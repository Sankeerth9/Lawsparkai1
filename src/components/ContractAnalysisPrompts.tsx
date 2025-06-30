import React, { useState } from 'react';
import { 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  Lightbulb, 
  Copy, 
  Check, 
  Save,
  Download,
  Upload,
  Trash2,
  Edit,
  Plus,
  Book,
  Wand,
  Zap,
  Scale
} from 'lucide-react';

interface ContractAnalysisPromptsProps {
  onSelectPrompt?: (prompt: string) => void;
}

const ContractAnalysisPrompts: React.FC<ContractAnalysisPromptsProps> = ({ onSelectPrompt }) => {
  const [activeCategory, setActiveCategory] = useState<string>('general');
  const [copiedPrompt, setCopiedPrompt] = useState<string | null>(null);
  const [savedPrompts, setSavedPrompts] = useState<Array<{name: string, prompt: string, category: string}>>([]);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [promptToSave, setPromptToSave] = useState<string>('');
  const [promptName, setPromptName] = useState<string>('');

  // Load saved prompts from localStorage on component mount
  React.useEffect(() => {
    const saved = localStorage.getItem('savedContractPrompts');
    if (saved) {
      try {
        setSavedPrompts(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse saved prompts:', e);
      }
    }
  }, []);

  const handleCopyPrompt = (prompt: string) => {
    navigator.clipboard.writeText(prompt);
    setCopiedPrompt(prompt);
    setTimeout(() => setCopiedPrompt(null), 2000);
  };

  const handleSelectPrompt = (prompt: string) => {
    if (onSelectPrompt) {
      onSelectPrompt(prompt);
    }
  };

  const handleSavePrompt = () => {
    if (!promptName.trim() || !promptToSave.trim()) return;
    
    const newSavedPrompts = [...savedPrompts, { 
      name: promptName, 
      prompt: promptToSave, 
      category: activeCategory 
    }];
    
    setSavedPrompts(newSavedPrompts);
    localStorage.setItem('savedContractPrompts', JSON.stringify(newSavedPrompts));
    
    // Reset form
    setPromptName('');
    setPromptToSave('');
    setShowSaveForm(false);
  };

  const handleDeletePrompt = (index: number) => {
    const newSavedPrompts = [...savedPrompts];
    newSavedPrompts.splice(index, 1);
    setSavedPrompts(newSavedPrompts);
    localStorage.setItem('savedContractPrompts', JSON.stringify(newSavedPrompts));
  };

  const exportPrompts = () => {
    const dataStr = JSON.stringify(savedPrompts, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'contract_analysis_prompts.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const importPrompts = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string);
        if (Array.isArray(imported)) {
          setSavedPrompts([...savedPrompts, ...imported]);
          localStorage.setItem('savedContractPrompts', JSON.stringify([...savedPrompts, ...imported]));
        }
      } catch (error) {
        console.error('Error importing prompts:', error);
        alert('Invalid prompt file format');
      }
    };
    reader.readAsText(file);
  };

  const promptCategories = [
    { id: 'general', name: 'General Analysis', icon: FileText },
    { id: 'risk', name: 'Risk Assessment', icon: AlertTriangle },
    { id: 'clauses', name: 'Clause Analysis', icon: CheckCircle },
    { id: 'plain', name: 'Plain Language', icon: Lightbulb },
    { id: 'saved', name: 'Saved Prompts', icon: Save }
  ];

  const generalPrompts = [
    {
      title: 'Comprehensive Contract Analysis',
      description: 'Full analysis of contract structure, clauses, risks, and recommendations',
      prompt: `Analyze this contract comprehensively. Identify all key clauses, assess risks, flag unusual terms, and provide a summary of strengths and weaknesses. Include specific recommendations for improving problematic clauses.`
    },
    {
      title: 'Risk Identification',
      description: 'Identify potential risks and red flags in the contract',
      prompt: `Review this contract and highlight all potential risks and red flags. Focus on unfair terms, missing protections, unclear language, and potential legal issues. Categorize risks by severity (high, medium, low) and provide specific recommendations for addressing each risk.`
    },
    {
      title: 'Clause Extraction',
      description: 'Extract and categorize all clauses in the contract',
      prompt: `Extract all distinct clauses from this contract. For each clause, provide the title, full text, and categorize it (e.g., payment, termination, liability, etc.). Include section numbers or references if available.`
    },
    {
      title: 'Missing Provisions Check',
      description: 'Identify important provisions that are missing from the contract',
      prompt: `Review this contract and identify any important provisions or clauses that are missing. Explain why each missing provision is important and provide suggested language to add to the contract.`
    }
  ];

  const riskPrompts = [
    {
      title: 'High-Risk Clause Identification',
      description: 'Focus on identifying the most problematic clauses',
      prompt: `Analyze this contract and identify the 5 most concerning or high-risk clauses. For each high-risk clause, explain why it's problematic, what specific risks it creates, and how it could be improved to better protect my interests.`
    },
    {
      title: 'One-Sided Terms Analysis',
      description: 'Identify terms that unfairly favor one party',
      prompt: `Review this contract and identify any terms that appear unfairly one-sided or that disproportionately favor the other party. For each one-sided term, explain the imbalance and suggest more equitable alternative language.`
    },
    {
      title: 'Liability Exposure Assessment',
      description: 'Focus on liability, indemnification, and risk allocation',
      prompt: `Analyze all liability-related provisions in this contract, including limitations of liability, indemnification, warranties, and disclaimers. Identify any concerning gaps in protection or excessive liability exposure. Suggest improvements to better allocate risk.`
    },
    {
      title: 'Termination Risk Analysis',
      description: 'Analyze termination provisions and associated risks',
      prompt: `Review all termination provisions in this contract. Identify any concerning imbalances in termination rights, inadequate notice periods, or problematic post-termination obligations. Explain the practical implications of these provisions and suggest improvements.`
    }
  ];

  const clausePrompts = [
    {
      title: 'Payment Terms Analysis',
      description: 'Analyze payment provisions, timing, and conditions',
      prompt: `Analyze the payment terms in this contract. Identify payment amounts, timing, conditions, late payment consequences, and any unusual payment provisions. Flag any concerning payment terms and suggest improvements.`
    },
    {
      title: 'Intellectual Property Clause Review',
      description: 'Analyze IP ownership, licenses, and rights',
      prompt: `Review all intellectual property provisions in this contract. Analyze ownership rights, licenses granted, IP representations and warranties, and any unusual IP terms. Identify who owns what IP and any concerning IP provisions.`
    },
    {
      title: 'Confidentiality Provisions Analysis',
      description: 'Analyze confidentiality and data protection terms',
      prompt: `Analyze all confidentiality and data protection provisions in this contract. Identify the definition of confidential information, exclusions, permitted uses, duration of obligations, and security requirements. Flag any concerning gaps or issues.`
    },
    {
      title: 'Dispute Resolution Analysis',
      description: 'Analyze how disputes will be handled',
      prompt: `Review the dispute resolution provisions in this contract. Analyze the chosen method (litigation, arbitration, mediation), jurisdiction, venue, governing law, and any unusual dispute-related terms. Explain the practical implications of these provisions.`
    }
  ];

  const plainLanguagePrompts = [
    {
      title: 'Simple Contract Summary',
      description: 'Summarize the entire contract in plain language',
      prompt: `Summarize this contract in simple, plain language that a non-lawyer can understand. Explain the main purpose, key obligations for each party, important dates or deadlines, payment terms, and what happens if someone breaks the agreement. Avoid legal jargon.`
    },
    {
      title: 'Explain Specific Clause',
      description: 'Get a plain language explanation of a particular clause',
      prompt: `Explain this specific clause in simple, everyday language that a non-lawyer can understand: [PASTE CLAUSE HERE]. What does it mean? What rights or obligations does it create? Are there any potential concerns with this clause?`
    },
    {
      title: 'Key Terms Explanation',
      description: 'Explain the most important terms in simple language',
      prompt: `Identify and explain the 10 most important terms in this contract using simple, everyday language. For each term, explain what it means, why it matters, and any potential concerns.`
    },
    {
      title: 'Contract Obligations Summary',
      description: 'Summarize what each party must do',
      prompt: `Create a simple, two-column summary of this contract that clearly shows what each party must do. List all key obligations, deadlines, payments, and deliverables for each party in plain, non-legal language.`
    }
  ];

  const renderPromptList = () => {
    switch (activeCategory) {
      case 'general':
        return (
          <div className="space-y-4">
            {generalPrompts.map((prompt, index) => (
              <div key={index} className="bg-white rounded-lg p-4 border border-gray-200 hover:border-blue-300 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-900">{prompt.title}</h3>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => handleCopyPrompt(prompt.prompt)}
                      className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                      title="Copy prompt"
                    >
                      {copiedPrompt === prompt.prompt ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setPromptToSave(prompt.prompt);
                        setPromptName(prompt.title);
                        setShowSaveForm(true);
                      }}
                      className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                      title="Save prompt"
                    >
                      <Save className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleSelectPrompt(prompt.prompt)}
                      className="p-1.5 text-blue-600 hover:text-blue-800 rounded-lg hover:bg-blue-50"
                      title="Use prompt"
                    >
                      <Zap className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-3">{prompt.description}</p>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <p className="text-sm text-gray-700 line-clamp-3">{prompt.prompt}</p>
                </div>
              </div>
            ))}
          </div>
        );
      
      case 'risk':
        return (
          <div className="space-y-4">
            {riskPrompts.map((prompt, index) => (
              <div key={index} className="bg-white rounded-lg p-4 border border-gray-200 hover:border-blue-300 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-900">{prompt.title}</h3>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => handleCopyPrompt(prompt.prompt)}
                      className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                      title="Copy prompt"
                    >
                      {copiedPrompt === prompt.prompt ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setPromptToSave(prompt.prompt);
                        setPromptName(prompt.title);
                        setShowSaveForm(true);
                      }}
                      className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                      title="Save prompt"
                    >
                      <Save className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleSelectPrompt(prompt.prompt)}
                      className="p-1.5 text-blue-600 hover:text-blue-800 rounded-lg hover:bg-blue-50"
                      title="Use prompt"
                    >
                      <Zap className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-3">{prompt.description}</p>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <p className="text-sm text-gray-700 line-clamp-3">{prompt.prompt}</p>
                </div>
              </div>
            ))}
          </div>
        );
      
      case 'clauses':
        return (
          <div className="space-y-4">
            {clausePrompts.map((prompt, index) => (
              <div key={index} className="bg-white rounded-lg p-4 border border-gray-200 hover:border-blue-300 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-900">{prompt.title}</h3>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => handleCopyPrompt(prompt.prompt)}
                      className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                      title="Copy prompt"
                    >
                      {copiedPrompt === prompt.prompt ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setPromptToSave(prompt.prompt);
                        setPromptName(prompt.title);
                        setShowSaveForm(true);
                      }}
                      className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                      title="Save prompt"
                    >
                      <Save className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleSelectPrompt(prompt.prompt)}
                      className="p-1.5 text-blue-600 hover:text-blue-800 rounded-lg hover:bg-blue-50"
                      title="Use prompt"
                    >
                      <Zap className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-3">{prompt.description}</p>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <p className="text-sm text-gray-700 line-clamp-3">{prompt.prompt}</p>
                </div>
              </div>
            ))}
          </div>
        );
      
      case 'plain':
        return (
          <div className="space-y-4">
            {plainLanguagePrompts.map((prompt, index) => (
              <div key={index} className="bg-white rounded-lg p-4 border border-gray-200 hover:border-blue-300 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-900">{prompt.title}</h3>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => handleCopyPrompt(prompt.prompt)}
                      className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                      title="Copy prompt"
                    >
                      {copiedPrompt === prompt.prompt ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setPromptToSave(prompt.prompt);
                        setPromptName(prompt.title);
                        setShowSaveForm(true);
                      }}
                      className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                      title="Save prompt"
                    >
                      <Save className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleSelectPrompt(prompt.prompt)}
                      className="p-1.5 text-blue-600 hover:text-blue-800 rounded-lg hover:bg-blue-50"
                      title="Use prompt"
                    >
                      <Zap className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-3">{prompt.description}</p>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <p className="text-sm text-gray-700 line-clamp-3">{prompt.prompt}</p>
                </div>
              </div>
            ))}
          </div>
        );
      
      case 'saved':
        return (
          <div className="space-y-4">
            {savedPrompts.length === 0 ? (
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <Save className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Saved Prompts</h3>
                <p className="text-gray-600 mb-4">You haven't saved any contract analysis prompts yet.</p>
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={() => setActiveCategory('general')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Browse Prompts
                  </button>
                  <label className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors cursor-pointer">
                    Import Prompts
                    <input
                      type="file"
                      accept=".json"
                      className="hidden"
                      onChange={importPrompts}
                    />
                  </label>
                </div>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-gray-900">Your Saved Prompts</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={exportPrompts}
                      className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Export Prompts"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <label className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer" title="Import Prompts">
                      <Upload className="h-4 w-4" />
                      <input
                        type="file"
                        accept=".json"
                        className="hidden"
                        onChange={importPrompts}
                      />
                    </label>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {savedPrompts.map((prompt, index) => (
                    <div key={index} className="bg-white rounded-lg p-4 border border-gray-200 hover:border-blue-300 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-gray-900">{prompt.name}</h3>
                        <div className="flex space-x-1">
                          <button
                            onClick={() => handleCopyPrompt(prompt.prompt)}
                            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                            title="Copy prompt"
                          >
                            {copiedPrompt === prompt.prompt ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleDeletePrompt(index)}
                            className="p-1.5 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                            title="Delete prompt"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleSelectPrompt(prompt.prompt)}
                            className="p-1.5 text-blue-600 hover:text-blue-800 rounded-lg hover:bg-blue-50"
                            title="Use prompt"
                          >
                            <Zap className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <p className="text-sm text-gray-700 line-clamp-3">{prompt.prompt}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <FileText className="h-6 w-6 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Contract Analysis Prompts</h2>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => {
              setPromptToSave('');
              setPromptName('');
              setShowSaveForm(true);
            }}
            className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Create New</span>
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex space-x-1 mb-6 border-b border-gray-200">
        {promptCategories.map((category) => {
          const Icon = category.icon;
          return (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeCategory === category.id
                  ? 'bg-white text-green-600 border border-gray-200 border-b-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
              style={{ marginBottom: '-1px' }}
            >
              <Icon className="h-4 w-4" />
              <span>{category.name}</span>
            </button>
          );
        })}
      </div>

      {/* Prompt List */}
      <div className="mt-4">
        {renderPromptList()}
      </div>

      {/* Save Prompt Form */}
      {showSaveForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Save Prompt</h3>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="promptName" className="block text-sm font-medium text-gray-700 mb-1">
                  Prompt Name
                </label>
                <input
                  type="text"
                  id="promptName"
                  value={promptName}
                  onChange={(e) => setPromptName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter a name for this prompt"
                />
              </div>
              
              <div>
                <label htmlFor="promptText" className="block text-sm font-medium text-gray-700 mb-1">
                  Prompt Text
                </label>
                <textarea
                  id="promptText"
                  value={promptToSave}
                  onChange={(e) => setPromptToSave(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  rows={6}
                  placeholder="Enter or paste your prompt text here"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowSaveForm(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePrompt}
                disabled={!promptName.trim() || !promptToSave.trim()}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Save Prompt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Best Practices */}
      <div className="mt-8 bg-blue-50 rounded-xl p-6 border border-blue-100">
        <div className="flex items-start space-x-3 mb-4">
          <div className="p-2 bg-blue-100 rounded-lg mt-1">
            <Lightbulb className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Contract Analysis Best Practices</h3>
            <p className="text-sm text-gray-600">Tips for creating effective contract analysis prompts</p>
          </div>
        </div>
        
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div className="flex items-start space-x-2">
            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
            <p className="text-gray-700">Be specific about which aspects of the contract to analyze</p>
          </div>
          <div className="flex items-start space-x-2">
            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
            <p className="text-gray-700">Request structured responses with clear categorization</p>
          </div>
          <div className="flex items-start space-x-2">
            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
            <p className="text-gray-700">Ask for specific examples from the contract text</p>
          </div>
          <div className="flex items-start space-x-2">
            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
            <p className="text-gray-700">Request practical recommendations, not just problems</p>
          </div>
          <div className="flex items-start space-x-2">
            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
            <p className="text-gray-700">Specify the audience's legal knowledge level</p>
          </div>
          <div className="flex items-start space-x-2">
            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
            <p className="text-gray-700">Ask for risk levels and scores to prioritize issues</p>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-blue-200">
          <div className="flex items-center justify-between">
            <p className="text-sm text-blue-700">
              <Scale className="h-4 w-4 inline mr-1" />
              Remember: AI analysis is not a substitute for professional legal advice
            </p>
            <button
              onClick={() => handleSelectPrompt(generalPrompts[0].prompt)}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
            >
              <Wand className="h-3.5 w-3.5 mr-1" />
              <span>Try a sample prompt</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractAnalysisPrompts;