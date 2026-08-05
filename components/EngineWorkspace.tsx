import React from 'react';
import { ArrowLeft, Download, Target, Linkedin, Map, Instagram, Globe } from 'lucide-react';
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
  const PlatformIcon = PLATFORM_ICONS[method.platform];
  const totalLeads = history.reduce((sum, s) => sum + s.leads.length, 0) + leads.length;
  const dateStr = new Date().toISOString().slice(0, 10);
  const hasAnything = history.length > 0 || leads.length > 0;

  return (
    <div className="space-y-8 animate-[fadeIn_0.3s_ease-out]">
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
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
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
            <span>{totalLeads} lead{totalLeads !== 1 ? 's' : ''} acumulados</span>
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
              <span key={t} className="bg-secondary px-1.5 py-0.5 rounded">{t}</span>
            ))}
            {icp.jobTitles.length > 4 && <span>+{icp.jobTitles.length - 4}</span>}
          </div>
        )}
        {icp.locations.length > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-foreground">Zonas:</span>
            {icp.locations.slice(0, 3).join(', ')}
            {icp.locations.length > 3 && ` +${icp.locations.length - 3}`}
          </div>
        )}
        {icp.keywords.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-medium text-foreground">Keywords:</span>
            {icp.keywords.slice(0, 3).map(k => (
              <span key={k} className="bg-primary/10 text-primary px-1.5 py-0.5 rounded">{k}</span>
            ))}
            {icp.keywords.length > 3 && <span>+{icp.keywords.length - 3}</span>}
          </div>
        )}
      </div>

      {/* Search Config */}
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

      {/* Pipeline */}
      <CampaignPipeline
        sessions={history}
        activeLeads={leads}
        onViewMessage={onViewMessage}
      />
    </div>
  );
}
