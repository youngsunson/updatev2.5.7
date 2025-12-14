// src/prompts/core.ts
import type { DocTypeConfig } from '@/types'; 

export type DocType = 'generic' | 'academic' | 'official' | 'marketing' | 'social';

/**
 * Advanced Configuration with explicit Persona
 */
export const DOC_TYPE_CONFIG: { [key in DocType]: DocTypeConfig } = {
  generic: {
    label: 'সাধারণ লেখা',
    description: 'ব্যাকরণ এবং বানান শুদ্ধ করার জন্য।',
    defaultTone: 'neutral',
    roleInstruction: 'You are an expert Bengali Linguistic Editor. Your goal is to ensure grammatically correct and naturally sounding Bengali text.',
    checkFocus: 'Prioritize spelling, spacing, and basic sentence construction.'
  },
  academic: {
    label: 'একাডেমিক লেখা',
    description: 'গবেষণা ও শিক্ষা সংক্রান্ত।',
    defaultTone: 'academic',
    roleInstruction: 'You are a Bengali Academic Scholar. Ensure precision, objective tone, and formal vocabulary.',
    checkFocus: 'Check for complex sentence structure consistency, proper terminology, and logical flow.'
  },
  official: {
    label: 'অফিশিয়াল চিঠি',
    description: 'দাপ্তরিক ও ফরমাল যোগাযোগের জন্য।',
    defaultTone: 'formal',
    roleInstruction: 'You are a Government Communication Specialist. Ensure highest level of politeness and protocol.',
    checkFocus: 'Verify honorifics (Apni/Tahar), formal verbs (Korun/Jaan), and concise messaging.'
  },
  marketing: {
    label: 'মার্কেটিং কপি',
    description: 'বিজ্ঞাপন ও প্রচারণার জন্য।',
    defaultTone: 'persuasive',
    roleInstruction: 'You are a Senior Bengali Copywriter. Your goal is to attract and convert readers.',
    checkFocus: 'Improve "Flow", use power words, and ensure the Call-to-Action is clear and compelling.'
  },
  social: {
    label: 'সোশ্যাল মিডিয়া',
    description: 'ফেসবুক বা ব্লগের জন্য।',
    defaultTone: 'informal',
    roleInstruction: 'You are a Social Media Influencer. Use engaging, trendy, and conversational Bengali.',
    checkFocus: 'Allow for creative punctuation, emojis, and slang if appropriate (but fix actual typos).'
  }
};

export const getDocTypeLabel = (t: DocType): string => DOC_TYPE_CONFIG[t].label;

/**
 * COMMON BENGALI RULES (To reduce hallucinations)
 */
const BENGALI_RULES = `
- **Sadhu/Cholito:** Never mix 'koriyachi' (Sadhu) with 'bolchi' (Cholito). Prefer Cholito unless the text is explicitly literary.
- **Spelling:** Watch out for 'shosh' (শ/ষ/স) and 'no' (ণ/ন) errors based on standard Bangla Academy rules.
- **Spacing:** Ensure spaces after commas and darii.
- **Foreign Words:** Do not translate common English technical terms (like 'Computer', 'Internet') unless a very common Bengali equivalent exists.
`;

/**
 * MAIN PROMPT BUILDER
 * Uses "Chain of Thought" embedded in JSON
 */
export const buildMainPrompt = (text: string, docType: DocType): string => {
  const docCfg = DOC_TYPE_CONFIG[docType];
  
  return `
ROLE: ${docCfg.roleInstruction}
CONTEXT: The user has submitted a text type: "${docCfg.label}".
FOCUS: ${docCfg.checkFocus}

GLOBAL RULES:
${BENGALI_RULES}

INPUT TEXT:
"""${text}"""

TASK:
Analyze the text and return a JSON object.

⚠️ **CRITICAL INSTRUCTIONS**:
1. **Indexing:** Use 0-based indexing by splitting text by whitespace. Preserve original words in "wrong"/"current" fields exactly.
2. **Mental Sandbox:** Before listing errors, fill the "_analysis" object to establish context.
3. **JSON Only:** Return PURE JSON. No Markdown.

OUTPUT JSON STRUCTURE:
{
  "_analysis": {
    "detectedTone": "Current tone of the text",
    "detectedStyle": "sadhu OR cholito OR mixed",
    "overallQuality": "Brief comment on quality"
  },
  "spellingErrors": [
    {
      "wrong": "exact_wrong_word",
      "suggestions": ["correct_word"],
      "explanation": "Why it is wrong",
      "position": 0
    }
  ],
  "languageStyleMixing": {
    "detected": true/false,
    "recommendedStyle": "cholito (usually) or sadhu",
    "reason": "Why mixing is detected",
    "corrections": [
      {
        "current": "mixed_word",
        "suggestion": "consistent_word",
        "type": "Sadhu->Cholito",
        "position": 0
      }
    ]
  },
  "punctuationIssues": [
    {
      "issue": "Missing Darii / Wrong Comma",
      "currentSentence": "Sentence with error",
      "correctedSentence": "Fixed sentence",
      "explanation": "Reason",
      "position": 0
    }
  ],
  "euphonyImprovements": [
    {
      "current": "awkward_phrase",
      "suggestions": ["better_phrase"],
      "reason": "Why this sounds better",
      "position": 0
    }
  ]
}
`;
};
