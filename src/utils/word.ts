// src/utils/word.ts

/**
 * Word ডকুমেন্ট থেকে টেক্সট পড়ার ফাংশন
 */
export const getTextFromWord = async (): Promise<string> => {
  try {
    return await Word.run(async (context) => {
      const selection = context.document.getSelection();
      selection.load('text');
      await context.sync();

      if (selection.text && selection.text.trim().length > 0) {
        // Normalize line breaks
        return selection.text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
      }

      // If no selection, get whole body
      const body = context.document.body;
      body.load('text');
      await context.sync();
      
      return body.text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    });
  } catch (error) {
    console.error('Error reading Word:', error);
    return '';
  }
};

/**
 * একাধিক শব্দ একসাথে হাইলাইট করা (Batch Highlighting)
 * Optimized for performance
 */
export const highlightMultipleInWord = async (
  items: Array<{ text: string; color: string; position?: number }>
): Promise<void> => {
  if (!items || items.length === 0) return;

  // Deduplicate items to prevent double highlighting of the same word
  const uniqueItems = Array.from(new Set(items.map(i => JSON.stringify(i)))).map(s => JSON.parse(s));

  try {
    await Word.run(async (context) => {
      const body = context.document.body;
      
      // Process in chunks to avoid blocking the UI thread if many errors
      const chunkSize = 20; 
      for (let i = 0; i < uniqueItems.length; i += chunkSize) {
        const chunk = uniqueItems.slice(i, i + chunkSize);
        
        for (const item of chunk) {
          const cleanText = item.text.trim();
          if (!cleanText) continue;

          // Search with options
          const results = body.search(cleanText, {
            matchCase: false,
            matchWholeWord: !/[\s\.,।?!]/.test(cleanText) // If it contains spaces/punct, don't enforce whole word
          });
          results.load('items');
          
          await context.sync(); 
          
          // Highlight all occurrences (Ideally we should use position, but Word API limitation makes it hard)
          // For now, this highlights ALL matching words. 
          for (let j = 0; j < results.items.length; j++) {
             // In "Pro Max" logic, we could check context here, but keeping it simple for stability
             results.items[j].font.highlightColor = item.color;
          }
        }
      }
      
      await context.sync();
    });
  } catch (error) {
    console.error('Batch highlight error:', error);
  }
};

/**
 * একটি শব্দ হাইলাইট করা (Single Highlight)
 */
export const highlightInWord = async (
  text: string,
  color: string,
  _position?: number
): Promise<void> => {
  const cleanText = text.trim();
  if (!cleanText) return;

  try {
    await Word.run(async (context) => {
      const body = context.document.body;
      const results = body.search(cleanText, {
        matchCase: false,
        matchWholeWord: !/[\s\.,।?!]/.test(cleanText)
      });
      results.load('items');
      await context.sync();

      // Highlight all occurrences
      for (let i = 0; i < results.items.length; i++) {
        results.items[i].font.highlightColor = color;
      }
      await context.sync();
    });
  } catch (error) {
    console.error('Highlight error:', error);
  }
};

/**
 * Word ডকুমেন্টে টেক্সট প্রতিস্থাপন (Replace)
 */
export const replaceInWord = async (
  oldText: string,
  newText: string,
  _position?: number
): Promise<boolean> => {
  const cleanOldText = oldText.trim();
  if (!cleanOldText) return false;

  try {
    return await Word.run(async (context) => {
      const body = context.document.body;
      const results = body.search(cleanOldText, {
        matchCase: false,
        matchWholeWord: !/[\s\.,।?!]/.test(cleanOldText)
      });
      results.load('items');
      await context.sync();

      if (results.items.length > 0) {
        // Replace the FIRST occurrence found.
        // In a perfect world, we would match context/position.
        results.items[0].insertText(newText, Word.InsertLocation.replace);
        
        // Remove highlight after replacement
        results.items[0].font.highlightColor = '#FFFFFF'; 
        
        await context.sync();
        return true;
      }
      return false;
    });
  } catch (error) {
    console.error('Replace error:', error);
    return false;
  }
};

/**
 * সব হাইলাইট মুছে ফেলা (Clear All)
 */
export const clearHighlights = async (): Promise<void> => {
  try {
    await Word.run(async (context) => {
      // It's safer to clear body range than selection
      context.document.body.font.highlightColor = null; // null sets it to 'No Color'
      await context.sync();
    });
  } catch (error) {
    console.error('Clear highlights error:', error);
  }
};
