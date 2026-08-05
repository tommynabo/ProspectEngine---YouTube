import React, { useState } from 'react';
import {
  Plus, Cpu, Trash2, X, Target, ChevronRight,
  Linkedin, Map, Instagram, Globe, Users, Calendar,
} from 'lucide-react';
import { ICPProfile, SearchMethod, ProspectingEngine, SearchSession } from '../lib/types';

// ─── Platform icon helper ─────────────────────────────────────────────────────

const PLATFORM_ICONS: Record<SearchMethod['platform'], React.ElementType> = {
  linkedin: Linkedin,
  google_maps: Map,
  instagram: Instagram,
  other: Globe,
};

const PLATFORM_LABEL: Record<SearchMethod['platform'], string> = {
  linkedin: 'LinkedIn',
  google_maps: 'Google Maps',
  instagram: 'Instagram',
  other: 'Otro',
};

// ─── Engine creation modal ────────────────────────────────────────────────────

interface EngineFormState { name: string; icpId: string; searchMethodId: string; }

function NewEngineModal({
  icps, methods, onSave, onClose,
}: { icps: ICPProfile[]; methods: SearchMethod[]; onSave: (e: ProspectingEngine) => void; onClose: () => void }) {
  const [form, setForm] = useState<EngineFormState>({ name: '', icpId: '', searchMethodId: '' });
  const set = (k: keyof EngineFormState) => (v: string) => setForm(f => ({ ...f, [k]: v }));
  const canSave = form.name.trim() && form.icpId && form.searchMethodId;

  const selectedIcp = icps.find(i => i.id === form.icpId);
  const selectedMethod = methods.find(m => m.id === form.searchMethodId);

  const handleSave = () => {
    if (!canSave) return;
    onSave({
      id: `engine_${Date.now()}`,
      name: form.name.trim(),
      icpId: form.icpId,
      searchMethodId: form.searchMethodId,
      totalLeads: 0,
      createdAt: new Date().toISOString(),
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-lg font-bold">Nuevo Motor de Prospección</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-secondary rounded-lg transition-colors text-muted-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1.5">Nombre del motor <span className="text-red-400">*</span></label>
            <input
              value={form.name}
              onChange={e => set('name')(e.target.value)}
              placeholder="Ej: Coaches LinkedIn España"
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary/50 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              ICP <span className="text-red-400">*</span>
              {icps.length === 0 && <span className="text-amber-400 text-xs ml-2">⚠️ Crea un ICP primero desde el Panel</span>}
            </label>
            {icps.length === 0 ? (
              <div className="border border-dashed border-border rounded-lg p-3 text-sm text-muted-foreground text-center">
                No hay ICPs disponibles
              </div>
            ) : (
              <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                {icps.map(icp => (
                  <button
                    key={icp.id}
                    type="button"
                    onClick={() => set('icpId')(icp.id)}
                    className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-xl border text-left transition-all ${
                      form.icpId === icp.id
                        ? 'bg-primary/10 border-primary/50 text-primary'
                        : 'border-border hover:border-primary/30'
                    }`}
                  >
                    <Target className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium">{icp.name}</p>
                      <p className="text-xs text-muted-foreground">{icp.niche}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Método de búsqueda <span className="text-red-400">*</span>
              {methods.length === 0 && <span className="text-amber-400 text-xs ml-2">⚠️ Crea un método primero</span>}
            </label>
            {methods.length === 0 ? (
              <div className="border border-dashed border-border rounded-lg p-3 text-sm text-muted-foreground text-center">
                No hay métodos disponibles
              </div>
            ) : (
              <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                {methods.map(method => {
                  const Icon = PLATFORM_ICONS[method.platform];
                  return (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => set('searchMethodId')(method.id)}
                      className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-xl border text-left transition-all ${
                        form.searchMethodId === method.id
                          ? 'bg-primary/10 border-primary/50 text-primary'
                          : 'border-border hover:border-primary/30'
                      }`}
                    >
                      <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium">{method.name}</p>
                        <p className="text-xs text-muted-foreground">{PLATFORM_LABEL[method.platform]} · Máx. {method.maxResults}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Preview */}
          {selectedIcp && selectedMethod && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground text-sm">Resumen del motor</p>
              <p>🎯 ICP: <span className="text-foreground">{selectedIcp.name}</span> — {selectedIcp.niche}</p>
              <p>🔍 Método: <span className="text-foreground">{selectedMethod.name}</span> en {PLATFORM_LABEL[selectedMethod.platform]}</p>
              <p>⚡ Modo: {selectedMethod.mode === 'fast' ? 'Rápido' : 'Profundo'} · Máx. {selectedMethod.maxResults} resultados</p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 p-6 pt-0">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-secondary transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="px-5 py-2 text-sm bg-primary text-primary-foreground rounded-lg font-medium hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Crear Motor
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Engine Card ──────────────────────────────────────────────────────────────

function EngineCard({
  engine, icp, method, sessionCount, totalLeads,
  onRun, onDelete,
}: {
  engine: ProspectingEngine;
  icp?: ICPProfile;
  method?: SearchMethod;
  sessionCount: number;
  totalLeads: number;
  onRun: () => void;
  onDelete: () => void;
}) {
  const PlatformIcon = method ? PLATFORM_ICONS[method.platform] : Globe;

  return (
    <div className="bg-card border border-border rounded-2xl p-6 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all group flex flex-col gap-5">
      <div className="flex items-start justify-between">
        <div className="w-10 h-10 bg-primary/15 rounded-xl flex items-center justify-center border border-primary/20">
          <Cpu className="w-5 h-5 text-primary" />
        </div>
        <button
          onClick={onDelete}
          className="p-1.5 hover:bg-destructive/10 rounded-lg transition-colors text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100"
          title="Eliminar motor"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div>
        <h3 className="font-bold text-lg group-hover:text-primary transition-colors">{engine.name}</h3>
      </div>

      {/* ICP + Method pills */}
      <div className="space-y-2">
        {icp && (
          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1.5 bg-secondary px-2.5 py-1 rounded-lg font-medium">
              <Target className="w-3 h-3 text-primary" />
              {icp.name}
            </span>
          </div>
        )}
        {method && (
          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1.5 bg-secondary px-2.5 py-1 rounded-lg font-medium">
              <PlatformIcon className="w-3 h-3 text-primary" />
              {method.name}
            </span>
            <span className={`px-2 py-0.5 rounded-md font-medium ${method.mode === 'fast' ? 'bg-yellow-500/15 text-yellow-400' : 'bg-blue-500/15 text-blue-400'}`}>
              {method.mode === 'fast' ? 'Rápido' : 'Profundo'}
            </span>
          </div>
        )}
      </div>

      {/* Stats + CTA */}
      <div className="flex items-center justify-between border-t border-border/50 pt-4 gap-3">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            <span className="font-semibold text-foreground">{totalLeads}</span> leads
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {sessionCount} runs
          </span>
        </div>
        <button
          onClick={onRun}
          className="flex items-center gap-2 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1.5 rounded-lg hover:brightness-110 active:scale-[0.97] transition-all shadow-sm shadow-primary/20"
        >
          <ChevronRight className="w-3 h-3" /> Abrir Motor
        </button>
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

interface ProspectingEnginesPageProps {
  engines: ProspectingEngine[];
  icps: ICPProfile[];
  methods: SearchMethod[];
  history: SearchSession[];
  onEnginesChange: (engines: ProspectingEngine[]) => void;
  onRunEngine: (engine: ProspectingEngine) => void;
}

export function ProspectingEnginesPage({
  engines, icps, methods, history, onEnginesChange, onRunEngine,
}: ProspectingEnginesPageProps) {
  const [modalOpen, setModalOpen] = useState(false);

  const handleCreate = (engine: ProspectingEngine) => {
    onEnginesChange([...engines, engine]);
    setModalOpen(false);
  };

  const handleDelete = (id: string) => onEnginesChange(engines.filter(e => e.id !== id));

  return (
    <div className="space-y-8 animate-[fadeIn_0.3s_ease-out]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Motores de Prospección</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Combina ICPs con métodos de búsqueda para crear motores de captación automatizados
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:brightness-110 transition-all shadow-md shadow-primary/20"
        >
          <Plus className="w-4 h-4" /> Nuevo Motor
        </button>
      </div>

      {/* No ICPs or Methods warning */}
      {(icps.length === 0 || methods.length === 0) && engines.length === 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-sm text-amber-400">
          <p className="font-semibold mb-1">Antes de crear un motor necesitas:</p>
          <ul className="space-y-0.5 text-xs opacity-80">
            {icps.length === 0 && <li>• Al menos un ICP (créalo en el <strong>Panel → ICPs</strong>)</li>}
            {methods.length === 0 && <li>• Al menos un método de búsqueda (créalo en el <strong>Panel → Métodos</strong>)</li>}
          </ul>
        </div>
      )}

      {/* Empty state */}
      {engines.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-2xl">
          <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Cpu className="w-7 h-7 text-primary" />
          </div>
          <h3 className="font-semibold text-lg mb-1">Sin motores creados</h3>
          <p className="text-muted-foreground text-sm mb-5 max-w-xs mx-auto">
            Crea tu primer motor combinando un ICP con un método de búsqueda
          </p>
          <button
            onClick={() => setModalOpen(true)}
            disabled={icps.length === 0 || methods.length === 0}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-semibold hover:brightness-110 transition-all mx-auto shadow-md shadow-primary/20 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" /> Crear primer motor
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {engines.map(engine => {
            const icp = icps.find(i => i.id === engine.icpId);
            const method = methods.find(m => m.id === engine.searchMethodId);
            const sessions = history.filter(s => s.engineId === engine.id);
            const totalLeads = sessions.reduce((sum, s) => sum + s.leads.length, 0);
            return (
              <EngineCard
                key={engine.id}
                engine={engine}
                icp={icp}
                method={method}
                sessionCount={sessions.length}
                totalLeads={totalLeads}
                onRun={() => onRunEngine(engine)}
                onDelete={() => handleDelete(engine.id)}
              />
            );
          })}
        </div>
      )}

      {modalOpen && (
        <NewEngineModal
          icps={icps}
          methods={methods}
          onSave={handleCreate}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}
