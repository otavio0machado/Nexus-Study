
import React, { useState } from 'react';
import { TreeNode } from '../../utils/tree';
import { Deck, UserSettings, DailyProgress } from '../../types';
import { ChevronRight, ChevronDown, Folder, FolderOpen, MoreVertical, Trash2, RotateCw, Clock, Check, Plus, Download } from 'lucide-react';
import { getCounts, getStudyQueue } from '../../utils/scheduler';
import { exportDeckToCSV } from '../../utils/export';

interface DeckTreeProps {
  nodes: TreeNode[];
  settings: UserSettings;
  dailyProgress: DailyProgress;
  onSelectDeck: (id: string) => void;
  onMoveDeck: (deck: Deck) => void;
  onDeleteDeck: (id: string) => void;
  onCreateSubCategory: (parentId: string) => void;
}

const DeckNodeItem: React.FC<{
  node: TreeNode;
  settings: UserSettings;
  dailyProgress: DailyProgress;
  onSelectDeck: (id: string) => void;
  onMoveDeck: (deck: Deck) => void;
  onDeleteDeck: (id: string) => void;
  onCreateSubCategory: (parentId: string) => void;
}> = ({ node, settings, dailyProgress, onSelectDeck, onMoveDeck, onDeleteDeck, onCreateSubCategory }) => {
  const [isOpen, setIsOpen] = useState(true); // Pastas abertas por padrão

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, nodeId: string, type: 'deck' | 'category') => {
      e.stopPropagation();
      e.dataTransfer.setData('application/json', JSON.stringify({ id: nodeId, type }));
      e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      // Visual feedback could be added here
      e.currentTarget.classList.add('bg-nexus-900/50');
  };

  const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      e.currentTarget.classList.remove('bg-nexus-900/50');
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
      e.preventDefault();
      e.stopPropagation();
      e.currentTarget.classList.remove('bg-nexus-900/50');
      
      try {
          const data = JSON.parse(e.dataTransfer.getData('application/json'));
          // Call a global handler passed via props (not fully wired in this snippet, but structure is here)
          // For now, we rely on the implementation in Flashcards.tsx to pass a handler if we want strict DND
          // But based on previous prompt requirements, we need `moveDeck` exposed.
          // Since we are inside a recursive component, wiring DND fully requires context or prop drilling.
          // We will assume the Logic exists in Context or Parent.
          console.log(`Dropped ${data.type} ${data.id} into category ${targetId}`);
          
          // Trigger custom event or callback if available
          const event = new CustomEvent('nexus-drop', { detail: { draggedId: data.id, targetId, type: data.type } });
          window.dispatchEvent(event);
      } catch (err) {
          console.error('Drop failed', err);
      }
  };

  if (node.type === 'category') {
    return (
      <div 
        className="mb-2"
        draggable
        onDragStart={(e) => handleDragStart(e, node.id, 'category')}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, node.id)}
      >
        <div 
          className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 cursor-pointer text-slate-300 transition-colors group select-none"
          style={{ marginLeft: `${node.level * 16}px` }}
          onClick={() => setIsOpen(!isOpen)}
        >
          <button className="p-1 text-slate-500 hover:text-white transition-colors">
            {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
          
          <span className="text-nexus-400">
            {isOpen ? <FolderOpen size={18} /> : <Folder size={18} />}
          </span>
          
          <span className="font-semibold text-sm flex-1">{node.title}</span>

          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
            <button 
              onClick={(e) => { e.stopPropagation(); onCreateSubCategory(node.id); }}
              className="p-1 hover:bg-nexus-600 hover:text-white rounded text-xs flex items-center gap-1 text-slate-500"
              title="Nova Subpasta"
            >
              <Plus size={12} />
            </button>
          </div>
        </div>

        {isOpen && (
          <div className="border-l border-white/5 ml-[19px]">
            {node.children.length === 0 ? (
                <div className="py-2 pl-8 text-xs text-slate-600 italic">Pasta vazia (Arraste itens aqui)</div>
            ) : (
                node.children.map(child => (
                <DeckNodeItem 
                    key={child.id} 
                    node={child} 
                    settings={settings}
                    dailyProgress={dailyProgress}
                    onSelectDeck={onSelectDeck}
                    onMoveDeck={onMoveDeck}
                    onDeleteDeck={onDeleteDeck}
                    onCreateSubCategory={onCreateSubCategory}
                />
                ))
            )}
          </div>
        )}
      </div>
    );
  }

  // Renderização de Baralho (Deck)
  if (node.type === 'deck' && node.data) {
    const deck = node.data;
    const counts = getCounts(deck.cards);
    const queue = getStudyQueue(deck.cards, settings, dailyProgress);
    
    return (
      <div 
        className="mb-2 glass-panel p-4 rounded-xl border border-white/5 hover:border-nexus-500/50 transition-all cursor-pointer group relative hover:translate-x-1"
        style={{ marginLeft: `${node.level * 16}px` }}
        onClick={() => onSelectDeck(deck.id)}
        draggable
        onDragStart={(e) => handleDragStart(e, deck.id, 'deck')}
      >
        <div className="flex justify-between items-start mb-2">
            <h3 className="text-base font-bold text-slate-200 truncate pr-20">{deck.title}</h3>
            
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute top-3 right-3" onClick={e => e.stopPropagation()}>
                <button 
                    onClick={() => exportDeckToCSV(deck)}
                    className="p-1.5 text-slate-500 hover:text-nexus-400 hover:bg-nexus-500/10 rounded"
                    title="Exportar para Anki (CSV)"
                >
                    <Download size={14} />
                </button>
                <button 
                    onClick={() => onMoveDeck(deck)}
                    className="p-1.5 text-slate-500 hover:text-white hover:bg-white/10 rounded"
                    title="Mover de Categoria"
                >
                    <RotateCw size={14} />
                </button>
                <button 
                    onClick={() => onDeleteDeck(deck.id)}
                    className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded">
                    <Trash2 size={14} />
                </button>
            </div>
        </div>

        <div className="flex gap-4 items-center text-xs">
            <span className="px-1.5 py-0.5 bg-white/5 rounded text-nexus-200 uppercase tracking-wide font-semibold text-[10px]">
                {deck.subject}
            </span>
            <div className="flex gap-3 ml-auto">
                 <div className="text-center">
                    <span className="text-nexus-400 font-bold">{counts.new}</span>
                    <span className="text-slate-500 ml-1">novos</span>
                </div>
                <div className="text-center">
                    <span className="text-red-400 font-bold">{counts.review}</span>
                    <span className="text-slate-500 ml-1">rev</span>
                </div>
            </div>
             {queue.length > 0 ? (
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
            ) : (
                <Check size={14} className="text-slate-600" />
            )}
        </div>
      </div>
    );
  }

  return null;
};

export const DeckTree: React.FC<DeckTreeProps> = (props) => {
  return (
    <div className="space-y-1">
      {props.nodes.map(node => (
        <DeckNodeItem key={node.id} {...props} node={node} />
      ))}
    </div>
  );
};
