import React, { useState } from 'react';
import { Plus, Target, Trash2, ChevronRight, Users, MapPin, Tag, Briefcase, X } from 'lucide-react';
import { ICPProfile } from '../lib/types';

// ─── Tag Input ────────────────────────────────────────────────────────────────

function TagInput({
  tags, onChange, placeholder, suggestions = [],
}: { tags: string[]; onChange: (t: string[]) => void; placeholder: string; suggestions?: string[] }) {
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const addTag = (value: string) => {
    const trimmed = value.trim();
    if (trimmed && !tags.includes(trimmed)) onChange([...tags, trimmed]);
    setInput('');
    setShowSuggestions(false);
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(input); }
    if (e.key === 'Backspace' && !input && tags.length > 0) onChange(tags.slice(0, -1));
  };

  const filteredSuggestions = input.length > 0
    ? suggestions.filter(s => s.toLowerCase().includes(input.toLowerCase()) && !tags.includes(s))
    : [];

  return (
    <div className="relative">
      <div className="min-h-[auto] flex flex-wrap gap-2 items-center border border-border rounded-lg px-3 py-2.5 bg-background focus-within:border-primary/50 transition-colors">
        {tags.map(tag => (
          <span key={tag} className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-semibold px-2.5 py-1 rounded-lg border border-primary/20 flex-shrink-0">
            <span className="truncate max-w-[140px]">{tag}</span>
            <button type="button" onClick={() => onChange(tags.filter(t => t !== tag))} className="hover:text-red-400 transition-colors flex-shrink-0">
              <X className="w-3.5 h-3.5" />
            </button>
          </span>
        ))}
        <input
          value={input}
          onChange={e => { setInput(e.target.value); setShowSuggestions(true); }}
          onKeyDown={handleKey}
          onBlur={() => { input.trim() && addTag(input); setShowSuggestions(false); }}
          onFocus={() => setShowSuggestions(true)}
          placeholder={tags.length === 0 ? placeholder : 'Añadir más...'}
          className="flex-1 min-w-[140px] bg-transparent text-sm outline-none text-foreground placeholder:text-muted-foreground py-1"
        />
      </div>
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute z-10 top-full mt-1 w-full bg-card border border-border rounded-lg shadow-xl max-h-48 overflow-y-auto">
          {filteredSuggestions.map(s => (
            <button
              key={s}
              type="button"
              onClick={() => addTag(s)}
              className="w-full text-left px-3 py-2.5 text-sm hover:bg-secondary transition-colors border-b border-border/30 last:border-b-0 font-medium text-foreground"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── ICP Creation Wizard ──────────────────────────────────────────────────────

const JOB_TITLE_SUGGESTIONS = [
  'CEO', 'Fundador', 'Co-Fundador', 'Propietario', 'Owner', 'Director General',
  'Director de Marketing', 'Head of Growth', 'CMO', 'Emprendedor', 'Consultor',
  'Coach', 'Infoproductor', 'Mentor', 'Freelancer',
];

const LOCATION_SUGGESTIONS = [
  'Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Bilbao', 'España',
  'Ciudad de México', 'Buenos Aires', 'Bogotá', 'Lima', 'Santiago de Chile',
  'Miami', 'LATAM', 'USA', 'Europa',
];

const KEYWORD_SUGGESTIONS = [
  'High Ticket', 'Automatización', 'Embudo de ventas', 'Comunidad', 'Escala',
  'Consultoría', 'Mentoría grupal', 'Infoproducto', 'Agencia', 'SaaS',
  'Lead generation', 'Marketing digital', 'Coaching online',
];

const COMPANY_SIZE_OPTIONS = ['1-10', '11-50', '51-200', '201-500', '500+'];
const REVENUE_OPTIONS = ['< 50k€', '50k - 200k€', '200k - 500k€', '500k - 1M€', '> 1M€'];

interface WizardState {
  name: string;
  niche: string;
  revenueRange: string;
  jobTitles: string[];
  companySize: string[];
  industries: string[];
  locations: string[];
  keywords: string[];
  painPoints: string;
}

const INITIAL_WIZARD: WizardState = {
  name: '', niche: '', revenueRange: '',
  jobTitles: [], companySize: [], industries: [],
  locations: [], keywords: [], painPoints: '',
};

function ICPWizardModal({
  onSave,
  onClose,
  editing,
}: { onSave: (icp: ICPProfile) => void; onClose: () => void; editing?: ICPProfile }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<WizardState>(
    editing
      ? { name: editing.name, niche: editing.niche, revenueRange: editing.revenueRange || '',
          jobTitles: editing.jobTitles, companySize: editing.companySize, industries: editing.industries,
          locations: editing.locations, keywords: editing.keywords, painPoints: editing.painPoints }
      : INITIAL_WIZARD
  );

  const set = (key: keyof WizardState) => (val: any) => setForm(f => ({ ...f, [key]: val }));

  const toggleSize = (size: string) => {
    setForm(f => ({
      ...f,
      companySize: f.companySize.includes(size)
        ? f.companySize.filter(s => s !== size)
        : [...f.companySize, size],
    }));
  };

  const canNext = [
    form.name.trim() !== '' && form.niche.trim() !== '',
    form.jobTitles.length > 0,
    form.keywords.length > 0,
  ];

  const handleSave = () => {
    const icp: ICPProfile = {
      id: editing?.id ?? `icp_${Date.now()}`,
      name: form.name.trim(),
      niche: form.niche.trim(),
      revenueRange: form.revenueRange || undefined,
      jobTitles: form.jobTitles,
      companySize: form.companySize,
      industries: form.industries,
      locations: form.locations,
      keywords: form.keywords,
      painPoints: form.painPoints,
      createdAt: editing?.createdAt ?? new Date().toISOString(),
    };
    onSave(icp);
  };

  const steps = [
    {
      title: 'Perfil Básico',
      desc: 'Nombre del ICP y nicho principal',
      content: (
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1.5">Nombre del ICP <span className="text-red-400">*</span></label>
            <input
              value={form.name}
              onChange={e => set('name')(e.target.value)}
              placeholder="Ej: Coach High Ticket España"
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary/50 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Nicho principal <span className="text-red-400">*</span></label>
            <input
              value={form.niche}
              onChange={e => set('niche')(e.target.value)}
              placeholder="Ej: Coaches de vida, Agencias de Marketing, Infoproductores"
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary/50 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Facturación aproximada <span className="text-muted-foreground">(opcional)</span></label>
            <div className="flex flex-wrap gap-2">
              {REVENUE_OPTIONS.map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => set('revenueRange')(form.revenueRange === r ? '' : r)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    form.revenueRange === r
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Segmentación',
      desc: 'Cargos, tamaño de empresa y ubicaciones',
      content: (
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1.5">Cargos y roles <span className="text-red-400">*</span></label>
            <p className="text-xs text-muted-foreground mb-2">Escribe y pulsa Enter para añadir</p>
            <TagInput tags={form.jobTitles} onChange={set('jobTitles')} placeholder="CEO, Fundador, Owner..." suggestions={JOB_TITLE_SUGGESTIONS} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Tamaño de empresa</label>
            <div className="flex flex-wrap gap-2">
              {COMPANY_SIZE_OPTIONS.map(size => (
                <button
                  key={size}
                  type="button"
                  onClick={() => toggleSize(size)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    form.companySize.includes(size)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  {size} personas
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Ubicaciones</label>
            <TagInput tags={form.locations} onChange={set('locations')} placeholder="Madrid, Barcelona, LATAM..." suggestions={LOCATION_SUGGESTIONS} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Industrias / Sectores</label>
            <TagInput tags={form.industries} onChange={set('industries')} placeholder="Marketing Digital, SaaS, Educación..." />
          </div>
        </div>
      ),
    },
    {
      title: 'Keywords y Dolores',
      desc: 'Qué define a tu cliente y sus problemas',
      content: (
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1.5">Palabras clave <span className="text-red-400">*</span></label>
            <p className="text-xs text-muted-foreground mb-2">Términos que identifican a tu cliente ideal en las plataformas</p>
            <TagInput tags={form.keywords} onChange={set('keywords')} placeholder="High Ticket, Automatización..." suggestions={KEYWORD_SUGGESTIONS} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Puntos de dolor principales</label>
            <p className="text-xs text-muted-foreground mb-2">Describe brevemente los problemas que tiene tu cliente ideal</p>
            <textarea
              value={form.painPoints}
              onChange={e => set('painPoints')(e.target.value)}
              placeholder="Ej: Falta de tiempo para escalar su negocio, no sabe cómo automatizar sus procesos de captación, necesita más clientes cualificados..."
              rows={4}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary/50 transition-colors resize-none"
            />
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-lg font-bold">{editing ? 'Editar ICP' : 'Crear Nuevo ICP'}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{steps[step].desc}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-secondary rounded-lg transition-colors text-muted-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex gap-2 px-6 pt-5">
          {steps.map((s, i) => (
            <div key={i} className="flex-1 flex flex-col gap-1">
              <div className={`h-1 rounded-full transition-all ${i <= step ? 'bg-primary' : 'bg-border'}`} />
              <span className={`text-[10px] font-medium ${i === step ? 'text-primary' : 'text-muted-foreground'}`}>
                {s.title}
              </span>
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="p-6">{steps[step].content}</div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 pt-0 gap-3">
          <button
            onClick={() => step > 0 ? setStep(s => s - 1) : onClose()}
            className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-secondary transition-colors"
          >
            {step === 0 ? 'Cancelar' : 'Atrás'}
          </button>
          {step < steps.length - 1 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={!canNext[step]}
              className="px-5 py-2 text-sm bg-primary text-primary-foreground rounded-lg font-medium hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              Siguiente <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={!canNext[0] && !canNext[1] && !canNext[2]}
              className="px-5 py-2 text-sm bg-primary text-primary-foreground rounded-lg font-medium hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {editing ? 'Guardar Cambios' : 'Crear ICP'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── ICP Card ─────────────────────────────────────────────────────────────────

function ICPCard({ icp, onDelete, onEdit }: { icp: ICPProfile; onDelete: () => void; onEdit: () => void }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-6 hover:border-primary/40 transition-all group flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div className="w-10 h-10 bg-primary/15 rounded-xl flex items-center justify-center border border-primary/20">
          <Target className="w-5 h-5 text-primary" />
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onEdit}
            className="p-1.5 hover:bg-secondary rounded-lg transition-colors text-muted-foreground hover:text-foreground"
            title="Editar"
          >
            <Briefcase className="w-3.5 h-3.5" />
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
        <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">{icp.name}</h3>
        <p className="text-sm text-muted-foreground mt-0.5">{icp.niche}</p>
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        {icp.jobTitles.slice(0, 3).map(t => (
          <span key={t} className="flex items-center gap-1 bg-secondary text-muted-foreground px-2 py-0.5 rounded-md">
            <Users className="w-3 h-3" />{t}
          </span>
        ))}
        {icp.jobTitles.length > 3 && (
          <span className="text-muted-foreground">+{icp.jobTitles.length - 3} más</span>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5 text-xs border-t border-border/50 pt-3">
        {icp.keywords.slice(0, 4).map(k => (
          <span key={k} className="bg-primary/10 text-primary px-2 py-0.5 rounded-md">{k}</span>
        ))}
        {icp.keywords.length > 4 && (
          <span className="text-muted-foreground">+{icp.keywords.length - 4}</span>
        )}
      </div>

      <div className="flex items-center gap-3 text-xs text-muted-foreground border-t border-border/50 pt-3">
        {icp.locations.length > 0 && (
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />{icp.locations.slice(0, 2).join(', ')}
            {icp.locations.length > 2 && ` +${icp.locations.length - 2}`}
          </span>
        )}
        {icp.revenueRange && (
          <span className="ml-auto font-medium text-green-400">{icp.revenueRange}</span>
        )}
      </div>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

interface ICPManagerProps {
  icps: ICPProfile[];
  onChange: (icps: ICPProfile[]) => void;
}

export function ICPManager({ icps, onChange }: ICPManagerProps) {
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editing, setEditing] = useState<ICPProfile | undefined>();

  const handleSave = (icp: ICPProfile) => {
    if (editing) {
      onChange(icps.map(p => p.id === icp.id ? icp : p));
    } else {
      onChange([...icps, icp]);
    }
    setWizardOpen(false);
    setEditing(undefined);
  };

  const handleDelete = (id: string) => {
    onChange(icps.filter(p => p.id !== id));
  };

  const handleEdit = (icp: ICPProfile) => {
    setEditing(icp);
    setWizardOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">ICPs Ideales</h2>
          <p className="text-sm text-muted-foreground">Define perfiles de clientes ideales para tus campañas</p>
        </div>
        <button
          onClick={() => { setEditing(undefined); setWizardOpen(true); }}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:brightness-110 transition-all shadow-md shadow-primary/20"
        >
          <Plus className="w-4 h-4" /> Nuevo ICP
        </button>
      </div>

      {icps.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-2xl">
          <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Target className="w-7 h-7 text-primary" />
          </div>
          <h3 className="font-semibold text-lg mb-1">Sin ICPs creados</h3>
          <p className="text-muted-foreground text-sm mb-5">Crea tu primer perfil de cliente ideal para empezar a prospectar</p>
          <button
            onClick={() => { setEditing(undefined); setWizardOpen(true); }}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-semibold hover:brightness-110 transition-all mx-auto shadow-md shadow-primary/20"
          >
            <Plus className="w-4 h-4" /> Crear primer ICP
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {icps.map(icp => (
            <ICPCard
              key={icp.id}
              icp={icp}
              onDelete={() => handleDelete(icp.id)}
              onEdit={() => handleEdit(icp)}
            />
          ))}
        </div>
      )}

      {wizardOpen && (
        <ICPWizardModal
          editing={editing}
          onSave={handleSave}
          onClose={() => { setWizardOpen(false); setEditing(undefined); }}
        />
      )}
    </div>
  );
}
