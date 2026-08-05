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
import { supabase } from './lib/supabase';

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
    if (userId) saveToStorage('icps', userId, updated);
  };

  const handleMethodsChange = (updated: SearchMethod[]) => {
    setMethods(updated);
    if (userId) saveToStorage('methods', userId, updated);
  };

  const handleEnginesChange = (updated: ProspectingEngine[]) => {
    setEngines(updated);
    if (userId) saveToStorage('engines', userId, updated);
  };

  // ── Load all user data ───────────────────────────────────────────────────────

  const loadUserData = async (uid: string) => {
    setIcps(loadFromStorage<ICPProfile>('icps', uid));
    setMethods(loadFromStorage<SearchMethod>('methods', uid));
    setEngines(loadFromStorage<ProspectingEngine>('engines', uid));
    await loadHistory(uid);
  };

  const loadHistory = async (uid: string) => {
    try {
      const { data: searchData, error: searchError } = await supabase
        .from('search_history')
        .select('*')
        .eq('user_id', uid)
        .order('executed_at', { ascending: false });

      if (searchError) { console.error('DB Error loading history:', searchError); return; }

      if (searchData && searchData.length > 0) {
        const sessions: SearchSession[] = await Promise.all(
          searchData.map(async (row) => {
            const { data: leadsData } = await supabase
              .from('leads')
              .select('*')
              .eq('search_id', row.id);

            const leads: Lead[] = (leadsData || []).map(l => ({
              id: l.id,
              source: (l.source || row.source || 'linkedin') as any,
              companyName: l.company_name || 'Sin Nombre',
              website: l.website,
              location: l.location,
              decisionMaker: l.decision_maker ? {
                name: l.decision_maker.name || '',
                role: l.decision_maker.role || '',
                email: l.decision_maker.email || '',
                phone: l.decision_maker.phone,
                linkedin: l.decision_maker.linkedin,
                facebook: l.decision_maker.facebook,
                instagram: l.decision_maker.instagram,
              } : undefined,
              aiAnalysis: {
                summary: l.ai_analysis?.summary || '',
                painPoints: l.ai_analysis?.painPoints || [],
                generatedIcebreaker: l.ai_analysis?.generatedIcebreaker || '',
                fullMessage: l.ai_analysis?.fullMessage || '',
                fullAnalysis: l.ai_analysis?.fullAnalysis || l.ai_analysis?.summary || '',
                psychologicalProfile: l.ai_analysis?.psychologicalProfile || '',
                businessMoment: l.ai_analysis?.businessMoment || '',
                salesAngle: l.ai_analysis?.salesAngle || '',
              },
              messageA: l.message_a,
              isNPLPotential: l.is_npl_potential || false,
              status: (l.status || 'scraped') as any,
              icp_type: l.icp_type as any,
            }));

            return {
              id: row.id,
              date: new Date(row.executed_at),
              query: row.query || '',
              source: (row.source || 'linkedin') as any,
              resultsCount: leads.length || row.results_count || 0,
              leads,
              icp_type: (row.icp_type as any) || undefined,
              engineId: row.engine_id || undefined,
              engineName: row.engine_name || undefined,
            };
          })
        );

        setHistory(sessions);
        const leadsSum = sessions.reduce((sum, s) => sum + s.leads.length, 0);
        setTotalLeadsGenerated(leadsSum);
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
            const { data, error: searchError } = await supabase
              .from('search_history')
              .insert({
                user_id: userId,
                query: config.query,
                source: config.source,
                mode: config.mode,
                max_results: config.maxResults,
                results_count: results.length,
                icp_type: config.icp_type || null,
                engine_id: activeEngine?.id || null,
                engine_name: activeEngine?.name || null,
                executed_at: new Date().toISOString(),
              })
              .select();

            if (searchError) {
              addLog(`[DB] ⚠️ Error al guardar búsqueda: ${searchError.message}`);
              return;
            }

            const searchId = data?.[0]?.id;
            if (!searchId) return;
            addLog(`[DB] ✅ Búsqueda registrada (ID: ${searchId})`);

            const leadsToInsert = results.map(lead => ({
              user_id: userId,
              search_id: searchId,
              source: lead.source || config.source,
              company_name: lead.companyName || '',
              website: lead.website || null,
              location: lead.location || null,
              decision_maker: lead.decisionMaker ? {
                name: lead.decisionMaker.name, role: lead.decisionMaker.role,
                email: lead.decisionMaker.email, phone: lead.decisionMaker.phone || null,
                linkedin: lead.decisionMaker.linkedin || null,
                facebook: lead.decisionMaker.facebook || null,
                instagram: lead.decisionMaker.instagram || null,
              } : null,
              ai_analysis: {
                summary: lead.aiAnalysis?.summary || '',
                painPoints: lead.aiAnalysis?.painPoints || [],
                generatedIcebreaker: lead.aiAnalysis?.generatedIcebreaker || '',
                fullMessage: lead.aiAnalysis?.fullMessage || '',
                fullAnalysis: lead.aiAnalysis?.fullAnalysis || '',
                psychologicalProfile: lead.aiAnalysis?.psychologicalProfile || '',
                businessMoment: lead.aiAnalysis?.businessMoment || '',
                salesAngle: lead.aiAnalysis?.salesAngle || '',
              },
              message_a: lead.messageA || null,
              is_npl_potential: lead.isNPLPotential || false,
              icp_type: lead.icp_type || config.icp_type || null,
              status: lead.status || 'scraped',
            }));

            const { error: leadsError } = await supabase.from('leads').insert(leadsToInsert);
            if (leadsError) {
              addLog(`[DB] ⚠️ Error al guardar contactos: ${leadsError.message}`);
            } else {
              addLog(`[DB] ✅ ${results.length} contactos guardados.`);
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
