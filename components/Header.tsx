import React from 'react';
import { Activity, LogOut, Cpu, History, LayoutDashboard } from 'lucide-react';
import { PageView } from '../lib/types';

interface HeaderProps {
  currentPage: PageView;
  onNavigate: (page: PageView) => void;
  onLogout: () => void;
  userName?: string;
}

export function Header({ currentPage, onNavigate, onLogout, userName }: HeaderProps) {
  const getLinkClass = (page: PageView) =>
    `flex items-center gap-1.5 cursor-pointer transition-colors px-3 py-1.5 rounded-lg text-sm font-medium ${
      currentPage === page
        ? 'text-primary bg-primary/10'
        : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
    }`;

  return (
    <header className="border-b border-border bg-background/50 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate('dashboard')}>
          <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center border border-primary/30">
            <Activity className="w-5 h-5 text-primary" />
          </div>
          <span className="font-bold text-lg tracking-tight">Prospect<span className="text-primary">Engine</span></span>
        </div>

        <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
          <a onClick={() => onNavigate('dashboard')} className={getLinkClass('dashboard')}>
            <LayoutDashboard className="w-4 h-4" /> Panel
          </a>
          <a onClick={() => onNavigate('engines')} className={getLinkClass('engines')}>
            <Cpu className="w-4 h-4" /> Motores
          </a>
          <a onClick={() => onNavigate('history')} className={getLinkClass('history')}>
            <History className="w-4 h-4" /> Historial
          </a>
        </nav>

        <button
          onClick={onLogout}
          className="p-2 hover:bg-destructive/10 hover:text-destructive rounded-full transition-colors text-muted-foreground"
          title="Cerrar Sesión"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
