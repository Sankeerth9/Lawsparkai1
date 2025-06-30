import React, { useState, useEffect } from 'react';
import { Globe, Check } from 'lucide-react';

interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  flag?: string;
}

interface LanguageSelectorProps {
  onChange: (languageCode: string) => void;
  currentLanguage: string;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ onChange, currentLanguage }) => {
  const [isOpen, setIsOpen] = useState(false);

  const languages: LanguageOption[] = [
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
    { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳' },
    { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳' }
  ];

  const selectedLanguage = languages.find(lang => lang.code === currentLanguage) || languages[0];

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = () => {
      setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isOpen]);

  const handleLanguageClick = (e: React.MouseEvent, code: string) => {
    e.stopPropagation();
    onChange(code);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
        className="flex items-center space-x-2 px-3 py-2 bg-primary-light border border-accent-blue/30 rounded-lg hover:bg-primary transition-colors text-text-primary"
      >
        <Globe className="h-4 w-4 text-accent-cyan" />
        <span className="flex items-center">
          {selectedLanguage.flag && <span className="mr-2">{selectedLanguage.flag}</span>}
          <span className="hidden sm:inline">{selectedLanguage.nativeName}</span>
        </span>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-48 rounded-md shadow-lg bg-primary-dark border border-accent-blue/30">
          <div className="py-1" role="menu" aria-orientation="vertical">
            {languages.map((language) => (
              <button
                key={language.code}
                onClick={(e) => handleLanguageClick(e, language.code)}
                className={`w-full text-left px-4 py-2 flex items-center justify-between ${
                  currentLanguage === language.code 
                    ? 'bg-primary-light text-accent-cyan' 
                    : 'text-text-secondary hover:bg-primary hover:text-text-primary'
                }`}
                role="menuitem"
              >
                <span className="flex items-center">
                  {language.flag && <span className="mr-2">{language.flag}</span>}
                  <span>{language.nativeName}</span>
                </span>
                {currentLanguage === language.code && (
                  <Check className="h-4 w-4" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;