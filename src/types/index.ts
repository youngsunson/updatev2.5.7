// src/types/index.ts
/* -------------------------------------------------------------------------- */
/*                                TYPES                                       */
/* -------------------------------------------------------------------------- */

// AI Analysis Metadata (For better reasoning)
export interface AIAnalysisMeta {
  detectedTone: string;
  detectedStyle: 'sadhu' | 'cholito' | 'mixed';
  overallQuality: string;
}

export interface Correction {
  wrong: string;
  suggestions: string[];
  explanation?: string; // Added explanation for better user understanding
  position?: number;
}

export interface ToneSuggestion {
  current: string;
  suggestion: string;
  reason: string;
  position?: number;
}

export interface StyleSuggestion {
  current: string;
  suggestion: string;
  type: string;
  position?: number;
}

export interface StyleMixingCorrection {
  current: string;
  suggestion: string;
  type: string;
  position?: number;
}

export interface StyleMixing {
  detected: boolean;
  recommendedStyle?: string;
  reason?: string;
  corrections?: StyleMixingCorrection[];
}

export interface PunctuationIssue {
  issue: string;
  currentSentence: string;
  correctedSentence: string;
  explanation: string;
  position?: number;
}

export interface EuphonyImprovement {
  current: string;
  suggestions: string[];
  reason: string;
  position?: number;
}

export interface ContentAnalysis {
  contentType: string;
  description?: string;
  missingElements?: string[];
  suggestions?: string[];
}

export type SectionKey =
  | 'spelling'
  | 'tone'
  | 'style'
  | 'mixing'
  | 'punctuation'
  | 'euphony'
  | 'content';

export type ViewFilter = 'all' | 'spelling' | 'punctuation';

export type ModalType = 'none' | 'settings' | 'instructions' | 'tone' | 'style' | 'doctype' | 'mainMenu';

export interface DocTypeConfig {
  label: string;
  description: string;
  defaultTone: string;
  roleInstruction: string;
  checkFocus: string;
}

// Main Response Structure
export interface AIResponse {
  _analysis?: AIAnalysisMeta; // New field for CoT
  spellingErrors?: Correction[];
  languageStyleMixing?: StyleMixing;
  punctuationIssues?: PunctuationIssue[];
  euphonyImprovements?: EuphonyImprovement[];
  toneConversions?: ToneSuggestion[]; // Optional if merged
  styleConversions?: StyleSuggestion[]; // Optional if merged
}

export interface Stats {
  totalWords: number;
  errorCount: number;
  accuracy: number;
}

export interface Message {
  text: string;
  type: 'success' | 'error';
}
