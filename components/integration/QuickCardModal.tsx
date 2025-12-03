
import React, { useState, useEffect } from 'react';
import { useStorage } from '../../contexts/StorageContext';
import { X, Plus, Check } from 'lucide-react';
import { extractCardsFromText } from '../../utils/extraction';

interface QuickCardModalProps {
  initialText?: string;
  sourceType: 'note' | 'pdf';
  sourceId: string;
  sourceTitle: string;
  onClose: () => void;
}

export const QuickCardModal: React.FC<QuickCardModalProps> = ({ 
  initialText = '', 
  sourceType, 
  sourceId, 
  sourceTitle,
  onClose 
}) => {
  const { state, addCard } = useStorage();
  const [selectedDeckId, setSelectedDeckId] = useState('');
  const [front, setFront] = useState(initialText);
  const [back, setBack] = useState('');
  const [autoMode, setAutoMode] = useState(false);
  const [detectedCards, setDetectedCards] = useState<any[]>([]);

  // Tenta detectar cards automaticamente se o texto for longo
  useEffect(() => {
    if (initialText.includes('::') || (initialText.includes('Q:') && initialText.includes('A:'))) {
      const extracted = extractCardsFromText(initialText);
      if (extracted.length > 0) {
        setDetectedCards(extracted);
        setAutoMode(true);
      }
    }
  }, [initialText]);

  const handleSave = () => {
    if (!selectedDeckId) {
      alert('Selecione um baralho primeiro.');
      return;
    }

    if (autoMode) {
      detectedCards.forEach(c => {
        addCard(selectedDeckId, {
          id: Date.now().toString() + Math.random(),
          front: c.front,
          back: c.back,
          sourceType,
          sourceId,
          sourceTitle,
          cardType: 'basic'
        } as any);
      });
      alert(`${detectedCards.length} cards criados com sucesso!`);
    } else {
      if (!front) return;
      addCard(selectedDeckId, {
        id: Date.now().toString(),
        front,
        back,
        sourceType,
        sourceId,
        sourceTitle,
        cardType: 'basic'
      } as any);
      alert('Card criado com sucesso!');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Plus className="text-nexus-400" size={20} /> 
              {autoMode ? 'Geração Automática' : 'Criar Flashcard Rápido'}
            </h2>
            <p className="text-xs text-slate-500">Origem: {sourceTitle}</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><X size={20} /></button>
        </div>

        <div className="mb-4">
          <label className="block text-xs uppercase text-slate-500 mb-1">Baralho de Destino</label>
          <select 
            value={selectedDeckId} 
            onChange={e => setSelectedDeckId(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-nexus-500 outline-none"
          >
            <option value="">Selecione um baralho...</option>
            {state.decks.map(deck => (
              <option key={deck.id} value={deck.id}>{deck.title}</option>
            ))}
          </select>
        </div>

        {autoMode ? (
          <div className="bg-slate-800/50 p-4 rounded-lg border border-white/5 mb-6 max-h-60 overflow-y-auto">
            <p className="text-sm text-nexus-300 mb-2">Detectamos {detectedCards.length} pares no texto selecionado:</p>
            <ul className="space-y-2 text-sm text-slate-300">
              {detectedCards.map((c, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-slate-500">{i+1}.</span> 
                  <span>{c.front}</span> 
                  <span className="text-slate-600">→</span> 
                  <span className="opacity-80">{c.back}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <label className="block text-xs uppercase text-slate-500 mb-1">Frente</label>
              <textarea 
                value={front} 
                onChange={e => setFront(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 h-24 text-white focus:ring-2 focus:ring-nexus-500 outline-none resize-none font-mono text-sm"
              />
            </div>
            <div className="mb-6">
              <label className="block text-xs uppercase text-slate-500 mb-1">Verso</label>
              <textarea 
                value={back} 
                onChange={e => setBack(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 h-24 text-white focus:ring-2 focus:ring-nexus-500 outline-none resize-none"
              />
            </div>
          </>
        )}

        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-slate-400 hover:text-white">Cancelar</button>
          <button onClick={handleSave} className="px-4 py-2 bg-nexus-600 hover:bg-nexus-500 text-white rounded-lg font-medium flex items-center gap-2">
            <Check size={16} /> Salvar no Baralho
          </button>
        </div>
      </div>
    </div>
  );
};
