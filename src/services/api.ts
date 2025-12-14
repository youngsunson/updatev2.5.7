// src/services/api.ts
import { parseAIResponse, extractTextFromGeminiResponse } from '@/utils/jsonFixer';

interface CallGeminiOptions {
  temperature?: number;
  retries?: number; // নতুন অপশন: কতবার রি-ট্রাই করবে
}

/**
 * Utility: Wait function for exponential backoff
 */
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Call Gemini API with JSON response mode & Retry Logic
 * Robust implementation for Production use.
 */
export const callGeminiJson = async (
  prompt: string,
  apiKey: string,
  selectedModel: string,
  options: CallGeminiOptions = {}
): Promise<any | null> => {
  // Default values: Temperature 0.3 (balanced), Retries 1 (try once more if fails)
  const { temperature = 0.3, retries = 1 } = options;
  
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`;

  let attempt = 0;
  let lastError: Error | null = null;
  
  // Retry Loop
  while (attempt <= retries) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json', // Force JSON mode
            temperature: temperature
          }
        })
      });

      if (!response.ok) {
        const status = response.status;
        
        // Client Errors (400-409): Do not retry (Wrong Key, Bad Request)
        if (status >= 400 && status < 500 && status !== 429) {
          const bodyText = await response.text().catch(() => '');
          if (status === 401 || status === 403) {
            throw new Error('API Key বা অনুমতি (permission) সংক্রান্ত সমস্যা হয়েছে। সেটিংস চেক করুন।');
          }
          throw new Error(`Client Error (${status}): ${bodyText}`);
        }

        // Server Errors (5xx) or Rate Limit (429): Throw to trigger retry
        throw new Error(`Server Error or Rate Limit (Status: ${status})`);
      }

      const data = await response.json();
      
      // Extract clean text from Gemini's nested response
      const raw = extractTextFromGeminiResponse(data);
      
      if (!raw) return null; // Empty response

      // Parse the JSON string
      const parsed = parseAIResponse(raw);
      
      // Basic validation: Check if it looks like our schema
      if (parsed && (
          parsed._analysis || 
          parsed.spellingErrors || 
          parsed.toneConversions || 
          parsed.styleConversions
        )) {
        return parsed;
      } else {
        // If JSON is valid but structure is wrong, treat as an error to retry (maybe hallucination)
        throw new Error("Invalid JSON structure received from AI");
      }

    } catch (err: any) {
      lastError = err;
      attempt++;
      
      // If it's a critical client error, stop immediately
      if (err.message.includes('API Key') || err.message.includes('Client Error')) {
        break;
      }

      console.warn(`Gemini API Attempt ${attempt} failed:`, err.message);
      
      if (attempt <= retries) {
        // Exponential backoff: Wait 1s, then 2s, then 4s...
        const delay = 1000 * Math.pow(2, attempt - 1);
        await wait(delay);
      }
    }
  }

  // If all attempts fail
  console.error('Final API Failure:', lastError);
  throw lastError || new Error('অজানা কারণে সার্ভারের সাথে সংযোগ স্থাপন করা যাচ্ছে না।');
};
