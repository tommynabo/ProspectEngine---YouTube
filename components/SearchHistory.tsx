import React, { useState, useMemo } from 'react';
import { Search, Download, Calendar, Users, Filter, Linkedin, Map, Instagram, Globe, ChevronDown } from 'lucide-react';
import { SearchSession, ProspectingEngine, ICPProfile } from '../lib/types';

// ─── CSV helpers ──────────────────────────────────────────────────────────────

function escapeCSV(v: string | undefined): string {
  if (!v) return '';
  const s = v.replace(/"/g, '""').replace(/[\n\r]/g, ' ');
  return s.includes(',') || s.includes('"') ? `"${s}"` : s;
}

function exportAllToCSV(sessions: SearchSession[]) {
  const headers = ['Fecha', 'Motor / Campaña', 'Plataforma', 'Query', 'Leads', 'Nombre', 'Apellido', 'Email', 'Cargo', 'LinkedIn'];
  const rows: string[] = [];

  sessions.forEach(session => {
    if (session.leads.length === 0) {
      rows.push([
        escapeCSV(session.date.toLocaleDateString('es-ES')),
        escapeCSV(session.engineName || 'Sin motor'),
        escapeCSV(session.source),
        escapeCSV(session.query),
        String(session.resultsCount),
        '', '', '', '', '',
      ].join(','));
    } else {
      session.leads.forEach(lead => {
        const fullName = (lead.decisionMaker?.name ?? '').trim();
        const spaceIdx = fullName.indexOf(' ');
        const firstName = spaceIdx === -1 ? fullName : fullName.slice(0, spaceIdx);
        const lastName = spaceIdx === -1 ? '' : fullName.slice(spaceIdx + 1);
        rows.push([
          escapeCSV(session.date.toLocaleDateString('es-ES')),
          escapeCSV(session.engineName || 'Sin motor'),
          escapeCSV(session.source),
          escapeCSV(session.query),
          String(session.resultsCount),
          escapeCSV(firstName),
          escapeCSV(lastName),
          escapeCSV(lead.decisionMaker?.email),
          escapeCSV(lead.decisionMaker?.role),
          escapeCSV(lead.decisionMaker?.linkedin || lead.socialUrl || ''),
        ].join(','));
      });
    }
  });

  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `historial_prospeccion_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── Source icon ──────────────────────────────────────────────────────────────

const SOURCE_ICONS: Record<string, React.ElementType> = {
  linkedin: Linkedin,
  gmail: Map,
  instagram: Instagram,
};

function SourceIcon({ source }: { source: string }) {
  const Icon = SOURCE_ICONS[source] || Globe;
  return <Icon className="w-4 h-4" />;
}

// ─── Row ──────────────────────────────────────────────────────────────────────

function SessionRow({ session, onExpand, expanded }: { session: SearchSession; onExpand: () => void; expanded: boolean }) {
  return (
    <>
      <tr
        onClick={onExpand}
        className={`border-b border-border/50 hover:bg-secondary/30 cursor-pointer transition-colors group ${expanded ? 'bg-secondary/20' : ''}`}
      >
        <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
          <div className="flex flex-col">
            <span>{session.date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
            <span className="text-xs opacity-60">{session.date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </td>
        <td className="px-4 py-3 text-sm font-medium">
          {session.engineName || <span className="text-muted-foreground italic">Sin motor</span>}
        </td>
        <td className="px-4 py-3">
          <span className="inline-flex items-center gap-1.5 text-xs bg-secondary px-2 py-1 rounded-md text-muted-foreground">
            <SourceIcon source={session.source} />
            {session.source}
          </span>
        </td>
        <td className="px-4 py-3 text-sm text-muted-foreground max-w-[240px] truncate">
          {session.query}
        </td>
        <td className="px-4 py-3">
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
            <Users className="w-3.5 h-3.5" />
            {session.resultsCount}
          </span>
        </td>
        <td className="px-4 py-3 text-right">
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform inline-block ${expanded ? 'rotate-180' : ''}`} />
        </td>
      </tr>
      {expanded && session.leads.length > 0 && (
        <tr className="bg-secondary/10">
          <td colSpan={6} className="px-4 py-3">
            <div className="space-y-1.5">
              {session.leads.map(lead => (
                <div key={lead.id} className="flex items-center gap-4 text-xs text-muted-foreground bg-background/50 rounded-lg px-3 py-2">
                  <span className="font-medium text-foreground min-w-[140px]">{lead.decisionMaker?.name || '—'}</span>
                  <span className="text-primary min-w-[100px]">{lead.decisionMaker?.role || '—'}</span>
                  <span className="font-mono opacity-80 min-w-[180px]">{lead.decisionMaker?.email || '—'}</span>
                  {lead.decisionMaker?.linkedin && (
                    <a href={lead.decisionMaker.linkedin} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-blue-400 hover:underline" onClick={e => e.stopPropagation()}>
                      <Linkedin className="w-3 h-3" /> LinkedIn
                    </a>
                  )}
                </div>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

interface SearchHistoryProps {
  history: SearchSession[];
  engines: ProspectingEngine[];
  icps: ICPProfile[];
}

export function SearchHistory({ history, engines, icps }: SearchHistoryProps) {
  const [filterEngine, setFilterEngine] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return history.filter(s => {
      const matchEngine = filterEngine === 'all' || s.engineId === filterEngine || (!s.engineId && filterEngine === 'none');
      const matchSearch = !search || s.query.toLowerCase().includes(search.toLowerCase()) || (s.engineName || '').toLowerCase().includes(search.toLowerCase());
      return matchEngine && matchSearch;
    });
  }, [history, filterEngine, search]);

  const totalLeads = filtered.reduce((sum, s) => sum + s.leads.length, 0);

  if (history.length === 0) {
    return (
      <div className="text-center py-20 animate-[fadeIn_0.5s_ease-out]">
        <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
          <Search className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Sin historial de búsquedas</h3>
        <p className="text-muted-foreground text-sm">Ejecuta un motor de prospección para ver los resultados aquí.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Historial de Búsquedas</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {filtered.length} sesiones · {totalLeads} leads encontrados
          </p>
        </div>
        <button
          onClick={() => exportAllToCSV(filtered)}
          disabled={filtered.length === 0}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:brightness-110 transition-all shadow-md shadow-primary/20 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4" /> Exportar CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por query o motor..."
            className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:border-primary/50 transition-colors"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <select
            value={filterEngine}
            onChange={e => setFilterEngine(e.target.value)}
            className="bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary/50 transition-colors cursor-pointer"
          >
            <option value="all">Todos los motores</option>
            <option value="none">Sin motor asignado</option>
            {engines.map(e => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fecha</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Motor</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Plataforma</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Query</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Leads</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map(session => (
                <SessionRow
                  key={session.id}
                  session={session}
                  expanded={expandedRow === session.id}
                  onExpand={() => setExpandedRow(prev => prev === session.id ? null : session.id)}
                />
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">
            No hay resultados con los filtros actuales
          </div>
        )}
      </div>
    </div>
  );
}
