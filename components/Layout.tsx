import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, WalletCards, Network, FileText, BarChart2, Menu, X } from 'lucide-react';

const SidebarItem = ({ to, icon: Icon, label }: { to: string; icon: any; label: string }) => {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
          isActive
            ? 'bg-nexus-600 text-white shadow-lg shadow-nexus-500/20'
            : 'text-slate-400 hover:bg-white/5 hover:text-nexus-200'
        }`
      }
    >
      <Icon size={20} strokeWidth={2} />
      <span className="font-medium">{label}</span>
    </NavLink>
  );
};

export const Layout: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const location = useLocation();

  React.useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex overflow-hidden selection:bg-nexus-500/30">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 glass-panel border-r border-white/5 transform transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col p-6">
          <div className="flex items-center gap-2 mb-10 px-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-nexus-400 to-nexus-600 flex items-center justify-center shadow-lg shadow-nexus-500/20">
              <span className="text-white font-bold text-lg">N</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              Nexus Study
            </h1>
          </div>

          <nav className="flex-1 space-y-2">
            <SidebarItem to="/" icon={LayoutDashboard} label="Dashboard" />
            <SidebarItem to="/flashcards" icon={WalletCards} label="Flashcards" />
            <SidebarItem to="/notes" icon={Network} label="Conexões" />
            <SidebarItem to="/pdf" icon={FileText} label="Leitor PDF" />
            <SidebarItem to="/tracker" icon={BarChart2} label="Desempenho" />
          </nav>

          <div className="mt-auto pt-6 border-t border-white/5">
            <div className="flex items-center gap-3 px-2 py-2">
              <div className="w-8 h-8 rounded-full bg-slate-700 border border-white/10" />
              <div>
                <p className="text-sm font-medium text-white">Estudante</p>
                <p className="text-xs text-slate-500">UFRGS 2025</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 glass-panel border-b border-white/5">
          <div className="flex items-center gap-2">
             <div className="w-6 h-6 rounded bg-nexus-500 flex items-center justify-center">
              <span className="text-white font-bold text-xs">N</span>
            </div>
            <span className="font-bold">Nexus</span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-slate-300">
            <Menu />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 scroll-smooth">
          <div className="max-w-7xl mx-auto h-full">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};