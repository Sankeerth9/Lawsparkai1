import React from 'react';
import { Link } from 'react-router-dom';
import { Scale, Mail, Phone, MapPin, Github, Linkedin, Twitter } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const Footer: React.FC = () => {
  const { t } = useLanguage();
  
  return (
    <footer className="bg-primary-dark text-text-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-gradient-to-br from-accent-blue to-accent-cyan rounded-lg">
                <Scale className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold gradient-text">{t('app.name')}</span>
            </div>
            <p className="text-text-secondary text-sm leading-relaxed">
              Empowering legal professionals and individuals with cutting-edge AI technology for legal education and contract analysis.
            </p>
            <div className="flex space-x-4 pt-2">
              <a href="#" className="text-text-secondary hover:text-accent-cyan transition-colors">
                <Github className="h-5 w-5" />
              </a>
              <a href="#" className="text-text-secondary hover:text-accent-cyan transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="#" className="text-text-secondary hover:text-accent-cyan transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-text-primary mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="text-text-secondary hover:text-accent-cyan transition-colors">{t('nav.home')}</Link></li>
              <li><Link to="/about" className="text-text-secondary hover:text-accent-cyan transition-colors">{t('nav.about')}</Link></li>
              <li><a href="#" className="text-text-secondary hover:text-accent-cyan transition-colors">{t('footer.privacy')}</a></li>
              <li><a href="#" className="text-text-secondary hover:text-accent-cyan transition-colors">{t('footer.terms')}</a></li>
              <li><Link to="/contact" className="text-text-secondary hover:text-accent-cyan transition-colors">{t('footer.contact')}</Link></li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-semibold text-text-primary mb-4">Services</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/chatbot" className="text-text-secondary hover:text-accent-cyan transition-colors">{t('nav.chatbot')}</Link></li>
              <li><Link to="/validator" className="text-text-secondary hover:text-accent-cyan transition-colors">{t('nav.validator')}</Link></li>
              <li><Link to="/rag" className="text-text-secondary hover:text-accent-cyan transition-colors">Legal Research</Link></li>
              <li><Link to="/data-preparation" className="text-text-secondary hover:text-accent-cyan transition-colors">Document Analysis</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-text-primary mb-4">Contact</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-accent-cyan" />
                <span className="text-text-secondary">contact@lawspark.ai</span>
              </li>
              <li className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-accent-cyan" />
                <span className="text-text-secondary">+1 (555) 123-4567</span>
              </li>
              <li className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-accent-cyan" />
                <span className="text-text-secondary">San Francisco, CA</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-accent-blue/20 mt-8 pt-8 text-center">
          <p className="text-text-muted text-sm">
            {t('footer.rights')}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;