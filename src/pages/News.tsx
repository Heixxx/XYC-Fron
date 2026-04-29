import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Loader2 } from 'lucide-react';
import { useNews } from '@/hooks/useNews';
import type { EditionType } from '@/hooks/useNews';
import EditionTabs from '@/components/news/EditionTabs';
import ExecutiveSummary from '@/components/news/ExecutiveSummary';
import NewsStoryCard from '@/components/news/NewsStoryCard';
import DeepDiveAccordion from '@/components/news/DeepDiveAccordion';
import SentimentPanel from '@/components/news/SentimentPanel';
import BlackRockPanel from '@/components/news/BlackRockPanel';
import AudioPlayer from '@/components/news/AudioPlayer';
import KeyLevelsTable from '@/components/news/KeyLevelsTable';
import CountdownTimer from '@/components/news/CountdownTimer';
import { useTranslation } from 'react-i18next';

export default function News() {
  const { t } = useTranslation();
  const {
    edition,
    data,
    loading,
    error,
    selectEdition,
    isSpeaking,
    speechRate,
    playBriefing,
    setRate,
    refresh,
  } = useNews();

  const [showFullAudio, setShowFullAudio] = useState(false);

  const currentDate = useMemo(() => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, []);

  const deepDiveSections = useMemo(() => {
    if (!data) return [];
    return [
      { title: 'Macro Landscape', content: data.deepDive.macro },
      { title: 'Technical Levels', content: data.deepDive.technical },
      { title: 'Central Bank Watch', content: data.deepDive.centralBank },
      { title: 'Commodity Corner', content: data.deepDive.commodities },
    ];
  }, [data]);

  const nextEdition: EditionType = useMemo(() => {
    const hour = new Date().getUTCHours();
    if (hour < 8) return 'morning';
    if (hour < 12) return 'noon';
    if (hour < 18) return 'evening';
    return 'morning';
  }, []);

  const editionLabel = edition === 'morning' ? 'Morning' : edition === 'noon' ? 'Noon' : 'Evening';

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
      className="space-y-6"
    >
      {/* Page Header */}
      <div
        className="rounded-lg p-5 sm:p-6"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          backgroundImage: 'var(--grad-glow-radial)',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="text-2xl sm:text-[28px] font-bold"
              style={{
                color: 'var(--text-primary)',
                fontFamily: "'Inter', system-ui, sans-serif",
                letterSpacing: '-0.02em',
              }}
            >
              {t('news.pageTitle')}
            </motion.h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              {t('news.pageSubtitle')} &middot; {currentDate}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setShowFullAudio(!showFullAudio);
                playBriefing();
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                backgroundColor: 'var(--bg-input)',
                color: 'var(--accent-gold)',
                border: '1px solid var(--border-default)',
              }}
            >
              {isSpeaking ? <Pause size={14} /> : <Play size={14} />}
              <span className="hidden sm:inline">{isSpeaking ? 'Pause' : 'Listen'}</span>
            </button>
            <CountdownTimer nextEdition={nextEdition} />
          </div>
        </div>

        {/* Edition Tabs */}
        <div className="mt-4">
          <EditionTabs active={edition} onSelect={selectEdition} />
        </div>
      </div>

      {/* Audio Player Panel */}
      {showFullAudio && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <AudioPlayer
            isPlaying={isSpeaking}
            onToggle={playBriefing}
            rate={speechRate}
            onRateChange={setRate}
          />
        </motion.div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 className="animate-spin" size={28} style={{ color: 'var(--accent-gold)' }} />
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {t('news.generatingEdition')} {editionLabel} {t('news.editionBadge')}...
          </p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div
          className="rounded-lg p-6 text-center"
          style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--accent-red)' }}
        >
          <p className="text-sm mb-3" style={{ color: 'var(--accent-red)' }}>
            {error}
          </p>
          <button
            onClick={refresh}
            className="text-sm px-4 py-2 rounded-lg"
            style={{ backgroundColor: 'var(--accent-gold)', color: '#050508' }}
          >
            {t('common.retry')}
          </button>
        </div>
      )}

      {/* Content */}
      {!loading && !error && data && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
          {/* Main Content */}
          <div className="space-y-6">
            {/* Executive Summary */}
            <ExecutiveSummary
              summary={data.executiveSummary}
              sentimentScore={data.sentiment.score}
              sentimentLabel={data.sentiment.label}
            />

            {/* Edition badge */}
            <div className="flex items-center gap-2">
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wide"
                style={{ backgroundColor: 'rgba(240,185,11,0.12)', color: 'var(--accent-gold)' }}
              >
                {editionLabel} {t('news.editionBadge')}
              </span>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {t('news.generatedAt')} {new Date(data.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' })} UTC
              </span>
            </div>

            {/* Top Stories Grid */}
            <div>
              <h2
                className="text-lg font-semibold mb-3"
                style={{ color: 'var(--text-primary)' }}
              >
                {t('news.topStories')}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {data.articles.map((article, i) => (
                  <NewsStoryCard key={article.id} article={article} index={i} />
                ))}
              </div>
            </div>

            {/* Deep Dive Accordion */}
            <div>
              <h2
                className="text-lg font-semibold mb-3"
                style={{ color: 'var(--text-primary)' }}
              >
                {t('news.deepDiveTitle')}
              </h2>
              <DeepDiveAccordion sections={deepDiveSections} />
            </div>

            {/* Sentiment Panel - mobile only (shown in sidebar on desktop) */}
            <div className="lg:hidden">
              <SentimentPanel
                score={data.sentiment.score}
                label={data.sentiment.label}
                pairScores={data.sentiment.pairScores}
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Sentiment Panel - desktop */}
            <div className="hidden lg:block">
              <SentimentPanel
                score={data.sentiment.score}
                label={data.sentiment.label}
                pairScores={data.sentiment.pairScores}
              />
            </div>

            {/* BlackRock Panel */}
            <BlackRockPanel />

            {/* Key Levels Table */}
            <KeyLevelsTable levels={data.keyLevels} />
          </div>
        </div>
      )}
    </motion.div>
  );
}
