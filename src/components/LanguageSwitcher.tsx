import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'pl', label: 'Polski', flag: '🇵🇱' },
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const currentLang = i18n.language?.split('-')[0] || 'en';

  const toggleLanguage = () => {
    const next = currentLang === 'pl' ? 'en' : 'pl';
    i18n.changeLanguage(next);
  };

  const current = LANGUAGES.find((l) => l.code === currentLang) || LANGUAGES[0];

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-200 hover:opacity-80"
      style={{
        borderColor: 'rgba(255,255,255,0.1)',
        backgroundColor: 'rgba(255,255,255,0.05)',
      }}
      title={`${current.label} — ${currentLang === 'pl' ? 'Switch to English' : 'Przełącz na Polski'}`}
    >
      <Globe size={14} style={{ color: 'var(--accent-cyan)' }} />
      <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
        {current.code.toUpperCase()}
      </span>
    </button>
  );
}
