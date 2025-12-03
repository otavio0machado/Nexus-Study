
import React from 'react';
import { useStorage } from '../../contexts/StorageContext';
import { FileText, Brain, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const IntegratedDashboard: React.FC = () => {
  const { state } = useStorage();

  const recentNotes = [...state.notes].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 3);
  
  // Coletar cards criados recentemente
  const allCards = state.decks.flatMap(d => d.cards.map(c => ({...c, deckTitle: d.title})));
  const recentCards = allCards
    .filter(c => c.sourceType) // Apenas cards integrados
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 3);

  return (
    <div className="glass-panel p-6 rounded-2xl mb-8 border border-white/5">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Brain className="text-nexus-400" /> Segundo Cérebro
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Atividade Recente em Notas */}
        <div>
          <h3 className="text-sm font-bold text-slate-400 uppercase mb-3">Notas Recentes</h3>
          <div className="space-y-2">
            {recentNotes.length === 0 && <p className="text-slate-600 text-sm">Nenhuma nota recente.</p>}
            {recentNotes.map(note => (
              <Link to="/notes" key={note.id} className="block p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-indigo-400" />
                  <span className="font-medium text-slate-200">{note.title}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1 truncate">{note.content.substring(0, 50)}...</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Flashcards Derivados */}
        <div>
          <h3 className="text-sm font-bold text-slate-400 uppercase mb-3">Conhecimento Extraído</h3>
          <div className="space-y-2">
            {recentCards.length === 0 && <p className="text-slate-600 text-sm">Nenhum flashcard criado a partir de notas/PDFs.</p>}
            {recentCards.map(card => (
              <div key={card.id} className="p-3 rounded-lg bg-white/5 border-l-2 border-nexus-500">
                <p className="text-sm text-slate-200 truncate">{card.front}</p>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-[10px] text-slate-500">
                    Via {card.sourceType === 'pdf' ? 'PDF' : 'Nota'}: {card.sourceTitle}
                  </span>
                  <span className="text-[10px] bg-slate-800 px-1 rounded text-slate-400">
                    {card.deckTitle}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
