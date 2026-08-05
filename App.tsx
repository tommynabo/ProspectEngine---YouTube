import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { SearchCriteriaModal } from './components/SearchCriteriaModal';
import { MessageModal } from './components/MessageModal';
import { LoginPage } from './components/LoginPage';
import { HistoryModal } from './components/HistoryModal';
import { ICPManager } from './components/ICPManager';
import { SearchMethodManager } from './components/SearchMethodManager';
import { ProspectingEnginesPage } from './components/ProspectingEnginesPage';
import { EngineWorkspace } from './components/EngineWorkspace';
import { SearchHistory } from './components/SearchHistory';
import { Lead, SearchConfigState, PageView, SearchSession, ICPProfile, SearchMethod, ProspectingEngine } from './lib/types';
import { searchService } from './services/search/SearchService';

// ─── Auth helpers ─────────────────────────────────────────────────────────────

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('auth_token') || '';
  return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
}

async function apiGet<T = any>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { headers: authHeaders() });
    const json = await res.json();
    return json.success ? json.data : null;
  } catch { return null; }
}

async function apiPost<T = any>(url: string, body: object): Promise<T | null> {
  try {
    const res = await fetch(url, { method: 'POST', headers: authHeaders(), body: JSON.stringify(body) });
    const json = await res.json();
    return json.success ? json.data : null;
  } catch { return null; }
}

// ─── Build search query from ICP + Method ─────────────────────────────────────

function buildConfigFromEngine(icp: ICPProfile, method: SearchMethod): SearchConfigState {
  const parts: string[] = [];
  if (icp.jobTitles.length > 0) {
    parts.push(`(${icp.jobTitles.map(t => `"${t}"`).join(' OR ')})`);
  }
  if (icp.keywords.length > 0) {
    parts.push(`(${icp.keywords.map(k => `"${k}"`).join(' OR ')})`);
  }
  const query = method.queryTemplate || parts.join(' AND ') || `"${icp.niche}"`;

  const sourceMap: Record<SearchMethod['platform'], SearchConfigState['source']> = {
    linkedin: 'linkedin',
    instagram: 'instagram',
    google_maps: 'gmail',
    other: 'linkedin',
  };

  return {
    query,
    source: sourceMap[method.platform],
    mode: method.mode,
    maxResults: method.maxResults,
    advancedFilters: {
      locations: icp.locations,
      jobTitles: icp.jobTitles,
      companySizes: icp.companySize,
      industries: icp.industries,
      keywords: icp.keywords,
    },
    icp_type: 'other',
  };
}

// ─── localStorage helpers ─────────────────────────────────────────────────────

function loadFromStorage<T>(key: string, userId: string): T[] {
  try {
    const raw = localStorage.getItem(`${key}_${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveToStorage<T>(key: string, userId: string, data: T[]) {
  localStorage.setItem(`${key}_${userId}`, JSON.stringify(data));
}

// ─── Dashboard tabs ───────────────────────────────────────────────────────────

type DashboardTab = 'icps' | 'methods';

function DashboardPanel({
  icps, onIcpsChange, methods, onMethodsChange,
}: {
  icps: ICPProfile[]; onIcpsChange: (v: ICPProfile[]) => void;
  methods: SearchMethod[]; onMethodsChange: (v: SearchMethod[]) => void;
}) {
  const [tab, setTab] = useState<DashboardTab>('icps');

  return (
    <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
      {/* Tabs */}
      <div className="flex gap-1 bg-secondary/50 p-1 rounded-xl w-fit">
        {([['icps', '🎯 ICPs Ideales'], ['methods', '🔍 Métodos de Búsqueda']] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'icps' && (
        <ICPManager icps={icps} onChange={onIcpsChange} />
      )}
      {tab === 'methods' && (
        <SearchMethodManager methods={methods} onChange={onMethodsChange} />
      )}
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

function App() {
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<PageView>('login');

  // User Data (persisted per user in localStorage)
  const [icps, setIcps] = useState<ICPProfile[]>([]);
  const [methods, setMethods] = useState<SearchMethod[]>([]);
  const [engines, setEngines] = useState<ProspectingEngine[]>([]);

  // Active Engine workspace
  const [activeEngine, setActiveEngine] = useState<ProspectingEngine | null>(null);

  // Search State
  const [config, setConfig] = useState<SearchConfigState>({
    query: '',
    source: 'linkedin',
    mode: 'fast',
    maxResults: 10,
  });
  const [isSearching, setIsSearching] = useState(false);
  const [terminalVisible, setTerminalVisible] = useState(false);
  const [terminalExpanded, setTerminalExpanded] = useState(true);
  const [logs, setLogs] = useState<string[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // History State
  const [history, setHistory] = useState<SearchSession[]>([]);
  const [selectedHistorySession, setSelectedHistorySession] = useState<SearchSession | null>(null);
  const [totalLeadsGenerated, setTotalLeadsGenerated] = useState(0);

  // Modal State
  const [isCriteriaModalOpen, setIsCriteriaModalOpen] = useState(false);

  // Sound Effect
  const playGlassSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(1100, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(1600, audioContext.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 1.5);
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 1.5);
    } catch (e) {
      console.error('Audio play failed', e);
    }
  };

  // ── Session persistence ──────────────────────────────────────────────────────

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const storedUserId = localStorage.getItem('user_id');
    if (token && storedUserId) {
      fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ action: 'verify', token }),
      })
        .then(res => res.json())
        .then(json => {
          if (json.success && json.data?.user) {
            const user = json.data.user;
            setIsAuthenticated(true);
            setUserId(user.id);
            setUserName(user.full_name || user.email);
            setCurrentPage('dashboard');
            loadUserData(user.id);
          } else {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user_id');
          }
        })
        .catch(() => {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user_id');
        });
    }
    return () => { searchService.stop(); };
  }, []);

  // ── Persist ICPs/Methods/Engines when they change ─────────────────────────

  const handleIcpsChange = (updated: ICPProfile[]) => {
    setIcps(updated);
    if (userId) {
      saveToStorage('icps', userId, updated);
      apiPost('/api/user-data?type=icps', { icps: updated }).catch(console.error);
    }
  };

  const handleMethodsChange = (updated: SearchMethod[]) => {
    setMethods(updated);
    if (userId) {
      saveToStorage('methods', userId, updated);
      apiPost('/api/user-data?type=methods', { methods: updated }).catch(console.error);
    }
  };

  const handleEnginesChange = (updated: ProspectingEngine[]) => {
    setEngines(updated);
    if (userId) {
      saveToStorage('engines', userId, updated);
      apiPost('/api/user-data?type=engines', { engines: updated }).catch(console.error);
    }
  };

  // ── Load all user data ───────────────────────────────────────────────────────

  const loadUserData = async (uid: string) => {
    // Load from localStorage first (fast, immediate)
    const localIcps = loadFromStorage<ICPProfile>('icps', uid);
    const localMethods = loadFromStorage<SearchMethod>('methods', uid);
    const localEngines = loadFromStorage<ProspectingEngine>('engines', uid);
    setIcps(localIcps);
    setMethods(localMethods);
    setEngines(localEngines);

    // Then sync from DB (source of truth — may have data from other devices)
    const [dbIcps, dbMethods, dbEngines] = await Promise.all([
      apiGet<ICPProfile[]>('/api/user-data?type=icps'),
      apiGet<SearchMethod[]>('/api/user-data?type=methods'),
      apiGet<ProspectingEngine[]>('/api/user-data?type=engines'),
    ]);

    if (dbIcps && dbIcps.length > 0) {
      setIcps(dbIcps);
      saveToStorage('icps', uid, dbIcps);
    } else if (localIcps.length > 0) {
      // Sync local data to DB
      apiPost('/api/user-data?type=icps', { icps: localIcps }).catch(console.error);
    }
    if (dbMethods && dbMethods.length > 0) {
      setMethods(dbMethods);
      saveToStorage('methods', uid, dbMethods);
    } else if (localMethods.length > 0) {
      apiPost('/api/user-data?type=methods', { methods: localMethods }).catch(console.error);
    }
    if (dbEngines && dbEngines.length > 0) {
      setEngines(dbEngines);
      saveToStorage('engines', uid, dbEngines);
    } else if (localEngines.length > 0) {
      apiPost('/api/user-data?type=engines', { engines: localEngines }).catch(console.error);
    }

    await loadHistory(uid);
  };

  const loadHistory = async (_uid: string) => {
    try {
      const sessions = await apiGet<any[]>('/api/history');
      if (sessions && sessions.length > 0) {
        const mapped: SearchSession[] = sessions.map(row => ({
          id: row.id,
          date: new Date(row.date),
          query: row.query || '',
          source: (row.source || 'linkedin') as any,
          resultsCount: row.resultsCount || 0,
          leads: (row.leads || []).map((l: any) => ({
            id: l.id,
            source: l.source || row.source || 'linkedin',
            companyName: l.companyName || 'Sin Nombre',
            website: l.website,
            location: l.location,
            decisionMaker: l.decisionMaker || undefined,
            aiAnalysis: l.aiAnalysis || { summary: '', painPoints: [] },
            messageA: l.messageA,
            isNPLPotential: l.isNPLPotential || false,
            status: (l.status || 'scraped') as any,
            icp_type: l.icp_type as any,
          })),
          icp_type: row.icp_type as any || undefined,
          engineId: row.engineId || undefined,
          engineName: row.engineName || undefined,
        }));
        setHistory(mapped);
        setTotalLeadsGenerated(mapped.reduce((sum, s) => sum + s.leads.length, 0));
      }
    } catch (e) {
      console.error('Error loading history', e);
    }
  };

  // ── Auth Handlers ────────────────────────────────────────────────────────────

  const handleLogin = (user: { id: string; email: string; full_name: string; company_name: string }) => {
    setIsAuthenticated(true);
    setUserId(user.id);
    setUserName(user.full_name || user.email);
    setCurrentPage('dashboard');
    loadUserData(user.id);
  };

  const handleLogout = async () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_id');
    setIsAuthenticated(false);
    setUserId(null);
    setUserName('');
    setCurrentPage('login');
    setLogs([]);
    setLeads([]);
    setTerminalVisible(false);
    setActiveEngine(null);
    setIcps([]);
    setMethods([]);
    setEngines([]);
    searchService.stop();
  };

  const addLog = (message: string) => setLogs(prev => [...prev, message]);

  // ── Run Engine ───────────────────────────────────────────────────────────────

  const handleRunEngine = (engine: ProspectingEngine) => {
    const icp = icps.find(i => i.id === engine.icpId);
    const method = methods.find(m => m.id === engine.searchMethodId);
    if (!icp || !method) return;

    const engineConfig = buildConfigFromEngine(icp, method);
    setConfig(engineConfig);
    setActiveEngine(engine);
    setLeads([]);
    setLogs([]);
    setTerminalVisible(false);
    setCurrentPage('engines');
  };

  // ── Search Logic ─────────────────────────────────────────────────────────────

  const handleSearch = () => {
    if (!config.query) return;
    setIsSearching(true);
    setTerminalVisible(true);
    setTerminalExpanded(true);
    setLogs([]);
    setLeads([]);

    searchService.startSearch(
      config,
      (message) => addLog(message),
      async (results) => {
        setIsSearching(false);
        setLeads(results);

        const newSession: SearchSession = {
          id: Date.now().toString(),
          date: new Date(),
          query: config.query,
          source: config.source,
          resultsCount: results.length,
          leads: results,
          icp_type: config.icp_type,
          engineId: activeEngine?.id,
          engineName: activeEngine?.name,
        };
        setHistory(prev => [newSession, ...prev]);
        setTotalLeadsGenerated(prev => prev + results.length);

        if (userId) {
          try {
            const saved = await apiPost<{ searchId: string }>('/api/history', {
              query: config.query,
              source: config.source,
              mode: config.mode,
              maxResults: config.maxResults,
              resultsCount: results.length,
              icpType: config.icp_type || null,
              engineId: activeEngine?.id || null,
              engineName: activeEngine?.name || null,
              leads: results,
            });

            if (saved?.searchId) {
              addLog(`[DB] ✅ ${results.length} contactos guardados (ID: ${saved.searchId})`);
            } else {
              addLog(`[DB] ⚠️ No se pudo guardar la sesión en base de datos`);
            }

            // Update engine totalLeads
            if (activeEngine) {
              const updatedEngines = engines.map(e =>
                e.id === activeEngine.id
                  ? { ...e, totalLeads: e.totalLeads + results.length, lastRunAt: new Date().toISOString() }
                  : e
              );
              handleEnginesChange(updatedEngines);
            }
          } catch (err) {
            addLog(`[ERROR] Excepción al guardar: ${err}`);
          }
        }

        playGlassSound();
        setTimeout(() => setTerminalExpanded(false), 1500);
      },
      userId
    );
  };

  const handleStop = () => {
    if (isSearching) {
      searchService.stop();
      setIsSearching(false);
      setTerminalExpanded(false);
      addLog('[USUARIO] 🛑 Generación detenida manualmente.');
    }
  };

  const handleConfigChange = (updates: Partial<SearchConfigState>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  const handleSaveCriteria = (newQuery: string, filters?: any, icp_type?: 'agency' | 'skool_creator' | 'other') => {
    setConfig(prev => ({ ...prev, query: newQuery, advancedFilters: filters, icp_type: icp_type ?? prev.icp_type }));
    setIsCriteriaModalOpen(false);
  };

  // ── Routing ──────────────────────────────────────────────────────────────────

  if (!isAuthenticated) return <LoginPage onLogin={handleLogin} />;

  const activeIcp = activeEngine ? icps.find(i => i.id === activeEngine.icpId) : undefined;
  const activeMethod = activeEngine ? methods.find(m => m.id === activeEngine.searchMethodId) : undefined;
  const engineHistory = activeEngine ? history.filter(s => s.engineId === activeEngine.id) : [];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30">
      <Header
        currentPage={currentPage}
        onNavigate={(page) => {
          if (page !== 'engines') setActiveEngine(null);
          setCurrentPage(page);
        }}
        onLogout={handleLogout}
        userName={userName}
      />

      <main className="max-w-7xl mx-auto px-6 py-8">

        {/* ── Dashboard: ICPs + Methods tabs ── */}
        {currentPage === 'dashboard' && (
          <DashboardPanel
            icps={icps}
            onIcpsChange={handleIcpsChange}
            methods={methods}
            onMethodsChange={handleMethodsChange}
          />
        )}

        {/* ── Engines page: list or workspace ── */}
        {currentPage === 'engines' && (
          <>
            {activeEngine && activeIcp && activeMethod ? (
              <EngineWorkspace
                engine={activeEngine}
                icp={activeIcp}
                method={activeMethod}
                config={config}
                onChange={handleConfigChange}
                onSearch={handleSearch}
                onStop={handleStop}
                isSearching={isSearching}
                logs={logs}
                terminalVisible={terminalVisible}
                terminalExpanded={terminalExpanded}
                onToggleTerminal={() => setTerminalExpanded(!terminalExpanded)}
                leads={leads}
                history={engineHistory}
                onViewMessage={setSelectedLead}
                onBack={() => { setActiveEngine(null); setLeads([]); setLogs([]); setTerminalVisible(false); }}
                onOpenCriteria={() => setIsCriteriaModalOpen(true)}
                totalLeadsGenerated={totalLeadsGenerated}
              />
            ) : (
              <ProspectingEnginesPage
                engines={engines}
                icps={icps}
                methods={methods}
                history={history}
                onEnginesChange={handleEnginesChange}
                onRunEngine={handleRunEngine}
              />
            )}
          </>
        )}

        {/* ── History ── */}
        {currentPage === 'history' && (
          <SearchHistory
            history={history}
            engines={engines}
            icps={icps}
          />
        )}

      </main>

      {/* Search Criteria Modal */}
      <SearchCriteriaModal
        isOpen={isCriteriaModalOpen}
        onClose={() => setIsCriteriaModalOpen(false)}
        currentQuery={config.query}
        onSave={handleSaveCriteria}
      />

      {/* Message Draft Modal */}
      {selectedLead && (
        <MessageModal
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
        />
      )}

      {/* Search History Results Popup */}
      {selectedHistorySession && (
        <HistoryModal
          session={selectedHistorySession}
          onClose={() => setSelectedHistorySession(null)}
          onViewMessage={setSelectedLead}
        />
      )}
    </div>
  );
}

export default App;
