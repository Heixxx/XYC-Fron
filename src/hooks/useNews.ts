import { useState, useEffect, useCallback, useRef } from 'react';
import { generateNewsEdition, speakBriefing, stopSpeaking } from '@/lib/api';
import type { EditionData } from '@/lib/api';

export type EditionType = 'morning' | 'noon' | 'evening';

export interface NewsState {
  edition: EditionType;
  data: EditionData | null;
  loading: boolean;
  error: string | null;
  editions: Record<EditionType, EditionData | null>;
}

export function useNews() {
  const [state, setState] = useState<NewsState>({
    edition: getCurrentEdition(),
    data: null,
    loading: true,
    error: null,
    editions: { morning: null, noon: null, evening: null },
  });

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechRate, setSpeechRate] = useState(1);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const getEditionData = useCallback(async (ed: EditionType) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await generateNewsEdition(ed);
      setState((s) => ({
        ...s,
        data,
        loading: false,
        editions: { ...s.editions, [ed]: data },
      }));
      return data;
    } catch (err) {
      setState((s) => ({
        ...s,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to load news',
      }));
      return null;
    }
  }, []);

  // Load current edition on mount
  useEffect(() => {
    getEditionData(state.edition);
  }, []);

  const selectEdition = useCallback(
    (ed: EditionType) => {
      setState((s) => ({
        ...s,
        edition: ed,
        data: s.editions[ed],
        loading: s.editions[ed] === null,
        error: null,
      }));
      if (!state.editions[ed]) {
        getEditionData(ed);
      }
    },
    [getEditionData, state.editions]
  );

  const playBriefing = useCallback(() => {
    if (!state.data) return;
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
      return;
    }
    const text = `${state.data.executiveSummary} ${state.data.articles.map((a) => a.headline + ". " + a.summary).join(" ")}`;
    const utt = speakBriefing(text, speechRate);
    if (utt) {
      utteranceRef.current = utt;
      utt.onend = () => setIsSpeaking(false);
      setIsSpeaking(true);
    }
  }, [state.data, isSpeaking, speechRate]);

  const stopBriefing = useCallback(() => {
    stopSpeaking();
    setIsSpeaking(false);
  }, []);

  const setRate = useCallback((r: number) => {
    setSpeechRate(r);
  }, []);

  return {
    ...state,
    isSpeaking,
    speechRate,
    selectEdition,
    playBriefing,
    stopBriefing,
    setRate,
    refresh: () => getEditionData(state.edition),
  };
}

export function getCurrentEdition(): EditionType {
  const hour = new Date().getUTCHours();
  if (hour >= 18) return 'evening';
  if (hour >= 12) return 'noon';
  return 'morning';
}

export function getEditionTime(ed: EditionType): string {
  if (ed === 'morning') return '08:00';
  if (ed === 'noon') return '15:00';
  return '20:00';
}

export function getEditionUnlockHour(ed: EditionType): number {
  if (ed === 'morning') return 8;
  if (ed === 'noon') return 12;
  return 18;
}

export function isEditionUnlocked(ed: EditionType): boolean {
  const currentHour = new Date().getUTCHours();
  return currentHour >= getEditionUnlockHour(ed);
}

export function getTimeUntilEdition(ed: EditionType): number {
  const now = new Date();
  const unlockHour = getEditionUnlockHour(ed);
  let target = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), unlockHour, 0, 0));
  if (now.getUTCHours() >= unlockHour) {
    target = new Date(target.getTime() + 24 * 60 * 60 * 1000);
  }
  return target.getTime() - now.getTime();
}
