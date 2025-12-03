import { PDFAnnotation } from '../types';

const STORAGE_KEY_ANNOTATIONS = 'nexus_pdf_annotations';

export const useAnnotationService = () => {
  
  const getAnnotations = (pdfId: string): PDFAnnotation[] => {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEY_ANNOTATIONS) || '[]');
    return all.filter((a: PDFAnnotation) => a.pdfId === pdfId);
  };

  const saveAnnotation = (annotation: PDFAnnotation) => {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEY_ANNOTATIONS) || '[]');
    // Avoid exact duplicates
    if (!all.find((a: PDFAnnotation) => a.id === annotation.id)) {
      const updated = [...all, annotation];
      localStorage.setItem(STORAGE_KEY_ANNOTATIONS, JSON.stringify(updated));
    }
    // Simulate API call log
    console.log('[API] Saved Annotation:', annotation);
  };

  const deleteAnnotation = (id: string) => {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEY_ANNOTATIONS) || '[]');
    const updated = all.filter((a: PDFAnnotation) => a.id !== id);
    localStorage.setItem(STORAGE_KEY_ANNOTATIONS, JSON.stringify(updated));
  };

  return {
    getAnnotations,
    saveAnnotation,
    deleteAnnotation
  };
};