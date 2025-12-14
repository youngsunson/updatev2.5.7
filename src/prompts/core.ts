// src/prompts/core.ts
import type { DocTypeConfig } from '@/types'; 

// DocType টাইপ ডেফিনিশন
export type DocType = 'generic' | 'academic' | 'official' | 'marketing' | 'social';

/**
 * Advanced Configuration with explicit Persona (Role)
 */
export const DOC_TYPE_CONFIG: { [key in DocType]: DocTypeConfig } = {
  generic: {
    label: 'সাধারণ',
    description: 'সাধারণ ব্যাকরণ ও বানান শুদ্ধ করার জন্য।',
    defaultTone: 'neutral',
    roleInstruction: 'You are an expert Bengali Linguistic Editor. Your goal is to ensure grammatically correct and naturally sounding Bengali text.',
    checkFocus: 'Focus on standard grammar (Banban/Nodi), spelling conventions (Bangla Academy), and clarity.'
  },
  academic: {
    label: 'একাডেমিক',
    description: 'গবেষণা, থিসিস বা শিক্ষা সংক্রান্ত লেখার জন্য।',
    defaultTone: 'academic',
    roleInstruction: 'You are a Bengali Academic Scholar. Ensure precision, objective tone, and formal vocabulary.',
    checkFocus: 'Check for complex sentence structure consistency, proper terminology, and logical flow. Use passive voice where appropriate.'
  },
  official: {
    label: 'অফিশিয়াল',
    description: 'দাপ্তরিক চিঠি বা আবেদনের জন্য।',
    defaultTone: 'formal',
    roleInstruction: 'You are a Government Communication Specialist. Ensure highest level of politeness and protocol.',
    checkFocus: 'Verify honorifics (Apni/Tahar), formal verbs (Korun/Jaan), and concise messaging.'
  },
  marketing: {
    label: 'মার্কেটিং',
    description: 'বিজ্ঞাপন বা প্রচারণার জন্য।',
    defaultTone: 'persuasive',
    roleInstruction: 'You are a Senior Bengali Copywriter. Your goal is to attract and convert readers.',
    checkFocus: 'Improve "Flow", use power words, and ensure the Call-to-Action is clear and compelling.'
  },
  social: {
    label: 'সোশ্যাল মিডিয়া',
    description: 'ফেসবুক, ব্লগ বা ক্যাপশনের জন্য।',
    defaultTone: 'informal',
    roleInstruction: 'You are a Social Media Influencer. Use engaging, trendy, and conversational Bengali.',
    checkFocus: 'Allow for creative punctuation, emojis, and slang if appropriate (but fix actual typos). Optimize for engagement.'
  }
};

/**
 * UI এর জন্য লেবেল ফাংশন
 */
export const getDocTypeLabel = (t: DocType): string => DOC_TYPE_CONFIG[t].label;

/**
 * COMMON BENGALI RULES (To reduce hallucinations)
 */
const BENGALI_RULES = `
- **Sadhu/Cholito:** Never mix 'koriyachi' (Sadhu) with 'bolchi' (Cholito). Prefer Cholito unless the text is explicitly literary.
- **Spelling:** Adhere to "Bangla Academy" rules. Distinguish between 'ki' (কি - noun) and 'kii' (কী - question).
- **Suffixes:** Be careful with 'Ra' (রা), 'Er' (এর) suffixes. Do not flag correct agglutinated words as typos.
- **Foreign Words:** English words written in Bangla (e.g., 'স্কুল', 'ইন্টারনেট') are valid. Do not correct them unless the transliteration is wrong.
- **Spacing:** Ensure spaces after commas and darii (|).
`;

/**
 * MAIN PROMPT BUILDER
 * Uses "Chain of Thought" embedded in JSON and Confidence Scoring
 */
export const buildMainPrompt = (text: string, docType: DocType): string => {
  const docCfg = DOC_TYPE_CONFIG[docType];
  
  return `
SYSTEM ROLE: ${docCfg.roleInstruction}
CONTEXT: User Input Type: "${docCfg.label}".
FOCUS: ${docCfg.checkFocus}

LANGUAGE RULES:
${BENGALI_RULES}

INPUT TEXT:
"""${text}"""

⚡ **CRITICAL PROCESSING INSTRUCTIONS**:
1. **Tokenization Strategy:** Treat the input text as a sequence of words separated by WHITESPACE (spaces, newlines, tabs). Punctuation attached to words counts as part of the word string for matching, but focus on the root word for error checking.
2. **Indexing:** The "position" MUST be the 0-based index of the word in the whitespace-separated list.
3. **Mental Sandbox:** Before listing errors, fill the "_analysis" object to establish context.
4. **Strictness:**
   - **Confidence Score < 0.8**: DO NOT report it (Ignore minor doubts).
   - **Confidence Score > 0.9**: Report as 'critical' severity.
5. **Format:** Return PURE JSON only. No Markdown codes.

OUTPUT SCHEMA (JSON):
{
  "_analysis": {
    "detectedTone": "Current tone of the text",
    "detectedStyle": "sadhu OR cholito OR mixed",
    "overallQuality": "Brief comment on quality"
  },
  "spellingErrors": [
    {
      "wrong": "exact_substring_from_text",
      "suggestions": ["corrected_word"],
      "explanation": "Brief reason in Bangla",
      "position": 0,
      "confidenceScore": 0.95,
      "severity": "critical"
    }
  ],
  "languageStyleMixing": {
    "detected": true,
    "recommendedStyle": "cholito (usually) or sadhu",
    "reason": "Why mixing is detected",
    "corrections": [
      {
        "current": "mixed_word",
        "suggestion": "consistent_word",
        "type": "Sadhu->Cholito",
        "position": 0,
        "confidenceScore": 0.9
      }
    ]
  },
  "punctuationIssues": [
    {
      "issue": "Missing Darii / Wrong Comma",
      "currentSentence": "Full sentence with error",
      "correctedSentence": "Full sentence fixed",
      "explanation": "Reason in Bangla",
      "position": 0,
      "confidenceScore": 0.85
    }
  ],
  "euphonyImprovements": [
    {
      "current": "awkward_phrase",
      "suggestions": ["better_phrase"],
      "reason": "Why this sounds better",
      "position": 0,
      "confidenceScore": 0.8
    }
  ]
}
`;
};
