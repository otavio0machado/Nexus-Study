
import { Flashcard, UserSettings, UserStats, DailyProgress } from '../types';

type Rating = 'again' | 'hard' | 'good' | 'easy';

/**
 * Calcula o próximo estado do cartão baseado no algoritmo SM-2 (SuperMemo 2).
 * Mapeamento de Botões:
 * - "Errei" -> again (Reseta intervalo, penaliza EF)
 * - "Difícil" -> hard (Crescimento lento do intervalo, leve penalidade EF)
 * - "Médio/Bom" -> good (Crescimento padrão pelo EF)
 * - "Fácil" -> easy (Bônus no intervalo, aumento do EF)
 */
export const scheduleCard = (
  card: Flashcard,
  rating: Rating,
  timeTaken: number,
  config: UserSettings
): Flashcard => {
  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;

  let nextCard = { ...card, lastReviewed: now };
  
  // Penalidade por tempo de reação excessivo (apenas para Good/Easy)
  let adjustedRating = rating;
  if ((rating === 'good' || rating === 'easy') && timeTaken > config.reactionTimeTarget * 3) {
    adjustedRating = rating === 'easy' ? 'good' : 'hard';
  }

  let nextInterval = 0; // Em dias

  // --- FASE 1: Cartões Novos ou em Aprendizagem ---
  if (nextCard.status === 'new' || nextCard.status === 'learning') {
    if (adjustedRating === 'again') {
      nextCard.stepIndex = 0;
      nextInterval = config.learningSteps[0] / 1440; // Ex: 1 minuto em dias
    } else if (adjustedRating === 'hard') {
      // Repete o passo atual ou média
      const currentStep = config.learningSteps[nextCard.stepIndex || 0];
      nextInterval = currentStep / 1440; 
    } else if (adjustedRating === 'good') {
      const nextIndex = (nextCard.stepIndex || 0) + 1;
      // Se ainda houver passos de aprendizagem (ex: 1min -> 10min)
      if (nextIndex < config.learningSteps.length) {
        nextCard.stepIndex = nextIndex;
        nextCard.status = 'learning';
        nextInterval = config.learningSteps[nextIndex] / 1440;
      } else {
        // Graduação! Sai do Learning -> Review
        nextCard.status = 'review';
        nextCard.stepIndex = 0;
        nextInterval = config.graduatingInterval;
      }
    } else if (adjustedRating === 'easy') {
      // Promoção imediata
      nextCard.status = 'review';
      nextCard.stepIndex = 0;
      nextInterval = config.graduatingInterval * config.easyBonus;
    }
  } 
  // --- FASE 2: Cartões em Revisão (Graduados) ---
  else if (nextCard.status === 'review') {
    if (adjustedRating === 'again') {
      // Lapso de memória
      nextCard.status = 'relearning';
      nextCard.lapses += 1;
      nextCard.easeFactor = Math.max(1.3, nextCard.easeFactor - 0.2); // Penaliza EF
      nextInterval = config.learningSteps[0] / 1440; 
      nextCard.reps = 0;
      
      // Detecção de "Leech" (Sanguessuga)
      if (nextCard.lapses >= config.leechThreshold) {
        nextCard.status = 'suspended';
      }
    } else if (adjustedRating === 'hard') {
      // Passou raspando: intervalo cresce pouco (x1.2 fixo) e EF cai
      nextInterval = nextCard.interval * 1.2;
      nextCard.easeFactor = Math.max(1.3, nextCard.easeFactor - 0.15);
    } else if (adjustedRating === 'good') {
      // Padrão: intervalo * EF
      nextInterval = nextCard.interval * nextCard.easeFactor;
      nextCard.reps += 1;
    } else if (adjustedRating === 'easy') {
      // Fácil: intervalo * EF * Bônus e EF sobe
      nextInterval = nextCard.interval * nextCard.easeFactor * config.easyBonus;
      nextCard.easeFactor += 0.15;
      nextCard.reps += 1;
    }
  }
  // --- FASE 3: Reaprendizagem (após lapso) ---
  else if (nextCard.status === 'relearning') {
     if (adjustedRating === 'again') {
       nextInterval = config.learningSteps[0] / 1440;
     } else if (adjustedRating === 'good' || adjustedRating === 'easy') {
       nextCard.status = 'review';
       // Recupera o intervalo antigo, mas reduzido (ex: 50%)
       nextInterval = Math.max(1, nextCard.interval * 0.5); 
     }
  }

  // "Fuzzing": Adiciona uma pequena aleatoriedade para evitar aglomeração de revisões no mesmo dia
  if (nextInterval > 2 && nextCard.status === 'review') {
    const fuzz = 0.95 + Math.random() * 0.1; // +/- 5%
    nextInterval = nextInterval * fuzz;
  }

  nextCard.interval = nextInterval;
  nextCard.dueDate = now + (nextInterval * oneDayMs);

  return nextCard;
};

// Funções auxiliares mantidas para compatibilidade
export const getStudyQueue = (
  cards: Flashcard[], 
  settings: UserSettings, 
  dailyProgress: DailyProgress
): Flashcard[] => {
  const now = Date.now();
  const todayStr = new Date().toISOString().split('T')[0];

  const isNewDay = dailyProgress.date !== todayStr;
  const currentNewCount = isNewDay ? 0 : dailyProgress.newStudied;
  const currentReviewCount = isNewDay ? 0 : dailyProgress.reviewStudied;

  const allDue = cards.filter(c => c.status !== 'suspended');
  const learning = allDue.filter(c => (c.status === 'learning' || c.status === 'relearning') && c.dueDate <= now);
  const reviews = allDue.filter(c => c.status === 'review' && c.dueDate <= now);
  const newCards = allDue.filter(c => c.status === 'new');

  const reviewQuota = Math.max(0, settings.maxReviewsPerDay - currentReviewCount);
  const newQuota = Math.max(0, settings.maxNewPerDay - currentNewCount);

  const limitedReviews = reviews.sort((a,b) => a.dueDate - b.dueDate).slice(0, reviewQuota);
  const limitedNew = newCards.slice(0, newQuota);

  return [...learning, ...limitedReviews, ...limitedNew];
};

export const getCounts = (cards: Flashcard[]) => {
  const now = Date.now();
  return {
    new: cards.filter(c => c.status === 'new').length,
    learning: cards.filter(c => (c.status === 'learning' || c.status === 'relearning') && c.dueDate <= now).length,
    review: cards.filter(c => c.status === 'review' && c.dueDate <= now).length,
    suspended: cards.filter(c => c.status === 'suspended').length
  }
}

export const updateUserStats = (
  stats: UserStats, 
  rating: Rating, 
  cardStatus: string
): UserStats => {
  const newStats = { ...stats };
  const now = Date.now();
  
  let xpGain = 10;
  if (cardStatus === 'new') xpGain = 15;
  if (rating === 'easy') xpGain += 5;
  if (rating === 'again') xpGain = 2;

  newStats.xp += xpGain;
  newStats.level = Math.floor(newStats.xp / 500) + 1;

  const lastDate = new Date(newStats.lastStudyDate);
  const today = new Date();
  lastDate.setHours(0,0,0,0);
  today.setHours(0,0,0,0);

  const diffTime = Math.abs(today.getTime() - lastDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

  if (diffDays === 1) {
    newStats.streak += 1;
    newStats.lastStudyDate = now;
  } else if (diffDays > 1) {
    newStats.streak = 1;
    newStats.lastStudyDate = now;
  } else if (diffDays === 0) {
    newStats.lastStudyDate = now;
  }

  return newStats;
};

export const parseCloze = (text: string) => {
  const regex = /{{c(\d+)::([\s\S]*?)(?:::(.*?))?}}/g;
  return text.replace(regex, '___');
};

export const renderClozeAnswer = (text: string) => {
  const regex = /{{c(\d+)::([\s\S]*?)(?:::(.*?))?}}/g;
  return text.replace(regex, (match, num, answer) => {
    return `<span class="text-nexus-400 font-bold underline decoration-2 underline-offset-4">${answer}</span>`;
  });
};
