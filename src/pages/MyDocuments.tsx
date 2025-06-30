import React, { useState, useEffect } from 'react';
import { FileText, Calendar, Clock, AlertTriangle, CheckCircle, Download, Trash2, Search, Filter, RefreshCw, MessageCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { SupabaseService } from '../services/supabaseService';
import { ProtectedRoute } from '../components/ProtectedRoute';

interface MyDocumentsContentProps {
  user: any;
}

const MyDocumentsContent: React.FC<MyDocumentsContentProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'contracts' | 'sessions'>('contracts');
  const [contractAnalyses, setContractAnalyses] = useState<any[]>([]);
  const [userSessions, setUserSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRisk, setFilterRisk] = useState<string | null>(null);

  useEffect(() => {
    loadUserData();
  }, [activeTab]);

  const loadUserData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (activeTab === 'contracts') {
        const analyses = await SupabaseService.getContractAnalyses(50);
        setContractAnalyses(analyses);
      } else {
        const sessions = await SupabaseService.getUserSessions(50);
        setUserSessions(sessions);
      }
    } catch (err) {
      setError('Failed to load your data. Please try again.');
      console.error('Error loading user data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAnalysis = async (id: string) => {
    if (!confirm('Are you sure you want to delete this analysis? This action cannot be undone.')) {
      return;
    }
    
    try {
      // In a real implementation, this would call a delete method
      // For now, just remove from the local state
      setContractAnalyses(prev => prev.filter(analysis => analysis.id !== id));
    } catch (err) {
      console.error('Error deleting analysis:', err);
    }
  };

  const handleDownloadAnalysis = (analysis: any) => {
    // Create a formatted text report
    const formattedReport = createTextReport(analysis);
    
    // Download as formatted text file
    const blob = new Blob([formattedReport], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contract-analysis-${analysis.document_name.replace(/\.[^/.]+$/, '')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const createTextReport = (analysis: any): string => {
    const formatTitle = (text: string) => {
      return "\n" + text.toUpperCase() + "\n" + "=".repeat(text.length) + "\n";
    };
    
    let report = `CONTRACT ANALYSIS REPORT
===============================

Document: ${analysis.document_name}
Analysis Date: ${formatDate(analysis.created_at || new Date().toISOString())}
Analysis Time: ${analysis.analysis_time?.toFixed(1) || '0'} seconds

OVERALL ASSESSMENT
------------------
Score: ${analysis.overall_score}/100
Risk Level: ${analysis.risk_level?.toUpperCase() || 'Unknown'}

SUMMARY
-------
Critical Issues: ${analysis.summary?.criticalIssues || 0}
Warnings: ${analysis.summary?.warnings || 0}
Suggestions: ${analysis.summary?.suggestions || 0}
Total Clauses: ${analysis.summary?.totalClauses || 0}
`;
    
    if (analysis.summary?.strengths?.length) {
      report += formatTitle("STRENGTHS");
      analysis.summary.strengths.forEach((strength: string, index: number) => {
        report += `${index + 1}. ${strength}\n`;
      });
    }
    
    if (analysis.summary?.weaknesses?.length) {
      report += formatTitle("WEAKNESSES");
      analysis.summary.weaknesses.forEach((weakness: string, index: number) => {
        report += `${index + 1}. ${weakness}\n`;
      });
    }
    
    if (analysis.clauses?.length) {
      report += formatTitle("CLAUSE ANALYSIS");
      
      analysis.clauses.forEach((clause: any, index: number) => {
        report += `\n${index + 1}. ${clause.title}\n` +
                  `${"~".repeat(clause.title.length + 3)}\n` +
                  `Category: ${clause.category}\n` +
                  `Risk Level: ${clause.riskLevel.toUpperCase()}\n` +
                  `Score: ${clause.score}/100\n\n`;
        
        if (clause.issues?.length) {
          report += "Issues:\n";
          clause.issues.forEach((issue: string, i: number) => {
            report += `  - ${issue}\n`;
          });
          report += "\n";
        }
        
        if (clause.suggestions?.length) {
          report += "Suggestions:\n";
          clause.suggestions.forEach((suggestion: string, i: number) => {
            report += `  - ${suggestion}\n`;
          });
          report += "\n";
        }
      });
    }
    
    report += "\nDISCLAIMER: This analysis is provided for informational purposes only and does not constitute legal advice.\n" +
              "For specific legal matters, please consult with a qualified attorney.\n\n" +
              "Generated by Lawspark AI - https://lawspark.ai";
    
    return report;
  };

  const handleDownloadAnalysisAsJson = (analysis: any) => {
    const data = {
      document_name: analysis.document_name,
      overall_score: analysis.overall_score,
      risk_level: analysis.risk_level,
      clauses: analysis.clauses,
      summary: analysis.summary,
      analysis_time: analysis.analysis_time,
      created_at: analysis.created_at
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contract-analysis-${analysis.document_name.replace(/\.[^/.]+$/, '')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteSession = async (id: string) => {
    if (!confirm('Are you sure you want to delete this chat session? This action cannot be undone.')) {
      return;
    }
    
    try {
      // Delete from database and update local state
      await SupabaseService.deleteUserSession(id);
      
      // Update local state
      setUserSessions(prevSessions => prevSessions.filter(session => session.id !== id));
      
      // Show success toast or message if needed
    } catch (err) {
      console.error('Error deleting chat session:', err);
    }
  };

  const filteredContracts = contractAnalyses.filter(analysis => {
    const matchesSearch = searchTerm === '' || 
      analysis.document_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRisk = filterRisk === null || analysis.risk_level === filterRisk;
    
    return matchesSearch && matchesRisk;
  });

  const filteredSessions = userSessions.filter(session => {
    if (searchTerm === '') return true;
    
    // Search through messages
    if (session.messages && Array.isArray(session.messages)) {
      return session.messages.some((msg: any) => 
        msg.content && msg.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return false;
  });

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'excellent': return 'bg-green-100 text-green-800 border-green-200';
      case 'good': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'fair': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'poor': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'excellent': return <CheckCircle className="h-4 w-4" />;
      case 'good': return <CheckCircle className="h-4 w-4" />;
      case 'fair': return <AlertTriangle className="h-4 w-4" />;
      case 'poor': return <AlertTriangle className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  return (
    <div className="min-h-screen bg-primary py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-gradient-to-r from-accent-blue to-accent-cyan rounded-xl mb-4">
            <FileText className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-text-primary mb-2">My Documents & History</h1>
          <p className="text-lg text-text-secondary max-w-3xl mx-auto">
            View your saved contract analyses and chat history
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-primary-light rounded-xl shadow-glow border border-accent-blue/20 mb-8">
          <div className="flex border-b border-accent-blue/20">
            <button
              onClick={() => setActiveTab('contracts')}
              className={`flex-1 py-4 text-center font-medium transition-colors ${
                activeTab === 'contracts'
                  ? 'text-accent-cyan border-b-2 border-accent-cyan'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Contract Analyses
            </button>
            <button
              onClick={() => setActiveTab('sessions')}
              className={`flex-1 py-4 text-center font-medium transition-colors ${
                activeTab === 'sessions'
                  ? 'text-accent-cyan border-b-2 border-accent-cyan'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Chat History
            </button>
          </div>

          <div className="p-6">
            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-muted" />
                <input
                  type="text"
                  placeholder={`Search ${activeTab === 'contracts' ? 'contracts' : 'chat history'}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-primary border border-accent-blue/30 rounded-lg focus:ring-2 focus:ring-accent-cyan focus:border-transparent text-text-primary"
                />
              </div>

              {activeTab === 'contracts' && (
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-text-muted" />
                  <select
                    value={filterRisk || ''}
                    onChange={(e) => setFilterRisk(e.target.value || null)}
                    className="bg-primary border border-accent-blue/30 rounded-lg px-3 py-2 focus:ring-2 focus:ring-accent-cyan focus:border-transparent text-text-primary"
                  >
                    <option value="">All Risk Levels</option>
                    <option value="excellent">Excellent</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="poor">Poor</option>
                  </select>
                </div>
              )}

              <button
                onClick={loadUserData}
                className="flex items-center justify-center space-x-2 px-4 py-2 bg-primary border border-accent-blue/30 rounded-lg hover:bg-primary-light transition-colors text-text-primary"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Refresh</span>
              </button>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="w-12 h-12 border-4 border-accent-cyan border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <div className="bg-primary border border-red-500/30 rounded-xl p-6 text-center">
                <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-text-primary mb-2">Error Loading Data</h3>
                <p className="text-text-secondary mb-4">{error}</p>
                <button
                  onClick={loadUserData}
                  className="px-6 py-2 bg-gradient-to-r from-accent-blue to-accent-cyan text-white rounded-lg hover:from-accent-cyan hover:to-accent-teal transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}

            {/* Contract Analyses Tab */}
            {activeTab === 'contracts' && !loading && !error && (
              <>
                {filteredContracts.length === 0 ? (
                  <div className="bg-primary-dark rounded-xl p-8 text-center">
                    <FileText className="h-16 w-16 text-text-muted mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-text-primary mb-2">No Contract Analyses Found</h3>
                    <p className="text-text-secondary mb-6">
                      You haven't analyzed any contracts yet. Try the Contract Validator to get started.
                    </p>
                    <a
                      href="/validator"
                      className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-accent-blue to-accent-cyan text-white rounded-lg hover:from-accent-cyan hover:to-accent-teal transition-colors"
                    >
                      <FileText className="h-5 w-5 mr-2" />
                      Check My Contract
                    </a>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {filteredContracts.map((analysis) => (
                      <div key={analysis.id} className="bg-primary-dark rounded-xl p-6 border border-accent-blue/20 hover:shadow-glow transition-shadow">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                          <div className="flex items-center space-x-3">
                            <FileText className="h-6 w-6 text-accent-cyan" />
                            <h3 className="font-bold text-text-primary text-lg">{analysis.document_name}</h3>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRiskColor(analysis.risk_level)}`}>
                              {getRiskIcon(analysis.risk_level)}
                              <span className="ml-2 capitalize">{analysis.risk_level}</span>
                            </div>
                            <div className="bg-primary rounded-full px-3 py-1 text-sm font-medium text-text-primary">
                              Score: {analysis.overall_score}/100
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="flex items-center space-x-2 text-sm text-text-secondary">
                            <Calendar className="h-4 w-4 text-text-muted" />
                            <span>{formatDate(analysis.created_at)}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-text-secondary">
                            <Clock className="h-4 w-4 text-text-muted" />
                            <span>Analysis Time: {analysis.analysis_time.toFixed(2)}s</span>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mb-4">
                          {analysis.summary?.strengths?.slice(0, 2).map((strength: string, idx: number) => (
                            <div key={idx} className="bg-green-900/20 text-green-400 text-xs px-3 py-1 rounded-full">
                              {strength.substring(0, 40)}...
                            </div>
                          ))}
                          {analysis.summary?.weaknesses?.slice(0, 2).map((weakness: string, idx: number) => (
                            <div key={idx} className="bg-red-900/20 text-red-400 text-xs px-3 py-1 rounded-full">
                              {weakness.substring(0, 40)}...
                            </div>
                          ))}
                        </div>
                        
                        <div className="flex justify-end space-x-3">
                          <button
                            onClick={() => handleDownloadAnalysis(analysis)}
                            className="flex items-center space-x-1 px-3 py-1.5 bg-primary border border-accent-blue/30 rounded-lg hover:bg-primary-light transition-colors text-text-secondary"
                          >
                            <Download className="h-4 w-4" />
                            <span>Download as Text</span>
                          </button>
                          <button
                            onClick={() => handleDownloadAnalysisAsJson(analysis)}
                            className="flex items-center space-x-1 px-3 py-1.5 bg-primary border border-accent-blue/30 rounded-lg hover:bg-primary-light transition-colors text-text-secondary"
                          >
                            <Download className="h-4 w-4" />
                            <span>Download as JSON</span>
                          </button>
                          <a
                            href={`/validator?id=${analysis.id}`}
                            className="flex items-center space-x-1 px-3 py-1.5 bg-gradient-to-r from-accent-blue to-accent-cyan text-white rounded-lg hover:from-accent-cyan hover:to-accent-teal transition-colors"
                          >
                            <FileText className="h-4 w-4" />
                            <span>View Details</span>
                          </a>
                          <button
                            onClick={() => handleDeleteAnalysis(analysis.id)}
                            className="flex items-center space-x-1 px-3 py-1.5 bg-red-900/20 text-red-400 rounded-lg hover:bg-red-900/40 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Chat History Tab */}
            {activeTab === 'sessions' && !loading && !error && (
              <>
                {filteredSessions.length === 0 ? (
                  <div className="bg-primary-dark rounded-xl p-8 text-center">
                    <MessageCircle className="h-16 w-16 text-text-muted mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-text-primary mb-2">No Chat History Found</h3>
                    <p className="text-text-secondary mb-6">
                      You haven't had any conversations with our AI assistant yet. Try the Legal Chatbot to get started.
                    </p>
                    <a
                      href="/chatbot"
                      className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-accent-blue to-accent-cyan text-white rounded-lg hover:from-accent-cyan hover:to-accent-teal transition-colors"
                    >
                      <MessageCircle className="h-5 w-5 mr-2" />
                      Start Chatting
                    </a>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {filteredSessions.map((session) => (
                      <div key={session.id} className="bg-primary-dark rounded-xl p-6 border border-accent-blue/20 hover:shadow-glow transition-shadow">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                          <div className="flex items-center space-x-3">
                            <MessageCircle className="h-6 w-6 text-accent-cyan" />
                            <h3 className="font-bold text-text-primary text-lg">
                              Chat Session {session.session_type === 'chatbot' ? '(Legal Assistant)' : 
                                          session.session_type === 'contract_validation' ? '(Contract Validator)' : 
                                          '(Document Analysis)'}
                            </h3>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-text-secondary">
                            <Calendar className="h-4 w-4 text-text-muted" />
                            <span>{formatDate(session.created_at)}</span>
                          </div>
                        </div>
                        
                        <div className="bg-primary rounded-lg p-4 mb-4 max-h-40 overflow-y-auto">
                          {session.messages && Array.isArray(session.messages) && session.messages.length > 0 ? (
                            <div className="space-y-3">
                              {session.messages.slice(0, 3).map((msg: any, idx: number) => (
                                <div key={idx} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                                  <div className={`rounded-lg px-3 py-2 max-w-xs ${
                                    msg.type === 'user' 
                                      ? 'bg-gradient-to-r from-accent-blue to-accent-cyan text-white' 
                                      : 'bg-primary-light text-text-primary'
                                  }`}>
                                    <p className="text-sm">{msg.content.substring(0, 100)}{msg.content.length > 100 ? '...' : ''}</p>
                                  </div>
                                </div>
                              ))}
                              {session.messages.length > 3 && (
                                <p className="text-center text-text-muted text-sm">
                                  + {session.messages.length - 3} more messages
                                </p>
                              )}
                            </div>
                          ) : (
                            <p className="text-text-muted text-center">No messages in this session</p>
                          )}
                        </div>
                        
                        <div className="flex justify-end space-x-3">
                          <a
                            href={`/chatbot?session=${session.id}`}
                            className="flex items-center space-x-1 px-3 py-1.5 bg-gradient-to-r from-accent-blue to-accent-cyan text-white rounded-lg hover:from-accent-cyan hover:to-accent-teal transition-colors"
                          >
                            <MessageCircle className="h-4 w-4" />
                            <span>Continue Chat</span>
                          </a>
                          <button
                            onClick={() => handleDeleteSession(session.id)}
                            className="flex items-center space-x-1 px-3 py-1.5 bg-red-900/20 text-red-400 rounded-lg hover:bg-red-900/40 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const MyDocuments: React.FC = () => {
  return (
    <ProtectedRoute>
      {(user) => <MyDocumentsContent user={user} />}
    </ProtectedRoute>
  );
};

export default MyDocuments;