
import { GoogleGenAI, Type } from "@google/genai";
import { DesignTokens, AnalysisResult } from "../types";

const getMimeType = (base64: string): string => {
  const match = base64.match(/^data:(image\/[a-z]+);base64,/);
  return match ? match[1] : 'image/png';
};

const getBase64Data = (base64: string): string => {
  return base64.split(',')[1] || base64;
};

const FOUNDRY_CORE_UTILS = `import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const foundryTheme = {
  version: "7.1",
  engine: "Next.js 15 (App Router)",
  ui: "Tailwind CSS 4 / Framer Motion",
};`;

export const analyzeUIScreenshot = async (base64Image: string, context: string = ""): Promise<{ 
  tokens: DesignTokens, 
  spec: string, 
  rules: string,
  projectFiles: Record<string, string> 
}> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `Tu es l'Intelligence Suprême de Nümtema Foundry. Ta mission est de forger un STARTER TEMPLATE SaaS complet à partir de cette UI.
  CONTEXTE ADDITIONNEL : ${context}
  Génère les rapports d'agents (AGENT_*.md) et le code Next.js 15 associé.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: [
      {
        parts: [
          { inlineData: { mimeType: getMimeType(base64Image), data: getBase64Data(base64Image) } },
          { text: prompt }
        ]
      }
    ],
    config: {
      responseMimeType: "application/json",
      thinkingConfig: { thinkingBudget: 32768 },
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          tokens: { 
            type: Type.OBJECT, 
            properties: { 
              colors: { type: Type.OBJECT, properties: { primary: {type: Type.STRING}, background: {type: Type.STRING}, surface: {type: Type.STRING}, text: {type: Type.STRING}, accent: {type: Type.STRING} }, required: ["primary", "background", "surface", "text", "accent"] },
              radii: { type: Type.OBJECT, properties: { card: {type: Type.STRING}, button: {type: Type.STRING}, input: {type: Type.STRING} }, required: ["card", "button", "input"] },
              typography: { type: Type.OBJECT, properties: { fontFamily: {type: Type.STRING}, baseSize: {type: Type.STRING}, headingWeight: {type: Type.STRING} }, required: ["fontFamily", "baseSize", "headingWeight"] },
              spacing: { type: Type.OBJECT, properties: { base: {type: Type.STRING}, gap: {type: Type.STRING} }, required: ["base", "gap"] }
            }, 
            required: ["colors", "radii", "typography", "spacing"]
          },
          spec: { type: Type.STRING },
          rules: { type: Type.STRING },
          projectFiles: { 
            type: Type.ARRAY, 
            items: {
              type: Type.OBJECT,
              properties: { path: { type: Type.STRING }, content: { type: Type.STRING } },
              required: ["path", "content"]
            }
          }
        },
        required: ["tokens", "spec", "rules", "projectFiles"]
      }
    }
  });

  const parsed = JSON.parse(response.text || "{}");
  const filesRecord: Record<string, string> = {};
  filesRecord['lib/foundry-utils.ts'] = FOUNDRY_CORE_UTILS;
  if (Array.isArray(parsed.projectFiles)) {
    parsed.projectFiles.forEach((file: any) => { filesRecord[file.path] = file.content; });
  }
  filesRecord['FOUNDRY_MANIFESTO.md'] = parsed.spec;
  filesRecord['.cursor/rules/foundry.mdc'] = parsed.rules;

  return { ...parsed, projectFiles: filesRecord };
};

export const refineAnalysis = async (base64Image: string, current: AnalysisResult, instruction: string): Promise<{
  tokens?: DesignTokens,
  spec?: string,
  rules?: string,
  projectFiles: Record<string, string>
}> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `Tu es l'Orchestrateur de Vanguard. L'utilisateur veut RAFFINER le projet existant.
  INSTRUCTION: "${instruction}"
  
  PROJET ACTUEL (DESIGN TOKENS): ${JSON.stringify(current.tokens)}
  
  Ta tâche:
  1. Modifie les fichiers de code (projectFiles) pour appliquer l'instruction.
  2. Mets à jour le manifeste (spec) et les règles (rules) si nécessaire.
  3. Retourne UNIQUEMENT les fichiers modifiés ou nouveaux.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: [
      {
        parts: [
          { inlineData: { mimeType: getMimeType(base64Image), data: getBase64Data(base64Image) } },
          { text: prompt }
        ]
      }
    ],
    config: {
      responseMimeType: "application/json",
      thinkingConfig: { thinkingBudget: 32768 },
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          tokens: { 
            type: Type.OBJECT, 
            properties: { 
              colors: { type: Type.OBJECT, properties: { primary: {type: Type.STRING}, background: {type: Type.STRING}, surface: {type: Type.STRING}, text: {type: Type.STRING}, accent: {type: Type.STRING} } },
              radii: { type: Type.OBJECT, properties: { card: {type: Type.STRING}, button: {type: Type.STRING}, input: {type: Type.STRING} } },
            }
          },
          spec: { type: Type.STRING },
          rules: { type: Type.STRING },
          projectFiles: { 
            type: Type.ARRAY, 
            items: {
              type: Type.OBJECT,
              properties: { path: { type: Type.STRING }, content: { type: Type.STRING } },
              required: ["path", "content"]
            }
          }
        },
        required: ["projectFiles"]
      }
    }
  });

  const parsed = JSON.parse(response.text || "{}");
  const filesRecord: Record<string, string> = { ...current.projectFiles };
  if (Array.isArray(parsed.projectFiles)) {
    parsed.projectFiles.forEach((file: any) => { filesRecord[file.path] = file.content; });
  }

  return { ...parsed, projectFiles: filesRecord };
};
