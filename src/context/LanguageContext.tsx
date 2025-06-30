import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

// Define available languages
export type LanguageCode = 'en' | 'hi' | 'te' | 'ta';

// Define translations interface
interface Translations {
  [key: string]: {
    [key: string]: string;
  };
}

// Language context interface
interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (code: LanguageCode) => void;
  t: (key: string) => string;
  isRtl: boolean;
}

// Create context with default values
const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key: string) => key,
  isRtl: false,
});

// Translations data
const translations: Translations = {
  // English translations
  en: {
    // Common
    'app.name': 'LawSpark AI',
    'app.tagline': 'Legal Technology Made Simple',
    'app.description': 'Democratize legal knowledge with AI-powered assistance and intelligent contract validation.',
    
    // Navigation
    'nav.home': 'Home',
    'nav.chatbot': 'Legal Literacy Chatbot',
    'nav.validator': 'Contract Validator',
    'nav.documents': 'My Documents',
    'nav.about': 'About',
    'nav.contact': 'Contact',
    
    // Auth
    'auth.signin': 'Sign In',
    'auth.signup': 'Sign Up',
    'auth.signout': 'Sign Out',
    'auth.email': 'Email Address',
    'auth.password': 'Password',
    'auth.forgot': 'Forgot Password?',
    
    // Home page
    'home.hero.title': 'Legal Technology',
    'home.hero.subtitle': 'Made Simple',
    'home.hero.description': 'Democratize legal knowledge with AI-powered assistance and intelligent contract validation. Get professional legal insights instantly, without the complexity or cost.',
    'home.hero.cta.chatbot': 'Use Legal Chatbot',
    'home.hero.cta.contract': 'Check My Contract',
    'home.trusted': 'Trusted by 50,000+ Users Worldwide',
    
    // Features
    'features.title': 'Powerful Legal Tools at Your Fingertips',
    'features.description': 'Choose from our comprehensive suite of AI-powered legal technology solutions designed for everyone',
    'features.chatbot.title': 'AI Legal Assistant',
    'features.chatbot.description': 'Get instant answers to legal questions with our advanced AI chatbot trained on comprehensive legal databases and case studies.',
    'features.contract.title': 'Check My Contract',
    'features.contract.description': 'Upload and analyze contracts for potential issues, missing clauses, legal compliance, and improvement recommendations.',
    
    // Chatbot
    'chatbot.title': 'Legal Literacy Chatbot',
    'chatbot.description': 'Get instant answers to your legal questions with our AI-powered assistant powered by Google Gemini Pro',
    'chatbot.placeholder': 'Ask any legal question...',
    'chatbot.send': 'Send',
    'chatbot.disclaimer': 'This AI assistant provides general legal information for educational purposes only and does not constitute legal advice.',
    
    // Contract validator
    'validator.title': 'Contract Validator',
    'validator.description': 'Analyze contracts for risks, issues, and improvement opportunities',
    'validator.upload': 'Upload Contract',
    'validator.analyze': 'Analyze Contract',
    'validator.disclaimer': 'For informational purposes only. Not a substitute for professional legal advice.',
    
    // Documents
    'documents.title': 'My Documents & History',
    'documents.description': 'View your saved contract analyses and chat history',
    'documents.contracts': 'Contract Analyses',
    'documents.sessions': 'Chat History',
    'documents.empty.contracts': 'You haven\'t analyzed any contracts yet.',
    'documents.empty.sessions': 'You haven\'t had any conversations with our AI assistant yet.',
    
    // Footer
    'footer.rights': '© 2025 LawSpark AI. All rights reserved. Built for legal professionals.',
    'footer.privacy': 'Privacy Policy',
    'footer.terms': 'Terms of Service',
    'footer.contact': 'Contact',
  },
  
  // Hindi translations
  hi: {
    // Common
    'app.name': 'लॉस्पार्क एआई',
    'app.tagline': 'कानूनी तकनीक को सरल बनाया गया',
    'app.description': 'एआई-संचालित सहायता और बुद्धिमान अनुबंध सत्यापन के साथ कानूनी ज्ञान का लोकतंत्रीकरण करें।',
    
    // Navigation
    'nav.home': 'होम',
    'nav.chatbot': 'कानूनी साक्षरता चैटबॉट',
    'nav.validator': 'अनुबंध सत्यापक',
    'nav.documents': 'मेरे दस्तावेज़',
    'nav.about': 'हमारे बारे में',
    'nav.contact': 'संपर्क करें',
    
    // Auth
    'auth.signin': 'साइन इन करें',
    'auth.signup': 'साइन अप करें',
    'auth.signout': 'साइन आउट करें',
    'auth.email': 'ईमेल पता',
    'auth.password': 'पासवर्ड',
    'auth.forgot': 'पासवर्ड भूल गए?',
    
    // Home page
    'home.hero.title': 'कानूनी तकनीक',
    'home.hero.subtitle': 'सरल बनाई गई',
    'home.hero.description': 'एआई-संचालित सहायता और बुद्धिमान अनुबंध सत्यापन के साथ कानूनी ज्ञान का लोकतंत्रीकरण करें। जटिलता या लागत के बिना तुरंत पेशेवर कानूनी अंतर्दृष्टि प्राप्त करें।',
    'home.hero.cta.chatbot': 'कानूनी चैटबॉट का उपयोग करें',
    'home.hero.cta.contract': 'मेरा अनुबंध जांचें',
    'home.trusted': 'दुनिया भर में 50,000+ उपयोगकर्ताओं द्वारा विश्वसनीय',
    
    // Features
    'features.title': 'आपकी उंगलियों पर शक्तिशाली कानूनी उपकरण',
    'features.description': 'हर किसी के लिए डिज़ाइन किए गए एआई-संचालित कानूनी तकनीक समाधानों के हमारे व्यापक सूट से चुनें',
    'features.chatbot.title': 'एआई कानूनी सहायक',
    'features.chatbot.description': 'हमारे उन्नत एआई चैटबॉट के साथ कानूनी प्रश्नों के तुरंत उत्तर प्राप्त करें जो व्यापक कानूनी डेटाबेस और केस स्टडीज पर प्रशिक्षित है।',
    'features.contract.title': 'मेरा अनुबंध जांचें',
    'features.contract.description': 'संभावित समस्याओं, गायब खंडों, कानूनी अनुपालन और सुधार सिफारिशों के लिए अनुबंधों को अपलोड और विश्लेषण करें।',
    
    // Chatbot
    'chatbot.title': 'कानूनी साक्षरता चैटबॉट',
    'chatbot.description': 'Google Gemini Pro द्वारा संचालित हमारे एआई-संचालित सहायक के साथ अपने कानूनी प्रश्नों के तुरंत उत्तर प्राप्त करें',
    'chatbot.placeholder': 'कोई भी कानूनी प्रश्न पूछें...',
    'chatbot.send': 'भेजें',
    'chatbot.disclaimer': 'यह एआई सहायक केवल शैक्षिक उद्देश्यों के लिए सामान्य कानूनी जानकारी प्रदान करता है और कानूनी सलाह नहीं है।',
    
    // Contract validator
    'validator.title': 'अनुबंध सत्यापक',
    'validator.description': 'जोखिमों, समस्याओं और सुधार के अवसरों के लिए अनुबंधों का विश्लेषण करें',
    'validator.upload': 'अनुबंध अपलोड करें',
    'validator.analyze': 'अनुबंध का विश्लेषण करें',
    'validator.disclaimer': 'केवल सूचनात्मक उद्देश्यों के लिए। पेशेवर कानूनी सलाह का विकल्प नहीं।',
    
    // Documents
    'documents.title': 'मेरे दस्तावेज़ और इतिहास',
    'documents.description': 'अपने सहेजे गए अनुबंध विश्लेषणों और चैट इतिहास को देखें',
    'documents.contracts': 'अनुबंध विश्लेषण',
    'documents.sessions': 'चैट इतिहास',
    'documents.empty.contracts': 'आपने अभी तक किसी अनुबंध का विश्लेषण नहीं किया है।',
    'documents.empty.sessions': 'आपने अभी तक हमारे एआई सहायक के साथ कोई बातचीत नहीं की है।',
    
    // Footer
    'footer.rights': '© 2025 लॉस्पार्क एआई। सर्वाधिकार सुरक्षित। कानूनी पेशेवरों के लिए बनाया गया।',
    'footer.privacy': 'गोपनीयता नीति',
    'footer.terms': 'सेवा की शर्तें',
    'footer.contact': 'संपर्क करें',
  },
  
  // Telugu translations
  te: {
    // Common
    'app.name': 'లాస్పార్క్ ఎఐ',
    'app.tagline': 'చట్ట సాంకేతికత సరళీకృతం',
    'app.description': 'AI-ఆధారిత సహాయం మరియు తెలివైన కాంట్రాక్ట్ ధృవీకరణతో చట్టపరమైన జ్ఞానాన్ని ప్రజాస్వామ్యం చేయండి.',
    
    // Navigation
    'nav.home': 'హోమ్',
    'nav.chatbot': 'చట్ట అక్షరాస్యత చాట్‌బాట్',
    'nav.validator': 'కాంట్రాక్ట్ వాలిడేటర్',
    'nav.documents': 'నా పత్రాలు',
    'nav.about': 'మా గురించి',
    'nav.contact': 'సంప్రదించండి',
    
    // Auth
    'auth.signin': 'సైన్ ఇన్',
    'auth.signup': 'సైన్ అప్',
    'auth.signout': 'సైన్ అవుట్',
    'auth.email': 'ఇమెయిల్ చిరునామా',
    'auth.password': 'పాస్‌వర్డ్',
    'auth.forgot': 'పాస్‌వర్డ్ మర్చిపోయారా?',
    
    // Home page
    'home.hero.title': 'చట్ట సాంకేతికత',
    'home.hero.subtitle': 'సరళీకృతం',
    'home.hero.description': 'AI-ఆధారిత సహాయం మరియు తెలివైన కాంట్రాక్ట్ ధృవీకరణతో చట్టపరమైన జ్ఞానాన్ని ప్రజాస్వామ్యం చేయండి. సంక్లిష్టత లేదా ఖర్చు లేకుండా వెంటనే వృత్తిపరమైన చట్టపరమైన అంతర్దృష్టులను పొందండి.',
    'home.hero.cta.chatbot': 'చట్ట చాట్‌బాట్‌ని ఉపయోగించండి',
    'home.hero.cta.contract': 'నా కాంట్రాక్ట్‌ని తనిఖీ చేయండి',
    'home.trusted': 'ప్రపంచవ్యాప్తంగా 50,000+ మంది వినియోగదారులచే విశ్వసనీయమైనది',
    
    // Features
    'features.title': 'మీ వేళ్ల చివర శక్తివంతమైన చట్ట సాధనాలు',
    'features.description': 'ప్రతి ఒక్కరికీ రూపొందించబడిన AI-ఆధారిత చట్ట సాంకేతిక పరిష్కారాల మా సమగ్ర సూట్ నుండి ఎంచుకోండి',
    'features.chatbot.title': 'AI చట్ట సహాయకుడు',
    'features.chatbot.description': 'సమగ్ర చట్ట డేటాబేస్‌లు మరియు కేస్ స్టడీలపై శిక్షణ పొందిన మా అధునాతన AI చాట్‌బాట్‌తో చట్ట ప్రశ్నలకు తక్షణ సమాధానాలు పొందండి.',
    'features.contract.title': 'నా కాంట్రాక్ట్‌ని తనిఖీ చేయండి',
    'features.contract.description': 'సంభావ్య సమస్యలు, తప్పిపోయిన క్లాజులు, చట్టపరమైన అనుసరణ మరియు మెరుగుదల సిఫార్సుల కోసం కాంట్రాక్ట్‌లను అప్‌లోడ్ చేయండి మరియు విశ్లేషించండి.',
    
    // Chatbot
    'chatbot.title': 'చట్ట అక్షరాస్యత చాట్‌బాట్',
    'chatbot.description': 'Google Gemini Pro ద్వారా ఆధారితమైన మా AI-ఆధారిత సహాయకుడితో మీ చట్ట ప్రశ్నలకు తక్షణ సమాధానాలు పొందండి',
    'chatbot.placeholder': 'ఏదైనా చట్ట ప్రశ్న అడగండి...',
    'chatbot.send': 'పంపండి',
    'chatbot.disclaimer': 'ఈ AI సహాయకుడు విద్యా ప్రయోజనాల కోసం మాత్రమే సాధారణ చట్ట సమాచారాన్ని అందిస్తుంది మరియు చట్ట సలహా కాదు.',
    
    // Contract validator
    'validator.title': 'కాంట్రాక్ట్ వాలిడేటర్',
    'validator.description': 'రిస్క్‌లు, సమస్యలు మరియు మెరుగుదల అవకాశాల కోసం కాంట్రాక్ట్‌లను విశ్లేషించండి',
    'validator.upload': 'కాంట్రాక్ట్‌ని అప్‌లోడ్ చేయండి',
    'validator.analyze': 'కాంట్రాక్ట్‌ని విశ్లేషించండి',
    'validator.disclaimer': 'సమాచార ప్రయోజనాల కోసం మాత్రమే. వృత్తిపరమైన చట్ట సలహాకు ప్రత్యామ్నాయం కాదు.',
    
    // Documents
    'documents.title': 'నా పత్రాలు & చరిత్ర',
    'documents.description': 'మీ సేవ్ చేసిన కాంట్రాక్ట్ విశ్లేషణలు మరియు చాట్ చరిత్రను వీక్షించండి',
    'documents.contracts': 'కాంట్రాక్ట్ విశ్లేషణలు',
    'documents.sessions': 'చాట్ చరిత్ర',
    'documents.empty.contracts': 'మీరు ఇంకా ఏ కాంట్రాక్ట్‌లను విశ్లేషించలేదు.',
    'documents.empty.sessions': 'మీరు ఇంకా మా AI సహాయకుడితో ఏ సంభాషణలు చేయలేదు.',
    
    // Footer
    'footer.rights': '© 2025 లాస్పార్క్ ఎఐ. అన్ని హక్కులు రిజర్వ్ చేయబడ్డాయి. చట్ట నిపుణుల కోసం నిర్మించబడింది.',
    'footer.privacy': 'గోప్యతా విధానం',
    'footer.terms': 'సేవా నిబంధనలు',
    'footer.contact': 'సంప్రదించండి',
  },
  
  // Tamil translations
  ta: {
    // Common
    'app.name': 'லாஸ்பார்க் ஏஐ',
    'app.tagline': 'சட்ட தொழில்நுட்பம் எளிமையாக்கப்பட்டது',
    'app.description': 'AI-இயக்கப்படும் உதவி மற்றும் புத்திசாலித்தனமான ஒப்பந்த சரிபார்ப்புடன் சட்ட அறிவை ஜனநாயகப்படுத்துங்கள்.',
    
    // Navigation
    'nav.home': 'முகப்பு',
    'nav.chatbot': 'சட்ட எழுத்தறிவு சாட்போட்',
    'nav.validator': 'ஒப்பந்த சரிபார்ப்பாளர்',
    'nav.documents': 'எனது ஆவணங்கள்',
    'nav.about': 'எங்களைப் பற்றி',
    'nav.contact': 'தொடர்பு கொள்ளவும்',
    
    // Auth
    'auth.signin': 'உள்நுழைக',
    'auth.signup': 'பதிவு செய்க',
    'auth.signout': 'வெளியேறு',
    'auth.email': 'மின்னஞ்சல் முகவரி',
    'auth.password': 'கடவுச்சொல்',
    'auth.forgot': 'கடவுச்சொல் மறந்துவிட்டதா?',
    
    // Home page
    'home.hero.title': 'சட்ட தொழில்நுட்பம்',
    'home.hero.subtitle': 'எளிமையாக்கப்பட்டது',
    'home.hero.description': 'AI-இயக்கப்படும் உதவி மற்றும் புத்திசாலித்தனமான ஒப்பந்த சரிபார்ப்புடன் சட்ட அறிவை ஜனநாயகப்படுத்துங்கள். சிக்கல் அல்லது செலவு இல்லாமல் உடனடியாக தொழில்முறை சட்ட நுண்ணறிவுகளைப் பெறுங்கள்.',
    'home.hero.cta.chatbot': 'சட்ட சாட்போட்டைப் பயன்படுத்துக',
    'home.hero.cta.contract': 'எனது ஒப்பந்தத்தைச் சரிபார்க்கவும்',
    'home.trusted': 'உலகளவில் 50,000+ பயனர்களால் நம்பப்படுகிறது',
    
    // Features
    'features.title': 'உங்கள் விரல்களில் சக்திவாய்ந்த சட்டக் கருவிகள்',
    'features.description': 'அனைவருக்கும் வடிவமைக்கப்பட்ட AI-இயக்கப்படும் சட்ட தொழில்நுட்பத் தீர்வுகளின் எங்கள் விரிவான தொகுப்பிலிருந்து தேர்வு செய்யவும்',
    'features.chatbot.title': 'AI சட்ட உதவியாளர்',
    'features.chatbot.description': 'விரிவான சட்ட தரவுத்தளங்கள் மற்றும் வழக்கு ஆய்வுகளில் பயிற்சி பெற்ற எங்கள் மேம்பட்ட AI சாட்போட்டுடன் சட்டக் கேள்விகளுக்கு உடனடி பதில்களைப் பெறுங்கள்.',
    'features.contract.title': 'எனது ஒப்பந்தத்தைச் சரிபார்க்கவும்',
    'features.contract.description': 'சாத்தியமான சிக்கல்கள், காணாமல் போன விதிகள், சட்ட இணக்கம் மற்றும் மேம்பாட்டு பரிந்துரைகளுக்காக ஒப்பந்தங்களை பதிவேற்றவும் மற்றும் பகுப்பாய்வு செய்யவும்.',
    
    // Chatbot
    'chatbot.title': 'சட்ட எழுத்தறிவு சாட்போட்',
    'chatbot.description': 'Google Gemini Pro ஆல் இயக்கப்படும் எங்கள் AI-இயக்கப்படும் உதவியாளருடன் உங்கள் சட்டக் கேள்விகளுக்கு உடனடி பதில்களைப் பெறுங்கள்',
    'chatbot.placeholder': 'எந்த சட்டக் கேள்வியையும் கேளுங்கள்...',
    'chatbot.send': 'அனுப்பு',
    'chatbot.disclaimer': 'இந்த AI உதவியாளர் கல்வி நோக்கங்களுக்காக மட்டுமே பொதுவான சட்டத் தகவல்களை வழங்குகிறது மற்றும் சட்ட ஆலோசனை அல்ல.',
    
    // Contract validator
    'validator.title': 'ஒப்பந்த சரிபார்ப்பாளர்',
    'validator.description': 'அபாயங்கள், சிக்கல்கள் மற்றும் மேம்பாட்டு வாய்ப்புகளுக்காக ஒப்பந்தங்களை பகுப்பாய்வு செய்யவும்',
    'validator.upload': 'ஒப்பந்தத்தைப் பதிவேற்றவும்',
    'validator.analyze': 'ஒப்பந்தத்தை பகுப்பாய்வு செய்யவும்',
    'validator.disclaimer': 'தகவல் நோக்கங்களுக்காக மட்டுமே. தொழில்முறை சட்ட ஆலோசனைக்கு மாற்றாக இல்லை.',
    
    // Documents
    'documents.title': 'எனது ஆவணங்கள் & வரலாறு',
    'documents.description': 'உங்கள் சேமித்த ஒப்பந்த பகுப்பாய்வுகள் மற்றும் அரட்டை வரலாற்றைக் காண்க',
    'documents.contracts': 'ஒப்பந்த பகுப்பாய்வுகள்',
    'documents.sessions': 'அரட்டை வரலாறு',
    'documents.empty.contracts': 'நீங்கள் இன்னும் எந்த ஒப்பந்தங்களையும் பகுப்பாய்வு செய்யவில்லை.',
    'documents.empty.sessions': 'நீங்கள் இன்னும் எங்கள் AI உதவியாளருடன் எந்த உரையாடல்களையும் நடத்தவில்லை.',
    
    // Footer
    'footer.rights': '© 2025 லாஸ்பார்க் ஏஐ. அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை. சட்ட நிபுணர்களுக்காக கட்டப்பட்டது.',
    'footer.privacy': 'தனியுரிமைக் கொள்கை',
    'footer.terms': 'சேவை விதிமுறைகள்',
    'footer.contact': 'தொடர்பு கொள்ளவும்',
  }
};

// RTL languages
const rtlLanguages: LanguageCode[] = [];

// Language provider component
interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  // Get saved language from localStorage or use browser language
  const getSavedLanguage = (): LanguageCode => {
    const saved = localStorage.getItem('language');
    if (saved && ['en', 'hi', 'te', 'ta'].includes(saved)) {
      return saved as LanguageCode;
    }
    
    // Try to detect browser language
    const browserLang = navigator.language.split('-')[0];
    if (['hi', 'te', 'ta'].includes(browserLang)) {
      return browserLang as LanguageCode;
    }
    
    return 'en';
  };

  const [language, setLanguageState] = useState<LanguageCode>(getSavedLanguage());
  const isRtl = rtlLanguages.includes(language);

  // Set language and save to localStorage
  const setLanguage = (code: LanguageCode) => {
    setLanguageState(code);
    localStorage.setItem('language', code);
    
    // Set HTML dir attribute for RTL support
    document.documentElement.dir = rtlLanguages.includes(code) ? 'rtl' : 'ltr';
  };

  // Initialize dir attribute on mount
  useEffect(() => {
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
  }, [isRtl]);

  // Translation function
  const t = (key: string): string => {
    return translations[language]?.[key] || translations.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRtl }}>
      {children}
    </LanguageContext.Provider>
  );
};

// Custom hook to use the language context
export const useLanguage = () => useContext(LanguageContext);

export default LanguageContext;