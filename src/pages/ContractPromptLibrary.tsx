import React, { useState } from 'react';
import { 
  FileCheck, 
  Search, 
  Filter, 
  Book, 
  Download, 
  Upload, 
  Zap,
  Copy,
  Check,
  Save,
  Trash2,
  Plus,
  FileText,
  AlertTriangle,
  CheckCircle,
  Lightbulb
} from 'lucide-react';
import ContractAnalysisPrompts from '../components/ContractAnalysisPrompts';
import { contractAnalysisService } from '../services/contractAnalysisService';

const ContractPromptLibrary: React.FC = () => {
  const [selectedPrompt, setSelectedPrompt] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'library' | 'custom' | 'examples'>('library');
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  const handleSelectPrompt = (prompt: string) => {
    setSelectedPrompt(prompt);
  };

  const copySelectedPrompt = () => {
    navigator.clipboard.writeText(selectedPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const saveCustomPrompt = () => {
    // In a real implementation, this would save to localStorage or a database
    alert('Custom prompt saved!');
  };

  const examplePrompts = [
    {
      title: 'Highlight Risky Clauses',
      prompt: 'Analyze this contract and highlight all clauses that present significant risks. For each risky clause, explain the specific risk, why it\'s concerning, and suggest alternative language that would better protect my interests.',
      category: 'risk'
    },
    {
      title: 'Explain Indemnification',
      prompt: 'Explain the indemnification clause in this contract in simple terms. What obligations does it create? Is it balanced between the parties? Are there any unusual aspects to this indemnification provision compared to standard contracts?',
      category: 'explanation'
    },
    {
      title: 'Contract Summary',
      prompt: 'Provide a comprehensive summary of this contract, including: 1) Key obligations for each party, 2) Payment terms and conditions, 3) Duration and termination provisions, 4) Major risks and liabilities, 5) Unusual or non-standard terms.',
      category: 'summary'
    }
  ];

  const tabs = [
    { id: 'library', label: 'Prompt Library', icon: Book },
    { id: 'custom', label: 'Custom Prompt', icon: Plus },
    { id: 'examples', label: 'Example Prompts', icon: Lightbulb }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-green-100 rounded-xl mb-4">
            <FileCheck className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Contract Analysis Prompts</h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Design effective prompts for contract analysis, risk assessment, and plain-language explanations
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-green-500 text-green-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {/* Prompt Library Tab */}
            {activeTab === 'library' && (
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <div className="mb-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search prompts..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  <ContractAnalysisPrompts onSelectPrompt={handleSelectPrompt} />
                </div>
                
                <div>
                  <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 sticky top-4">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-gray-900">Selected Prompt</h2>
                      <div className="flex space-x-2">
                        <button
                          onClick={copySelectedPrompt}
                          disabled={!selectedPrompt}
                          className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Copy prompt"
                        >
                          {copied ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          onClick={() => setCustomPrompt(selectedPrompt)}
                          disabled={!selectedPrompt}
                          className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Edit as custom prompt"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    {selectedPrompt ? (
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 h-96 overflow-y-auto">
                        <p className="text-gray-700 whitespace-pre-wrap">{selectedPrompt}</p>
                      </div>
                    ) : (
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 h-96 flex items-center justify-center">
                        <div className="text-center">
                          <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-500">Select a prompt to view it here</p>
                        </div>
                      </div>
                    )}
                    
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h3 className="font-medium text-gray-900 mb-2">How to use this prompt:</h3>
                      <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                        <li>Copy the prompt text</li>
                        <li>Upload your contract document</li>
                        <li>Paste the prompt in the analysis request</li>
                        <li>Review the AI's response</li>
                        <li>Refine the prompt if needed for better results</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Custom Prompt Tab */}
            {activeTab === 'custom' && (
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Create Custom Prompt</h2>
                    
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="customPrompt" className="block text-sm font-medium text-gray-700 mb-1">
                          Your Custom Prompt
                        </label>
                        <textarea
                          id="customPrompt"
                          value={customPrompt}
                          onChange={(e) => setCustomPrompt(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          rows={12}
                          placeholder="Write your custom contract analysis prompt here..."
                        />
                      </div>
                      
                      <div className="flex space-x-3">
                        <button
                          onClick={saveCustomPrompt}
                          disabled={!customPrompt.trim()}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                        >
                          <Save className="h-4 w-4" />
                          <span>Save Prompt</span>
                        </button>
                        <button
                          onClick={() => setSelectedPrompt(customPrompt)}
                          disabled={!customPrompt.trim()}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                        >
                          <Zap className="h-4 w-4" />
                          <span>Use Prompt</span>
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                    <h3 className="font-semibold text-gray-900 mb-3">Prompt Building Blocks</h3>
                    
                    <div className="space-y-3">
                      <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <h4 className="font-medium text-gray-800 mb-1 text-sm">Contract Analysis Introduction</h4>
                        <p className="text-xs text-gray-600 mb-2">Sets the context for the analysis</p>
                        <button
                          onClick={() => setCustomPrompt(prev => prev + "\n\nAnalyze this contract and provide a detailed assessment of its terms, risks, and recommendations.")}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          Add to prompt
                        </button>
                      </div>
                      
                      <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <h4 className="font-medium text-gray-800 mb-1 text-sm">Risk Assessment Request</h4>
                        <p className="text-xs text-gray-600 mb-2">Asks for identification of risks</p>
                        <button
                          onClick={() => setCustomPrompt(prev => prev + "\n\nIdentify all potential risks and red flags in this contract, categorized by severity (high, medium, low).")}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          Add to prompt
                        </button>
                      </div>
                      
                      <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <h4 className="font-medium text-gray-800 mb-1 text-sm">Plain Language Request</h4>
                        <p className="text-xs text-gray-600 mb-2">Asks for simple explanations</p>
                        <button
                          onClick={() => setCustomPrompt(prev => prev + "\n\nExplain all key terms and obligations in simple, non-legal language that a non-lawyer can understand.")}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          Add to prompt
                        </button>
                      </div>
                      
                      <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <h4 className="font-medium text-gray-800 mb-1 text-sm">Improvement Suggestions</h4>
                        <p className="text-xs text-gray-600 mb-2">Asks for ways to improve the contract</p>
                        <button
                          onClick={() => setCustomPrompt(prev => prev + "\n\nFor each problematic clause, provide specific alternative language that would better protect my interests.")}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          Add to prompt
                        </button>
                      </div>
                      
                      <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <h4 className="font-medium text-gray-800 mb-1 text-sm">Response Format Instructions</h4>
                        <p className="text-xs text-gray-600 mb-2">Specifies how to format the response</p>
                        <button
                          onClick={() => setCustomPrompt(prev => prev + "\n\nStructure your response with clear headings and bullet points. Include a summary section at the beginning and recommendations at the end.")}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          Add to prompt
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Prompt Design Guidelines</h2>
                    
                    <div className="space-y-6">
                      <div>
                        <h3 className="font-medium text-gray-900 mb-2 flex items-center">
                          <AlertTriangle className="h-4 w-4 text-yellow-500 mr-2" />
                          Common Pitfalls to Avoid
                        </h3>
                        <ul className="text-sm text-gray-600 space-y-2">
                          <li className="flex items-start space-x-2">
                            <span className="text-red-500 font-bold mt-0.5">✕</span>
                            <span>Being too vague ("Review this contract" without specifics)</span>
                          </li>
                          <li className="flex items-start space-x-2">
                            <span className="text-red-500 font-bold mt-0.5">✕</span>
                            <span>Asking for legal advice rather than information</span>
                          </li>
                          <li className="flex items-start space-x-2">
                            <span className="text-red-500 font-bold mt-0.5">✕</span>
                            <span>Requesting analysis without specifying key areas of concern</span>
                          </li>
                          <li className="flex items-start space-x-2">
                            <span className="text-red-500 font-bold mt-0.5">✕</span>
                            <span>Not specifying the desired format for the response</span>
                          </li>
                        </ul>
                      </div>
                      
                      <div>
                        <h3 className="font-medium text-gray-900 mb-2 flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          Best Practices
                        </h3>
                        <ul className="text-sm text-gray-600 space-y-2">
                          <li className="flex items-start space-x-2">
                            <span className="text-green-500 font-bold mt-0.5">✓</span>
                            <span>Specify which aspects of the contract to focus on</span>
                          </li>
                          <li className="flex items-start space-x-2">
                            <span className="text-green-500 font-bold mt-0.5">✓</span>
                            <span>Request specific formats (e.g., JSON, bullet points, tables)</span>
                          </li>
                          <li className="flex items-start space-x-2">
                            <span className="text-green-500 font-bold mt-0.5">✓</span>
                            <span>Ask for examples from the contract text to support findings</span>
                          </li>
                          <li className="flex items-start space-x-2">
                            <span className="text-green-500 font-bold mt-0.5">✓</span>
                            <span>Request risk levels and scores to prioritize issues</span>
                          </li>
                          <li className="flex items-start space-x-2">
                            <span className="text-green-500 font-bold mt-0.5">✓</span>
                            <span>Ask for specific alternative language for problematic clauses</span>
                          </li>
                        </ul>
                      </div>
                      
                      <div>
                        <h3 className="font-medium text-gray-900 mb-2 flex items-center">
                          <Lightbulb className="h-4 w-4 text-blue-500 mr-2" />
                          Key Elements to Include
                        </h3>
                        <ul className="text-sm text-gray-600 space-y-2">
                          <li className="flex items-start space-x-2">
                            <span className="text-blue-500 font-bold mt-0.5">•</span>
                            <span>Clear instructions about what to analyze</span>
                          </li>
                          <li className="flex items-start space-x-2">
                            <span className="text-blue-500 font-bold mt-0.5">•</span>
                            <span>Specific contract elements to focus on</span>
                          </li>
                          <li className="flex items-start space-x-2">
                            <span className="text-blue-500 font-bold mt-0.5">•</span>
                            <span>Desired response format and structure</span>
                          </li>
                          <li className="flex items-start space-x-2">
                            <span className="text-blue-500 font-bold mt-0.5">•</span>
                            <span>Request for practical recommendations</span>
                          </li>
                          <li className="flex items-start space-x-2">
                            <span className="text-blue-500 font-bold mt-0.5">•</span>
                            <span>Audience specification (lawyer, business person, etc.)</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Example Prompts Tab */}
            {activeTab === 'examples' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Example Contract Analysis Prompts</h2>
                
                <div className="grid md:grid-cols-3 gap-6">
                  {examplePrompts.map((example, index) => (
                    <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-gray-900">{example.title}</h3>
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          {example.category}
                        </span>
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 mb-4">
                        <p className="text-sm text-gray-700">{example.prompt}</p>
                      </div>
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(example.prompt);
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                          }}
                          className="flex items-center space-x-1 px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                        >
                          {copied ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                          <span>Copy</span>
                        </button>
                        <button
                          onClick={() => {
                            setCustomPrompt(example.prompt);
                            setActiveTab('custom');
                          }}
                          className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                          <Edit className="h-4 w-4" />
                          <span>Customize</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="bg-yellow-50 rounded-xl p-6 border border-yellow-100">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-yellow-800 mb-2">Important Note</h3>
                      <p className="text-sm text-yellow-700">
                        These example prompts are starting points that should be customized for your specific contract and needs. 
                        The quality of AI analysis depends significantly on the quality and specificity of your prompts. 
                        Always review AI-generated analysis carefully and consult with a qualified legal professional for important contracts.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractPromptLibrary;