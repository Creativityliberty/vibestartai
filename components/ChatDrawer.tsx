
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, Bot, User, Sparkles, Terminal, ShieldCheck, Cpu, Zap, Activity } from 'lucide-react';
import { GoogleGenAI, GenerateContentResponse, FunctionDeclaration, Type } from "@google/genai";
import { AnalysisResult, AppStep } from '../types';
import { AGENTS } from '../App';

interface Message {
  role: 'user' | 'model';
  text: string;
}

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onRefine: (instruction: string) => void;
  currentContext: AnalysisResult | null;
}

export const ChatDrawer: React.FC<ChatDrawerProps> = ({ isOpen, onClose, onRefine, currentContext }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'Vanguard Intelligence en ligne. Je suis votre Tour de Contrôle. Comment puis-je raffiner votre forge ?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const refineForgeFunctionDeclaration: FunctionDeclaration = {
    name: 'refineForge',
    parameters: {
      type: Type.OBJECT,
      description: 'Déclenche un raffinement du projet en relançant les agents avec de nouvelles instructions.',
      properties: {
        instruction: {
          type: Type.STRING,
          description: 'L\'instruction précise pour modifier le code ou le design (ex: "Change la couleur primaire en bleu", "Ajoute un dashboard").',
        },
      },
      required: ['instruction'],
    },
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
          { role: 'user', parts: [{ text: userMsg }] }
        ],
        config: {
          systemInstruction: `Tu es Vanguard AI, l'Orchestrateur Suprême de Foundry OS. 
          Tu as un contrôle total sur le pipeline d'agents. 
          CONTEXTE ACTUEL: ${currentContext ? JSON.stringify(currentContext.tokens) : "Pas encore de forge active"}.
          Si l'utilisateur demande une modification du code, du design ou du projet, utilise obligatoirement l'outil 'refineForge'. 
          Sinon, réponds de façon concise et technique.`,
          tools: [{ functionDeclarations: [refineForgeFunctionDeclaration] }],
        },
      });

      if (response.functionCalls && response.functionCalls.length > 0) {
        const fc = response.functionCalls[0];
        if (fc.name === 'refineForge') {
          const instr = (fc.args as any).instruction;
          setMessages(prev => [...prev, { role: 'model', text: `Reçu. Je transmets l'instruction aux agents : "${instr}". Déclenchement du pipeline...` }]);
          onRefine(instr);
          onClose(); // On ferme le chat pour laisser voir l'orchestration
        }
      } else {
        setMessages(prev => [...prev, { role: 'model', text: response.text || "Compris." }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: "Lien neuronal interrompu. Veuillez réessayer." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />
          <motion.div 
            initial={{ x: '100%' }} 
            animate={{ x: 0 }} 
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-[500px] bg-[#080808] border-l border-white/10 z-[101] flex flex-col shadow-[-20px_0_50px_rgba(0,0,0,0.5)]"
          >
            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-black/40">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#E6644C]/10 flex items-center justify-center text-[#E6644C]">
                  <Activity size={24} className="animate-pulse" />
                </div>
                <div>
                  <h3 className="text-xl font-black italic tracking-tighter uppercase">Vanguard <span className="text-[#E6644C]">Command</span></h3>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-30">Master Orchestrator Node</p>
                </div>
              </div>
              <button onClick={onClose} className="p-3 hover:bg-white/5 rounded-xl transition-colors"><X size={24} /></button>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
              <div className="p-6 bg-[#E6644C]/5 border border-[#E6644C]/20 rounded-[25px]">
                <p className="text-[11px] font-black uppercase tracking-widest text-[#E6644C] mb-3 flex items-center gap-2"><Zap size={14} /> Power Mode</p>
                <p className="text-white/60 text-xs">Je peux piloter les agents pour modifier vos artifacts. Dites simplement : "Change les boutons en arrondi" ou "Ajoute une page profil".</p>
              </div>

              {messages.map((m, i) => (
                <div key={i} className={`flex gap-5 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${m.role === 'user' ? 'bg-white/5 text-white' : 'bg-[#E6644C]/10 text-[#E6644C]'}`}>
                    {m.role === 'user' ? <User size={18} /> : <Cpu size={18} />}
                  </div>
                  <div className={`max-w-[80%] p-6 rounded-[25px] text-[13px] leading-relaxed font-medium ${m.role === 'user' ? 'bg-[#E6644C] text-white' : 'bg-white/[0.03] text-white/80 border border-white/5 shadow-inner'}`}>
                    {m.text}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-5">
                  <div className="w-10 h-10 rounded-xl bg-[#E6644C]/10 flex items-center justify-center text-[#E6644C] animate-pulse">
                    <Cpu size={18} />
                  </div>
                  <div className="flex gap-1.5 items-center p-6 bg-white/[0.03] rounded-[25px] border border-white/5">
                    <motion.div animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 rounded-full bg-[#E6644C]" />
                    <motion.div animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 rounded-full bg-[#E6644C]" />
                    <motion.div animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 rounded-full bg-[#E6644C]" />
                  </div>
                </div>
              )}
            </div>

            <div className="p-8 border-t border-white/5 bg-black/40">
              <div className="relative">
                <input 
                  type="text" 
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage()}
                  placeholder="Donner un ordre à l'Orchestrateur..."
                  className="w-full bg-white/5 border border-white/10 rounded-[25px] px-8 py-6 pr-20 outline-none focus:border-[#E6644C]/40 transition-all text-sm font-medium"
                />
                <button 
                  onClick={sendMessage}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-14 h-14 rounded-2xl bg-[#E6644C] flex items-center justify-center text-white shadow-lg shadow-[#E6644C]/20 hover:scale-105 transition-all active:scale-95"
                >
                  <Send size={24} />
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
