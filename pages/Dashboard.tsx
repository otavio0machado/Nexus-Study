
import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, TrendingUp, Brain, FileText, ArrowRight, BarChart2 } from 'lucide-react';
import { useStorage } from '../contexts/StorageContext';
import { IntegratedDashboard } from '../components/dashboard/IntegratedDashboard';

export const Dashboard: React.FC = () => {
  const { state } = useStorage();
  
  const stats = React.useMemo(() => {
    const totalCards = state.decks.reduce((acc, deck) => acc + deck.cards.length, 0);
    const lastExam = state.examResults.length > 0 
      ? [...state.examResults].sort((a, b) => b.date - a.date)[0].score 
      : 0;

    return {
      decks: state.decks.length,
      cards: totalCards,
      notes: state.notes.length,
      exams: state.examResults.length,
      lastExamScore: lastExam
    };
  }, [state]);

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Bem-vindo de volta</h1>
        <p className="text-slate-400">Aqui está o resumo do seu progresso hoje.</p>
      </div>

      {/* NOVO: Dashboard Integrado */}
      <IntegratedDashboard />

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          icon={Brain} 
          label="Flashcards" 
          value={stats.cards} 
          subLabel={`em ${stats.decks} baralhos`} 
          color="nexus"
        />
        <StatCard 
          icon={TrendingUp} 
          label="Último Simulado" 
          value={stats.lastExamScore} 
          subLabel="pontos gerais" 
          color="emerald"
        />
        <StatCard 
          icon={FileText} 
          label="Notas Criadas" 
          value={stats.notes} 
          subLabel="conexões neurais" 
          color="indigo"
        />
         <StatCard 
          icon={Clock} 
          label="Dias Restantes" 
          value="245" 
          subLabel="até o ENEM" 
          color="orange"
        />
      </div>

      {/* Action Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Continuar Estudando</h2>
            <Link to="/flashcards" className="text-nexus-400 text-sm hover:underline flex items-center gap-1">
              Ver todos <ArrowRight size={14}/>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {state.decks.length > 0 ? (
               state.decks.slice(0, 2).map(deck => (
                 <Link key={deck.id} to="/flashcards" className="p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors border border-white/5 hover:border-nexus-500/30">
                    <div className="flex items-center justify-between mb-2">
                        <span className="px-2 py-1 text-xs font-semibold bg-slate-700/50 text-slate-300 rounded uppercase tracking-wider">{deck.subject}</span>
                        <span className="text-xs text-slate-500">{deck.cards.length} cards</span>
                    </div>
                    <h3 className="font-semibold text-lg truncate">{deck.title}</h3>
                    <div className="mt-3 h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-nexus-500 w-1/3"></div>
                    </div>
                 </Link>
               ))
             ) : (
                <div className="col-span-2 p-8 text-center border border-dashed border-white/10 rounded-xl">
                    <p className="text-slate-500 mb-2">Você ainda não tem baralhos.</p>
                    <Link to="/flashcards" className="text-nexus-400 hover:text-nexus-300 font-medium text-sm">Criar meu primeiro baralho</Link>
                </div>
             )}
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl">
          <h2 className="text-xl font-semibold mb-6">Acesso Rápido</h2>
          <div className="space-y-3">
            <QuickAction to="/notes" icon={Brain} title="Criar Nota" subtitle="Capture uma ideia" color="indigo" />
            <QuickAction to="/tracker" icon={BarChart2} title="Lançar Simulado" subtitle="Registre progresso" color="emerald" />
            <QuickAction to="/pdf" icon={FileText} title="Ler PDF" subtitle="Estudar material" color="rose" />
          </div>
        </div>
      </div>
    </div>
  );
};

// Reusable Components to clean up JSX
const StatCard = ({ icon: Icon, label, value, subLabel, color }: any) => (
  <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
    <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-${color}-400`}>
      <Icon size={64} />
    </div>
    <div className="flex flex-col relative z-10">
      <span className="text-slate-400 text-sm font-medium">{label}</span>
      <span className="text-3xl font-bold text-white mt-1">{value}</span>
      <span className={`text-${color}-400 text-xs mt-2`}>{subLabel}</span>
    </div>
  </div>
);

const QuickAction = ({ to, icon: Icon, title, subtitle, color }: any) => (
  <Link to={to} className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors group">
    <div className={`w-10 h-10 rounded-lg bg-${color}-500/20 text-${color}-400 flex items-center justify-center group-hover:scale-110 transition-transform`}>
        <Icon size={20} />
    </div>
    <div>
        <h4 className="font-medium">{title}</h4>
        <p className="text-xs text-slate-400">{subtitle}</p>
    </div>
  </Link>
);
