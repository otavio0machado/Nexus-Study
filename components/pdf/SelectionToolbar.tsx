import React from 'react';
import { Highlighter, FileText, Zap, Copy, X, Trash2 } from 'lucide-react';

interface SelectionToolbarProps {
  position: { x: number; y: number } | null;
  onHighlight: (color: string) => void;
  onNote: () => void;
  onFlashcard: () => void;
  onCopy: () => void;
  onClose: () => void;
}

export const SelectionToolbar: React.FC<SelectionToolbarProps> = ({
  position,
  onHighlight,
  onNote,
  onFlashcard,
  onCopy,
  onClose
}) => {
  if (!position) return null;

  return (
    <div 
      className="fixed z-50 flex items-center gap-1 bg-slate-900 border border-white/10 p-1 rounded-lg shadow-xl animate-fade-in"
      style={{ 
        left: position.x, 
        top: position.y - 50, // Position above the selection
        transform: 'translateX(-50%)' 
      }}
    >
      <div className="flex items-center border-r border-white/10 pr-1 mr-1 gap-1">
        <button onClick={() => onHighlight('#facc15')} className="w-6 h-6 rounded-full bg-yellow-400 hover:scale-110 transition-transform shadow-lg" title="Highlight Yellow" />
        <button onClick={() => onHighlight('#4ade80')} className="w-6 h-6 rounded-full bg-green-400 hover:scale-110 transition-transform shadow-lg" title="Highlight Green" />
        <button onClick={() => onHighlight('#f472b6')} className="w-6 h-6 rounded-full bg-pink-400 hover:scale-110 transition-transform shadow-lg" title="Highlight Pink" />
      </div>

      <button onClick={onNote} className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded transition-colors" title="Add to Notes">
        <FileText size={16} />
      </button>
      
      <button onClick={onFlashcard} className="p-2 text-slate-300 hover:text-nexus-400 hover:bg-nexus-500/10 rounded transition-colors" title="Create Flashcard">
        <Zap size={16} />
      </button>

      <button onClick={onCopy} className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded transition-colors" title="Copy Citation">
        <Copy size={16} />
      </button>

      <div className="w-px h-4 bg-white/10 mx-1" />

      <button onClick={onClose} className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors">
        <X size={16} />
      </button>
      
      {/* Down Arrow Indicator */}
      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-slate-900 filter drop-shadow-sm"></div>
    </div>
  );
};