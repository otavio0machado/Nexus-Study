import { Flashcard, Note, PDFAnnotation } from '../types';
import { generateAIContent } from './ai';
// Re-export AI function
export { generateAIContent };

// --- Mock Backend Simulation ---
// These functions simulate REST endpoints required for the integration

export const api = {
  annotations: {
    create: async (annotation: PDFAnnotation): Promise<{ id: string }> => {
      console.log('POST /api/v1/annotations', annotation);
      // In a real app, this would be fetch('/api/v1/annotations', ...)
      return Promise.resolve({ id: annotation.id });
    }
  },

  notes: {
    createOrUpdate: async (note: Partial<Note>): Promise<{ id: string }> => {
      console.log('POST /api/v1/notes', note);
      return Promise.resolve({ id: note.id || Date.now().toString() });
    }
  },

  flashcards: {
    create: async (card: Partial<Flashcard> & { deckId: string }): Promise<{ id: string }> => {
      console.log('POST /api/v1/flashcards', card);
      return Promise.resolve({ id: card.id || Date.now().toString() });
    },
    move: async (cardId: string, deckId: string): Promise<boolean> => {
      console.log(`PATCH /api/v1/flashcards/${cardId}/move`, { deckId });
      return Promise.resolve(true);
    }
  }
};
