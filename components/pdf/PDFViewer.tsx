import React, { useState, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { 
  ZoomIn, ZoomOut, RotateCw, ChevronLeft, ChevronRight, 
  Grid, Loader2 
} from 'lucide-react';
import { SelectionToolbar } from './SelectionToolbar';
import { useAnnotationService } from '../../services/annotationService';
import { formatCitation } from '../../utils/citation';
import { PDFAnnotation } from '../../types';
import { api } from '../../services/api';

// Worker Configuration
// Using unpkg to avoid build issues with standard imports in this environment
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

// Import standard react-pdf styles are handled in index.html or ignored if css modules not available
// We rely on the CSS injected in index.html

interface PDFViewerProps {
  src: string;
  initialPage?: number;
  theme?: 'dark' | 'light';
  title?: string;
  onPageChange?: (page: number) => void;
  onSelection?: (text: string, page: number) => void; // For external integration (Flashcards/Notes)
}

export const PDFViewer: React.FC<PDFViewerProps> = ({
  src,
  initialPage = 1,
  title = "Document",
  onPageChange,
  onSelection
}) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(initialPage);
  const [scale, setScale] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Selection State
  const [selectionRect, setSelectionRect] = useState<{ x: number; y: number } | null>(null);
  const [selectedText, setSelectedText] = useState('');

  const { saveAnnotation } = useAnnotationService();
  const containerRef = useRef<HTMLDivElement>(null);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const changePage = (offset: number) => {
    setPageNumber(prev => {
      const newPage = Math.min(Math.max(1, prev + offset), numPages);
      if (onPageChange) onPageChange(newPage);
      return newPage;
    });
  };

  const changeZoom = (delta: number) => {
    setScale(prev => Math.min(Math.max(0.5, prev + delta), 3.0));
  };

  // --- SELECTION LOGIC ---
  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      
      if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
        setSelectionRect(null);
        setSelectedText('');
        return;
      }

      const text = selection.toString().trim();
      if (text.length === 0) return;

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      // Check if selection is inside our PDF container
      if (containerRef.current && containerRef.current.contains(range.commonAncestorContainer)) {
          setSelectionRect({
              x: rect.left + (rect.width / 2),
              y: rect.top
          });
          setSelectedText(text);
      }
    };

    document.addEventListener('mouseup', handleSelectionChange);
    return () => document.removeEventListener('mouseup', handleSelectionChange);
  }, []);

  // --- ACTIONS ---
  const handleHighlight = (color: string) => {
    if (!selectedText) return;

    const annotation: PDFAnnotation = {
        id: crypto.randomUUID(),
        userId: 'current_user',
        pdfId: src,
        page: pageNumber,
        text: selectedText,
        bbox: { x: 0, y: 0, width: 0, height: 0 }, // Simplified for this demo
        color: color,
        type: 'highlight',
        createdAt: new Date().toISOString()
    };

    saveAnnotation(annotation);
    api.annotations.create(annotation); // Simulate API call

    setSelectionRect(null);
    window.getSelection()?.removeAllRanges();
    alert("Destaque salvo!");
  };

  const handleCopyCitation = () => {
    const citation = formatCitation({
        text: selectedText,
        title: title,
        page: pageNumber,
        format: 'RAW'
    });
    
    navigator.clipboard.writeText(citation);
    setSelectionRect(null);
    alert('Citação copiada!');
  };

  const handleExternalAction = (action: 'note' | 'flashcard') => {
      if (onSelection) {
          onSelection(selectedText, pageNumber);
      }
      setSelectionRect(null);
      // The parent component (PDFStudy) detects the 'text' change or opens the modal
      // This is slightly distinct from prop callback, usually we'd pass an explicit handler
      // But for this integration, we trigger the parent's flow.
  };

  return (
    <div className="pdf-wrapper">
      {/* Floating Toolbar */}
      <SelectionToolbar 
        position={selectionRect}
        onHighlight={handleHighlight}
        onNote={() => handleExternalAction('note')}
        onFlashcard={() => handleExternalAction('flashcard')}
        onCopy={handleCopyCitation}
        onClose={() => {
            window.getSelection()?.removeAllRanges();
            setSelectionRect(null);
        }}
      />

      {/* Main Toolbar */}
      <div className="pdf-toolbar">
        <div className="pdf-controls">
          <button 
            className={`pdf-btn ${sidebarOpen ? 'bg-white/10' : ''}`}
            onClick={() => setSidebarOpen(!sidebarOpen)}
            title="Thumbnails"
          >
            <Grid size={18} />
          </button>
          <div className="h-6 w-px bg-white/10 mx-2" />
          <button className="pdf-btn" onClick={() => changePage(-1)} disabled={pageNumber <= 1}>
            <ChevronLeft size={18} />
          </button>
          <span className="pdf-page-indicator">
            {pageNumber} / {numPages || '--'}
          </span>
          <button className="pdf-btn" onClick={() => changePage(1)} disabled={pageNumber >= numPages}>
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="pdf-controls">
          <button className="pdf-btn" onClick={() => changeZoom(-0.1)}><ZoomOut size={18} /></button>
          <span className="pdf-page-indicator w-12 text-center">{Math.round(scale * 100)}%</span>
          <button className="pdf-btn" onClick={() => changeZoom(0.1)}><ZoomIn size={18} /></button>
          <div className="h-6 w-px bg-white/10 mx-2" />
          <button className="pdf-btn" onClick={() => setRotation((r) => (r + 90) % 360)}><RotateCw size={18} /></button>
        </div>
      </div>

      <div className="pdf-container">
        {/* Sidebar */}
        <div className={`pdf-sidebar ${!sidebarOpen ? 'closed' : ''}`}>
          {sidebarOpen && numPages > 0 && Array.from(new Array(numPages), (el, index) => (
            <div 
              key={`thumb_${index + 1}`}
              className={`pdf-thumbnail ${pageNumber === index + 1 ? 'active' : ''}`}
              onClick={() => setPageNumber(index + 1)}
            >
              <div className="aspect-[1/1.4] bg-slate-800 flex items-center justify-center text-xs text-slate-500">
                P {index + 1}
              </div>
            </div>
          ))}
        </div>

        {/* Viewport */}
        <div className="pdf-viewport" ref={containerRef}>
          <Document
            file={src}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={(error) => console.error('Error loading PDF:', error)}
            loading={
              <div className="pdf-loading">
                <div className="spinner" />
                <span>Carregando Documento...</span>
              </div>
            }
            className="pdf-document"
          >
            <div className="pdf-page-wrapper" style={{ transform: `rotate(${rotation}deg)` }}>
              <Page 
                pageNumber={pageNumber} 
                scale={scale} 
                renderTextLayer={true}
                renderAnnotationLayer={true}
                className="shadow-2xl"
                loading={
                  <div className="h-[800px] w-[600px] bg-white/5 animate-pulse flex items-center justify-center">
                    <Loader2 className="animate-spin text-nexus-400" />
                  </div>
                }
              />
            </div>
          </Document>
        </div>
      </div>
    </div>
  );
};