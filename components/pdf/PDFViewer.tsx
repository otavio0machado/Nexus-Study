import React, { useState, useEffect, useRef, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  Grid,
  Loader2,
} from "lucide-react";
import { SelectionToolbar } from "./SelectionToolbar";
import { useAnnotationService } from "../../services/annotationService";
import { formatCitation } from "../../utils/citation";
import { PDFAnnotation } from "../../types";

// Worker Configuration
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerProps {
  src: string;
  initialPage?: number;
  theme?: "dark" | "light";
  title?: string;
  onPageChange?: (page: number) => void;
  onSelection?: (text: string, page: number) => void;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({
  src,
  initialPage = 1,
  title = "Document",
  onPageChange,
  onSelection,
}) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(initialPage);
  const [scale, setScale] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Selection State
  const [selectionRect, setSelectionRect] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [selectedText, setSelectedText] = useState("");
  const [selectionBBox, setSelectionBBox] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const [selectionPage, setSelectionPage] = useState<number>(1);
  
  const [annotations, setAnnotations] = useState<PDFAnnotation[]>([]);

  const { saveAnnotation, getAnnotations } = useAnnotationService();
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Load annotations
  useEffect(() => {
    setAnnotations(getAnnotations(src));
  }, [src, getAnnotations]);

  // Setup Intersection Observer for scrolling
  useEffect(() => {
    if (!containerRef.current || numPages === 0) return;

    const options = {
      root: containerRef.current,
      rootMargin: '-40% 0px -40% 0px', // Trigger when page is in middle 20% of viewport
      threshold: 0.1
    };

    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const pageNum = parseInt(entry.target.getAttribute('data-page-number') || '1');
          setPageNumber(pageNum);
          if (onPageChange) onPageChange(pageNum);
        }
      });
    }, options);

    // Observe all page wrappers
    Object.values(pageRefs.current).forEach((el) => {
      if (el) observerRef.current?.observe(el);
    });

    return () => {
      observerRef.current?.disconnect();
    };
  }, [numPages, onPageChange]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    // Initial scroll to page if needed
    if (initialPage > 1) {
      setTimeout(() => scrollToPage(initialPage), 500);
    }
  };

  const scrollToPage = (page: number) => {
    const element = pageRefs.current[page];
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setPageNumber(page);
    }
  };

  const changePage = (offset: number) => {
    const newPage = Math.min(Math.max(1, pageNumber + offset), numPages);
    scrollToPage(newPage);
  };

  const changeZoom = (delta: number) => {
    setScale((prev) => Math.min(Math.max(0.5, prev + delta), 3.0));
  };

  // --- SELECTION LOGIC ---
  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();

      if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
        setSelectionRect(null);
        setSelectedText("");
        setSelectionBBox(null);
        return;
      }

      const text = selection.toString().trim();
      if (text.length === 0) return;

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      // Check if selection is inside our PDF container
      if (
        containerRef.current &&
        containerRef.current.contains(range.commonAncestorContainer)
      ) {
        // Find which page this selection belongs to
        let node: Node | null = range.commonAncestorContainer;
        let pageElement: HTMLElement | null = null;
        
        while (node && node !== containerRef.current) {
          if (node.nodeType === 1 && (node as HTMLElement).classList.contains('react-pdf__Page')) {
            pageElement = node as HTMLElement;
            break;
          }
          node = node.parentNode;
        }

        if (pageElement) {
          const pageNum = parseInt(pageElement.getAttribute('data-page-number') || '0');
          if (pageNum > 0) {
            setSelectionPage(pageNum);
            
            // Calculate position for toolbar (viewport relative)
            setSelectionRect({
              x: rect.left + rect.width / 2,
              y: rect.top,
            });
            setSelectedText(text);

            const pageRect = pageElement.getBoundingClientRect();
            setSelectionBBox({
              x: (rect.left - pageRect.left) / scale,
              y: (rect.top - pageRect.top) / scale,
              width: rect.width / scale,
              height: rect.height / scale,
            });
          }
        }
      }
    };

    document.addEventListener("mouseup", handleSelectionChange);
    return () => document.removeEventListener("mouseup", handleSelectionChange);
  }, [scale]);

  // --- ACTIONS ---
  const handleHighlight = (color: string) => {
    if (!selectedText || !selectionBBox) return;

    const annotation: PDFAnnotation = {
      id: crypto.randomUUID(),
      userId: "current_user",
      pdfId: src,
      page: selectionPage,
      text: selectedText,
      bbox: selectionBBox,
      color: color,
      type: "highlight",
      createdAt: new Date().toISOString(),
    };

    saveAnnotation(annotation);
    setAnnotations((prev) => [...prev, annotation]);

    setSelectionRect(null);
    setSelectionBBox(null);
    window.getSelection()?.removeAllRanges();
  };

  const handleCopyCitation = () => {
    const citation = formatCitation({
      text: selectedText,
      title: title,
      page: selectionPage,
      format: "RAW",
    });

    navigator.clipboard.writeText(citation);
    setSelectionRect(null);
    setSelectionBBox(null);
    alert("Citação copiada!");
  };

  const handleExternalAction = (action: "note" | "flashcard") => {
    if (onSelection) {
      onSelection(selectedText, selectionPage);
    }
    setSelectionRect(null);
    setSelectionBBox(null);
  };

  // Scroll sidebar to active page
  const sidebarRef = useRef<HTMLDivElement>(null);
  const activeThumbnailRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (sidebarOpen && activeThumbnailRef.current && sidebarRef.current) {
      const sidebar = sidebarRef.current;
      const thumbnail = activeThumbnailRef.current;
      
      const sidebarRect = sidebar.getBoundingClientRect();
      const thumbnailRect = thumbnail.getBoundingClientRect();

      // Only scroll if out of view
      if (thumbnailRect.top < sidebarRect.top || thumbnailRect.bottom > sidebarRect.bottom) {
        thumbnail.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [pageNumber, sidebarOpen]);

  // ... existing code ...

  return (
    <div className="pdf-wrapper">
      {/* ... existing toolbar code ... */}
      <SelectionToolbar
        position={selectionRect}
        onHighlight={handleHighlight}
        onNote={() => handleExternalAction("note")}
        onFlashcard={() => handleExternalAction("flashcard")}
        onCopy={handleCopyCitation}
        onClose={() => {
          window.getSelection()?.removeAllRanges();
          setSelectionRect(null);
          setSelectionBBox(null);
        }}
      />

      {/* Main Toolbar */}
      <div className="pdf-toolbar">
        <div className="pdf-controls">
          <button
            className={`pdf-btn ${sidebarOpen ? "bg-white/10" : ""}`}
            onClick={() => setSidebarOpen(!sidebarOpen)}
            title="Thumbnails"
          >
            <Grid size={18} />
          </button>
          <div className="h-6 w-px bg-white/10 mx-2" />
          <button
            className="pdf-btn"
            onClick={() => changePage(-1)}
            disabled={pageNumber <= 1}
          >
            <ChevronLeft size={18} />
          </button>
          <span className="pdf-page-indicator">
            {pageNumber} / {numPages || "--"}
          </span>
          <button
            className="pdf-btn"
            onClick={() => changePage(1)}
            disabled={pageNumber >= numPages}
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="pdf-controls">
          <button className="pdf-btn" onClick={() => changeZoom(-0.1)}>
            <ZoomOut size={18} />
          </button>
          <span className="pdf-page-indicator w-12 text-center">
            {Math.round(scale * 100)}%
          </span>
          <button className="pdf-btn" onClick={() => changeZoom(0.1)}>
            <ZoomIn size={18} />
          </button>
          <div className="h-6 w-px bg-white/10 mx-2" />
          <button
            className="pdf-btn"
            onClick={() => setRotation((r) => (r + 90) % 360)}
          >
            <RotateCw size={18} />
          </button>
        </div>
      </div>

      <div className="pdf-container">
        {/* Sidebar */}
        <div 
          ref={sidebarRef}
          className={`pdf-sidebar ${!sidebarOpen ? "closed" : ""}`}
        >
          {sidebarOpen && numPages > 0 && (
            <div className="flex flex-col gap-4">
              {Array.from(new Array(numPages), (_, index) => {
                const pageNum = index + 1;
                const isActive = pageNumber === pageNum;
                return (
                  <div
                    key={`thumb_${pageNum}`}
                    ref={isActive ? activeThumbnailRef : null}
                    className={`pdf-thumbnail ${
                      isActive ? "active" : ""
                    }`}
                    onClick={() => scrollToPage(pageNum)}
                  >
                    <div className="aspect-[1/1.4] bg-slate-800 flex items-center justify-center text-xs text-slate-500 relative overflow-hidden">
                      <span className="z-10 font-bold text-lg">{pageNum}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Viewport */}
        <div className="pdf-viewport" ref={containerRef}>
          <Document
            file={src}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={(error) => console.error("Error loading PDF:", error)}
            loading={
              <div className="pdf-loading">
                <div className="spinner" />
                <span>Carregando Documento...</span>
              </div>
            }
            className="pdf-document"
          >
            {numPages > 0 && Array.from(new Array(numPages), (_, index) => {
              const pageNum = index + 1;
              const pageAnnotations = annotations.filter((a) => a.page === pageNum);
              
              return (
                <div
                  key={`page_${pageNum}`}
                  ref={(el) => (pageRefs.current[pageNum] = el)}
                  data-page-number={pageNum}
                  className="pdf-page-wrapper"
                  style={{ transform: `rotate(${rotation}deg)` }}
                >
                  <Page
                    pageNumber={pageNum}
                    scale={scale}
                    renderTextLayer={true}
                    renderAnnotationLayer={true}
                    className="shadow-2xl relative"
                    loading={
                      <div className="h-[800px] w-[600px] bg-white/5 animate-pulse flex items-center justify-center">
                        <Loader2 className="animate-spin text-nexus-400" />
                      </div>
                    }
                  >
                    {/* Highlights Layer */}
                    {pageAnnotations.map((annotation) => (
                      <div
                        key={annotation.id}
                        style={{
                          position: "absolute",
                          left: annotation.bbox.x * scale,
                          top: annotation.bbox.y * scale,
                          width: annotation.bbox.width * scale,
                          height: annotation.bbox.height * scale,
                          backgroundColor: annotation.color,
                          opacity: 0.4,
                          pointerEvents: "none",
                          mixBlendMode: "multiply",
                        }}
                      />
                    ))}
                  </Page>
                </div>
              );
            })}
          </Document>
        </div>
      </div>
    </div>
  );
};
