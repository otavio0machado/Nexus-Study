
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { 
  ZoomIn, ZoomOut, RotateCw, ChevronLeft, ChevronRight, 
  Grid, Maximize, Minimize, Loader2 
} from 'lucide-react';
import '../../styles/pdf-viewer.css';

// Configuração do Worker (Essencial para Vite/React)
// Para pdfjs v4+/react-pdf v10, o worker é um bundle ESM (`.mjs`) servido via CDN.
// Usamos HTTPS explícito para evitar problemas em alguns ambientes.
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// Importar estilos padrão do react-pdf (se não tiver no global, isso ajuda)
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

interface PDFViewerProps {
  src: string;
  initialPage?: number;
  theme?: 'dark' | 'light';
  onPageChange?: (page: number) => void;
  onZoomChange?: (scale: number) => void;
  onSelection?: (text: string, page: number) => void;
  onReady?: (total: number) => void;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({
  src,
  initialPage = 1,
  theme = 'dark',
  onPageChange,
  onZoomChange,
  onSelection,
  onReady
}) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(initialPage);
  const [scale, setScale] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);

  // Callbacks
  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
    if (onReady) onReady(numPages);
  };

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
      if (e.key === 'ArrowRight' || e.key === 'PageDown') changePage(1);
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') changePage(-1);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [numPages]);

  // Text Selection Handler
  const handleMouseUp = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0 && onSelection) {
      onSelection(selection.toString(), pageNumber);
    }
  };

  return (
    <div className={`pdf-wrapper ${theme}`} onMouseUp={handleMouseUp}>
      {/* Toolbar */}
      <div className="pdf-toolbar">
        <div className="pdf-controls">
          <button 
            className={`pdf-btn ${sidebarOpen ? 'bg-white/10' : ''}`}
            onClick={() => setSidebarOpen(!sidebarOpen)}
            title="Miniaturas"
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
          <button className="pdf-btn" onClick={() => changeZoom(-0.1)} title="Diminuir Zoom">
            <ZoomOut size={18} />
          </button>
          <span className="pdf-page-indicator w-12 text-center">
            {Math.round(scale * 100)}%
          </span>
          <button className="pdf-btn" onClick={() => changeZoom(0.1)} title="Aumentar Zoom">
            <ZoomIn size={18} />
          </button>
          <div className="h-6 w-px bg-white/10 mx-2" />
          <button className="pdf-btn" onClick={() => setRotation((r) => (r + 90) % 360)} title="Girar">
            <RotateCw size={18} />
          </button>
        </div>
      </div>

      <div className="pdf-container">
        {/* Sidebar (Thumbnails) */}
        <div className={`pdf-sidebar ${!sidebarOpen ? 'closed' : ''}`}>
          {sidebarOpen && numPages > 0 && Array.from(new Array(numPages), (el, index) => (
            <div 
              key={`thumb_${index + 1}`}
              className={`pdf-thumbnail ${pageNumber === index + 1 ? 'active' : ''}`}
              onClick={() => setPageNumber(index + 1)}
            >
              {/* Rendering a small page as thumbnail (simplified) */}
              <div className="aspect-[1/1.4] bg-slate-800 flex items-center justify-center text-xs text-slate-500">
                Pág {index + 1}
              </div>
            </div>
          ))}
        </div>

        {/* Main Viewport */}
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
