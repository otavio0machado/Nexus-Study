
import { AppState, INITIAL_STATE, Deck, Note, ExamResult, Flashcard } from '../types';
import { STORAGE_KEY, MOCK_DATA_INITIALIZED_KEY } from '../constants';

const sanitizeCard = (card: any): Flashcard => ({
  ...card,
  status: card.status || 'new',
  interval: typeof card.interval === 'number' ? card.interval : 0,
  easeFactor: typeof card.easeFactor === 'number' ? card.easeFactor : 2.5,
  reps: typeof card.reps === 'number' ? card.reps : 0,
  lapses: typeof card.lapses === 'number' ? card.lapses : 0,
  dueDate: typeof card.dueDate === 'number' ? card.dueDate : Date.now(),
  createdAt: card.createdAt || Date.now(),
  cardType: card.cardType || 'basic'
});

export const getAppState = (): AppState => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return INITIAL_STATE;

  try {
    const parsed: AppState = JSON.parse(data);
    
    if (parsed.decks) {
      parsed.decks = parsed.decks.map(deck => ({
        ...deck,
        cards: Array.isArray(deck.cards) ? deck.cards.map(sanitizeCard) : []
      }));
    } else {
        parsed.decks = [];
    }

    if (!parsed.notes) parsed.notes = [];
    if (!parsed.examResults) parsed.examResults = [];
    if (!parsed.settings) parsed.settings = INITIAL_STATE.settings;
    if (!parsed.stats) parsed.stats = INITIAL_STATE.stats;
    if (!parsed.dailyProgress) parsed.dailyProgress = INITIAL_STATE.dailyProgress;

    // Reset daily progress if new day
    const today = new Date().toISOString().split('T')[0];
    if (parsed.dailyProgress.date !== today) {
      parsed.dailyProgress = {
        date: today,
        newStudied: 0,
        reviewStudied: 0
      };
    }

    return parsed;
  } catch (e) {
    console.error("Failed to parse app state from storage", e);
    return INITIAL_STATE;
  }
};

export const saveAppState = (state: AppState) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

const createMockCard = (id: string, front: string, back: string, status: any = 'new', type: 'basic' | 'cloze' = 'basic'): Flashcard => ({
  id,
  front,
  back,
  status,
  cardType: type,
  interval: 0,
  easeFactor: 2.5,
  reps: 0,
  lapses: 0,
  dueDate: Date.now(),
  createdAt: Date.now()
});

export const initializeMockData = () => {
  if (localStorage.getItem(MOCK_DATA_INITIALIZED_KEY)) return;

  const mockState: AppState = {
    ...INITIAL_STATE,
    stats: {
      xp: 1250,
      level: 3,
      streak: 4,
      lastStudyDate: Date.now(),
      cardsLearned: 15
    },
    decks: [
      {
        id: 'deck_1',
        title: 'Biologia Celular',
        subject: 'Biologia',
        cards: [
          createMockCard('c1', 'O que é Mitocôndria?', 'Organela responsável pela respiração celular e produção de ATP.', 'review'),
          createMockCard('c2', 'Função do Ribossomo', 'Síntese de proteínas.', 'new'),
          createMockCard('c4', 'O {{c1::DNA}} é encontrado no núcleo, enquanto o {{c2::RNA}} pode ir ao citoplasma.', '', 'new', 'cloze')
        ]
      },
      {
        id: 'deck_2',
        title: 'História do Brasil',
        subject: 'História',
        cards: [
          createMockCard('c3', 'Ano da Proclamação da República', '1889', 'new')
        ]
      }
    ],
    notes: [
      {
        id: 'n1',
        title: 'Resumo Revolução Industrial',
        content: 'A Revolução Industrial foi um processo de grandes transformações econômicas e sociais.\n\nVeja também: [[Capitalismo]] e [[Máquina a Vapor]].',
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
    ]
  };

  saveAppState(mockState);
  localStorage.setItem(MOCK_DATA_INITIALIZED_KEY, 'true');
};
