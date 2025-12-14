// src/services/api.ts
import { parseAIResponse, extractTextFromGeminiResponse } from '@/utils/jsonFixer';

interface CallGeminiOptions {
  temperature?: number;
  retries?: number;
}

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const callGeminiJson = async (
  prompt: string,
  apiKey: string,
  selectedModel: string,
  options: CallGeminiOptions = {}
): Promise<any | null> => {
  const { temperature = 0.3, retries = 1 } = options;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`;

  let attempt = 0;
  let lastError: Error | null = null;
  
  while (attempt <= retries) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: temperature
          }
        })
      });

      if (!response.ok) {
        const status = response.status;
        if (status >= 400 && status < 500 && status !== 429) {
          const bodyText = await response.text().catch(() => '');
          if (status === 401 || status === 403) throw new Error('API Key বা পারমিশন সমস্যা।');
          throw new Error(`Client Error (${status}): ${bodyText}`);
        }
        throw new Error(`Server Error (${status})`);
      }

      const data = await response.json();
      const raw = extractTextFromGeminiResponse(data);
      
      if (!raw) return null;

      const parsed = parseAIResponse(raw);
      
      // FIXED: Added 'parsed.contentType' to validation logic
      if (parsed && (
          parsed._analysis || 
          parsed.spellingErrors || 
          parsed.toneConversions || 
          parsed.styleConversions ||
          parsed.contentType // <-- This allows Content Analysis to pass
        )) {
        return parsed;
      } else {
        throw new Error("Invalid JSON structure received from AI");
      }

    } catch (err: any) {
      lastError = err;
      attempt++;
      
      if (err.message.includes('API Key') || err.message.includes('Client Error')) break;
      console.warn(`Gemini API Attempt ${attempt} failed:`, err.message);
      
      if (attempt <= retries) {
        await wait(1000 * Math.pow(2, attempt - 1));
      }
    }
  }

  console.error('Final API Failure:', lastError);
  throw lastError || new Error('সার্ভার রেসপন্স করেনি।');
};
