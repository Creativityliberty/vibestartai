
export type AgentId =
  | 'VISUAL_PARSER'
  | 'WEB_GROUNDING'
  | 'DESIGN_ENGINEER'
  | 'MAITRE_COPYWRITER'
  | 'SEO_STRATEGIST'
  | 'DATA_MODELER'
  | 'AUTH_SENTINEL'
  | 'STRIPE_INTEGRATOR'
  | 'BACKEND_FORGE'
  | 'EDGE_OPTIMIZER'
  | 'LEGAL_SHIELD'
  | 'ACCESSIBILITY_AUDITOR'
  | 'QA_SENTINEL'
  | 'SYMMETRY_GUARD'
  | 'VIBE_SPECIALIST'
  | 'MASTER_ASSEMBLER';

export interface DesignTokens {
  colors: {
    primary: string;
    background: string;
    surface: string;
    text: string;
    accent: string;
  };
  radii: { card: string; button: string; input: string; };
  typography: { fontFamily: string; baseSize: string; headingWeight: string; };
  spacing: { base: string; gap: string; };
}

export interface AnalysisResult {
  tokens: DesignTokens;
  markdownSpec: string;
  cursorRules: string;
  projectFiles: Record<string, string>;
  confidence: number;
  metrics: {
    symmetry: number;
    tokens: number;
    agents: number;
    latency: string;
    compliance: string;
  };
}

export type ViewState = 'landing' | 'console' | 'dashboard';
export enum AppStep { IDLE = 'idle', SCANNING = 'scanning', REFINING = 'refining', RESULT = 'result' }
export enum ResultTab { MISSION = 'mission', INFRA = 'infra', RULES = 'rules', AUDIT = 'audit' }
