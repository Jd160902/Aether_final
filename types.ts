import type { ReactNode } from 'react';

export interface Tab {
  id: string;
  label: string;
  icon: ReactNode;
}

export interface User {
  id:string;
  email: string;
}

export type Mood = 'rad' | 'good' | 'meh' | 'bad' | 'awful';

export interface ReflectionEntry {
  id: string;
  date: string;
  text: string;
  analysis?: string;
  mood?: Mood;
}

export interface Aspiration {
  id: string;
  date: string;
  text: string;
  inspiration?: string;
  imageUrl?: string;
}

export interface Goal {
  id: string;
  text: string;
  isCompleted: boolean;
  dueDate?: string;
  tags?: string[];
  type?: 'short-term' | 'long-term';
}

export type AiPersona = 'empathetic_companion' | 'stoic_philosopher' | 'cheerful_coach' | 'direct_concise' | 'custom';

export type PromptDetail = {
  systemInstruction: string;
  userPrompt: string;
};

export type PersonaPrompts = {
  REFLECTION_ANALYSIS: PromptDetail;
  ASPIRATION_INSPIRATION: PromptDetail;
  GOAL_MOTIVATION: PromptDetail;
  WELLNESS_ADVICE: PromptDetail;
  ADVICE: PromptDetail;
  COGNITIVE_REFRAMING: PromptDetail;
};

export type PromptKey = keyof PersonaPrompts;

export interface CustomPersona {
  name: string;
  description: string;
  prompts: Partial<PersonaPrompts>;
}

export interface UserSettings {
  aiPersona: AiPersona;
  customPersona?: CustomPersona;
}

export interface SentimentAnalysisResult {
  overallSentiment: string;
  keyThemes: string[];
  sentimentScore: number; // A score from 0 to 10
}