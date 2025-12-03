
export type CardStatus = 'new' | 'learning' | 'review' | 'relearning' | 'suspended';
export type CardType = 'basic' | 'cloze';

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  cardType?: CardType;
  
  // SRS Data (SM-2)
  status: CardStatus;
  interval: number;
  easeFactor: number;
  reps: number;
  lapses: number;
  dueDate: number;
  stepIndex?: number;
  
  // Meta
  createdAt: number;
  lastReviewed?: number;
  
  // Integration / Second Brain
  sourceType?: 'note' | 'pdf';
  sourceId?: string; // ID da nota ou Nome do arquivo PDF
  sourceTitle?: string; // Título legível para exibição
}

export interface Category {
  id: string;
  name: string;
  parentId?: string;
}

export interface Deck {
  id: string;
  title: string;
  subject: string;
  categoryId?: string;
  cards: Flashcard[];
}

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

export interface ExamResult {
  id: string;
  date: number;
  type: 'ENEM' | 'UFRGS' | 'SIMULADO';
  score: number;
  maxScore: number;
  details: {
    [subject: string]: number;
  };
}

export interface UserSettings {
  learningSteps: number[];
  graduatingInterval: number;
  easyBonus: number;
  leechThreshold: number;
  reactionTimeTarget: number;
  maxNewPerDay: number;
  maxReviewsPerDay: number;
}

export interface UserStats {
  xp: number;
  level: number;
  streak: number;
  lastStudyDate: number;
  cardsLearned: number;
}

export interface DailyProgress {
  date: string;
  newStudied: number;
  reviewStudied: number;
}

export interface AppState {
  categories: Category[];
  decks: Deck[];
  notes: Note[];
  examResults: ExamResult[];
  settings: UserSettings;
  stats: UserStats;
  dailyProgress: DailyProgress;
}

// --- PDF Integration Types ---
export type AnnotationType = 'highlight' | 'underline' | 'comment';

export interface PDFAnnotation {
  id: string;
  userId: string;
  pdfId: string;
  page: number;
  text: string;
  context?: string;
  bbox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  color: string;
  type: AnnotationType;
  comment?: string;
  noteId?: string;
  createdAt: string;
}

export interface Citation {
  text: string;
  author?: string;
  title: string;
  page: number;
  format: 'ABNT' | 'APA' | 'RAW';
}
// -----------------------------

export const DEFAULT_SETTINGS: UserSettings = {
  learningSteps: [1, 10],
  graduatingInterval: 1,
  easyBonus: 1.3,
  leechThreshold: 8,
  reactionTimeTarget: 5000,
  maxNewPerDay: 20,
  maxReviewsPerDay: 100
};

export const INITIAL_STATE: AppState = {
  categories: [],
  decks: [],
  notes: [],
  examResults: [],
  settings: DEFAULT_SETTINGS,
  stats: {
    xp: 0,
    level: 1,
    streak: 0,
    lastStudyDate: 0,
    cardsLearned: 0
  },
  dailyProgress: {
    date: new Date().toISOString().split('T')[0],
    newStudied: 0,
    reviewStudied: 0
  }
};

export interface StorageContextType {
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