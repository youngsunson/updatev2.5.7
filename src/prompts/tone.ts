// src/prompts/tone.ts

/**
 * FEW-SHOT EXAMPLES (To guide the AI)
 */
const TONE_EXAMPLES = `
Examples of Tone Conversion:

1. **Formal (Official)**:
   - Input: "কাজটা করে দিস।" -> Output: "দয়া করে কাজটি সম্পন্ন করুন।"
   - Input: "তোর নাম কি?" -> Output: "আপনার নাম কি জানতে পারি?"

2. **Professional**:
   - Input: "আমি এটা পারবো না মনে হয়।" -> Output: "বিষয়টি আমার জন্য চ্যালেঞ্জিং হতে পারে।"
   - Input: "তাড়াতাড়ি পাঠান।" -> Output: "দ্রুত প্রেরণ করার অনুরোধ রইল।"

3. **Friendly/Informal**:
   - Input: "আপনি কি ভোজন সম্পন্ন করিয়াছেন?" -> Output: "দুপুরের খাওয়া হয়েছে?"
   - Input: "ধন্যবাদ জ্ঞাপন করছি।" -> Output: "থ্যাংকস!"
`;

const toneInstructions: Record<string, string> = {
  'formal': `Target: **Formal (Official)**. Use 'Apni'. Avoid slang. Be polite and distant. Use honorifics like 'Mahashoy'.`,
  'informal': `Target: **Informal (Casual)**. Use 'Tumi' or 'Tui'. Be conversational like speaking to a friend. Use contractions where natural.`,
  'professional': `Target: **Professional**. Clear, concise, business-like. Avoid emotions. Focus on efficiency and clarity.`,
  'friendly': `Target: **Friendly**. Warm, welcoming, enthusiastic. Use positive words.`,
  'respectful': `Target: **Respectful**. High honorifics (Apni/Tini). Humble self-reference. Suitable for elders.`,
  'persuasive': `Target: **Persuasive**. Action-oriented verbs. Highlight benefits. Create urgency.`,
  'neutral': `Target: **Neutral**. Objective, journalistic style. No bias. Just facts.`,
  'academic': `Target: **Academic**. Scholarly vocabulary. Complex sentence structures. Third-person perspective.`
};

/**
 * Tone Prompt Builder
 */
export const buildTonePrompt = (text: string, tone: string): string => {
  return `
ROLE: You are an expert Bengali Stylistic Editor.
TASK: Rewrite specific parts of the text to match the **${tone.toUpperCase()}** tone.

${TONE_EXAMPLES}

CURRENT TARGET TONE: ${toneInstructions[tone]}

INPUT TEXT:
"""${text}"""

STRICT RULES:
1. **Preserve Meaning:** Do not change the core message, only the delivery style.
2. **Minimalism:** Only change words that clearly violate the ${tone} tone.
3. **No Hallucinations:** If a sentence is already in the correct tone, DO NOT suggest changes.
4. **Positioning:** "position" must be the 0-based word index.

OUTPUT JSON (No Markdown):
{
  "toneConversions": [
    {
      "current": "exact_original_substring",
      "suggestion": "improved_version",
      "reason": "Why this change fits '${tone}' tone",
      "position": 0,
      "confidenceScore": 0.9
    }
  ]
}

If no changes are needed, return: { "toneConversions": [] }
`;
};

/**
 * UI তে দেখানোর জন্য বাংলা নাম
 */
export const getToneName = (tone: string): string => {
  const map: Record<string, string> = {
    'formal': '📋 আনুষ্ঠানিক',
    'informal': '💬 অনানুষ্ঠানিক',
    'professional': '💼 পেশাদার',
    'friendly': '😊 বন্ধুত্বপূর্ণ',
    'respectful': '🙏 সম্মানজনক',
    'persuasive': '💪 প্রভাবশালী',
    'neutral': '⚖️ নিরপেক্ষ',
    'academic': '📚 শিক্ষামূলক'
  };
  return map[tone] || tone;
};

/**
 * UI Options List
 */
export const TONE_OPTIONS = [
  { id: '', icon: '❌', title: 'কোনটি নয়', desc: 'স্বাভাবিক বিশ্লেষণ' },
  { id: 'formal', icon: '📋', title: 'আনুষ্ঠানিক (Formal)', desc: 'দাপ্তরিক চিঠি, আবেদন' },
  { id: 'informal', icon: '💬', title: 'অনানুষ্ঠানিক (Informal)', desc: 'বন্ধু-বান্ধব, সোশ্যাল মিডিয়া' },
  { id: 'professional', icon: '💼', title: 'পেশাদার (Professional)', desc: 'অফিস, বিজনেস' },
  { id: 'friendly', icon: '😊', title: 'বন্ধুত্বপূর্ণ (Friendly)', desc: 'উষ্ণ সম্পর্ক' },
  { id: 'respectful', icon: '🙏', title: 'সম্মানজনক (Respectful)', desc: 'গুরুজনদের জন্য' },
  { id: 'persuasive', icon: '💪', title: 'প্রভাবশালী (Persuasive)', desc: 'মার্কেটিং' },
  { id: 'neutral', icon: '⚖️', title: 'নিরপেক্ষ (Neutral)', desc: 'রিপোর্ট' },
  { id: 'academic', icon: '📚', title: 'শিক্ষামূলক (Academic)', desc: 'গবেষণা' }
];
