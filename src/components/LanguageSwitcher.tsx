import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const [isTransitioning, setIsTransitioning] = useState(false);

  const changeLanguage = (lng: string) => {
    if (lng === i18n.language) return;

    setIsTransitioning(true);

    // Fade out
    setTimeout(() => {
      i18n.changeLanguage(lng);
      localStorage.setItem('longsang-language', lng);

      // Fade in
      setTimeout(() => {
        setIsTransitioning(false);
      }, 200);
    }, 200);
  };

  return (
    <div
      className={`flex items-center gap-2 text-sm font-medium transition-opacity duration-200 ${
        isTransitioning ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <button
        onClick={() => changeLanguage('vi')}
        className={`px-2 py-1 rounded transition-all duration-200 cursor-pointer ${
          i18n.language === 'vi'
            ? 'text-primary font-semibold bg-primary/10'
            : 'text-muted-foreground opacity-70 hover:opacity-100 hover:bg-muted/50'
        }`}
        type="button"
      >
        🇻🇳 VI
      </button>
      <span className="text-muted-foreground">|</span>
      <button
        onClick={() => changeLanguage('en')}
        className={`px-2 py-1 rounded transition-all duration-200 cursor-pointer ${
          i18n.language === 'en'
            ? 'text-primary font-semibold bg-primary/10'
            : 'text-muted-foreground opacity-70 hover:opacity-100 hover:bg-muted/50'
        }`}
        type="button"
      >
        🇺🇸 EN
      </button>
    </div>
  );
};
