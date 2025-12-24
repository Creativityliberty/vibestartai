
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  Upload, Zap, Copy, Check, RefreshCw, Eye, FolderTree, FileCode,
  Rocket, Binary, Terminal, Target, Cpu, Layers, Sun, Moon, Globe, 
  Database, CloudUpload, ShieldCheck, Search, Wifi, Archive, 
  Sparkles, Box, Command, Palette, CheckCircle2,
  FileText, Code2, Layout, ChevronRight, Binary as BinaryIcon,
  Monitor, Fingerprint, BarChart3, Plus, ExternalLink, Brain, Bot, 
  MessageSquare, X, ShieldAlert, ZapOff, Server
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import JSZip from 'jszip';
import { AppStep, ResultTab, AnalysisResult, ViewState, AgentId } from './types';
import { Button } from './components/Button';
import { TokenItem } from './components/TokenItem';
import { ChatDrawer } from './components/ChatDrawer';
import { analyzeUIScreenshot, refineAnalysis } from './services/geminiService';

const VANGUARD_VERSION = '7.3.0-INFINITY-ELITE';
const STARTER_NAME = 'pageai-pro-vibe-coding-starter';

// Added ARCHIVES constant definition to fix "Cannot find name 'ARCHIVES'" error
const ARCHIVES = [
  { name: 'Nexus SaaS Delta', date: '20 Oct 2024', status: 'CERTIFIED' },
  { name: 'Aetheria Protocol', date: '12 Nov 2024', status: 'CERTIFIED' },
  { name: 'Vanguard Core v6', date: '01 Dec 2024', status: 'CERTIFIED' },
];

interface Agent {
  id: AgentId;
  label: string;
  role: string;
  desc: string;
  icon: any;
  docUrl: string;
}

export const AGENTS: Agent[] = [
  { id: 'VISUAL_PARSER', label: 'Visual Parser', role: 'Sémantique', desc: 'Scan structurel et mapping UI → @/components/shared/ui.', icon: Search, docUrl: 'mdc:docs/agents/visual-parser.md' },
  { id: 'WEB_GROUNDING', label: 'Web Intel', role: 'Contexte', desc: 'Sync docs Next.js/Zod/Tailwind + contraintes starter.', icon: Wifi, docUrl: 'mdc:docs/agents/web-grounding.md' },
  { id: 'DESIGN_ENGINEER', label: 'Design Architect', role: 'Esthétique', desc: 'Extraction DNA, tokens, variables CSS & Tailwind.', icon: Brain, docUrl: 'mdc:docs/agents/design-engineer.md' },
  { id: 'MAITRE_COPYWRITER', label: 'Maître Copy', role: 'Conversion', desc: 'Rédaction AIDA pour Hero et CTA.', icon: FileText, docUrl: 'mdc:docs/agents/copywriter.md' },
  { id: 'SEO_STRATEGIST', label: 'SEO Strategic', role: 'Visibilité', desc: 'Metadata, OpenGraph et JSON-LD.', icon: Globe, docUrl: 'mdc:docs/agents/seo.md' },
  { id: 'DATA_MODELER', label: 'Data Modeler', role: 'Structure', desc: 'Schéma Drizzle & relations DB.', icon: Database, docUrl: 'mdc:docs/agents/data.md' },
  { id: 'AUTH_SENTINEL', label: 'Auth Sentinel', role: 'Sécurité', desc: 'RBAC, middleware et protection routes.', icon: ShieldCheck, docUrl: 'mdc:docs/agents/auth.md' },
  { id: 'STRIPE_INTEGRATOR', label: 'Stripe Node', role: 'Revenue', desc: 'Pricing map et routes webhooks.', icon: Zap, docUrl: 'mdc:docs/agents/stripe.md' },
  // Fixed missing icon import for Server
  { id: 'BACKEND_FORGE', label: 'Backend Forge', role: 'Logique', desc: 'Server Actions et validation Zod.', icon: Server, docUrl: 'mdc:docs/agents/backend.md' },
  { id: 'EDGE_OPTIMIZER', label: 'Edge Opti', role: 'Perf', desc: 'Headers de cache et Edge Runtime.', icon: Rocket, docUrl: 'mdc:docs/agents/edge.md' },
  { id: 'LEGAL_SHIELD', label: 'Legal Shield', role: 'Compliance', desc: 'Privacy, Terms et RGPD check.', icon: ShieldAlert, docUrl: 'mdc:docs/agents/legal.md' },
  { id: 'ACCESSIBILITY_AUDITOR', label: 'A11y Auditor', role: 'Inclusion', desc: 'Audit ARIA et conformité WCAG.', icon: Eye, docUrl: 'mdc:docs/agents/a11y.md' },
  { id: 'QA_SENTINEL', label: 'QA Sentinel', role: 'Qualité', desc: 'Type-safety et smoke testing.', icon: Target, docUrl: 'mdc:docs/agents/qa.md' },
  { id: 'SYMMETRY_GUARD', label: 'Symmetry Guard', role: 'Fidélité', desc: 'Synchronisation Design-to-Code.', icon: Monitor, docUrl: 'mdc:docs/agents/symmetry.md' },
  { id: 'VIBE_SPECIALIST', label: 'Vibe Spec', role: 'DX', desc: 'Configuration .mdc et contexte Cursor.', icon: Command, docUrl: 'mdc:docs/agents/vibe.md' },
  { id: 'MASTER_ASSEMBLER', label: 'Assembler', role: 'Packaging', desc: 'Compilation ZIP starter-ready.', icon: Archive, docUrl: 'mdc:docs/agents/assembler.md' }
];

export default function VanguardInfinityPage() {
  const [view, setView] = useState<ViewState>('landing');
  const [step, setStep] = useState<AppStep>(AppStep.IDLE);
  const [activeTab, setActiveTab] = useState<ResultTab>(ResultTab.INFRA);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [logs, setLogs] = useState<{msg: string, agent?: string, status: 'info' | 'success' | 'warning'}[]>([]);
  const [activeAgentId, setActiveAgentId] = useState<AgentId | null>(null);
  const [completedAgents, setCompletedAgents] = useState<AgentId[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [credits, setCredits] = useState(2412);

  const addLog = (msg: string, agent?: string, status: 'info' | 'success' | 'warning' = 'info') => {
    setLogs(prev => [...prev.slice(-30), { msg, agent, status }]);
  };

  const runVanguardProtocol = useCallback(async (base64Image: string, customInstruction: string = "") => {
    setUploadedImage(base64Image);
    setStep(AppStep.SCANNING);
    setLogs([]);
    setCompletedAgents([]);

    try {
      addLog(`Protocol INFINITY engagé pour ${STARTER_NAME}.`, "system", "info");
      
      // Simulation ralentie pour "poids" cognitif
      for (const agent of AGENTS) {
        setActiveAgentId(agent.id);
        addLog(`Activation : ${agent.label} [${agent.role}]`, agent.id, "info");
        await new Promise(r => setTimeout(r, 600)); // Ralentissement demandé
        addLog(`${agent.desc}`, agent.id, "info");
        await new Promise(r => setTimeout(r, 400));
        addLog(`${agent.label} : Certification terminée.`, agent.id, "success");
        setCompletedAgents(prev => [...prev, agent.id]);
      }

      const result = await analyzeUIScreenshot(base64Image, customInstruction || searchQuery);
      
      setAnalysisResult({ 
        tokens: result.tokens,
        projectFiles: result.projectFiles,
        markdownSpec: result.spec,
        cursorRules: result.rules,
        confidence: 99.9,
        metrics: {
          symmetry: 99.9,
          tokens: 32450,
          agents: 16,
          latency: "142ms",
          compliance: "Starter v1.6.0-ELITE"
        }
      });

      setCredits(prev => prev - 50);
      setStep(AppStep.RESULT);
    } catch (err: any) {
      addLog(`CRITICAL FAILURE: ${err.message}`, "system", "warning");
      setStep(AppStep.IDLE);
    }
  }, [searchQuery]);

  const refineForge = useCallback(async (instruction: string) => {
    if (!analysisResult || !uploadedImage) return;
    setStep(AppStep.REFINING);
    addLog(`Raffinement Vibe-Coding : "${instruction}"`, "system", "info");

    try {
      const refined = await refineAnalysis(uploadedImage, analysisResult, instruction);
      setAnalysisResult(prev => prev ? { ...prev, ...refined } : null);
      addLog("Raffinement terminé. Artifacts mis à jour.", "MASTER_ASSEMBLER", "success");
      setStep(AppStep.RESULT);
    } catch (err: any) {
      addLog(`Erreur Raffinement: ${err.message}`, "system", "warning");
      setStep(AppStep.RESULT);
    }
  }, [analysisResult, uploadedImage]);

  const downloadZip = async () => {
    if (!analysisResult) return;
    const zip = new JSZip();
    Object.entries(analysisResult.projectFiles).forEach(([p, c]) => zip.file(p, c));
    zip.file("VANGUARD_MANIFESTO.md", analysisResult.markdownSpec);
    zip.file(".cursor/rules/vanguard.mdc", analysisResult.cursorRules);
    
    const content = await zip.generateAsync({ type: "blob" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(content);
    link.download = `vanguard-infinity-pack-${Date.now()}.zip`;
    link.click();
  };

  return (
    <div className={`min-h-screen transition-all duration-700 selection:bg-[#E6644C] selection:text-white flex flex-col ${isDarkMode ? 'bg-[#050505] text-white' : 'bg-[#FAFAFA] text-slate-900'}`}>
      
      {/* HEADER */}
      <header className={`px-10 py-6 border-b flex items-center justify-between z-[150] backdrop-blur-3xl sticky top-0 ${isDarkMode ? 'border-white/5 bg-black/60' : 'border-slate-200 bg-white/80 shadow-sm'}`}>
        <div className="flex items-center gap-6 cursor-pointer group" onClick={() => { setView('landing'); setStep(AppStep.IDLE); }}>
          <div className="w-12 h-12 rounded-2xl bg-[#E6644C] flex items-center justify-center font-black text-2xl shadow-[0_0_20px_#E6644C50] transition-transform group-hover:rotate-12">V</div>
          <div>
            <h1 className={`text-xl font-black italic tracking-tighter leading-none ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Vanguard <span className="text-[#E6644C]">Infinity</span></h1>
            <p className={`text-[9px] font-black uppercase tracking-[0.5em] opacity-30 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Elite Command Center • v{VANGUARD_VERSION}</p>
          </div>
        </div>

        <div className={`hidden md:flex gap-10 px-10 py-3 rounded-full border backdrop-blur-md ${isDarkMode ? 'bg-black/5 border-white/5' : 'bg-slate-100/50 border-slate-200'}`}>
          {['landing', 'console', 'dashboard'].map((v: any) => (
            <button key={v} onClick={() => setView(v)} className={`text-[10px] font-black uppercase tracking-[0.2em] transition-all ${view === v ? 'text-[#E6644C]' : (isDarkMode ? 'text-gray-500 hover:text-gray-300' : 'text-slate-400 hover:text-slate-600')}`}>
              {v === 'landing' ? 'Accueil' : v === 'console' ? 'Forge' : 'Archives'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-6">
          <Badge credits={credits} isDarkMode={isDarkMode} />
          <button onClick={() => setIsDarkMode(!isDarkMode)} className={`p-3 rounded-2xl border transition-all ${isDarkMode ? 'border-white/5 bg-white/5 hover:bg-white/10' : 'border-slate-200 bg-slate-50 hover:bg-slate-100'}`}>
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} className="text-slate-600" />}
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col relative overflow-hidden">
        <AnimatePresence mode="wait">
          
          {view === 'landing' && (
            <motion.div key="landing" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, y: 30 }} className="flex-1 flex flex-col items-center justify-center text-center max-w-6xl mx-auto space-y-12 py-20">
              <div className="bg-primary/10 text-primary px-6 py-2 rounded-full font-black text-xs tracking-widest uppercase">Next.js 15 Synergic Control</div>
              <h2 className={`text-8xl md:text-[10rem] font-black tracking-tighter italic leading-[0.75] ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                 L’IA Forge. <br /><span className="opacity-20 italic">SaaS Infinity.</span>
              </h2>
              <p className={`max-w-3xl text-2xl font-medium leading-relaxed ${isDarkMode ? 'text-gray-500' : 'text-slate-500'}`}>
                De l’image au business pack final. 16 agents spécialisés génèrent ton infra Next.js, ta business logic et ta conformité.
              </p>
              <div className="flex flex-col md:flex-row gap-8 pt-8">
                 <Button onClick={() => setView('console')} className="px-16 py-8 text-lg uppercase tracking-widest shadow-2xl">Ouvrir la Console <ChevronRight size={20}/></Button>
                 <Button variant="ghost" onClick={() => setView('dashboard')} className="px-16 py-8 text-lg uppercase tracking-widest">Voir les Archives</Button>
              </div>
            </motion.div>
          )}

          {view === 'console' && (
            <div className="flex-1 flex flex-col h-full">
              {step === AppStep.IDLE && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col items-center justify-center p-10 gap-16 max-w-4xl mx-auto w-full">
                   <div className="w-full relative group">
                      <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={24} />
                      <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Synergy Grounding : Stripe, SEO, GDPR, Auth..." className={`w-full border rounded-[35px] px-16 py-8 outline-none focus:border-[#E6644C]/40 transition-all text-xl font-medium ${isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'}`} />
                   </div>

                   <label className={`w-full h-[400px] border-4 border-dashed rounded-[60px] flex flex-col items-center justify-center cursor-pointer transition-all group overflow-hidden ${isDarkMode ? 'border-white/10 hover:bg-white/[0.02]' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
                    <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if(f){ const r = new FileReader(); r.onload = ev => runVanguardProtocol(ev.target?.result as string); r.readAsDataURL(f); }}} />
                    <div className={`w-20 h-20 rounded-[30px] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform ${isDarkMode ? 'bg-white/5' : 'bg-slate-100'}`}>
                      <Upload size={32} className="text-[#E6644C]" />
                    </div>
                    <p className={`text-3xl font-black italic mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Initialiser l'Omni-Forge</p>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-30 italic">Colle (Ctrl+V) ou Glisse ton Blueprint</p>
                  </label>
                </motion.div>
              )}

              {(step === AppStep.SCANNING || step === AppStep.REFINING) && (
                <motion.div key="scanning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 grid lg:grid-cols-12 gap-8 p-10 h-full overflow-hidden">
                  {/* PREVIEW CARD */}
                  <div className={`lg:col-span-4 rounded-[50px] border p-8 flex flex-col gap-8 ${isDarkMode ? 'bg-white/[0.02] border-white/10' : 'bg-slate-100 border-slate-200 shadow-xl'}`}>
                    <div className="relative aspect-square overflow-hidden rounded-[40px] border border-white/5">
                      {uploadedImage && <img src={uploadedImage} className="w-full h-full object-cover opacity-10 grayscale" />}
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-6">
                         <motion.div animate={{ rotate: 360 }} transition={{ duration: 15, repeat: Infinity, ease: "linear" }} className="w-48 h-48 border-2 border-dashed border-[#E6644C]/30 rounded-full flex items-center justify-center">
                            <Brain size={48} className="text-[#E6644C] animate-pulse" />
                         </motion.div>
                         <h3 className={`text-xl font-black italic tracking-tighter text-center uppercase ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Traitement Neural...</h3>
                      </div>
                    </div>
                    <div className="space-y-4">
                       <div className="flex justify-between text-[10px] font-black uppercase tracking-widest opacity-40">
                          <span>Charge Neurale</span>
                          <span>98%</span>
                       </div>
                       <div className="h-2 bg-black/20 rounded-full overflow-hidden">
                          <motion.div animate={{ width: "98%" }} className="h-full bg-[#E6644C]" />
                       </div>
                    </div>
                  </div>

                  {/* AGENTS LIST */}
                  <div className={`lg:col-span-3 rounded-[50px] border p-8 flex flex-col gap-6 ${isDarkMode ? 'bg-white/[0.02] border-white/10' : 'bg-white border-slate-200 shadow-xl'}`}>
                    <div className="flex items-center justify-between">
                       <h4 className="text-[11px] font-black uppercase tracking-widest opacity-50">Agents Protocol</h4>
                       <span className="text-[10px] font-mono opacity-30">16 Active</span>
                    </div>
                    <div className="flex-1 overflow-y-auto pr-2 space-y-3 scrollbar-hide">
                       {AGENTS.map(a => {
                         const active = activeAgentId === a.id;
                         const done = completedAgents.includes(a.id);
                         return (
                           <div key={a.id} className={`p-4 rounded-3xl border transition-all flex items-center gap-4 ${active ? 'bg-[#E6644C] border-[#E6644C] text-white scale-[1.05] shadow-xl' : done ? 'bg-green-500/10 border-green-500/20 opacity-80' : 'bg-white/5 border-white/5 opacity-40'}`}>
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${active ? 'bg-white/20' : 'bg-slate-100 dark:bg-white/5'}`}>
                                 <a.icon size={18} className={active ? 'text-white' : 'text-[#E6644C]'} />
                              </div>
                              <div className="min-w-0">
                                 <div className="text-[10px] font-black uppercase truncate tracking-tight">{a.label}</div>
                                 <div className={`text-[8px] opacity-70 truncate ${active ? 'text-white' : ''}`}>{a.role}</div>
                              </div>
                              {done && !active && <Check size={14} className="ml-auto text-green-500" />}
                           </div>
                         );
                       })}
                    </div>
                  </div>

                  {/* LOGS STREAM */}
                  <div className={`lg:col-span-5 rounded-[50px] border p-0 overflow-hidden flex flex-col ${isDarkMode ? 'bg-black border-white/10' : 'bg-slate-900 border-slate-800 shadow-2xl'}`}>
                     <div className="px-8 py-5 border-b border-white/5 flex items-center justify-between text-white/30 font-black text-[10px] uppercase tracking-widest">
                        <div className="flex items-center gap-4"><Terminal size={16} className="text-[#E6644C]" /> Vanguard Stream Logs</div>
                        <div className="bg-white/10 px-3 py-1 rounded-md text-[8px]">Secure Tunnel</div>
                     </div>
                     <div className="flex-1 p-8 font-mono text-[11px] space-y-4 overflow-y-auto scrollbar-hide">
                        {logs.map((l, i) => (
                          <div key={i} className={`flex flex-col gap-1 border-l pl-4 ml-1 ${l.status === 'success' ? 'border-green-500 text-green-400' : l.status === 'warning' ? 'border-orange-500 text-orange-400' : 'border-white/10 text-white/40'}`}>
                            <span className="text-[8px] opacity-30 font-black tracking-tighter">[{new Date().toLocaleTimeString()}] {l.agent && `// NODE_${l.agent}`}</span>
                            <p className={l.status === 'success' ? 'font-black' : ''}>{l.msg}</p>
                          </div>
                        ))}
                        <motion.div animate={{ opacity: [0, 1] }} transition={{ repeat: Infinity, duration: 0.8 }} className="inline-block w-1 h-4 bg-[#E6644C]" />
                     </div>
                  </div>
                </motion.div>
              )}

              {step === AppStep.RESULT && analysisResult && (
                <div className="flex-1 flex h-full overflow-hidden">
                    <aside className={`w-[400px] border-r flex flex-col p-10 gap-10 overflow-y-auto scrollbar-hide shrink-0 ${isDarkMode ? 'border-white/5 bg-black/40' : 'border-slate-200 bg-slate-50'}`}>
                      <div>
                        <h4 className="text-[11px] font-black uppercase tracking-[0.5em] text-[#E6644C] mb-8 flex items-center gap-3"><Monitor size={18} /> Metrics DNA</h4>
                        <div className="space-y-4">
                          <div className={`p-6 rounded-3xl border ${isDarkMode ? 'bg-white/[0.03] border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
                             <div className="flex justify-between items-center mb-4">
                               <span className={`text-[10px] font-black uppercase tracking-widest opacity-40 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Symmetry Score</span>
                               <span className="text-green-500 font-mono text-xl font-bold">99.9%</span>
                             </div>
                             <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDarkMode ? 'bg-white/5' : 'bg-slate-100'}`}>
                                <motion.div animate={{ width: "99.9%" }} className="h-full bg-green-500" />
                             </div>
                          </div>
                          <TokenItem iconKey="Palette" label="Brand Core" value={analysisResult.tokens.colors.primary} />
                          <TokenItem iconKey="Type" label="Typography" value={analysisResult.tokens.typography.fontFamily} />
                        </div>
                      </div>

                      <div className={`pt-8 border-t ${isDarkMode ? 'border-white/5' : 'border-slate-200'}`}>
                        <h4 className="text-[11px] font-black uppercase tracking-[0.5em] text-[#E6644C] mb-8 flex items-center gap-3"><ShieldCheck size={18} /> Elite Validation</h4>
                        <div className="grid grid-cols-1 gap-2">
                          {AGENTS.slice(0, 8).map(a => (
                            <div key={a.id} className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${isDarkMode ? 'bg-white/[0.02] border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                               <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_#22c55e]" />
                               <span className={`text-[9px] font-black uppercase tracking-widest ${isDarkMode ? 'text-white/30' : 'text-slate-600'}`}>{a.label}</span>
                               <span className="ml-auto font-mono text-[8px] opacity-20">{a.docUrl}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <Button onClick={downloadZip} className="mt-auto w-full !bg-[#E6644C] shadow-3xl py-7 !rounded-[30px]"><Archive size={22} /> Exporter Artifact (.ZIP)</Button>
                    </aside>

                    <div className={`flex-1 flex flex-col min-w-0 ${isDarkMode ? '' : 'bg-white'}`}>
                      <div className={`p-8 border-b flex items-center justify-between ${isDarkMode ? 'border-white/5' : 'border-slate-200'}`}>
                         <div className="flex gap-4">
                           {['Artifacts', 'Manifesto', 'Vibe Rules', 'Audit'].map((label, idx) => {
                             const tab = [ResultTab.INFRA, ResultTab.MISSION, ResultTab.RULES, ResultTab.AUDIT][idx];
                             return (
                               <button key={label} onClick={() => setActiveTab(tab)} className={`px-8 py-4 rounded-3xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-4 ${activeTab === tab ? 'bg-[#E6644C] text-white shadow-2xl' : (isDarkMode ? 'text-white/30 hover:bg-white/5' : 'text-slate-400 hover:bg-slate-50')}`}>
                                 {label}
                               </button>
                             );
                           })}
                         </div>
                      </div>

                      <div className="flex-1 overflow-hidden">
                        {activeTab === ResultTab.INFRA && <FileExplorer files={analysisResult.projectFiles} isDark={isDarkMode} />}
                        {activeTab === ResultTab.MISSION && <CodePreview code={analysisResult.markdownSpec} title="MANIFESTO.md" isDark={isDarkMode} />}
                        {activeTab === ResultTab.RULES && <CodePreview code={analysisResult.cursorRules} title="VANGUARD.mdc" isDark={isDarkMode} />}
                      </div>
                    </div>
                </div>
              )}
            </div>
          )}

          {view === 'dashboard' && (
             <motion.div key="dashboard" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex-1 flex flex-col gap-12 p-20 max-w-7xl mx-auto w-full">
                <header className="flex justify-between items-center">
                   <div>
                      <h2 className={`text-6xl font-black italic tracking-tighter uppercase mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Sync <span className="text-[#E6644C]">Archives</span></h2>
                      <p className={`text-[12px] font-black uppercase tracking-[0.5em] opacity-40 ${isDarkMode ? 'text-gray-500' : 'text-slate-400'}`}>Historique des blueprints certifiés</p>
                   </div>
                   <Button onClick={() => setView('console')} className="px-12 py-6"><Plus size={20} /> Nouveau Blueprint</Button>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                   {ARCHIVES.map((p, i) => (
                     <div key={i} className={`p-10 flex flex-col justify-between group rounded-[40px] border transition-all ${isDarkMode ? 'bg-white/[0.02] border-white/5' : 'bg-white border-slate-200 shadow-xl'}`}>
                        <div>
                           <div className="flex justify-between items-start mb-8">
                              <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${p.status === 'CERTIFIED' ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-orange-500'}`}>{p.status}</span>
                              <span className="text-[11px] font-mono opacity-40">{p.date}</span>
                           </div>
                           <h3 className={`text-3xl font-black italic tracking-tighter mb-4 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{p.name}</h3>
                        </div>
                        <div className="flex gap-4 pt-10">
                           <button className={`flex-1 p-5 rounded-[25px] flex items-center justify-center transition-colors ${isDarkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-slate-100 hover:bg-slate-200'}`}>
                              <ExternalLink size={20} />
                           </button>
                           <button className="flex-[3] bg-[#E6644C] text-white px-8 rounded-[25px] font-black text-[10px] uppercase tracking-widest">Ouvrir Forge</button>
                        </div>
                     </div>
                   ))}
                </div>
             </motion.div>
          )}

        </AnimatePresence>
      </main>

      <div className="fixed bottom-10 right-10 flex flex-col gap-6 z-[200]">
        <button onClick={() => setIsChatOpen(!isChatOpen)} className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all ${isChatOpen ? 'bg-white text-black' : 'bg-[#E6644C] text-white'}`}>
          {isChatOpen ? <X size={28} /> : <MessageSquare size={28} />}
        </button>
      </div>

      <ChatDrawer isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} onRefine={refineForge} currentContext={analysisResult} />

      <footer className={`px-10 py-8 border-t flex items-center justify-between text-[10px] font-black uppercase tracking-[0.5em] opacity-30 ${isDarkMode ? 'border-white/5' : 'border-slate-200'}`}>
        <div className="flex items-center gap-4 italic"><div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" /> Vanguard Infinity • Compliance Ready</div>
        <div className="flex gap-14">
           <span>Starter Compliant: {STARTER_NAME}</span>
           <span>Next.js 15 Ready</span>
        </div>
      </footer>
    </div>
  );
}

const Badge = ({ credits, isDarkMode }: { credits: number, isDarkMode: boolean }) => (
  <div className={`px-4 py-2 rounded-full border flex items-center gap-3 ${isDarkMode ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50'}`}>
     <span className="h-2 w-2 rounded-full bg-green-500" />
     <span className="text-[10px] font-black uppercase tracking-widest">Credits: {credits}</span>
  </div>
);

const FileExplorer: React.FC<{ files: Record<string, string>, isDark: boolean }> = ({ files, isDark }) => {
  const filePaths = Object.keys(files).sort();
  const [selectedPath, setSelectedPath] = useState(filePaths[0]);

  return (
    <div className="h-full flex flex-col lg:flex-row">
      <div className={`w-full lg:w-[420px] border-r overflow-y-auto scrollbar-hide p-10 shrink-0 ${isDark ? 'border-white/5 bg-black/20' : 'bg-slate-50 border-slate-200'}`}>
        <div className="space-y-3">
          {filePaths.map(path => (
            <button key={path} onClick={() => setSelectedPath(path)} className={`w-full text-left px-7 py-5 rounded-[25px] transition-all flex items-center gap-5 ${selectedPath === path ? 'bg-[#E6644C] text-white shadow-xl scale-[1.03]' : (isDark ? 'text-white/20 hover:bg-white/5' : 'text-slate-600 hover:bg-slate-100')}`}>
              <FileCode size={16} />
              <span className="text-[12px] font-black truncate">{path}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <CodePreview code={files[selectedPath] || ''} title={selectedPath} isDark={isDark} />
      </div>
    </div>
  );
};

const CodePreview: React.FC<{ code: string, title: string, isDark: boolean }> = ({ code, title, isDark }) => {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <div className={`flex flex-col h-full ${isDark ? 'bg-[#020202]' : 'bg-white'}`}>
      <div className={`flex justify-between items-center px-16 py-8 border-b ${isDark ? 'border-white/5 bg-white/[0.01]' : 'border-slate-100 bg-slate-50/50'}`}>
         <span className={`text-[10px] font-mono tracking-widest uppercase font-black ${isDark ? 'text-white/30' : 'text-slate-400'}`}>{title}</span>
         <button onClick={copy} className={`p-4 rounded-2xl border transition-all ${isDark ? 'hover:text-[#E6644C] bg-white/5 border-white/5 text-white' : 'hover:border-slate-300 bg-white border-slate-200 text-slate-600 shadow-sm'}`}>
           {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
         </button>
      </div>
      <pre className={`p-16 text-[13px] font-mono overflow-auto flex-1 leading-relaxed ${isDark ? 'text-white/60' : 'text-slate-800'}`}>
        <code>{code}</code>
      </pre>
    </div>
  );
};
