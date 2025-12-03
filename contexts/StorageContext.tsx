
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppState, Deck, Flashcard, Note, ExamResult, INITIAL_STATE, DEFAULT_SETTINGS, Category } from '../types';
import { getAppState, saveAppState, initializeMockData } from '../services/storage';
import { scheduleCard, updateUserStats } from '../utils/scheduler';

const StorageContext = createContext<StorageContextType | undefined>(undefined);

interface StorageContextType {
  state: AppState;
  addCategory: (name: string, parentId?: string) => void;
  addDeck: (deck: Deck) => void;
  moveDeck: (deckId: string, categoryId: string) => void;
  deleteDeck: (id: string) => void;
  addCard: (deckId: string, card: Flashcard) => void;
  reviewCard: (deckId: string, cardId: string, rating: 'again' | 'hard' | 'good' | 'easy', timeTaken: number) => void;
  suspendCard: (deckId: string, cardId: string) => void;
  saveNote: (note: Note) => void;
  deleteNote: (id: string) => void;
  addExamResult: (exam: ExamResult) => void;
  refreshData: () => void;
}

export const StorageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  useEffect(() => {
    initializeMockData();
  }, []);

  const [state, setState] = useState<AppState>(getAppState());

  const updateState = (newState: AppState) => {
    setState(newState);
    saveAppState(newState);
  };

  const addCategory = (name: string, parentId?: string) => {
    const newCategory: Category = {
      id: Date.now().toString(),
      name,
      parentId
    };
    updateState({ ...state, categories: [...(state.categories || []), newCategory] });
  };

  const addDeck = (deck: Deck) => {
    updateState({ ...state, decks: [...state.decks, deck] });
  };

  const moveDeck = (deckId: string, categoryId: string) => {
    const updatedDecks = state.decks.map(d => 
      d.id === deckId ? { ...d, categoryId } : d
    );
    updateState({ ...state, decks: updatedDecks });
  };

  const deleteDeck = (id: string) => {
    updateState({ ...state, decks: state.decks.filter(d => d.id !== id) });
  };

  const addCard = (deckId: string, card: Flashcard) => {
    const newCard: Flashcard = {
        ...card,
        status: 'new',
        interval: 0,
        easeFactor: 2.5,
        reps: 0,
        lapses: 0,
        dueDate: Date.now(),
        cardType: card.cardType || 'basic'
    }
    const updatedDecks = state.decks.map(d => 
      d.id === deckId ? { ...d, cards: [...d.cards, newCard] } : d
    );
    updateState({ ...state, decks: updatedDecks });
  };

  const suspendCard = (deckId: string, cardId: string) => {
     const updatedDecks = state.decks.map(d => {
      if (d.id !== deckId) return d;
      return {
        ...d,
        cards: d.cards.map(c => c.id === cardId ? { ...c, status: 'suspended' as const } : c)
      };
    });
    updateState({ ...state, decks: updatedDecks });
  };

  const reviewCard = (deckId: string, cardId: string, rating: 'again' | 'hard' | 'good' | 'easy', timeTaken: number) => {
    const deck = state.decks.find(d => d.id === deckId);
    if (!deck) return;

    const card = deck.cards.find(c => c.id === cardId);
    if (!card) return;

    const previousStatus = card.status;

    // 1. Run Schedule Algorithm
    const updatedCard = scheduleCard(card, rating, timeTaken, state.settings || DEFAULT_SETTINGS);

    // 2. Update Stats (XP, Streak)
    const updatedStats = updateUserStats(state.stats, rating, previousStatus);

    // 3. Update Daily Progress
    const isNew = previousStatus === 'new';
    const updatedDaily = { ...state.dailyProgress };
    if (updatedDaily.date !== new Date().toISOString().split('T')[0]) {
       updatedDaily.date = new Date().toISOString().split('T')[0];
       updatedDaily.newStudied = 0;
       updatedDaily.reviewStudied = 0;
    }
    if (isNew) updatedDaily.newStudied++;
    else updatedDaily.reviewStudied++;

    // 4. Update Decks
    const updatedDecks = state.decks.map(d => {
      if (d.id !== deckId) return d;
      return {
        ...d,
        cards: d.cards.map(c => c.id === cardId ? updatedCard : c)
      };
    });

    // 5. Commit
    updateState({ 
      ...state, 
      decks: updatedDecks,
      stats: updatedStats,
      dailyProgress: updatedDaily
    });

    console.log('[Analytics] Card Rated', { cardId, rating, timeTaken, xp: updatedStats.xp });
  };

  const saveNote = (note: Note) => {
    const existingIndex = state.notes.findIndex(n => n.id === note.id);
    let updatedNotes = [...state.notes];
    
    if (existingIndex >= 0) {
      updatedNotes[existingIndex] = note;
    } else {
      updatedNotes.push(note);
    }
    updateState({ ...state, notes: updatedNotes });
  };

  const deleteNote = (id: string) => {
    updateState({ ...state, notes: state.notes.filter(n => n.id !== id) });
  };

  const addExamResult = (exam: ExamResult) => {
    updateState({ ...state, examResults: [...state.examResults, exam] });
  };

  const refreshData = () => {
    setState(getAppState());
  };

  return (
    <StorageContext.Provider value={{ 
      state, 
      addCategory,
      addDeck, 
      moveDeck,
      deleteDeck, 
      addCard, 
      reviewCard,
      suspendCard,
      saveNote, 
      deleteNote, 
      addExamResult,
      refreshData 
    }}>
      {children}
    </StorageContext.Provider>
  );
};

export const useStorage = () => {
  const context = useContext(StorageContext);
  if (context === undefined) {
    throw new Error('useStorage must be used within a StorageProvider');
  }
  return context;
};
