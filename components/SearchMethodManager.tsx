import React, { useState } from 'react';
import { Plus, Zap, Trash2, Linkedin, Map, Instagram, Globe, X, Settings } from 'lucide-react';
import { SearchMethod } from '../lib/types';

// ─── Platform Icons ───────────────────────────────────────────────────────────

const PLATFORM_CONFIG = {
  linkedin: { label: 'LinkedIn', icon: Linkedin, color: 'text-blue-400', bg: 'bg-blue-400/15 border-blue-400/20' },
  google_maps: { label: 'Google Maps', icon: Map, color: 'text-green-400', bg: 'bg-green-400/15 border-green-400/20' },
  instagram: { label: 'Instagram', icon: Instagram, color: 'text-pink-400', bg: 'bg-pink-400/15 border-pink-400/20' },
  other: { label: 'Otro', icon: Globe, color: 'text-purple-400', bg: 'bg-purple-400/15 border-purple-400/20' },
};

// ─── Creation Modal ───────────────────────────────────────────────────────────

interface MethodFormState {
  name: string;
  platform: SearchMethod['platform'];
  mode: SearchMethod['mode'];
  maxResults: number;
  queryTemplate: string;
}

const INITIAL_FORM: MethodFormState = {
  name: '', platform: 'linkedin', mode: 'fast', maxResults: 10, queryTemplate: '',
};

function SearchMethodModal({
  onSave,
  onClose,
  editing,
}: { onSave: (m: SearchMethod) => void; onClose: () => void; editing?: SearchMethod }) {
  const [form, setForm] = useState<MethodFormState>(
    editing
      ? { name: editing.name, platform: editing.platform, mode: editing.mode,
          maxResults: editing.maxResults, queryTemplate: editing.queryTemplate || '' }
      : INITIAL_FORM
  );

  const set = (key: keyof MethodFormState) => (val: any) =>
    setForm(f => ({ ...f, [key]: val }));

  const handleSave = () => {
    if (!form.name.trim()) return;
    const method: SearchMethod = {
      id: editing?.id ?? `method_${Date.now()}`,
      name: form.name.trim(),
      platform: form.platform,
      mode: form.mode,
      maxResults: form.maxResults,
      queryTemplate: form.queryTemplate.trim() || undefined,
      createdAt: editing?.createdAt ?? new Date().toISOString(),
    };
    onSave(method);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-lg font-bold">{editing ? 'Editar Método' : 'Nuevo Método de Búsqueda'}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-secondary rounded-lg transition-colors text-muted-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Nombre del método <span className="text-red-400">*</span></label>
            <input
              value={form.name}
              onChange={e => set('name')(e.target.value)}
              placeholder="Ej: LinkedIn Fast Outreach"
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary/50 transition-colors"
            />
          </div>

          {/* Platform */}
          <div>
            <label className="block text-sm font-medium mb-2">Plataforma</label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.entries(PLATFORM_CONFIG) as [SearchMethod['platform'], typeof PLATFORM_CONFIG['linkedin']][]).map(([key, cfg]) => {
                const Icon = cfg.icon;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => set('platform')(key)}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                      form.platform === key
                        ? `${cfg.bg} ${cfg.color} border-current`
                        : 'border-border hover:border-border/80 text-muted-foreground'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mode */}
          <div>
            <label className="block text-sm font-medium mb-2">Modo de búsqueda</label>
            <div className="flex gap-2">
              {([['fast', 'Rápido', 'Resultados en segundos'], ['deep', 'Profundo', 'Análisis detallado']] as const).map(([val, label, desc]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => set('mode')(val)}
                  className={`flex-1 flex flex-col items-start px-3 py-2.5 rounded-xl border text-sm transition-all ${
                    form.mode === val
                      ? 'bg-primary/10 border-primary/50 text-primary'
                      : 'border-border hover:border-border/80 text-muted-foreground'
                  }`}
                >
                  <span className="font-medium">{label}</span>
                  <span className="text-xs opacity-70">{desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Max Results */}
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Resultados máximos: <span className="text-primary font-bold">{form.maxResults}</span>
            </label>
            <input
              type="range" min={1} max={50} value={form.maxResults}
              onChange={e => set('maxResults')(parseInt(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>1</span><span>25</span><span>50</span>
            </div>
          </div>

          {/* Query Template (optional) */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Plantilla de query <span className="text-muted-foreground">(opcional)</span></label>
            <input
              value={form.queryTemplate}
              onChange={e => set('queryTemplate')(e.target.value)}
              placeholder='Ej: "CEO" OR "Fundador" AND "Agencia"'
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary/50 transition-colors font-mono text-xs"
            />
            <p className="text-xs text-muted-foreground mt-1">Si se deja vacío, se generará automáticamente desde el ICP vinculado</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 pt-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-secondary transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!form.name.trim()}
            className="px-5 py-2 text-sm bg-primary text-primary-foreground rounded-lg font-medium hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {editing ? 'Guardar Cambios' : 'Crear Método'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Method Card ──────────────────────────────────────────────────────────────

function MethodCard({ method, onDelete, onEdit }: { method: SearchMethod; onDelete: () => void; onEdit: () => void }) {
  const cfg = PLATFORM_CONFIG[method.platform];
  const Icon = cfg.icon;

  return (
    <div className="bg-card border border-border rounded-2xl p-6 hover:border-primary/40 transition-all group flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 ${cfg.bg} rounded-xl flex items-center justify-center border`}>
          <Icon className={`w-5 h-5 ${cfg.color}`} />
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onEdit}
            className="p-1.5 hover:bg-secondary rounded-lg transition-colors text-muted-foreground hover:text-foreground"
            title="Editar"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 hover:bg-destructive/10 rounded-lg transition-colors text-muted-foreground hover:text-destructive"
            title="Eliminar"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div>
        <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">{method.name}</h3>
        <p className={`text-sm mt-0.5 font-medium ${cfg.color}`}>{cfg.label}</p>
      </div>

      <div className="flex items-center gap-3 text-xs text-muted-foreground border-t border-border/50 pt-3">
        <span className={`px-2 py-0.5 rounded-md font-medium ${method.mode === 'fast' ? 'bg-yellow-500/15 text-yellow-400' : 'bg-blue-500/15 text-blue-400'}`}>
          {method.mode === 'fast' ? 'Rápido' : 'Profundo'}
        </span>
        <span className="flex items-center gap-1">
          <Zap className="w-3 h-3" />
          Máx. {method.maxResults} resultados
        </span>
        {method.queryTemplate && (
          <span className="ml-auto truncate max-w-[120px] font-mono text-[10px] opacity-60">
            {method.queryTemplate}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

interface SearchMethodManagerProps {
  methods: SearchMethod[];
  onChange: (methods: SearchMethod[]) => void;
}

export function SearchMethodManager({ methods, onChange }: SearchMethodManagerProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SearchMethod | undefined>();

  const handleSave = (method: SearchMethod) => {
    if (editing) {
      onChange(methods.map(m => m.id === method.id ? method : m));
    } else {
      onChange([...methods, method]);
    }
    setModalOpen(false);
    setEditing(undefined);
  };

  const handleDelete = (id: string) => onChange(methods.filter(m => m.id !== id));
  const handleEdit = (m: SearchMethod) => { setEditing(m); setModalOpen(true); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Métodos de Búsqueda</h2>
          <p className="text-sm text-muted-foreground">Configura cómo y dónde buscar a tus clientes ideales</p>
        </div>
        <button
          onClick={() => { setEditing(undefined); setModalOpen(true); }}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:brightness-110 transition-all shadow-md shadow-primary/20"
        >
          <Plus className="w-4 h-4" /> Nuevo Método
        </button>
      </div>

      {methods.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-2xl">
          <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Zap className="w-7 h-7 text-primary" />
          </div>
          <h3 className="font-semibold text-lg mb-1">Sin métodos creados</h3>
          <p className="text-muted-foreground text-sm mb-5">Crea un método de búsqueda para combinarlo con tus ICPs</p>
          <button
            onClick={() => { setEditing(undefined); setModalOpen(true); }}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-semibold hover:brightness-110 transition-all mx-auto shadow-md shadow-primary/20"
          >
            <Plus className="w-4 h-4" /> Crear primer método
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {methods.map(m => (
            <MethodCard key={m.id} method={m} onDelete={() => handleDelete(m.id)} onEdit={() => handleEdit(m)} />
          ))}
        </div>
      )}

      {modalOpen && (
        <SearchMethodModal
          editing={editing}
          onSave={handleSave}
          onClose={() => { setModalOpen(false); setEditing(undefined); }}
        />
      )}
    </div>
  );
}
