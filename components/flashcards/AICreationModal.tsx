
import React, { useState } from 'react';
import { Sparkles, X, Brain, Loader2, BookOpen, Target } from 'lucide-react';
import { generateAIContent } from '../../services/ai';
import { useStorage } from '../../contexts/StorageContext';
import { Flashcard } from '../../types';

interface AICreationModalProps {
  onClose: () => void;
}

export const AICreationModal: React.FC<AICreationModalProps> = ({ onClose }) => {
  const { addDeck } = useStorage();
  
  const [step, setStep] = useState<'input' | 'processing' | 'success'>('input');
  const [topic, setTopic] = useState('');
  const [focus, setFocus] = useState('');
  const [count, setCount] = useState(5);
  const [difficulty, setDifficulty] = useState('Médio');
  
  const [resultDeckName, setResultDeckName] = useState('');
  const [cardsGenerated, setCardsGenerated] = useState(0);

  const handleGenerate = async () => {
    if (!topic) return;

    setStep('processing');
    
    try {
      const response = await generateAIContent({
        topic,
        focus,
        count,
        difficulty
      });

      const newDeckId = Date.now().toString();

      // Create cards objects with default SM-2 values manually since we aren't using addCard()
      const newCards: Flashcard[] = response.cards.map((card, index) => ({
        id: `${newDeckId}_${index}`,
        front: card.front || '?',
        back: card.back || '!',
        cardType: 'basic',
        status: 'new',
        interval: 0,
        easeFactor: 2.5,
        reps: 0,
        lapses: 0,
        dueDate: Date.now(),
        createdAt: Date.now()
      }));

      // Atomic save: Create deck containing all cards at once
      addDeck({
        id: newDeckId,
        title: response.deckTitle,
        subject: response.subject,
        cards: newCards
      });

      setResultDeckName(response.deckTitle);
      setCardsGenerated(newCards.length);
      setStep('success');

    } catch (error) {
      console.error(error);
      alert('Erro ao conectar com a IA. Tente novamente.');
      setStep('input');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden relative">
        
        {/* Decorative Gradients */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-nexus-500/10 rounded-full filter blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full filter blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

        <div className="p-6 relative z-10">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2 bg-gradient-to-r from-nexus-400 to-purple-400 bg-clip-text text-transparent">
              <Sparkles size={20} className="text-nexus-400" /> 
              Nexus AI Generator
            </h2>
            <button onClick={onClose} className="text-slate-500 hover:text-white"><X size={20} /></button>
          </div>

          {step === 'input' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs uppercase text-slate-500 mb-1 font-bold">Sobre o que vamos estudar?</label>
                <div className="relative">
                  <BookOpen className="absolute left-3 top-3 text-slate-500" size={16} />
                  <input 
                    type="text" 
                    placeholder="Ex: Revolução Francesa, Citologia, Logaritmos..." 
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white focus:ring-2 focus:ring-nexus-500 outline-none transition-all"
                    value={topic}
                    onChange={e => setTopic(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase text-slate-500 mb-1 font-bold">Foco Específico (Opcional)</label>
                <div className="relative">
                  <Target className="absolute left-3 top-3 text-slate-500" size={16} />
                  <input 
                    type="text" 
                    placeholder="Ex: Datas importantes, Fórmulas, Nomes..." 
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white focus:ring-2 focus:ring-nexus-500 outline-none transition-all"
                    value={focus}
                    onChange={e => setFocus(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase text-slate-500 mb-1 font-bold">Quantidade</label>
                  <input 
                    type="number" 
                    min={1} 
                    max={20} 
                    value={count}
                    onChange={e => setCount(Number(e.target.value))}
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-nexus-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase text-slate-500 mb-1 font-bold">Nível</label>
                  <select 
                    value={difficulty}
                    onChange={e => setDifficulty(e.target.value)}
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-nexus-500 outline-none"
                  >
                    <option>Básico</option>
                    <option>Médio</option>
                    <option>Avançado (ITA/IME)</option>
                  </select>
                </div>
              </div>

              <div className="pt-4">
                <button 
                  onClick={handleGenerate}
                  disabled={!topic}
                  className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-all transform hover:-translate-y-1 active:scale-95
                    ${topic ? 'bg-gradient-to-r from-nexus-600 to-purple-600 text-white shadow-nexus-600/20' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}
                  `}
                >
                  <Sparkles size={20} /> Gerar Material
                </button>
                <p className="text-center text-xs text-slate-500 mt-3">A IA pode cometer erros. Sempre revise o conteúdo.</p>
              </div>
            </div>
          )}

          {step === 'processing' && (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-nexus-500 rounded-full blur-xl opacity-20 animate-pulse"></div>
                <Brain size={64} className="text-nexus-400 relative z-10 animate-bounce-slow" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Consultando a Nuvem...</h3>
              <p className="text-slate-400 max-w-xs mx-auto mb-8">Estamos analisando milhões de conexões para criar o melhor material para você.</p>
              
              <div className="flex items-center gap-2 text-nexus-400 bg-nexus-900/30 px-4 py-2 rounded-full border border-nexus-500/20">
                <Loader2 size={16} className="animate-spin" />
                <span className="text-sm font-medium">Gerando {count} cards sobre "{topic}"</span>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="py-8 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6 border border-emerald-500/20">
                <Sparkles size={40} className="text-emerald-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Sucesso!</h3>
              <p className="text-slate-400 mb-8">
                Criamos o baralho <strong className="text-white">"{resultDeckName}"</strong> com <strong className="text-white">{cardsGenerated} cartões</strong> novos.
              </p>
              <button 
                onClick={onClose}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-600/20 transition-all"
              >
                Começar a Estudar
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
