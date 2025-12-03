
import React, { useState, useMemo } from 'react';
import { useStorage } from '../../contexts/StorageContext';
import { Deck } from '../../types';
import { FolderInput, X, Plus } from 'lucide-react';
import { getFlattenedCategoryOptions } from '../../utils/tree';

interface DeckMoveModalProps {
  deck: Deck;
  onClose: () => void;
}

export const DeckMoveModal: React.FC<DeckMoveModalProps> = ({ deck, onClose }) => {
  const { state, moveDeck, addCategory } = useStorage();
  const [selectedCat, setSelectedCat] = useState(deck.categoryId || '');
  const [newCatName, setNewCatName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const categoryOptions = useMemo(() => {
    return getFlattenedCategoryOptions(state.categories);
  }, [state.categories]);

  const handleMove = () => {
    moveDeck(deck.id, selectedCat);
    onClose();
  };

  const handleCreateCategory = () => {
    if (newCatName) {
      addCategory(newCatName); 
      setNewCatName('');
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-sm p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <FolderInput className="text-nexus-400" size={20} /> Mover Baralho
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><X size={20} /></button>
        </div>

        <p className="text-sm text-slate-400 mb-4">
          Selecione uma categoria para <strong>{deck.title}</strong>:
        </p>

        <div className="space-y-3 mb-6">
          <select 
            value={selectedCat} 
            onChange={(e) => setSelectedCat(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-nexus-500 outline-none text-sm"
          >
            <option value="">Sem Categoria (Raiz)</option>
            {categoryOptions.map(opt => (
              <option key={opt.id} value={opt.id}>{opt.label}</option>
            ))}
          </select>

          {isCreating ? (
            <div className="flex gap-2">
              <input 
                type="text" 
                autoFocus
                placeholder="Nova Categoria Raiz"
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg p-2 text-sm text-white focus:ring-2 focus:ring-nexus-500 outline-none"
              />
              <button onClick={handleCreateCategory} className="bg-emerald-600 px-3 rounded-lg text-white hover:bg-emerald-500 text-sm">OK</button>
            </div>
          ) : (
            <button 
              onClick={() => setIsCreating(true)}
              className="text-xs text-nexus-400 hover:text-nexus-300 flex items-center gap-1"
            >
              <Plus size={12} /> Criar nova categoria raiz
            </button>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-slate-400 hover:text-white">Cancelar</button>
          <button onClick={handleMove} className="px-4 py-2 bg-nexus-600 hover:bg-nexus-500 text-white rounded-lg font-medium">
            Mover
          </button>
        </div>
      </div>
    </div>
  );
};
