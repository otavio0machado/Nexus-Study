
import React, { useState, useEffect } from 'react';
import { useStorage } from '../contexts/StorageContext';
import { Deck, Flashcard, Category } from '../types';
import { getStudyQueue, parseCloze } from '../utils/scheduler';
import { buildDeckTree } from '../utils/tree';
import { StudySession } from '../components/flashcards/StudySession';
import { Plus, Play, ArrowLeft, Flame, Zap, Target, Link as LinkIcon, FolderPlus, Sparkles } from 'lucide-react';
import { DeckMoveModal } from '../components/flashcards/DeckMoveModal';
import { DeckTree } from '../components/flashcards/DeckTree';
import { AICreationModal } from '../components/flashcards/AICreationModal';

export const Flashcards: React.FC = () => {
  const { state, addDeck, deleteDeck, addCard, reviewCard, suspendCard, addCategory } = useStorage();
  const [isCreatingDeck, setIsCreatingDeck] = useState(false);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  
  const [activeDeckId, setActiveDeckId] = useState<string | null>(null);
  
  const [studyMode, setStudyMode] = useState(false);
  const [moveModalDeck, setMoveModalDeck] = useState<Deck | null>(null);
  
  const [newDeckTitle, setNewDeckTitle] = useState('');
  const [newDeckSubject, setNewDeckSubject] = useState('');
  
  const [newCategoryName, setNewCategoryName] = useState('');
  const [parentCategoryId, setParentCategoryId] = useState<string | undefined>(undefined);

  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCardFront, setNewCardFront] = useState('');
  const [newCardBack, setNewCardBack] = useState('');
  const [newCardType, setNewCardType] = useState<'basic' | 'cloze'>('basic');

  const activeDeck = React.useMemo(() => {
    return state.decks.find(d => d.id === activeDeckId) || null;
  }, [state.decks, activeDeckId]);

  // Tree Building
  const deckTree = React.useMemo(() => {
      return buildDeckTree(state.categories, state.decks);
  }, [state.categories, state.decks]);

  const groupedDecks = React.useMemo(() => {
    // This is a fallback/helper if we needed flat groups, but we use deckTree now.
    // Keeping it simple to avoid hook errors if referenced elsewhere, though unused.
    return {};
  }, [state.decks]);

  const globalQueue = React.useMemo(() => {
    if(activeDeck) {
        return getStudyQueue(activeDeck.cards, state.settings, state.dailyProgress);
    }
    const allCards = state.decks.flatMap(d => d.cards);
    return getStudyQueue(allCards, state.settings, state.dailyProgress);
  }, [state.decks, activeDeck, state.settings, state.dailyProgress]);

  const handleCreateDeck = () => {
    if (!newDeckTitle || !newDeckSubject) return;
    addDeck({
      id: Date.now().toString(),
      title: newDeckTitle,
      subject: newDeckSubject,
      // Se tivermos um parent selecionado na UI (futuro), poderíamos passar aqui
      cards: []
    });
    setIsCreatingDeck(false);
    setNewDeckTitle('');
    setNewDeckSubject('');
  };

  const handleOpenCreateCategory = (parentId?: string) => {
      setParentCategoryId(parentId);
      setIsCreatingCategory(true);
  };

  const handleCreateCategory = () => {
      if(!newCategoryName) return;
      
      addCategory(newCategoryName, parentCategoryId); 
      setIsCreatingCategory(false);
      setNewCategoryName('');
      setParentCategoryId(undefined);
  };

  const handleAddCard = () => {
    if (!activeDeck || !newCardFront) return;
    const newCard: any = {
      id: Date.now().toString(),
      front: newCardFront,
      back: newCardBack || '',
      cardType: newCardType
    };
    addCard(activeDeck.id, newCard);
    
    setNewCardFront('');
    setNewCardBack('');
    setIsAddingCard(false);
  };

  const handleDeleteDeck = (id: string) => {
      if(window.confirm('Excluir este baralho?')) deleteDeck(id);
  }

  // Handle Drag and Drop for Tree
  const handleDropItem = (draggedId: string, targetId: string | undefined, type: 'deck' | 'category') => {
      // This is handled inside DeckTree mostly, but if we need page-level logic:
      console.log('Dropped', type, draggedId, 'into', targetId);
  }

  const { stats, dailyProgress } = state;
  const progressPercent = Math.min(100, Math.round(((dailyProgress.newStudied + dailyProgress.reviewStudied) / (state.settings.maxNewPerDay + state.settings.maxReviewsPerDay)) * 100));

  if (studyMode && activeDeck) {
    return <StudySession deck={activeDeck} queue={globalQueue} onReview={reviewCard} onSuspend={suspendCard} onClose={() => setStudyMode(false)} />;
  }

  return (
    <div className="space-y-6 animate-fade-in h-full flex flex-col pb-20">
      
      {/* Gamification Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
         <div className="glass-panel p-4 rounded-xl flex items-center gap-4 relative overflow-hidden group">
             <div className="p-3 bg-orange-500/10 rounded-full text-orange-500 group-hover:scale-110 transition-transform effect-levitate aura-orange" style={{animationDelay: '0s'}}>
                 <Flame size={24} fill={stats.streak > 0 ? "currentColor" : "none"} />
             </div>
             <div>
                 <p className="text-xs text-slate-400 font-bold uppercase">Sequência</p>
                 <p className="text-xl font-bold text-white">{stats.streak} dias</p>
             </div>
         </div>
         <div className="glass-panel p-4 rounded-xl flex items-center gap-4 group">
             <div className="p-3 bg-yellow-500/10 rounded-full text-yellow-500 group-hover:scale-110 transition-transform effect-levitate aura-yellow" style={{animationDelay: '0.1s'}}>
                 <Zap size={24} fill="currentColor" />
             </div>
             <div>
                 <p className="text-xs text-slate-400 font-bold uppercase">Nível {stats.level}</p>
                 <p className="text-xl font-bold text-white">{stats.xp} XP</p>
             </div>
         </div>
         <div className="glass-panel p-4 rounded-xl flex items-center gap-4">
             <div className="relative w-12 h-12 flex items-center justify-center rounded-full effect-levitate aura-cyan bg-slate-800/20" style={{animationDelay: '0.2s'}}>
                 <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                     <circle cx="24" cy="24" r="18" stroke="#334155" strokeWidth="4" fill="none" />
                     <circle cx="24" cy="24" r="18" stroke="#0ea5e9" strokeWidth="4" fill="none" strokeDasharray="113" strokeDashoffset={113 - (113 * progressPercent) / 100} strokeLinecap="round" />
                 </svg>
                 <Target size={20} className="text-nexus-400 relative z-10" />
             </div>
             <div>
                 <p className="text-xs text-slate-400 font-bold uppercase">Meta Diária</p>
                 <p className="text-xl font-bold text-white">{dailyProgress.newStudied + dailyProgress.reviewStudied} / {state.settings.maxNewPerDay + state.settings.maxReviewsPerDay}</p>
             </div>
         </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
           {activeDeck ? (
             <button onClick={() => setActiveDeckId(null)} className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                <ArrowLeft size={20} />
             </button>
           ) : null}
           <div>
            <h1 className="text-3xl font-bold text-white">
                {activeDeck ? activeDeck.title : 'Meus Baralhos'}
            </h1>
            {!activeDeck && (
               <p className="text-slate-400 text-sm mt-1">
                 {globalQueue.length} cartões recomendados para hoje.
               </p>
            )}
           </div>
        </div>
        
        {!activeDeck ? (
            <div className="flex gap-2">
                <button 
                    onClick={() => setIsAIModalOpen(true)}
                    className="flex items-center gap-2 bg-gradient-to-r from-nexus-600 to-purple-600 hover:from-nexus-500 hover:to-purple-500 text-white px-4 py-2 rounded-lg transition-all shadow-lg shadow-purple-900/20 border border-white/10"
                >
                    <Sparkles size={18} /> <span className="hidden md:inline">Mágica IA</span>
                </button>
                <button 
                    onClick={() => handleOpenCreateCategory()}
                    className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg transition-all"
                >
                    <FolderPlus size={18} /> <span className="hidden md:inline">Pasta</span>
                </button>
                <button 
                    onClick={() => setIsCreatingDeck(true)}
                    className="flex items-center gap-2 bg-nexus-600 hover:bg-nexus-500 text-white px-4 py-2 rounded-lg transition-all shadow-lg shadow-nexus-600/20"
                >
                    <Plus size={18} /> <span className="hidden md:inline">Baralho</span>
                </button>
            </div>
        ) : (
             <div className="flex gap-2">
                <button 
                    onClick={() => setIsAddingCard(true)}
                    className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg transition-all"
                >
                    <Plus size={18} /> Criar Carta
                </button>
                <button 
                    onClick={() => setStudyMode(true)}
                    disabled={globalQueue.length === 0}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all shadow-lg ${globalQueue.length > 0 ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
                >
                    <Play size={18} /> Estudar ({globalQueue.length})
                </button>
             </div>
        )}
      </div>

      {!activeDeck && (
        <div className="bg-slate-900/30 border border-white/5 rounded-2xl p-4 min-h-[300px]">
            {deckTree.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                    <p>Nenhuma pasta ou baralho criado.</p>
                </div>
            ) : (
                <DeckTree 
                    nodes={deckTree} 
                    settings={state.settings} 
                    dailyProgress={state.dailyProgress}
                    onSelectDeck={setActiveDeckId}
                    onMoveDeck={setMoveModalDeck}
                    onDeleteDeck={handleDeleteDeck}
                    onCreateSubCategory={handleOpenCreateCategory}
                />
            )}
        </div>
      )}

      {/* DETALHES DO BARALHO ATIVO (Cards List) */}
      {activeDeck && (
        <div className="grid grid-cols-1 gap-4">
            {activeDeck.cards.length === 0 ? (
                <div className="text-center py-12 glass-panel rounded-xl">
                    <p className="text-slate-500 mb-4">Este baralho está vazio.</p>
                </div>
            ) : (
               activeDeck.cards.map((card) => {
                const status = card.status || 'new';
                return (
                <div key={card.id} className="glass-panel p-4 rounded-lg flex flex-col md:flex-row gap-4 border-l-4 border-white/5 hover:border-nexus-500/50 transition-colors">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                                {card.cardType === 'cloze' ? 'Cloze' : 'Frente'}
                            </span>
                            {card.sourceType && (
                                <span className="text-[10px] flex items-center gap-1 text-indigo-400 bg-indigo-400/10 px-1.5 rounded border border-indigo-400/20">
                                    <LinkIcon size={8} /> {card.sourceType === 'pdf' ? 'PDF' : 'Nota'}
                                </span>
                            )}
                        </div>
                        <p className="font-medium text-slate-200 whitespace-pre-wrap">
                            {card.cardType === 'cloze' ? parseCloze(card.front) : card.front}
                        </p>
                    </div>
                    {card.cardType === 'basic' && (
                        <>
                            <div className="hidden md:block w-px bg-white/10"></div>
                            <div className="flex-1">
                                <span className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 block font-bold">Verso</span>
                                <p className="font-medium text-slate-300 whitespace-pre-wrap">{card.back}</p>
                            </div>
                        </>
                    )}
                    <div className="w-full md:w-32 flex flex-row md:flex-col justify-between items-center md:items-end gap-2 md:gap-0 border-t md:border-t-0 md:border-l border-white/5 pt-2 md:pt-0 md:pl-4">
                         <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide
                           ${status === 'new' ? 'bg-blue-500/10 text-blue-400' : 
                             status === 'review' ? 'bg-emerald-500/10 text-emerald-400' : 
                             status === 'suspended' ? 'bg-slate-500/10 text-slate-400' :
                             'bg-orange-500/10 text-orange-400' }`}>
                           {status ? status.toUpperCase() : 'NEW'}
                        </div>
                        <div className="text-xs text-slate-500 font-mono">
                           Iv: {(card.interval ?? 0).toFixed(1)}d
                        </div>
                    </div>
                </div>
            )}))}
        </div>
      )}

       {/* MODAL: Criar Carta */}
       {isAddingCard && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <h2 className="text-xl font-bold mb-4">Nova Carta</h2>
            <div className="flex gap-4 mb-4">
                <button onClick={() => setNewCardType('basic')} className={`px-3 py-1 rounded text-sm ${newCardType === 'basic' ? 'bg-nexus-600 text-white' : 'bg-slate-800 text-slate-400'}`}>Básico</button>
                <button onClick={() => setNewCardType('cloze')} className={`px-3 py-1 rounded text-sm ${newCardType === 'cloze' ? 'bg-nexus-600 text-white' : 'bg-slate-800 text-slate-400'}`}>Cloze (Omissão)</button>
            </div>
            <div className="mb-4">
                <label className="block text-xs uppercase text-slate-500 mb-1">{newCardType === 'cloze' ? 'Texto (Use {{c1::resposta}})' : 'Frente'}</label>
                <textarea className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 h-24 text-white focus:ring-2 focus:ring-nexus-500 outline-none resize-none font-mono text-sm" value={newCardFront} onChange={e => setNewCardFront(e.target.value)} autoFocus />
            </div>
            {newCardType === 'basic' && (
                <div className="mb-6">
                    <label className="block text-xs uppercase text-slate-500 mb-1">Verso</label>
                    <textarea className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 h-24 text-white focus:ring-2 focus:ring-nexus-500 outline-none resize-none" value={newCardBack} onChange={e => setNewCardBack(e.target.value)} />
                </div>
            )}
            <div className="flex justify-end gap-3">
              <button onClick={() => setIsAddingCard(false)} className="px-4 py-2 text-slate-400 hover:text-white">Cancelar</button>
              <button onClick={handleAddCard} className="px-4 py-2 bg-nexus-600 hover:bg-nexus-500 text-white rounded-lg">Adicionar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Criar Baralho */}
      {isCreatingDeck && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h2 className="text-xl font-bold mb-4">Novo Baralho</h2>
            <input type="text" placeholder="Título" className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 mb-3 text-white focus:ring-2 focus:ring-nexus-500 outline-none" value={newDeckTitle} onChange={e => setNewDeckTitle(e.target.value)} autoFocus />
            <input type="text" placeholder="Matéria" className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 mb-6 text-white focus:ring-2 focus:ring-nexus-500 outline-none" value={newDeckSubject} onChange={e => setNewDeckSubject(e.target.value)} />
            <div className="flex justify-end gap-3">
              <button onClick={() => setIsCreatingDeck(false)} className="px-4 py-2 text-slate-400 hover:text-white">Cancelar</button>
              <button onClick={handleCreateDeck} className="px-4 py-2 bg-nexus-600 hover:bg-nexus-500 text-white rounded-lg">Criar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Criar Categoria */}
      {isCreatingCategory && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h2 className="text-xl font-bold mb-4">
                {parentCategoryId ? 'Nova Subpasta' : 'Nova Pasta'}
            </h2>
            <input 
                type="text" 
                placeholder="Nome da Pasta" 
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 mb-6 text-white focus:ring-2 focus:ring-nexus-500 outline-none" 
                value={newCategoryName} 
                onChange={e => setNewCategoryName(e.target.value)} 
                autoFocus 
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setIsCreatingCategory(false)} className="px-4 py-2 text-slate-400 hover:text-white">Cancelar</button>
              <button onClick={handleCreateCategory} className="px-4 py-2 bg-nexus-600 hover:bg-nexus-500 text-white rounded-lg">Criar</button>
            </div>
          </div>
        </div>
      )}

      {moveModalDeck && (
        <DeckMoveModal deck={moveModalDeck} onClose={() => setMoveModalDeck(null)} />
      )}

      {isAIModalOpen && (
        <AICreationModal onClose={() => setIsAIModalOpen(false)} />
      )}
    </div>
  );
};
