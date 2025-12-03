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

// Configuração ROBUSTA do Worker
// Usando cdnjs que costuma ser mais estável e rápido que unpkg
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

// Import standard react-pdf styles are handled in index.html or ignored if css modules not available
// We rely on the CSS injected in index.html

interface PDFViewerProps {
  src: string;
  initialPage?: number;
  theme?: 'dark' | 'light';
  title?: string;
  onPageChange?: (page: number) => void;
  onZoomChange?: (scale: number) => void;
  onSelection?: (text: string, page: number) => void;
  onLinkRequest?: (text: string, page: number) => void;
  onReady?: (total: number) => void;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({
  src,
  initialPage = 1,
  theme = 'dark',
  title = "Document",
  onPageChange,
  onZoomChange,
  onSelection,
  onLinkRequest,
  onReady
}) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(initialPage);
  const [scale, setScale] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loadError, setLoadError] = useState<Error | null>(null);
  
  // Selection State
  const [selectionRect, setSelectionRect] = useState<{ x: number; y: number } | null>(null);
  const [selectedText, setSelectedText] = useState('');

  const { saveAnnotation } = useAnnotationService();
  const containerRef = useRef<HTMLDivElement>(null);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoadError(null);
    if (onReady) onReady(numPages);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('PDF Load Error:', error);
    setLoadError(error);
  }

  const changePage = (offset: number) => {
    setPageNumber(prev => {
      const newPage = Math.min(Math.max(1, prev + offset), numPages);
      if (onPageChange && newPage !== prev) onPageChange(newPage);
      return newPage;
    });
  };

  const changeZoom = (delta: number) => {
    setScale(prev => {
      const newScale = Math.min(Math.max(0.5, prev + delta), 3.0);
      if (onZoomChange) onZoomChange(newScale);
      return newScale;
    });
  };

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') changePage(1);
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') changePage(-1);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [numPages]);

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
        bbox: { x: 0, y: 0, width: 0, height: 0 }, 
        color: color,
        type: 'highlight',
        createdAt: new Date().toISOString()
    };

    saveAnnotation(annotation);
    api.annotations.create(annotation);

    setSelectionRect(null);
    window.getSelection()?.removeAllRanges();
    alert("Destaque salvo!");
  };

  const handleComment = () => {
    const commentText = window.prompt("Adicionar comentário à seleção:");
    if (!commentText) return;

    const annotation: PDFAnnotation = {
      id: crypto.randomUUID(),
      userId: 'current_user',
      pdfId: src,
      page: pageNumber,
      text: selectedText,
      bbox: { x: 0, y: 0, width: 0, height: 0 },
      color: '#3b82f6', // Blue for comments
      type: 'comment',
      comment: commentText,
      createdAt: new Date().toISOString()
    };

    saveAnnotation(annotation);
    api.annotations.create(annotation);
    
    setSelectionRect(null);
    window.getSelection()?.removeAllRanges();
  };

  const handleLinkNote = () => {
    if (onLinkRequest) {
      onLinkRequest(selectedText, pageNumber);
    }
    setSelectionRect(null);
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
  };

  return (
    <div className={`pdf-wrapper ${theme}`}>
      {/* Floating Toolbar */}
      <SelectionToolbar 
        position={selectionRect}
        onHighlight={handleHighlight}
        onComment={handleComment}
        onLink={handleLinkNote}
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
          <button className="pdf-btn" onClick={() => changeZoom(-0.1)} title="Diminuir Zoom"><ZoomOut size={18} /></button>
          <span className="pdf-page-indicator w-12 text-center">{Math.round(scale * 100)}%</span>
          <button className="pdf-btn" onClick={() => changeZoom(0.1)} title="Aumentar Zoom"><ZoomIn size={18} /></button>
          <div className="h-6 w-px bg-white/10 mx-2" />
          <button className="pdf-btn" onClick={() => setRotation((r) => (r + 90) % 360)} title="Girar"><RotateCw size={18} /></button>
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
          {loadError ? (
            <div className="flex flex-col items-center justify-center h-full text-red-400">
                <p>Erro ao carregar PDF.</p>
                <p className="text-sm opacity-70 max-w-xs text-center mt-2">{loadError.message}</p>
                <p className="text-xs text-slate-500 mt-4">Verifique se o arquivo é um PDF válido.</p>
            </div>
          ) : (
             <Document
                file={src}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                loading={
                <div className="pdf-loading">
                    <div className="spinner" />
                    <span>Carregando Documento...</span>
                </div>
                }
                className="pdf-document"
                error={
                    <div className="text-red-400 text-sm">Falha ao abrir documento.</div>
                }
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
          )}
        </div>
      </div>
    </div>
  );
};