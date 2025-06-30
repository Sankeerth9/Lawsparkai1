import React, { useState } from 'react';
import { 
  FileCheck, 
  AlertTriangle, 
  CheckCircle, 
  Lightbulb, 
  ArrowRight, 
  FileText, 
  Zap,
  Copy,
  Check,
  Eye,
  Download,
  Upload,
  Trash2,
  Edit,
  Plus,
  Book,
  Scale
} from 'lucide-react';
import ContractAnalysisPrompts from '../components/ContractAnalysisPrompts';
import { contractAnalysisService } from '../services/contractAnalysisService';

const ContractValidatorPrompts: React.FC = () => {
  const [selectedPrompt, setSelectedPrompt] = useState<string>('');
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [contractText, setContractText] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'prompts' | 'tester' | 'examples'>('prompts');

  const handleSelectPrompt = (prompt: string) => {
    setSelectedPrompt(prompt);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAnalyzeContract = async () => {
    if (!contractText.trim() || !selectedPrompt.trim()) return;
    
    setIsAnalyzing(true);
    setAnalysisResult('');
    
    try {
      // In a real implementation, this would use the actual AI service
      // For this example, we'll simulate a response
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate a sample response based on the prompt type
      let response = '';
      
      if (selectedPrompt.includes('risk') || selectedPrompt.includes('Risk')) {
        response = `# Risk Analysis Results

## High-Risk Issues
- **Termination Clause (Section 8.2)**: Allows the other party to terminate without cause with only 7 days notice, which is unusually short and creates business continuity risk.
- **Liability Cap (Section 12.1)**: Caps your liability but not the other party's liability, creating an unfair imbalance in risk allocation.

## Medium-Risk Issues
- **Payment Terms (Section 4.3)**: 45-day payment window is longer than industry standard (30 days).
- **IP Assignment (Section 10.1)**: Overly broad language could unintentionally transfer rights to pre-existing IP.
- **Force Majeure (Section 14)**: Definition is narrower than standard clauses, potentially limiting protection.

## Low-Risk Issues
- **Notice Provision (Section 16.2)**: Requires physical mail for notices, which is outdated.
- **Assignment (Section 15.1)**: Requires consent for assignment but doesn't specify that consent won't be unreasonably withheld.

## Missing Provisions
- No data protection or privacy clause
- No alternative dispute resolution mechanism
- No audit rights

## Recommendations
1. Negotiate longer termination notice period (minimum 30 days)
2. Add mutual liability caps with reasonable amounts
3. Reduce payment terms to net-30
4. Add exclusion for pre-existing IP
5. Expand force majeure definition to include standard events`;
      } else if (selectedPrompt.includes('explain') || selectedPrompt.includes('Explain')) {
        response = `# Indemnification Clause Explanation

## What This Clause Means in Simple Terms
This indemnification clause requires you to protect the other company from financial losses if certain bad things happen that are your fault. Think of it like insurance – you're promising to pay for damages if you cause problems.

## Key Points in Plain Language
- You must pay for any losses, damages, or legal costs the other company faces if:
  - You break the contract
  - You infringe someone's intellectual property
  - You or your employees are negligent
  - You break any laws

## Is This Balanced?
No, this clause is one-sided. It requires you to indemnify the other party, but there's no matching requirement for them to indemnify you. In a balanced contract, indemnification would be mutual.

## Unusual Aspects
The clause has no financial cap on your potential liability, which is concerning. Most standard indemnification clauses include some limit on the amount you might have to pay.

## Practical Impact
If you sign this as written, you could face unlimited financial liability for a wide range of issues, even for problems that are only partially your fault.

## Suggested Improvements
1. Make the indemnification mutual (both parties should indemnify each other)
2. Add a financial cap on indemnification (e.g., limited to fees paid under the contract)
3. Add a time limit for indemnification claims
4. Narrow the scope to cover only things directly within your control`;
      } else {
        response = `# Contract Analysis Summary

## Overview
This appears to be a Service Agreement between a service provider and a client. The contract is 12 pages long with 18 sections covering standard business terms.

## Key Obligations
- **Service Provider**: Deliver services described in Exhibit A, maintain insurance, provide monthly reports
- **Client**: Pay fees according to schedule, provide necessary information and access, review deliverables within 5 business days

## Payment Terms
- $10,000 monthly retainer
- Additional services billed at $150/hour
- 45-day payment window (longer than standard 30 days)
- 1.5% late fee per month on overdue amounts

## Duration and Termination
- 12-month initial term with automatic renewal
- Client can terminate without cause with 30 days notice
- Either party can terminate for material breach with 15 days notice and opportunity to cure

## Major Risks
1. Broad IP assignment language could transfer rights to pre-existing materials
2. One-sided indemnification favoring the client
3. No liability cap for service provider
4. Vague acceptance criteria for deliverables

## Unusual Terms
- Non-compete extends to client's potential future competitors
- Client can withhold final payment until all acceptance criteria are met, without clear timeline
- Governing law is Delaware (unusual if neither party is based there)

## Recommendations
1. Add mutual indemnification provisions
2. Include liability caps for both parties
3. Clarify deliverable acceptance process and timeline
4. Narrow IP assignment to exclude pre-existing materials
5. Reduce payment terms to industry-standard 30 days`;
      }
      
      setAnalysisResult(response);
    } catch (error) {
      console.error('Analysis error:', error);
      setAnalysisResult('An error occurred during analysis. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const exampleContracts = [
    {
      title: 'Consulting Agreement',
      excerpt: `CONSULTING AGREEMENT

THIS CONSULTING AGREEMENT (the "Agreement") is made and entered into as of [DATE] (the "Effective Date"), by and between [CLIENT NAME], a [STATE] corporation with its principal place of business at [ADDRESS] (the "Client"), and [CONSULTANT NAME], a [STATE] [entity type] with its principal place of business at [ADDRESS] (the "Consultant").

1. SERVICES
   1.1 Services. The Consultant shall provide the services described in Exhibit A attached hereto (the "Services").
   1.2 Performance. The Consultant shall perform the Services in a professional manner and in accordance with industry standards and the requirements set forth in this Agreement.
   1.3 Deliverables. The Consultant shall deliver to the Client the deliverables described in Exhibit A (the "Deliverables") in accordance with the schedule set forth therein.

2. COMPENSATION
   2.1 Fees. The Client shall pay the Consultant the fees set forth in Exhibit B attached hereto (the "Fees").
   2.2 Expenses. The Client shall reimburse the Consultant for reasonable expenses incurred in connection with the performance of the Services, provided that such expenses are approved in advance by the Client.
   2.3 Invoicing. The Consultant shall invoice the Client on a monthly basis for Fees and expenses. Payment shall be due within forty-five (45) days of receipt of invoice.`
    },
    {
      title: 'Employment Agreement',
      excerpt: `EMPLOYMENT AGREEMENT

THIS EMPLOYMENT AGREEMENT (the "Agreement") is made and entered into as of [DATE] (the "Effective Date"), by and between [EMPLOYER NAME], a [STATE] corporation with its principal place of business at [ADDRESS] (the "Employer"), and [EMPLOYEE NAME], an individual residing at [ADDRESS] (the "Employee").

1. EMPLOYMENT
   1.1 Position. The Employer hereby employs the Employee, and the Employee hereby accepts employment, as [POSITION TITLE] of the Employer.
   1.2 Duties. The Employee shall perform such duties as are customarily performed by someone in such position and such other duties as may be assigned from time to time by the Employer.
   1.3 Reporting. The Employee shall report directly to the [SUPERVISOR TITLE] of the Employer.

2. TERM
   2.1 Term. The term of this Agreement shall commence on the Effective Date and shall continue until terminated as provided herein (the "Term").
   2.2 At-Will Employment. The Employee's employment with the Employer is "at-will," meaning that either the Employee or the Employer may terminate the employment relationship at any time, with or without cause, and with or without notice.

3. COMPENSATION
   3.1 Base Salary. The Employer shall pay the Employee a base salary of $[AMOUNT] per year (the "Base Salary"), payable in accordance with the Employer's standard payroll practices.
   3.2 Benefits. The Employee shall be eligible to participate in the employee benefit plans and programs offered by the Employer to its employees, subject to the terms and conditions of such plans and programs.`
    }
  ];

  const tabs = [
    { id: 'prompts', label: 'Prompt Library', icon: Book },
    { id: 'tester', label: 'Prompt Tester', icon: Zap },
    { id: 'examples', label: 'Example Contracts', icon: FileText }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-green-100 rounded-xl mb-4">
            <FileCheck className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Contract Validator Prompts</h1>
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
            {activeTab === 'prompts' && (
              <ContractAnalysisPrompts onSelectPrompt={handleSelectPrompt} />
            )}

            {/* Prompt Tester Tab */}
            {activeTab === 'tester' && (
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Test Your Prompt</h2>
                    
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-1">
                          Prompt
                        </label>
                        <textarea
                          id="prompt"
                          value={selectedPrompt || customPrompt}
                          onChange={(e) => setCustomPrompt(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          rows={6}
                          placeholder="Enter your contract analysis prompt here..."
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="contract" className="block text-sm font-medium text-gray-700 mb-1">
                          Contract Text (Sample or Paste Your Own)
                        </label>
                        <textarea
                          id="contract"
                          value={contractText}
                          onChange={(e) => setContractText(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          rows={10}
                          placeholder="Paste contract text here..."
                        />
                      </div>
                      
                      <div className="flex space-x-3">
                        <button
                          onClick={() => setContractText(exampleContracts[0].excerpt)}
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                        >
                          Load Sample Contract
                        </button>
                        <button
                          onClick={handleAnalyzeContract}
                          disabled={!contractText.trim() || !(selectedPrompt.trim() || customPrompt.trim()) || isAnalyzing}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                        >
                          {isAnalyzing ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              <span>Analyzing...</span>
                            </>
                          ) : (
                            <>
                              <Zap className="h-4 w-4" />
                              <span>Analyze Contract</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-yellow-50 rounded-xl p-6 border border-yellow-100">
                    <div className="flex items-start space-x-3">
                      <Scale className="h-5 w-5 text-yellow-600 mt-1 flex-shrink-0" />
                      <div>
                        <h3 className="font-semibold text-yellow-800 mb-2">Legal Disclaimer</h3>
                        <p className="text-sm text-yellow-700">
                          This prompt testing tool is for educational purposes only. The AI-generated analysis is not a substitute for professional legal advice. 
                          Always consult with a qualified attorney for specific legal matters. The quality of analysis depends on the prompt, 
                          and results should be carefully reviewed.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-gray-900">Analysis Result</h2>
                      {analysisResult && (
                        <button
                          onClick={() => copyToClipboard(analysisResult)}
                          className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                          title="Copy result"
                        >
                          {copied ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>
                      )}
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 h-[500px] overflow-y-auto">
                      {analysisResult ? (
                        <div className="prose prose-sm max-w-none">
                          <pre className="whitespace-pre-wrap text-gray-700">{analysisResult}</pre>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <div className="text-center">
                            <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-gray-500">Analysis results will appear here</p>
                            <p className="text-sm text-gray-400 mt-1">Enter a prompt and contract text, then click "Analyze Contract"</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Example Contracts Tab */}
            {activeTab === 'examples' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Example Contracts for Testing</h2>
                
                <div className="grid md:grid-cols-2 gap-6">
                  {exampleContracts.map((contract, index) => (
                    <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                      <h3 className="font-semibold text-gray-900 mb-3">{contract.title}</h3>
                      
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 mb-4 h-64 overflow-y-auto">
                        <pre className="text-sm text-gray-700 whitespace-pre-wrap">{contract.excerpt}</pre>
                      </div>
                      
                      <div className="flex space-x-3">
                        <button
                          onClick={() => copyToClipboard(contract.excerpt)}
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
                            setContractText(contract.excerpt);
                            setActiveTab('tester');
                          }}
                          className="flex items-center space-x-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                        >
                          <Zap className="h-4 w-4" />
                          <span>Use for Testing</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
                  <div className="flex items-start space-x-3">
                    <Lightbulb className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-blue-800 mb-2">Prompt Testing Tips</h3>
                      <p className="text-sm text-blue-700 mb-3">
                        When testing contract analysis prompts, try these approaches:
                      </p>
                      <ul className="text-sm text-blue-700 space-y-1 list-disc pl-4">
                        <li>Test the same contract with different prompts to compare results</li>
                        <li>Start with general analysis, then focus on specific areas of concern</li>
                        <li>Try both technical legal prompts and plain language prompts</li>
                        <li>Experiment with different response formats (narrative, bullet points, JSON)</li>
                        <li>Combine multiple prompt elements for comprehensive analysis</li>
                      </ul>
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

export default ContractValidatorPrompts;