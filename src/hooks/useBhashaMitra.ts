// src/hooks/useBhashaMitra.ts
import { useState, useCallback, useRef } from 'react';
import { normalize } from '@/utils/normalize';
import {
  getTextFromWord,
  highlightMultipleInWord,
  highlightInWord,
  replaceInWord,
  clearHighlights
} from '@/utils/word';
import { callGeminiJson } from '@/services/api';
import { buildTonePrompt, getToneName, TONE_OPTIONS } from '@/prompts/tone';
import { buildStylePrompt, STYLE_OPTIONS } from '@/prompts/style';
import {
  buildMainPrompt,
  DOC_TYPE_CONFIG, // Import the config object
  getDocTypeLabel,
  DocType // Import the type - now it should be correctly exported from core.ts
} from '@/prompts/core'; // Assuming these are in the same file
import type {
  Correction,
  ToneSuggestion,
  StyleSuggestion,
  StyleMixing,
  PunctuationIssue,
  EuphonyImprovement,
  ContentAnalysis,
  SectionKey,
  ViewFilter,
  ModalType,
  Stats,
  Message
} from '@/types';

export const useBhashaMitra = () => {
  // Settings State
  const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || '');
  const [selectedModel, setSelectedModel] = useState(
    localStorage.getItem('gemini_model') || 'gemini-2.5-flash'
  );
  const [docType, setDocType] = useState<DocType>(
    (localStorage.getItem('doc_type') as DocType) || 'generic'
  );

  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [message, setMessage] = useState<Message | null>(null);
  const [activeModal, setActiveModal] = useState<ModalType>('none');
  const [viewFilter, setViewFilter] = useState<ViewFilter>('all');
  const [collapsedSections, setCollapsedSections] = useState<Record<SectionKey, boolean>>({
    spelling: false,
    tone: false,
    style: false,
    mixing: false,
    punctuation: false,
    euphony: false,
    content: false
  });

  // Selection State
  const [selectedTone, setSelectedTone] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<'none' | 'sadhu' | 'cholito'>('none');

  // Data State
  const [corrections, setCorrections] = useState<Correction[]>([]);
  const [toneSuggestions, setToneSuggestions] = useState<ToneSuggestion[]>([]);
  const [styleSuggestions, setStyleSuggestions] = useState<StyleSuggestion[]>([]);
  const [languageStyleMixing, setLanguageStyleMixing] = useState<StyleMixing | null>(null);
  const [punctuationIssues, setPunctuationIssues] = useState<PunctuationIssue[]>([]);
  const [euphonyImprovements, setEuphonyImprovements] = useState<EuphonyImprovement[]>([]);
  const [contentAnalysis, setContentAnalysis] = useState<ContentAnalysis | null>(null);
  const [stats, setStats] = useState<Stats>({ totalWords: 0, errorCount: 0, accuracy: 100 });

  const highlightTimeoutRef = useRef<any>(null);

  const showMessage = useCallback((text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  }, []);

  const saveSettings = useCallback(() => {
    localStorage.setItem('gemini_api_key', apiKey);
    localStorage.setItem('gemini_model', selectedModel);
    localStorage.setItem('doc_type', docType);
    showMessage('সেটিংস সংরক্ষিত হয়েছে! ✓', 'success');
    setActiveModal('none');
  }, [apiKey, selectedModel, docType, showMessage]);

  const toggleSection = useCallback((key: SectionKey) => {
    setCollapsedSections(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const handleHighlight = useCallback((text: string, color: string, position?: number) => {
    if (highlightTimeoutRef.current) {
      clearTimeout(highlightTimeoutRef.current);
    }
    highlightTimeoutRef.current = setTimeout(() => {
      highlightInWord(text, color, position);
    }, 300);
  }, []);

  const handleReplace = useCallback(async (oldText: string, newText: string, position?: number) => {
    const success = await replaceInWord(oldText, newText, position);
    if (success) {
      const target = normalize(oldText.trim());
      const isNotMatch = (textToCheck: string) => normalize(textToCheck) !== target;

      setCorrections(prev => prev.filter(c => isNotMatch(c.wrong)));
      setToneSuggestions(prev => prev.filter(t => isNotMatch(t.current)));
      setStyleSuggestions(prev => prev.filter(s => isNotMatch(s.current)));
      setEuphonyImprovements(prev => prev.filter(e => isNotMatch(e.current)));
      setPunctuationIssues(prev => prev.filter(p => isNotMatch(p.currentSentence)));

      setLanguageStyleMixing(prev => {
        if (!prev || !prev.corrections) return prev;
        const filtered = prev.corrections.filter(c => isNotMatch(c.current));
        return filtered.length > 0 ? { ...prev, corrections: filtered } : null;
      });

      showMessage(`সংশোধিত হয়েছে ✓`, 'success');
    } else {
      showMessage(`শব্দটি ডকুমেন্টে খুঁজে পাওয়া যায়নি।`, 'error');
    }
  }, [showMessage]);

  const dismissSuggestion = useCallback((
    type: 'spelling' | 'tone' | 'style' | 'mixing' | 'punct' | 'euphony',
    textToDismiss: string
  ) => {
    const target = normalize(textToDismiss);
    const isNotMatch = (t: string) => normalize(t) !== target;
    switch (type) {
      case 'spelling': setCorrections(prev => prev.filter(c => isNotMatch(c.wrong))); break;
      case 'tone': setToneSuggestions(prev => prev.filter(t => isNotMatch(t.current))); break;
      case 'style': setStyleSuggestions(prev => prev.filter(s => isNotMatch(s.current))); break;
      case 'mixing':
        setLanguageStyleMixing(prev => {
          if (!prev || !prev.corrections) return prev;
          const filtered = prev.corrections.filter(c => isNotMatch(c.current));
          return filtered.length > 0 ? { ...prev, corrections: filtered } : null;
        });
        break;
      case 'punct': setPunctuationIssues(prev => prev.filter(p => isNotMatch(p.currentSentence))); break;
      case 'euphony': setEuphonyImprovements(prev => prev.filter(e => isNotMatch(e.current))); break;
    }
  }, []);

  // --- API Helpers (same as before) ---
  const performMainCheck = async (text: string) => {
    const prompt = buildMainPrompt(text, docType);
    const result = await callGeminiJson(prompt, apiKey, selectedModel, { temperature: 0.1 });
    if (!result) return null;

    const spelling = (result.spellingErrors || []).map((e: any) => ({ ...e, position: e.position ?? 0 }));
    setCorrections(spelling);
    setPunctuationIssues((result.punctuationIssues || []).map((p: any) => ({ ...p, position: p.position ?? 0 })));
    setEuphonyImprovements((result.euphonyImprovements || []).map((e: any) => ({ ...e, position: e.position ?? 0 })));
    
    let mixing = result.languageStyleMixing || null;
    if (mixing && mixing.corrections) {
      mixing.corrections = mixing.corrections.map((c: any) => ({ ...c, position: c.position ?? 0 }));
    }
    setLanguageStyleMixing(mixing);

    const words = text.trim().split(/\s+/).filter(Boolean).length;
    const errorCount = spelling.length;
    setStats({
      totalWords: words,
      errorCount,
      accuracy: words > 0 ? Math.round(((words - errorCount) / words) * 100) : 100
    });
    return spelling;
  };

  const performToneCheck = async (text: string) => {
    if (!selectedTone) return [];
    const prompt = buildTonePrompt(text, selectedTone);
    const result = await callGeminiJson(prompt, apiKey, selectedModel, { temperature: 0.2 });
    if (!result) return [];
    const tones = (result.toneConversions || []).map((t: any) => ({ ...t, position: t.position ?? 0 }));
    setToneSuggestions(tones);
    return tones;
  };

  const performStyleCheck = async (text: string) => {
    if (selectedStyle === 'none') return [];
    const prompt = buildStylePrompt(text, selectedStyle);
    const result = await callGeminiJson(prompt, apiKey, selectedModel, { temperature: 0.2 });
    if (!result) return [];
    const styles = (result.styleConversions || []).map((s: any) => ({ ...s, position: s.position ?? 0 }));
    setStyleSuggestions(styles);
    return styles;
  };

  const analyzeContentLogic = async (text: string) => {
    const cfg = DOC_TYPE_CONFIG[docType]; // Fixed: This should work now as docType is a state variable of type DocType and DocTypeConfig has the required properties
    const prompt = `
Role: ${cfg.roleInstruction}
Task: Analyze the content structure briefly.

INPUT: """${text}"""

OUTPUT JSON:
{
  "contentType": "Type in Bangla (1-2 words)",
  "description": "Short description in Bangla",
  "missingElements": ["Missing element 1 in Bangla", "Missing element 2 in Bangla"],
  "suggestions": ["Suggestion 1 in Bangla"]
}
`;
    const result = await callGeminiJson(prompt, apiKey, selectedModel, { temperature: 0.4 });
    if (result) setContentAnalysis(result);
  };

  const checkSpelling = useCallback(async () => {
    if (!apiKey) {
      showMessage('অনুগ্রহ করে প্রথমে API Key দিন', 'error');
      setActiveModal('settings');
      return;
    }

    const text = await getTextFromWord();
    if (!text || text.trim().length === 0) {
      showMessage('টেক্সট নির্বাচন করুন বা কার্সার রাখুন', 'error');
      return;
    }

    setIsLoading(true);
    setLoadingText('বিশ্লেষণ করা হচ্ছে...');

    setCorrections([]);
    setToneSuggestions([]);
    setStyleSuggestions([]);
    setLanguageStyleMixing(null);
    setPunctuationIssues([]);
    setEuphonyImprovements([]);
    setContentAnalysis(null);
    setStats({ totalWords: 0, errorCount: 0, accuracy: 100 });
    await clearHighlights();

    try {
      const tasks = Promise.all([
        performMainCheck(text),
        new Promise(resolve => setTimeout(resolve, 200)).then(() => performToneCheck(text)),
        new Promise(resolve => setTimeout(resolve, 400)).then(() => performStyleCheck(text)),
        new Promise(resolve => setTimeout(resolve, 600)).then(() => analyzeContentLogic(text))
      ]);

      const [spellingResult, toneResult, styleResult] = await tasks;

      setLoadingText('হাইলাইট করা হচ্ছে...');
      const highlightItems: Array<{ text: string; color: string; position?: number }> = [];
      
      // Fixed: Added type annotation to 'i' in map functions
      (spellingResult || []).forEach((i: Correction) => highlightItems.push({ text: i.wrong, color: '#fee2e2', position: i.position }));
      (toneResult || []).forEach((i: ToneSuggestion) => highlightItems.push({ text: i.current, color: '#fef3c7', position: i.position }));
      (styleResult || []).forEach((i: StyleSuggestion) => highlightItems.push({ text: i.current, color: '#ccfbf1', position: i.position }));

      if (highlightItems.length > 0) {
        await highlightMultipleInWord(highlightItems);
      }
    } catch (error: any) {
      console.error(error);
      showMessage(error?.message || 'ত্রুটি হয়েছে।', 'error');
    } finally {
      setIsLoading(false);
      setLoadingText('');
    }
  }, [apiKey, selectedModel, docType, selectedTone, selectedStyle, showMessage]);

  const shouldShowSection = (key: SectionKey) => {
    if (viewFilter === 'all') return true;
    if (viewFilter === 'spelling') return key === 'spelling';
    if (viewFilter === 'punctuation') return key === 'punctuation';
    return true;
  };

  return {
    // State
    apiKey,
    setApiKey, // Fixed: Add setter
    selectedModel,
    setSelectedModel, // Fixed: Add setter
    docType,
    setDocType, // Fixed: Add setter
    isLoading,
    loadingText,
    message,
    activeModal,
    setActiveModal,
    viewFilter,
    setViewFilter,
    collapsedSections,
    selectedTone,
    setSelectedTone, // Fixed: Add setter
    selectedStyle,
    setSelectedStyle, // Fixed: Add setter
    corrections,
    toneSuggestions,
    styleSuggestions,
    languageStyleMixing,
    punctuationIssues,
    euphonyImprovements,
    contentAnalysis,
    stats,

    // Actions
    saveSettings,
    toggleSection,
    handleHighlight,
    handleReplace,
    dismissSuggestion,
    checkSpelling,
    shouldShowSection,

    // Helpers
    getToneName,
    getDocTypeLabel,
    TONE_OPTIONS,
    STYLE_OPTIONS,
    DOC_TYPE_CONFIG // Fixed: Add DOC_TYPE_CONFIG
  };
};
