import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Scale, Menu, X, MessageCircle, FileCheck, Home, Info, Mail, LogIn, FolderOpen } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { UserMenu } from './UserMenu';
import { AuthModal } from './AuthModal';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const location = useLocation();
  const { user } = useAuth();
  
  const navigation = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Legal Literacy Chatbot', href: '/chatbot', icon: MessageCircle },
    { name: 'Contract Validator', href: '/validator', icon: FileCheck },
    { name: 'My Documents', href: '/my-documents', icon: FolderOpen },
    { name: 'About', href: '/about', icon: Info },
    { name: 'Contact', href: '/contact', icon: Mail },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <header className="fixed top-0 left-0 right-0 bg-primary/95 backdrop-blur-md border-b border-accent-blue/20 z-[100]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3 group z-10">
              <div className="p-2 bg-gradient-to-br from-accent-blue to-accent-cyan rounded-xl group-hover:from-accent-cyan group-hover:to-accent-teal transition-all duration-300 shadow-glow flex-shrink-0">
                <Scale className="h-6 w-6 text-white" />
              </div>
              <div className="hidden sm:block">
                <span className="text-xl font-bold gradient-text">
                  LawSpark AI
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-1 z-10 overflow-x-auto py-2 px-1 max-w-[calc(100%-320px)] scrollbar-thin">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`relative flex items-center space-x-1 px-2 py-1.5 rounded-xl transition-all duration-300 group flex-shrink-0 ${
                      isActive(item.href)
                        ? 'bg-gradient-to-r from-accent-blue to-accent-cyan text-white shadow-glow'
                        : 'text-text-secondary hover:text-accent-cyan hover:bg-primary-light'
                    }`}
                  >
                    <Icon className={`h-4 w-4 transition-transform duration-300 ${
                      isActive(item.href) ? 'scale-110' : 'group-hover:scale-110'
                    }`} />
                    <span className="font-medium whitespace-nowrap text-sm">{item.name}</span>
                    {isActive(item.href) && (
                      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white rounded-full"></div>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* User Menu / Auth Button */}
            <div className="hidden lg:flex items-center space-x-4 z-10">
              {user ? (
                <UserMenu />
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-accent-blue to-accent-cyan text-white rounded-lg hover:from-accent-cyan hover:to-accent-teal transition-colors"
                >
                  <LogIn className="h-4 w-4" />
                  <span>Sign In</span>
                </button>
              )}
            </div>

            {/* Mobile menu button */}
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-text-secondary hover:text-accent-cyan hover:bg-primary-light transition-all duration-300 z-10"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          <div className={`lg:hidden transition-all duration-300 ease-in-out mobile-menu ${
            isMenuOpen ? 'max-h-[80vh] opacity-100 py-4 border-t border-accent-blue/20' : 'max-h-0 opacity-0 overflow-hidden'
          }`}>
            <nav className="space-y-1 z-20 max-h-[70vh] overflow-y-auto pb-4">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-2.5 rounded-xl transition-all duration-300 ${
                      isActive(item.href)
                        ? 'bg-gradient-to-r from-accent-blue to-accent-cyan text-white shadow-glow'
                        : 'text-text-secondary hover:text-accent-cyan hover:bg-primary-light'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{item.name}</span>
                    {isActive(item.href) && (
                      <div className="ml-auto w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </Link>
                );
              })}
              
              {/* Mobile Auth */}
              <div className="pt-4 border-t border-accent-blue/20">
                {user ? (
                  <div className="px-4 py-2">
                    <UserMenu />
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setShowAuthModal(true);
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-accent-blue to-accent-cyan text-white rounded-xl hover:from-accent-cyan hover:to-accent-teal transition-colors"
                  >
                    <LogIn className="h-4 w-4" />
                    <span>Sign In</span>
                  </button>
                )}
              </div>
            </nav>
          </div>
        </div>
      </header>

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </>
  );
};

export default Header;