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
  'sadhu': `Target: **Sadhu Bhasha** (High Literary). Convert all verbs and pronouns to their classical full forms.`,
  'cholito': `Target: **Cholito Bhasha** (Standard Colloquial). Convert all verbs and pronouns to their modern short forms.`
};

export const buildStylePrompt = (text: string, style: string): string => {
  return `
ROLE: Expert Bengali Grammarian.
TASK: Convert the text strictly to **${style === 'sadhu' ? 'SADHU' : 'CHOLITO'}** bhasha.

${STYLE_EXAMPLES}

${styleInstructions[style]}

INPUT TEXT:
"""${text}"""

OUTPUT JSON:
{
  "styleConversions": [
    {
      "current": "exact_word_match",
      "suggestion": "converted_word",
      "type": "Verb/Pronoun",
      "position": 0
    }
  ]
}
`;
};

export type StyleType = 'none' | 'sadhu' | 'cholito';

export const STYLE_OPTIONS = [
  { id: 'none' as StyleType, icon: '❌', title: 'কোনটি নয়', desc: 'মিশ্রণ সনাক্তকরণ' },
  { id: 'sadhu' as StyleType, icon: '📜', title: 'সাধু রীতি', desc: 'করিতেছি, করিয়াছি, তাহার' },
  { id: 'cholito' as StyleType, icon: '💬', title: 'চলিত রীতি', desc: 'করছি, করেছি, তার' }
];
