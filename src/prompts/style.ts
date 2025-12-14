// src/prompts/style.ts

/**
 * STYLE MAPPING EXAMPLES
 */
const STYLE_EXAMPLES = `
Examples:
- **Sadhu**: "খাইতেছি" (Verb), "তাহাদের" (Pronoun), "যাহা" (Relative Pronoun).
- **Cholito**: "খাচ্ছি" (Verb), "তাদের" (Pronoun), "যা" (Relative Pronoun).

Rules:
1. **Sadhu**: Verb suffix -techi, -iyachi, -ibe. Pronoun -aha (tahar, jaha).
2. **Cholito**: Shortened verbs. Standard pronouns.
`;

const styleInstructions: Record<string, string> = {
  'sadhu': `Target: **Sadhu Bhasha** (High Literary). 
   - Convert all verbs to their classical full forms (e.g., 'korchi' -> 'koritechi').
   - Convert pronouns to formal/classical forms (e.g., 'tar' -> 'tahar').`,
   
  'cholito': `Target: **Cholito Bhasha** (Standard Colloquial). 
   - Convert all verbs to their modern short forms (e.g., 'koritechi' -> 'korchi').
   - Convert pronouns to standard forms (e.g., 'tahar' -> 'tar').`
};

/**
 * Style Prompt Builder
 */
export const buildStylePrompt = (text: string, style: string): string => {
  return `
ROLE: Expert Bengali Grammarian.
TASK: Convert the text strictly to **${style === 'sadhu' ? 'SADHU' : 'CHOLITO'}** bhasha.

${STYLE_EXAMPLES}

${styleInstructions[style]}

INPUT TEXT:
"""${text}"""

INSTRUCTIONS:
1. Identify words that do not match the target style (${style}).
2. Provide the corrected word in Bengali.
3. **"current" field**: Must be an EXACT copy from input text.
4. **"position" field**: 0-based word index.

OUTPUT FORMAT (JSON ONLY, No Markdown):
{
  "styleConversions": [
    {
      "current": "exact_word_match",
      "suggestion": "converted_word",
      "type": "Verb/Pronoun",
      "position": 0,
      "confidenceScore": 0.95
    }
  ]
}

If no changes are needed (text is already in target style), return: { "styleConversions": [] }
`;
};

/**
 * Style Types
 */
export type StyleType = 'none' | 'sadhu' | 'cholito';

/**
 * UI Options for Style
 */
export const STYLE_OPTIONS = [
  { id: 'none' as StyleType, icon: '❌', title: 'কোনটি নয়', desc: 'মিশ্রণ সনাক্তকরণ' },
  { id: 'sadhu' as StyleType, icon: '📜', title: 'সাধু রীতি', desc: 'করিতেছি, করিয়াছি, তাহার' },
  { id: 'cholito' as StyleType, icon: '💬', title: 'চলিত রীতি', desc: 'করছি, করেছি, তার' }
];
