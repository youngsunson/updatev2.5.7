// src/types/index.ts

/* -------------------------------------------------------------------------- */
/*                                TYPES                                       */
/* -------------------------------------------------------------------------- */

// AI Analysis Metadata (Chain of Thought - CoT)
// এটি AI কে উত্তর দেয়ার আগে ভাবতে বাধ্য করবে
export interface AIAnalysisMeta {
  detectedTone: string;
  detectedStyle: 'sadhu' | 'cholito' | 'mixed';
  overallQuality: string;
}

// সাধারণ ভুলের জন্য
export interface Correction {
  wrong: string;
  suggestions: string[];
  explanation?: string;
  position?: number;
  confidenceScore?: number; // 0.0 to 1.0
  severity?: 'critical' | 'minor';
}

// টোন বা বাচনভঙ্গির সাজেশনের জন্য
export interface ToneSuggestion {
  current: string;
  suggestion: string;
  reason: string;
  position?: number;
  confidenceScore?: number;
}

// স্টাইল (সাধু/চলিত) সাজেশনের জন্য
export interface StyleSuggestion {
  current: string;
  suggestion: string;
  type: string;
  position?: number;
  confidenceScore?: number;
}

// স্টাইল মিক্সিং কারেকশনের জন্য
export interface StyleMixingCorrection {
  current: string;
  suggestion: string;
  type: string;
  position?: number;
  confidenceScore?: number;
}

// মিশ্রণ ডিটেকশন অবজেক্ট
export interface StyleMixing {
  detected: boolean;
  recommendedStyle?: string;
  reason?: string;
  corrections?: StyleMixingCorrection[];
}

// যতিচিহ্নের সমস্যার জন্য
export interface PunctuationIssue {
  issue: string;
  currentSentence: string;
  correctedSentence: string;
  explanation: string;
  position?: number;
  confidenceScore?: number;
}

// শ্রুতিমাধুর্য (Euphony) এর জন্য
export interface EuphonyImprovement {
  current: string;
  suggestions: string[];
  reason: string;
  position?: number;
  confidenceScore?: number;
}

// কনটেন্ট অ্যানালাইসিস (যদি ভবিষ্যতে লাগে)
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

// ডকুমেন্ট কনফিগারেশন টাইপ
export interface DocTypeConfig {
  label: string;
  description: string;
  defaultTone: string;
  roleInstruction: string;
  checkFocus: string;
}

// সম্পূর্ণ API রেসপন্স স্ট্রাকচার
export interface AIResponse {
  _analysis?: AIAnalysisMeta; // AI-এর লজিক্যাল বিশ্লেষণ
  spellingErrors?: Correction[];
  languageStyleMixing?: StyleMixing;
  punctuationIssues?: PunctuationIssue[];
  euphonyImprovements?: EuphonyImprovement[];
  toneConversions?: ToneSuggestion[]; 
  styleConversions?: StyleSuggestion[];
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
