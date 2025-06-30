import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageCircle, User, Bot, Lightbulb, BookOpen, Scale, HelpCircle, Upload, FileText, Globe, Bookmark, Copy, Check, X, Download, Languages, AlertCircle, CheckCircle } from 'lucide-react';
import { useGeminiAI } from '../hooks/useGeminiAI';
import { DocumentProcessor } from '../utils/documentProcessor';
import { useAuth } from '../hooks/useAuth';
import { SupabaseService } from '../services/supabaseService';
import { ProtectedRoute } from '../components/ProtectedRoute';
import ApiKeySetup from '../components/ApiKeySetup';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  isBookmarked?: boolean;
  hasDocument?: boolean;
  documentName?: string;
  isHighlighted?: boolean;
  isError?: boolean;
}

interface UploadedDocument {
  file: File;
  name: string;
  size: string;
  uploadTime: Date;
  processedText?: string;
}

interface ChatBotContentProps {
  user: any;
}

const ChatBotContent: React.FC<ChatBotContentProps> = ({ user }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
      content: "Hello! I'm your AI Legal Assistant powered by Google's Gemini Pro. I can help you understand legal concepts, explain contract terms, analyze uploaded documents, and provide general legal guidance in multiple languages. What legal question can I help you with today?",
      timestamp: new Date(),
      isHighlighted: true
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([]);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [showDocumentUpload, setShowDocumentUpload] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { 
    isLoading, 
    error, 
    getLegalAdvice, 
    analyzeDocument, 
    translateText,
    clearError,
    isConfigured 
  } = useGeminiAI();

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'it', name: 'Italiano', flag: '🇮🇹' },
    { code: 'pt', name: 'Português', flag: '🇵🇹' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' }
  ];

  const sampleQuestions = [
    "What is the difference between a contract and an agreement?",
    "Explain what 'force majeure' means in contracts",
    "What are the key elements of a valid contract?",
    "How do I know if a non-disclosure agreement is fair?",
    "What should I look for in an employment contract?",
    "Explain intellectual property clauses in simple terms"
  ];

  // Initialize session when component mounts
  useEffect(() => {
    if (user && !currentSessionId) {
      initializeSession();
    }
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (error) {
      const errorMessage: Message = {
        id: Date.now().toString(),
        type: 'bot',
        content: `I apologize, but I encountered an error: ${error}. Please check your API configuration and try again.`,
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  }, [error]);

  const initializeSession = async () => {
    if (!user) return;
    
    try {
      const session = await SupabaseService.createUserSession({
        session_type: 'chatbot',
        messages: [],
        metadata: { language: selectedLanguage }
      });
      setCurrentSessionId(session.id);
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  };

  const updateSession = async (newMessages: Message[]) => {
    if (!currentSessionId || !user) return;
    
    try {
      await SupabaseService.updateUserSession(currentSessionId, {
        messages: newMessages,
        metadata: { 
          language: selectedLanguage,
          totalMessages: newMessages.length,
          lastActivity: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Failed to update session:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    if (!isConfigured) {
      const errorMessage: Message = {
        id: Date.now().toString(),
        type: 'bot',
        content: "Please configure your Gemini Pro API key to use AI features. Scroll down to see the setup instructions.",
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date(),
      hasDocument: uploadedDocuments.length > 0,
      documentName: uploadedDocuments.length > 0 ? uploadedDocuments[uploadedDocuments.length - 1].name : undefined
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    
    const currentMessage = inputMessage;
    setInputMessage('');
    clearError();

    // Log API usage
    const startTime = Date.now();

    try {
      let response: string;
      const currentLanguage = languages.find(lang => lang.code === selectedLanguage)?.name || 'English';
      
      if (uploadedDocuments.length > 0) {
        const latestDoc = uploadedDocuments[uploadedDocuments.length - 1];
        if (latestDoc.processedText) {
          response = await analyzeDocument(latestDoc.processedText, currentLanguage);
        } else {
          response = "I notice you've uploaded a document, but I wasn't able to process its content. Please try uploading a text file or check that your document is readable.";
        }
      } else {
        response = await getLegalAdvice({
          text: currentMessage,
          type: 'general',
          language: currentLanguage
        });
      }

      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: response,
        timestamp: new Date(),
        isHighlighted: true
      };
      
      const finalMessages = [...newMessages, botResponse];
      setMessages(finalMessages);
      
      // Update session with new messages
      await updateSession(finalMessages);

      // Log successful API usage
      if (user) {
        await SupabaseService.logApiUsage({
          endpoint: '/api/legal-advice',
          method: 'POST',
          response_time_ms: Date.now() - startTime,
          status_code: 200,
          metadata: {
            language: currentLanguage,
            hasDocument: uploadedDocuments.length > 0,
            messageLength: currentMessage.length
          }
        });
      }
    } catch (err) {
      console.error('Error getting AI response:', err);
      
      // Log failed API usage
      if (user) {
        await SupabaseService.logApiUsage({
          endpoint: '/api/legal-advice',
          method: 'POST',
          response_time_ms: Date.now() - startTime,
          status_code: 500,
          error_message: err instanceof Error ? err.message : 'Unknown error'
        });
      }
    }
  };

  const handleSampleQuestion = (question: string) => {
    setInputMessage(question);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileUpload = async (file: File) => {
    const validation = DocumentProcessor.validateFile(file);
    if (!validation.isValid) {
      alert(validation.error);
      return;
    }

    try {
      const processedDoc = await DocumentProcessor.processFile(file);
      
      const newDocument: UploadedDocument = {
        file,
        name: file.name,
        size: DocumentProcessor.formatFileSize(file.size),
        uploadTime: new Date(),
        processedText: processedDoc.text
      };

      setUploadedDocuments(prev => [...prev, newDocument]);
      setShowDocumentUpload(false);
      
      // Auto-send a message about the uploaded document
      setTimeout(() => {
        setInputMessage(`Please analyze my uploaded document: ${file.name}`);
      }, 500);
    } catch (error) {
      console.error('Error processing document:', error);
      alert('Error processing document. Please try again.');
    }
  };

  const toggleBookmark = (messageId: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, isBookmarked: !msg.isBookmarked } : msg
    ));
  };

  const copyMessage = async (messageId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      console.error('Failed to copy message:', err);
    }
  };

  const removeDocument = (index: number) => {
    setUploadedDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const exportBookmarkedMessages = () => {
    const bookmarked = messages.filter(msg => msg.isBookmarked);
    const exportData = bookmarked.map(msg => ({
      type: msg.type,
      content: msg.content,
      timestamp: msg.timestamp.toISOString()
    }));
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bookmarked-legal-responses.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const currentLanguage = languages.find(lang => lang.code === selectedLanguage);

  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-primary py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <div className="inline-flex p-3 bg-gradient-to-r from-accent-blue to-accent-cyan rounded-xl mb-4">
              <MessageCircle className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-text-primary mb-2">Legal Literacy Chatbot</h1>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              AI-powered legal assistance requires API configuration
            </p>
          </div>
          <ApiKeySetup />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-gradient-to-r from-accent-blue to-accent-cyan rounded-xl mb-4">
            <MessageCircle className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-text-primary mb-2">Legal Literacy Chatbot</h1>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
            Get instant answers to your legal questions with our AI-powered assistant powered by Google Gemini Pro
          </p>
          {user && (
            <div className="mt-4 text-sm text-text-muted">
              Signed in as {user.email} • Your conversations are automatically saved
            </div>
          )}
        </div>

        {/* Language Selector & Tools */}
        <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="appearance-none bg-primary-light border border-accent-blue/30 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-accent-cyan focus:border-transparent text-text-primary"
              >
                {languages.map(lang => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.name}
                  </option>
                ))}
              </select>
              <Languages className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-accent-cyan pointer-events-none" />
            </div>
            
            <button
              onClick={() => setShowDocumentUpload(!showDocumentUpload)}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-accent-blue to-accent-cyan text-white rounded-lg hover:from-accent-cyan hover:to-accent-teal transition-colors"
            >
              <Upload className="h-4 w-4" />
              <span>Upload Document</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-sm text-text-secondary">
              {messages.filter(m => m.isBookmarked).length} bookmarked
            </span>
            {messages.some(m => m.isBookmarked) && (
              <button
                onClick={exportBookmarkedMessages}
                className="flex items-center space-x-1 px-3 py-1 bg-primary-light text-accent-cyan rounded-lg hover:bg-primary transition-colors text-sm border border-accent-blue/30"
              >
                <Download className="h-3 w-3" />
                <span>Export</span>
              </button>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-primary-light border border-red-500/30 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-400">Error</h3>
                <p className="text-red-300 text-sm">{error}</p>
              </div>
              <button
                onClick={clearError}
                className="text-red-400 hover:text-red-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Document Upload Section */}
        {showDocumentUpload && (
          <div className="mb-6 bg-primary-light rounded-xl p-6 shadow-glow border border-accent-blue/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-text-primary">Upload Legal Document</h3>
              <button
                onClick={() => setShowDocumentUpload(false)}
                className="p-1 hover:bg-primary rounded"
              >
                <X className="h-4 w-4 text-text-muted" />
              </button>
            </div>
            
            <div className="border-2 border-dashed border-accent-blue/30 rounded-lg p-6 text-center hover:border-accent-cyan/50 transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.txt"
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
              />
              <Upload className="h-8 w-8 text-accent-cyan mx-auto mb-2" />
              <p className="text-text-secondary mb-2">Drop your legal document here or click to browse</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-gradient-to-r from-accent-blue to-accent-cyan text-white rounded-lg hover:from-accent-cyan hover:to-accent-teal transition-colors"
              >
                Choose File
              </button>
              <p className="text-xs text-text-muted mt-2">PDF, DOC, DOCX, TXT (Max 10MB)</p>
            </div>
          </div>
        )}

        {/* Uploaded Documents */}
        {uploadedDocuments.length > 0 && (
          <div className="mb-6 bg-primary-light rounded-xl p-4 shadow-glow border border-accent-blue/20">
            <h4 className="font-medium text-text-primary mb-3">Uploaded Documents</h4>
            <div className="space-y-2">
              {uploadedDocuments.map((doc, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-primary rounded-lg border border-accent-blue/20">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-accent-cyan" />
                    <div>
                      <p className="font-medium text-text-primary">{doc.name}</p>
                      <p className="text-sm text-text-muted">{doc.size} • {doc.uploadTime.toLocaleTimeString()}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeDocument(index)}
                    className="p-1 hover:bg-primary-dark rounded"
                  >
                    <X className="h-4 w-4 text-text-muted" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sample Questions */}
        {messages.length === 1 && (
          <div className="mb-8 bg-primary-light rounded-xl p-6 shadow-glow border border-accent-blue/20">
            <div className="flex items-center space-x-2 mb-4">
              <Lightbulb className="h-5 w-5 text-accent-cyan" />
              <h3 className="font-semibold text-text-primary">Sample Questions</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              {sampleQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleSampleQuestion(question)}
                  className="text-left p-3 bg-primary rounded-lg hover:bg-primary-dark hover:border-accent-blue/30 border border-accent-blue/10 transition-all group"
                >
                  <div className="flex items-start space-x-2">
                    <HelpCircle className="h-4 w-4 text-text-muted group-hover:text-accent-cyan mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-text-secondary group-hover:text-text-primary">{question}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Legal Image */}
        {messages.length === 1 && (
          <div className="mb-8 bg-primary-light rounded-xl p-6 shadow-glow border border-accent-blue/20">
            <div className="flex flex-col md:flex-row gap-6 items-center">
              <div className="md:w-1/2">
                <img 
                  src="https://images.pexels.com/photos/5668858/pexels-photo-5668858.jpeg" 
                  alt="Legal scales of justice" 
                  className="rounded-lg shadow-lg w-full h-auto"
                />
              </div>
              <div className="md:w-1/2 space-y-4">
                <h3 className="text-xl font-bold text-text-primary">Expert Legal Assistance</h3>
                <p className="text-text-secondary">
                  Our AI-powered legal assistant provides instant answers to your legal questions, 
                  explains complex legal concepts in simple terms, and helps you understand your rights and obligations.
                </p>
                <div className="space-y-2">
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-accent-teal mt-1" />
                    <p className="text-text-secondary text-sm">24/7 availability for legal questions</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-accent-teal mt-1" />
                    <p className="text-text-secondary text-sm">Plain language explanations of complex legal terms</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-accent-teal mt-1" />
                    <p className="text-text-secondary text-sm">Document analysis and contract review assistance</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Chat Container */}
        <div className="bg-primary-light rounded-xl shadow-glow border border-accent-blue/20 overflow-hidden">
          {/* Messages */}
          <div className="h-96 overflow-y-auto p-6 space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex space-x-3 max-w-4xl ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    message.type === 'user' ? 'bg-gradient-to-r from-accent-blue to-accent-cyan' : message.isError ? 'bg-red-500' : 'bg-primary'
                  }`}>
                    {message.type === 'user' ? (
                      <User className="h-4 w-4 text-white" />
                    ) : (
                      <Bot className="h-4 w-4 text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div
                      className={`rounded-2xl px-4 py-3 relative group ${
                        message.type === 'user'
                          ? 'bg-gradient-to-r from-accent-blue to-accent-cyan text-white'
                          : message.isError
                          ? 'bg-primary border-2 border-red-500/30 text-red-300'
                          : message.isHighlighted
                          ? 'bg-primary-dark border border-accent-blue/30 text-text-primary'
                          : 'bg-primary text-text-primary border border-accent-blue/20'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                          {message.hasDocument && (
                            <div className="mt-2 flex items-center space-x-2 text-xs opacity-75">
                              <FileText className="h-3 w-3" />
                              <span>Document: {message.documentName}</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Message Actions */}
                        {message.type === 'bot' && !message.isError && (
                          <div className="flex items-center space-x-1 ml-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => toggleBookmark(message.id)}
                              className={`p-1 rounded hover:bg-primary transition-colors ${
                                message.isBookmarked ? 'text-accent-cyan' : 'text-text-muted'
                              }`}
                              title="Bookmark"
                            >
                              <Bookmark className={`h-3 w-3 ${message.isBookmarked ? 'fill-current' : ''}`} />
                            </button>
                            <button
                              onClick={() => copyMessage(message.id, message.content)}
                              className="p-1 rounded hover:bg-primary transition-colors text-text-muted"
                              title="Copy"
                            >
                              {copiedMessageId === message.id ? (
                                <Check className="h-3 w-3 text-accent-teal" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <p className={`text-xs ${
                        message.type === 'user' ? 'text-text-muted text-right' : 'text-text-muted'
                      }`}>
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                      {message.isBookmarked && (
                        <div className="flex items-center space-x-1 text-xs text-accent-cyan">
                          <Bookmark className="h-3 w-3 fill-current" />
                          <span>Bookmarked</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex space-x-3 max-w-4xl">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <div className="bg-primary rounded-2xl px-4 py-3 border border-accent-blue/20">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-accent-blue rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-accent-cyan rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-accent-teal rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-accent-blue/20 p-4">
            <div className="flex space-x-3">
              <div className="flex-1">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={`Ask any legal question in ${currentLanguage?.name}...`}
                  className="w-full px-4 py-3 bg-primary border border-accent-blue/30 rounded-lg focus:ring-2 focus:ring-accent-cyan focus:border-transparent resize-none text-text-primary"
                  rows={2}
                  disabled={isLoading}
                />
              </div>
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="px-6 py-3 bg-gradient-to-r from-accent-blue to-accent-cyan text-white rounded-lg hover:from-accent-cyan hover:to-accent-teal disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                <Send className="h-4 w-4" />
                <span className="hidden sm:inline">Send</span>
              </button>
            </div>
            
            <div className="mt-3 flex items-center justify-between text-xs text-text-muted">
              <div className="flex items-center space-x-4">
                <span>Press Enter to send, Shift+Enter for new line</span>
                <div className="flex items-center space-x-1">
                  <Globe className="h-3 w-3" />
                  <span>Language: {currentLanguage?.name}</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Scale className="h-3 w-3" />
                <span>Powered by Gemini Pro - For informational purposes only</span>
              </div>
            </div>
          </div>
        </div>

        {/* Legal Disclaimer */}
        <div className="mt-8 bg-primary-dark border border-accent-blue/20 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <BookOpen className="h-6 w-6 text-accent-cyan flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-text-primary mb-2">Important Legal Disclaimer</h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                This AI assistant provides general legal information for educational purposes only and does not constitute legal advice. 
                Always consult with a qualified attorney for specific legal matters. The information provided should not be relied upon 
                for making legal decisions without professional consultation. Document analysis is for informational purposes only.
              </p>
            </div>
          </div>
        </div>

        {/* Legal Image */}
        <div className="mt-8 bg-primary-dark border border-accent-blue/20 rounded-xl p-6">
          <div className="flex flex-col md:flex-row gap-6 items-center">
            <div className="md:w-1/3">
              <img 
                src="https://images.pexels.com/photos/5668481/pexels-photo-5668481.jpeg" 
                alt="Legal gavel" 
                className="rounded-lg shadow-lg w-full h-auto"
              />
            </div>
            <div className="md:w-2/3 space-y-4">
              <h3 className="text-xl font-bold text-text-primary">Professional Legal Guidance</h3>
              <p className="text-text-secondary">
                Our AI-powered legal assistant is trained on extensive legal databases and case law to provide 
                accurate, helpful information about a wide range of legal topics. While not a substitute for 
                professional legal advice, it can help you understand legal concepts, analyze documents, and 
                prepare for consultations with attorneys.
              </p>
              <div className="flex flex-wrap gap-3">
                <div className="bg-primary rounded-lg px-3 py-2 border border-accent-blue/20">
                  <span className="text-sm text-accent-cyan">Contract Analysis</span>
                </div>
                <div className="bg-primary rounded-lg px-3 py-2 border border-accent-blue/20">
                  <span className="text-sm text-accent-cyan">Legal Research</span>
                </div>
                <div className="bg-primary rounded-lg px-3 py-2 border border-accent-blue/20">
                  <span className="text-sm text-accent-cyan">Document Review</span>
                </div>
                <div className="bg-primary rounded-lg px-3 py-2 border border-accent-blue/20">
                  <span className="text-sm text-accent-cyan">Legal Education</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ChatBot: React.FC = () => {
  return (
    <ProtectedRoute>
      {(user) => <ChatBotContent user={user} />}
    </ProtectedRoute>
  );
};

export default ChatBot;