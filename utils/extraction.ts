
import { Flashcard } from '../types';

/**
 * Analisa texto em busca de padrões de perguntas e respostas.
 * Padrões suportados:
 * 1. Q: Pergunta A: Resposta
 * 2. Pergunta :: Resposta (Estilo Anki simples)
 */
export const extractCardsFromText = (text: string): Partial<Flashcard>[] => {
  const cards: Partial<Flashcard>[] = [];
  const lines = text.split('\n');

  lines.forEach(line => {
    // Padrão :: (Frente :: Verso)
    if (line.includes('::')) {
      const parts = line.split('::');
      if (parts.length >= 2) {
        cards.push({
          front: parts[0].trim(),
          back: parts[1].trim(),
          cardType: 'basic'
        });
      }
    }
    // Padrão Q: A:
    else if (line.toLowerCase().startsWith('q:') && line.toLowerCase().includes('a:')) {
      const parts = line.split(/a:/i);
      const question = parts[0].replace(/q:/i, '').trim();
      const answer = parts[1].trim();
      if (question && answer) {
        cards.push({
          front: question,
          back: answer,
          cardType: 'basic'
        });
      }
    }
  });

  return cards;
};
