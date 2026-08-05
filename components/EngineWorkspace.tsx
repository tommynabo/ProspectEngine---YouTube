import React, { useState } from 'react';
import { ArrowLeft, Download, Target, Linkedin, Map, Instagram, Globe, Zap, History } from 'lucide-react';
import { Lead, SearchConfigState, SearchSession, ProspectingEngine, ICPProfile, SearchMethod } from '../lib/types';
import { SearchConfig } from './SearchConfig';
import { AgentTerminal } from './AgentTerminal';
import { CampaignPipeline } from './CampaignPipeline';

// ─── CSV helpers ──────────────────────────────────────────────────────────────

function escapeCSV(v: string | undefined): string {
  if (!v) return '';
  const s = v.replace(/"/g, '""').replace(/[\n\r]/g, ' ');
  return s.includes(',') || s.includes('"') ? `"${s}"` : s;
}

function downloadCSV(sessions: SearchSession[], activeLeads: Lead[], filename: string) {
  const headers = ['Nombre', 'Apellido', 'Email', 'Cargo', 'Perfil de LinkedIn'];
  const allLeads = [...sessions.flatMap(s => s.leads), ...activeLeads];
  const rows = allLeads.map(l => {
    const fullName = (l.decisionMaker?.name ?? '').trim();
    const spaceIdx = fullName.indexOf(' ');
    const firstName = spaceIdx === -1 ? fullName : fullName.slice(0, spaceIdx);
    const lastName = spaceIdx === -1 ? '' : fullName.slice(spaceIdx + 1);
    return [
      escapeCSV(firstName),
      escapeCSV(lastName),
      escapeCSV(l.decisionMaker?.email),
      escapeCSV(l.decisionMaker?.role),
      escapeCSV(l.decisionMaker?.linkedin || l.socialUrl || ''),
    ].join(',');
  });
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const PLATFORM_ICONS: Record<SearchMethod['platform'], React.ElementType> = {
  linkedin: Linkedin, google_maps: Map, instagram: Instagram, other: Globe,
};

// ─── Tabs ─────────────────────────────────────────────────────────────────────

type EngineWorkspaceTab = 'generator' | 'history';

// ─── Component ────────────────────────────────────────────────────────────────

interface EngineWorkspaceProps {
  engine: ProspectingEngine;
  icp: ICPProfile;
  method: SearchMethod;
  config: SearchConfigState;
  onChange: (updates: Partial<SearchConfigState>) => void;
  onSearch: () => void;
  onStop: () => void;
  isSearching: boolean;
  logs: string[];
  terminalVisible: boolean;
  terminalExpanded: boolean;
  onToggleTerminal: () => void;
  leads: Lead[];
  history: SearchSession[];
  onViewMessage: (lead: Lead) => void;
  onBack: () => void;
  onOpenCriteria: () => void;
  totalLeadsGenerated: number;
}

export function EngineWorkspace({
  engine, icp, method,
  config, onChange, onSearch, onStop, isSearching,
  logs, terminalVisible, terminalExpanded, onToggleTerminal,
  leads, history, onViewMessage, onBack,
  onOpenCriteria, totalLeadsGenerated,
}: EngineWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<EngineWorkspaceTab>('generator');
  const PlatformIcon = PLATFORM_ICONS[method.platform];
  const totalLeads = history.reduce((sum, s) => sum + s.leads.length, 0) + leads.length;
  const dateStr = new Date().toISOString().slice(0, 10);
  const hasAnything = history.length > 0 || leads.length > 0;

  return (
    <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
      {/* Engine header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 rounded-lg border border-border hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
          title="Volver a motores"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold tracking-tight">{engine.name}</h2>
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1">
              <Target className="w-3 h-3 text-primary" />
              {icp.name}
            </span>
            <span className="text-border">·</span>
            <span className="flex items-center gap-1">
              <PlatformIcon className="w-3 h-3 text-primary" />
              {method.name}
            </span>
            <span className="text-border">·</span>
            <span>{totalLeads} lead{totalLeads !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {hasAnything && (
          <button
            onClick={() => downloadCSV(history, leads, `${engine.name}_${dateStr}.csv`)}
            className="flex items-center gap-2 bg-primary text-primary-foreground font-semibold text-sm px-4 py-2 rounded-lg hover:brightness-110 active:scale-[0.98] transition-all shadow-md shadow-primary/20 flex-shrink-0"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Exportar CSV</span>
          </button>
        )}
      </div>

      {/* ICP summary strip */}
      <div className="bg-card border border-border rounded-xl p-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Target className="w-3.5 h-3.5 text-primary" />
          <span className="font-medium text-foreground">ICP:</span> {icp.niche}
        </div>
        {icp.jobTitles.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-medium text-foreground">Cargos:</span>
            {icp.jobTitles.slice(0, 4).map(t => (
              <span key={t} className="bg-secondary px-1.5 py-0.5 rounded font-semibold">{t}</span>
            ))}
            {icp.jobTitles.length > 4 && <span>+{icp.jobTitles.length - 4}</span>}
          </div>
        )}
        {icp.locations.length > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-foreground">Zonas:</span>
            {icp.locations.slice(0, 3).map((l, i) => (
              <span key={i} className="bg-secondary px-1.5 py-0.5 rounded font-semibold">{l}</span>
            ))}
            {icp.locations.length > 3 && <span>+{icp.locations.length - 3}</span>}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-secondary/50 p-1 rounded-xl w-fit">
        {([['generator', '⚡ Generador'], ['history', '📊 Historial del Motor']] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {key === 'generator' ? <Zap className="w-4 h-4" /> : <History className="w-4 h-4" />}
            {label}
          </button>
        ))}
      </div>

      {/* ── GENERADOR TAB ── */}
      {activeTab === 'generator' && (
        <div className="space-y-6">
          <SearchConfig
            config={config}
            onChange={onChange}
            onSearch={onSearch}
            onStop={onStop}
            isSearching={isSearching}
            onOpenCriteria={onOpenCriteria}
            totalLeadsGenerated={totalLeadsGenerated}
            hidePresets={true}
          />

          <AgentTerminal
            logs={logs}
            isVisible={terminalVisible}
            isExpanded={terminalExpanded}
            onToggleExpand={onToggleTerminal}
          />

          {/* Pipeline - Current leads */}
          {(leads.length > 0 || isSearching) && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold">Resultados Actuales</h3>
              <CampaignPipeline
                sessions={[]}
                activeLeads={leads}
                onViewMessage={onViewMessage}
              />
            </div>
          )}
        </div>
      )}

      {/* ── HISTORIAL TAB ── */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          {history.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-border rounded-2xl">
              <History className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <h3 className="font-semibold text-lg mb-1">Sin historial de búsquedas</h3>
              <p className="text-muted-foreground text-sm">Las búsquedas que ejecutes aparecerán aquí</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold">{history.length} búsqueda{history.length !== 1 ? 's' : ''}</h3>
                  <p className="text-xs text-muted-foreground">Total: {history.reduce((sum, s) => sum + s.leads.length, 0)} leads</p>
                </div>
              </div>
              
              <div className="space-y-3">
                {history.map((session) => (
                  <div key={session.id} className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-muted-foreground">
                          {session.date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })} · {session.date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p className="text-sm font-medium mt-1 truncate">{session.query}</p>
                        <p className="text-xs text-primary font-semibold mt-1.5">{session.resultsCount} leads encontrados</p>
                      </div>
                      {session.leads.length > 0 && (
                        <button
                          onClick={() => session.leads.forEach(l => onViewMessage(l))}
                          className="px-3 py-1.5 text-xs bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors whitespace-nowrap flex-shrink-0 font-medium"
                        >
                          Ver leads
                        </button>
                      )}
                    </div>
                    
                    {session.leads.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-border/30 space-y-1 max-h-48 overflow-y-auto">
                        {session.leads.slice(0, 5).map(lead => (
                          <div key={lead.id} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                            onClick={() => onViewMessage(lead)}>
                            <span className="w-1.5 h-1.5 bg-primary rounded-full flex-shrink-0" />
                            <span className="font-medium truncate">{lead.decisionMaker?.name || '—'}</span>
                            <span className="text-primary opacity-70 truncate">({lead.decisionMaker?.role || '—'})</span>
                          </div>
                        ))}
                        {session.leads.length > 5 && (
                          <p className="text-xs text-muted-foreground italic px-3 pt-1">+{session.leads.length - 5} más...</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
