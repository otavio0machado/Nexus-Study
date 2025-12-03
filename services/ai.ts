import { Flashcard } from '../types';

// NOTE: In a production environment, this key should be secured in a backend proxy.
// For this client-side demo, we use it directly as requested.
const API_KEY = process.env.GOOGLE_API_KEY;

interface AIRequest {
  topic: string;
  focus: string;
  count: number;
  difficulty: string;
}

interface AIResponse {
  deckTitle: string;
  subject: string;
  cards: Partial<Flashcard>[];
}

/**
 * Connects to Google Gemini API to generate flashcards.
 */
export const generateAIContent = async (req: AIRequest): Promise<AIResponse> => {
  const prompt = `
    You are an expert teacher creating study flashcards for a student preparing for ENEM/UFRGS exams.
    
    TOPIC: ${req.topic}
    FOCUS: ${req.focus || "General Concepts"}
    DIFFICULTY: ${req.difficulty}
    QUANTITY: ${req.count} cards
    
    TASK: Create a JSON object containing a deck title, subject, and a list of flashcards.
    
    OUTPUT FORMAT (JSON ONLY, NO MARKDOWN):
    {
      "deckTitle": "Short Title",
      "subject": "Subject",
      "cards": [
        { "front": "Question", "back": "Answer" }
      ]
    }

    RULES:
    1. Return ONLY valid JSON.
    2. Keep answers concise (max 2 sentences).
    3. Ensure the content matches the requested difficulty level.
  `;

  try {
    // Using gemini-2.5-flash as per latest standards
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.7,
            // Aumentado para evitar cortes em respostas longas
            maxOutputTokens: 8192,
            responseMimeType: "application/json"
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText} (${response.status})`);
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      throw new Error("No content generated");
    }

    // Clean up potential markdown if the model ignores the JSON enforcement
    // Remove code blocks and whitespace
    let cleanJson = generatedText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    // Tentativa simples de correção se a string terminou abruptamente (hack de segurança)
    if (!cleanJson.endsWith('}')) {
       // Se cortou no meio de um array, tenta fechar
       if (cleanJson.lastIndexOf(']') === -1) cleanJson += ']';
       cleanJson += '}'; 
    }

    const parsedData: AIResponse = JSON.parse(cleanJson);

    // Map to ensure cardType is set
    return {
      deckTitle: parsedData.deckTitle,
      subject: parsedData.subject,
      cards: parsedData.cards.map(c => ({
        ...c,
        cardType: 'basic' as const
      }))
    };

  } catch (error) {
    console.error("AI Generation Failed:", error);
    throw error;
  }
};