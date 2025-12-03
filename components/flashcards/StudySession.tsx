import React, { useState, useEffect } from 'react';
import { Deck, Flashcard } from '../../types';
import { parseCloze, renderClozeAnswer } from '../../utils/scheduler';
import { X, Check, MoreVertical, EyeOff, Award, Zap } from 'lucide-react';

interface StudyProps {
    deck: Deck;
    queue: Flashcard[];
    onReview: (dId: string, cId: string, rating: 'again'|'hard'|'good'|'easy', time: number) => void;
    onClose: () => void;
    onSuspend: (dId: string, cId: string) => void;
}

export const StudySession: React.FC<StudyProps> = ({ deck, queue, onReview, onClose, onSuspend }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [startTime, setStartTime] = useState(Date.now());
    const [sessionStats, setStats] = useState({ reviewed: 0, correct: 0, xpGained: 0 });
    const [showMenu, setShowMenu] = useState(false);
    
    // Derived state
    const card = queue[currentIndex];
    const progress = Math.round((currentIndex / queue.length) * 100);

    // Reset timer on card switch
    useEffect(() => {
        setStartTime(Date.now());
        setIsFlipped(false);
    }, [currentIndex]);

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!card) return;
            if (e.code === 'Space') {
                e.preventDefault();
                if (!isFlipped) setIsFlipped(true);
            }
            if (!isFlipped) return;

            switch(e.key) {
                case '1': handleRate('again'); break;
                case '2': handleRate('hard'); break;
                case '3': handleRate('good'); break;
                case '4': handleRate('easy'); break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isFlipped, card]);

    const handleRate = (rating: 'again'|'hard'|'good'|'easy') => {
        const timeTaken = Date.now() - startTime;
        
        // Calculate optimistic XP
        let xp = 2;
        if(rating === 'hard') xp = 5;
        if(rating === 'good') xp = 10;
        if(rating === 'easy') xp = 15;
        
        onReview(deck.id, card.id, rating, timeTaken);

        setStats(prev => ({
            reviewed: prev.reviewed + 1,
            correct: rating === 'again' ? prev.correct : prev.correct + 1,
            xpGained: prev.xpGained + xp
        }));

        if (currentIndex < queue.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            setCurrentIndex(prev => prev + 1); // Triggers end screen
        }
    };

    const handleSuspend = () => {
        onSuspend(deck.id, card.id);
        setShowMenu(false);
        // Skip current
        if (currentIndex < queue.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            setCurrentIndex(prev => prev + 1); 
        }
    };

    // Render Cloze Content
    const renderCardContent = (content: string, isBack: boolean) => {
        if (card.cardType === 'cloze') {
             if (!isBack) {
                 return <span className="leading-relaxed whitespace-pre-wrap block text-left">{parseCloze(content)}</span>
             } else {
                 return <span className="leading-relaxed whitespace-pre-wrap block text-left" dangerouslySetInnerHTML={{ __html: renderClozeAnswer(content) }} />
             }
        }
        return <p className="leading-relaxed whitespace-pre-wrap">{content}</p>;
    }

    // --- END SCREEN ---
    if (!card) {
        return (
            <div className="flex flex-col items-center justify-center h-full animate-fade-in text-center p-6 bg-gradient-to-br from-slate-900 via-slate-900 to-nexus-900/20">
                <div className="w-24 h-24 bg-gradient-to-br from-nexus-400 to-emerald-500 rounded-full flex items-center justify-center mb-8 shadow-2xl shadow-emerald-500/20 animate-bounce-slow">
                    <Award size={48} className="text-white" />
                </div>
                <h2 className="text-4xl font-bold mb-2 text-white">Sessão Concluída!</h2>
                
                <div className="flex gap-8 my-8">
                     <div className="text-center">
                         <span className="block text-3xl font-bold text-nexus-400">{sessionStats.reviewed}</span>
                         <span className="text-xs text-slate-500 uppercase font-bold">Cartões</span>
                     </div>
                     <div className="text-center">
                         <span className="block text-3xl font-bold text-yellow-400">+{sessionStats.xpGained}</span>
                         <span className="text-xs text-slate-500 uppercase font-bold">XP Ganho</span>
                     </div>
                     <div className="text-center">
                         <span className="block text-3xl font-bold text-emerald-400">{Math.round((sessionStats.correct/sessionStats.reviewed)*100)}%</span>
                         <span className="text-xs text-slate-500 uppercase font-bold">Precisão</span>
                     </div>
                </div>

                <button onClick={onClose} className="px-8 py-3 bg-white text-slate-900 hover:bg-slate-200 rounded-full font-bold transition-all shadow-lg transform hover:scale-105">
                    Continuar Estudando
                </button>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 bg-slate-950 z-50 flex flex-col">
             {/* HEADER */}
             <div className="flex items-center justify-between p-4 px-6 border-b border-white/5 bg-slate-900/50 backdrop-blur">
                 <div className="flex items-center gap-4">
                     <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors"><X size={24}/></button>
                     <div className="h-2 w-24 md:w-48 bg-slate-800 rounded-full overflow-hidden">
                         <div className="h-full bg-nexus-500 transition-all duration-500" style={{ width: `${progress}%` }}></div>
                     </div>
                 </div>
                 
                 <div className="flex items-center gap-4">
                     <div className="hidden md:flex items-center gap-1 text-yellow-500 font-bold text-sm">
                         <Zap size={16} fill="currentColor" /> {sessionStats.xpGained} XP
                     </div>
                     <div className="relative">
                        <button onClick={() => setShowMenu(!showMenu)} className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10">
                            <MoreVertical size={20} />
                        </button>
                        {showMenu && (
                            <div className="absolute right-0 top-12 bg-slate-800 border border-white/10 rounded-xl shadow-xl py-2 w-48 animate-fade-in">
                                <button onClick={handleSuspend} className="w-full text-left px-4 py-2 hover:bg-white/5 text-red-400 text-sm flex items-center gap-2">
                                    <EyeOff size={16} /> Suspender Cartão
                                </button>
                            </div>
                        )}
                     </div>
                 </div>
             </div>

             {/* MAIN STAGE */}
             <div className="flex-1 flex flex-col items-center justify-center p-4 relative overflow-hidden" onClick={() => !isFlipped && setIsFlipped(true)}>
                 {/* Card Container */}
                 <div className="w-full max-w-3xl aspect-[4/3] md:aspect-[16/9] perspective-1000 cursor-pointer group relative">
                     <div className={`relative w-full h-full duration-500 transform-style-3d transition-transform ${isFlipped ? 'rotate-y-180' : ''}`}>
                         
                         {/* Front Face */}
                         <div className="absolute w-full h-full backface-hidden glass-panel border border-white/10 rounded-3xl flex flex-col items-center justify-center p-8 md:p-16 shadow-2xl bg-gradient-to-b from-slate-900/80 to-slate-900/40">
                            <span className="absolute top-8 text-xs font-bold text-slate-500 tracking-widest uppercase">
                                {card.cardType === 'cloze' ? 'Complete' : 'Pergunta'}
                            </span>
                            <div className="text-2xl md:text-4xl font-medium text-center text-slate-100 w-full overflow-y-auto max-h-full">
                                {renderCardContent(card.front, false)}
                            </div>
                            <div className="absolute bottom-8 text-slate-500 text-sm flex items-center gap-2 opacity-60">
                                <span className="animate-pulse">Toque ou Espaço para virar</span>
                            </div>
                         </div>

                         {/* Back Face */}
                         <div className="absolute w-full h-full backface-hidden rotate-y-180 bg-slate-800 border border-nexus-500/20 rounded-3xl flex flex-col items-center justify-center p-8 md:p-16 shadow-2xl">
                             <span className="absolute top-8 text-xs font-bold text-nexus-400 tracking-widest uppercase">Resposta</span>
                             <div className="text-2xl md:text-4xl font-medium text-center text-white w-full overflow-y-auto max-h-full">
                                {card.cardType === 'cloze' ? renderCardContent(card.front, true) : renderCardContent(card.back, true)}
                             </div>
                         </div>
                     </div>
                 </div>
             </div>

             {/* CONTROLS */}
             <div className="p-6 pb-10 max-w-3xl mx-auto w-full">
                 {!isFlipped ? (
                      <button onClick={() => setIsFlipped(true)} className="w-full py-4 bg-nexus-600 hover:bg-nexus-500 text-white rounded-2xl font-bold text-lg shadow-lg shadow-nexus-600/20 transition-all transform active:scale-95">
                        Mostrar Resposta
                      </button>
                 ) : (
                     <div className="grid grid-cols-4 gap-3 md:gap-4 h-20">
                        <RatingBtn label="Errei" sub="< 1m" color="red" hotkey="1" onClick={() => handleRate('again')} />
                        <RatingBtn label="Difícil" sub="~ 2d" color="orange" hotkey="2" onClick={() => handleRate('hard')} />
                        <RatingBtn label="Bom" sub="~ 4d" color="blue" hotkey="3" onClick={() => handleRate('good')} />
                        <RatingBtn label="Fácil" sub="~ 7d" color="emerald" hotkey="4" onClick={() => handleRate('easy')} />
                     </div>
                 )}
             </div>
        </div>
    )
}

const RatingBtn = ({ label, sub, color, hotkey, onClick }: any) => {
    const colorClasses: any = {
        red: 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20',
        orange: 'bg-orange-500/10 text-orange-400 border-orange-500/20 hover:bg-orange-500/20',
        blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20',
        emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20',
    };

    return (
        <button onClick={onClick} className={`flex flex-col items-center justify-center border rounded-2xl transition-all transform hover:-translate-y-1 active:scale-95 ${colorClasses[color]}`}>
            <span className="font-bold text-sm md:text-base">{label}</span>
            <span className="text-[10px] opacity-60 uppercase font-mono mt-1">{sub}</span>
            <span className="hidden md:block absolute top-1 right-2 text-[10px] opacity-30 border border-current px-1 rounded">{hotkey}</span>
        </button>
    )
}