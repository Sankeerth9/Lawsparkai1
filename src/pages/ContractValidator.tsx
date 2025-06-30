import React, { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, AlertTriangle, XCircle, Download, Eye, Shield, Clock, X, BarChart3, FileCheck, AlertCircle, Info, Star, TrendingUp, TrendingDown, Minus, Lightbulb, Scale } from 'lucide-react';
import { useGeminiAI } from '../hooks/useGeminiAI';
import { DocumentProcessor } from '../utils/documentProcessor';
import { indianLegalStandards } from '../utils/indianLegalStandards';
import { useAuth } from '../hooks/useAuth';
import { SupabaseService } from '../services/supabaseService';
import { ProtectedRoute } from '../components/ProtectedRoute';
import ApiKeySetup from '../components/ApiKeySetup';

interface ClauseAnalysis {
  id: string;
  title: string;
  content: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  score: number;
  issues: string[];
  vague_language?: string[];
  suggested_improvements?: string[];
  plain_language_explanation?: string;
  suggestions: string[];
  category: string;
  lineNumbers?: number[];
}

interface ValidationResult {
  overallScore: number;
  riskLevel: 'excellent' | 'good' | 'fair' | 'poor';
  clauses: ClauseAnalysis[];
  compliance?: {
    indian_contract_act: boolean;
    labour_laws: boolean;
    gdpr_compliance: boolean;
    compliance_notes: string[];
  };
  negotiation_score?: number;
  missing_clauses?: string[];
  summary: {
    totalClauses: number;
    criticalIssues: number;
    warnings: number;
    suggestions: number;
    strengths: string[];
    weaknesses: string[];
  };
  analysisTime: number;
}

interface ContractValidatorContentProps {
  user: any;
}

const ContractValidatorContent: React.FC<ContractValidatorContentProps> = ({ user }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedClause, setSelectedClause] = useState<string | null>(null);
  const [analysisStage, setAnalysisStage] = useState('');
  
  // State for detailed analysis modal
  const [showDetailedAnalysis, setShowDetailedAnalysis] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { 
    isLoading, 
    error, 
    analyzeContract, 
    clearError,
    isConfigured 
  } = useGeminiAI();

  const analysisStages = [
    'Parsing document structure...',
    'Identifying legal clauses...',
    'Analyzing contract terms...',
    'Assessing risk factors...',
    'Generating recommendations...',
    'Finalizing analysis...'
  ];

  const handleFileUpload = (uploadedFile: File) => {
    const validation = DocumentProcessor.validateFile(uploadedFile);
    if (!validation.isValid) {
      alert(validation.error);
      return;
    }

    setFile(uploadedFile);
    setValidationResult(null);
    setAnalysisProgress(0);
    clearError();
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleAnalysis = async () => {
    if (!file || !isConfigured) return;
    
    setIsAnalyzing(true);
    setAnalysisProgress(0);
    
    try {
      // Process the document
      const processedDoc = await DocumentProcessor.processFile(file);
      
      // Show realistic progress through different stages
      // Simulate realistic analysis progress
      for (let i = 0; i < analysisStages.length; i++) {
        setAnalysisStage(analysisStages[i]);
        
        // Update progress for each stage
        for (let progress = 0; progress <= 100; progress += 20) {
          await new Promise(resolve => setTimeout(resolve, 100));
          setAnalysisProgress((i * 100 + progress) / analysisStages.length);
        }
        
        // Add Indian legal standards check to the analysis stages
        if (i === 2) {
          setAnalysisStage("Checking Indian Contract Act compliance...");
        } else if (i === 3) {
          setAnalysisStage("Analyzing compliance with Indian labour laws...");
        } else if (i === 4) {
          setAnalysisStage("Detecting missing critical clauses for Indian context...");
        }
        
      }

      // Get AI analysis
      const startTime = Date.now();
      const result = await analyzeContract(processedDoc.text);
      const analysisTime = (Date.now() - startTime) / 1000;
      
      // Add analysis time to result
      const finalResult = {
        ...result,
        analysisTime: Math.round(analysisTime * 10) / 10
      };
      
      setValidationResult(finalResult);

      // Save analysis to Supabase if user is authenticated
      if (user) {
        try {
          await SupabaseService.saveContractAnalysis({
            document_name: file.name,
            document_content: processedDoc.text.substring(0, 10000), // Limit content size
            overall_score: finalResult.overallScore,
            risk_level: finalResult.riskLevel,
            clauses: finalResult.clauses,
            summary: finalResult.summary,
            analysis_time: finalResult.analysisTime
          });

          // Log API usage
          await SupabaseService.logApiUsage({
            endpoint: '/api/contract-analysis',
            method: 'POST',
            response_time_ms: analysisTime * 1000,
            status_code: 200,
            metadata: {
              fileName: file.name,
              fileSize: file.size,
              overallScore: finalResult.overallScore,
              riskLevel: finalResult.riskLevel
            }
          });
        } catch (error) {
          console.error('Failed to save analysis:', error);
        }
      }
    } catch (error) {
      console.error('Analysis error:', error);
      
      // Log failed API usage
      if (user) {
        await SupabaseService.logApiUsage({
          endpoint: '/api/contract-analysis',
          method: 'POST',
          response_time_ms: Date.now() - Date.now(),
          status_code: 500,
          error_message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    } finally {
      setIsAnalyzing(false);
      setAnalysisProgress(100);
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return <CheckCircle className="h-4 w-4" />;
      case 'medium': return <AlertTriangle className="h-4 w-4" />;
      case 'high': return <AlertCircle className="h-4 w-4" />;
      case 'critical': return <XCircle className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreTrend = (score: number) => {
    if (score >= 80) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (score >= 60) return <Minus className="h-4 w-4 text-yellow-600" />;
    return <TrendingDown className="h-4 w-4 text-red-600" />;
  };

  const downloadReport = () => {
    if (!validationResult) return;
    
    // Create a formatted text report instead of JSON
    const textReport = createTextReport(validationResult);
    
    // Create a blob and download
    const blob = new Blob([textReport], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contract-analysis-${file?.name?.replace(/\.[^/.]+$/, '')}-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const createTextReport = (result: ValidationResult): string => {
    // Format headers with consistent style
    const formatHeader = (text: string, level: number = 1): string => {
      if (level === 1) {
        return `\n${text.toUpperCase()}\n${'='.repeat(text.length)}\n`;
      } else {
        return `\n${text}\n${'-'.repeat(text.length)}\n`;
      }
    };

    let report = `CONTRACT ANALYSIS REPORT
===============================

Document: ${file?.name || 'Untitled Document'}
Analysis Date: ${new Date().toLocaleString()}
Analysis Time: ${result.analysisTime?.toFixed(1) || '0'} seconds

OVERALL ASSESSMENT
------------------
Score: ${result.overallScore}/100
Risk Level: ${result.riskLevel?.toUpperCase() || 'Unknown'}`;

    // Add negotiation score if available
    if (result.negotiation_score !== undefined) {
      report += `\nNegotiation Readiness Score: ${result.negotiation_score}/100`;
    }

    // Add Indian compliance details if available
    if (result.compliance) {
      report += formatHeader('INDIAN LEGAL COMPLIANCE', 2);
      report += `Indian Contract Act: ${result.compliance.indian_contract_act ? 'Compliant' : 'Non-compliant'}\n`;
      report += `Indian Labour Laws: ${result.compliance.labour_laws ? 'Compliant' : 'Non-compliant'}\n`;
      report += `Data Protection: ${result.compliance.gdpr_compliance ? 'Compliant' : 'Non-compliant'}\n`;
      
      if (result.compliance.compliance_notes?.length) {
        report += "\nCompliance Notes:\n";
        result.compliance.compliance_notes.forEach((note, i) => {
          report += `${i+1}. ${note}\n`;
        });
      }
    }

    // Add missing clauses section if available
    if (result.missing_clauses?.length) {
      report += formatHeader('MISSING CRITICAL CLAUSES', 2);
      result.missing_clauses.forEach((clause, i) => {
        report += `${i+1}. ${clause}\n`;
      });
    }

    report += formatHeader('SUMMARY', 2);
    report += `Critical Issues: ${result.summary.criticalIssues || 0}\n`;
    report += `Warnings: ${result.summary.warnings || 0}\n`;
    report += `Suggestions: ${result.summary.suggestions || 0}\n`;
    report += `Total Clauses: ${result.summary.totalClauses || 0}\n`;
    
    if (result.summary.strengths?.length) {
      report += "\nStrengths:\n";
      result.summary.strengths.forEach((strength, i) => {
        report += `${i+1}. ${strength}\n`;
      });
    }
    
    if (result.summary.weaknesses?.length) {
      report += "\nWeaknesses:\n";
      result.summary.weaknesses.forEach((weakness, i) => {
        report += `${i+1}. ${weakness}\n`;
      });
    }
    
    report += formatHeader('CLAUSE ANALYSIS', 1);
    
    result.clauses.forEach((clause, i) => {
      report += `\n${i+1}. ${clause.title}\n`;
      report += `${'~'.repeat(clause.title.length + 3)}\n`;
      report += `Category: ${clause.category}\n`;
      report += `Risk Level: ${clause.riskLevel.toUpperCase()}\n`;
      report += `Score: ${clause.score}/100\n\n`;
      
      // Add plain language explanation if available
      if (clause.plain_language_explanation) {
        report += `Plain Language Explanation:\n${clause.plain_language_explanation}\n\n`;
      }
      
      if (clause.issues?.length) {
        report += "Issues:\n";
        clause.issues.forEach((issue, j) => {
          report += `  - ${issue}\n`;
        });
        report += "\n";
      }
      
      // Add vague language if available
      if (clause.vague_language?.length) {
        report += "Vague Language Identified:\n";
        clause.vague_language.forEach((vague, j) => {
          report += `  - ${vague}\n`;
        });
        report += "\n";
      }
      
      // Add suggestions for improvements
      if (clause.suggested_improvements?.length) {
        report += "Suggested Improvements:\n";
        clause.suggested_improvements.forEach((improvement, j) => {
          report += `  - ${improvement}\n`;
        });
        report += "\n";
      }
      
      if (clause.suggestions?.length) {
        report += "Recommendations:\n";
        clause.suggestions.forEach((suggestion, j) => {
          report += `  - ${suggestion}\n`;
        });
        report += "\n";
      }
    });
    
    report += `\n\nDISCLAIMER: This analysis is provided for informational purposes only and does not constitute legal advice.`;
    report += `\nFor specific legal matters, please consult with a qualified attorney.`;
    report += `\n\nGenerated by LawSpark AI - Specialized for Indian legal frameworks`;
    
    return report;
  };

  // Function to handle the "View Detailed Analysis" button
  const viewDetailedAnalysis = () => {
    if (!validationResult) return;
    setShowDetailedAnalysis(true);
  };

  const downloadAnalysisAsJson = (analysis: any) => {
    const reportData = {
      fileName: file?.name,
      analysisDate: new Date().toISOString(),
      overallScore: validationResult.overallScore,
      riskLevel: validationResult.riskLevel,
      analysisTime: validationResult.analysisTime,
      summary: validationResult.summary,
      clauses: validationResult.clauses.map(clause => ({
        title: clause.title,
        riskLevel: clause.riskLevel,
        score: clause.score,
        issues: clause.issues,
        suggestions: clause.suggestions,
        category: clause.category
      }))
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contract-analysis-${file?.name?.replace(/\.[^/.]+$/, '')}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <div className="inline-flex p-3 bg-green-100 rounded-xl mb-4">
              <FileCheck className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Contract Validator</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              AI-powered contract analysis requires API configuration
            </p>
          </div>
          <ApiKeySetup />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-green-100 rounded-xl mb-4">
            <FileCheck className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Contract Validator</h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Upload your contract for comprehensive AI-powered analysis using Google Gemini Pro. Get detailed clause-by-clause insights, 
            risk assessments, and actionable recommendations.
          </p>
          {user && (
            <div className="mt-4 text-sm text-gray-500">
              Signed in as {user.email} • Your analysis results are automatically saved
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-800">Analysis Error</h3>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
              <button
                onClick={clearError}
                className="text-red-500 hover:text-red-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Upload Section */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8 mb-8">
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
              dragActive 
                ? 'border-blue-400 bg-blue-50 scale-105' 
                : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="space-y-4">
              <div className="inline-flex p-4 bg-blue-100 rounded-xl">
                <Upload className="h-10 w-10 text-blue-600" />
              </div>
              
              {file ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-center space-x-3">
                    <FileText className="h-6 w-6 text-green-600" />
                    <span className="font-semibold text-gray-900 text-lg">{file.name}</span>
                  </div>
                  <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
                    <span>{DocumentProcessor.formatFileSize(file.size)}</span>
                    <span>•</span>
                    <span>{file.type.split('/')[1].toUpperCase()}</span>
                    <span>•</span>
                    <span>Uploaded {new Date().toLocaleTimeString()}</span>
                  </div>
                  <div className="flex justify-center space-x-4">
                    <button
                      onClick={handleAnalysis}
                      disabled={isAnalyzing || isLoading}
                      className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center space-x-2 font-semibold"
                    >
                      {isAnalyzing || isLoading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Analyzing...</span>
                        </>
                      ) : (
                        <>
                          <BarChart3 className="h-5 w-5" />
                          <span>Analyze Contract</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setFile(null);
                        setValidationResult(null);
                        setAnalysisProgress(0);
                        clearError();
                      }}
                      className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
                    >
                      Remove File
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-gray-900">Upload Your Contract</h3>
                  <p className="text-gray-600 text-lg">
                    Drag and drop your contract file here, or click to browse
                  </p>
                  <div className="flex justify-center">
                    <label className="cursor-pointer px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-semibold">
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        accept=".pdf,.doc,.docx,.txt"
                        onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                      />
                      Choose Contract File
                    </label>
                  </div>
                  <p className="text-sm text-gray-500">
                    Supported formats: PDF, DOC, DOCX, TXT • Maximum size: 10MB
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Analysis Progress */}
        {isAnalyzing && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8 mb-8">
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex p-3 bg-blue-100 rounded-xl mb-4">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Analyzing Your Contract</h3>
                <p className="text-gray-600">{analysisStage}</p>
              </div>
              
              <div className="max-w-2xl mx-auto">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Progress</span>
                  <span>{Math.round(analysisProgress)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${analysisProgress}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Analysis Results */}
        {validationResult && (
          <div className="space-y-8">
            {/* Overall Score & Summary */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8">
              <div className="grid lg:grid-cols-3 gap-8">
                {/* Score Circle */}
                <div className="text-center">
                  <div className="relative inline-flex items-center justify-center w-32 h-32 mb-4">
                    <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        className="text-gray-200"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={`${2 * Math.PI * 40}`}
                        strokeDashoffset={`${2 * Math.PI * 40 * (1 - validationResult.overallScore / 100)}`}
                        className={getScoreColor(validationResult.overallScore)}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className={`text-3xl font-bold ${getScoreColor(validationResult.overallScore)}`}>
                        {validationResult.overallScore}
                      </span>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Overall Score</h3>
                  <div className={`inline-flex items-center px-4 py-2 rounded-full font-semibold ${getRiskColor(validationResult.riskLevel)}`}>
                    {getRiskIcon(validationResult.riskLevel)}
                    <span className="ml-2 capitalize">{validationResult.riskLevel}</span>
                  </div>
                </div>

                {/* Key Metrics */}
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Analysis Summary</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-gray-900">{validationResult.summary.totalClauses}</div>
                      <div className="text-sm text-gray-600">Total Clauses</div>
                    </div>
                    <div className="bg-red-50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-red-600">{validationResult.summary.criticalIssues}</div>
                      <div className="text-sm text-gray-600">Critical Issues</div>
                    </div>
                    <div className="bg-yellow-50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-yellow-600">{validationResult.summary.warnings}</div>
                      <div className="text-sm text-gray-600">Warnings</div>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-blue-600">{validationResult.summary.suggestions}</div>
                      <div className="text-sm text-gray-600">Suggestions</div>
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Analysis Details</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Analysis Time</span>
                      <span className="font-semibold">{validationResult.analysisTime}s</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Document Size</span>
                      <span className="font-semibold">{file ? DocumentProcessor.formatFileSize(file.size) : '0 MB'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Risk Level</span>
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${getRiskColor(validationResult.riskLevel)}`}>
                        {getRiskIcon(validationResult.riskLevel)}
                        <span className="ml-1 capitalize">{validationResult.riskLevel}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Clause Analysis Table */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">Clause-by-Clause Analysis</h2>
                <p className="text-gray-600 mt-2">Detailed breakdown of each contract clause with risk assessment and recommendations</p>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Clause</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Category</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Score</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Risk Level</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Issues</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {validationResult.clauses.map((clause) => (
                      <tr key={clause.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="font-semibold text-gray-900">{clause.title}</div>
                            {clause.lineNumbers && clause.lineNumbers.length > 0 && (
                              <div className="text-sm text-gray-500">Lines {clause.lineNumbers.join(', ')}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                            {clause.category}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <span className={`text-lg font-bold ${getScoreColor(clause.score)}`}>
                              {clause.score}
                            </span>
                            {getScoreTrend(clause.score)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${getRiskColor(clause.riskLevel)}`}>
                            {getRiskIcon(clause.riskLevel)}
                            <span className="ml-2 capitalize">{clause.riskLevel}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600">
                            {clause.issues.length} issues, {clause.suggestions.length} suggestions
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => setSelectedClause(selectedClause === clause.id ? null : clause.id)}
                            className="inline-flex items-center px-3 py-1 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            {selectedClause === clause.id ? 'Hide' : 'View'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Detailed Clause View */}
            {selectedClause && (
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8">
                {(() => {
                  const clause = validationResult.clauses.find(c => c.id === selectedClause);
                  if (!clause) return null;
                  
                  return (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-2xl font-bold text-gray-900">{clause.title}</h3>
                        <button
                          onClick={() => setSelectedClause(null)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <X className="h-5 w-5 text-gray-500" />
                        </button>
                      </div>
                      
                      <div className="grid lg:grid-cols-3 gap-8">
                        {/* Clause Content */}
                        <div className="lg:col-span-2 space-y-4">
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">Clause Content</h4>
                            <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-blue-500">
                              <p className="text-gray-700 leading-relaxed">{clause.content}</p>
                              {clause.lineNumbers && clause.lineNumbers.length > 0 && (
                                <p className="text-sm text-gray-500 mt-2">Lines: {clause.lineNumbers.join(', ')}</p>
                              )}
                            </div>
                          </div>
                          
                          {clause.issues.length > 0 && (
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                                <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                                Issues Identified
                              </h4>
                              <div className="space-y-2">
                                {clause.issues.map((issue, index) => (
                                  <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-3">
                                    <p className="text-red-800 text-sm">{issue}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {clause.suggestions.length > 0 && (
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                                Recommendations
                              </h4>
                              <div className="space-y-2">
                                {clause.suggestions.map((suggestion, index) => (
                                  <div key={index} className="bg-green-50 border border-green-200 rounded-lg p-3">
                                    <p className="text-green-800 text-sm">{suggestion}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Plain Language Explanation */}
                          {clause.plain_language_explanation && (
                            <div className="mt-4">
                              <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                                <Lightbulb className="h-5 w-5 text-blue-500 mr-2" />
                                Plain Language Explanation
                              </h4>
                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <p className="text-blue-800 text-sm">{clause.plain_language_explanation}</p>
                              </div>
                            </div>
                          )}
                          
                          {/* Vague Language */}
                          {clause.vague_language && clause.vague_language.length > 0 && (
                            <div className="mt-4">
                              <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                                <AlertCircle className="h-5 w-5 text-yellow-500 mr-2" />
                                Vague Language Detected
                              </h4>
                              <div className="space-y-2">
                                {clause.vague_language.map((vagueText, index) => (
                                  <div key={index} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                    <p className="text-yellow-800 text-sm font-medium mb-1">{vagueText}</p>
                                    {clause.suggested_improvements && clause.suggested_improvements[index] && (
                                      <div className="mt-2 pt-2 border-t border-yellow-200">
                                        <p className="text-green-700 text-sm">
                                          <span className="font-medium">Suggested Improvement: </span>
                                          {clause.suggested_improvements[index]}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Clause Metrics */}
                        <div className="space-y-4">
                          <div className="bg-gray-50 rounded-lg p-4">
                            <h4 className="font-semibold text-gray-900 mb-3">Clause Metrics</h4>
                            <div className="space-y-3">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Score</span>
                                <span className={`font-bold ${getScoreColor(clause.score)}`}>{clause.score}/100</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Risk Level</span>
                                <div className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${getRiskColor(clause.riskLevel)}`}>
                                  {getRiskIcon(clause.riskLevel)}
                                  <span className="ml-1 capitalize">{clause.riskLevel}</span>
                                </div>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Category</span>
                                <span className="font-semibold">{clause.category}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Issues</span>
                                <span className="font-semibold text-red-600">{clause.issues.length}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Suggestions</span>
                                <span className="font-semibold text-green-600">{clause.suggestions.length}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Strengths and Weaknesses */}
            <div className="grid lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <CheckCircle className="h-6 w-6 text-green-500 mr-2" />
                  Contract Strengths
                  <div className="ml-2 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                    Overall Score: {validationResult.overallScore}/100
                  </div>
                </h3>
                <div className="space-y-3">
                  {validationResult.summary.strengths.map((strength, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-gray-700">{strength}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Missing Clauses Section */}
              {validationResult.missing_clauses && validationResult.missing_clauses.length > 0 && (
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                    <AlertTriangle className="h-6 w-6 text-red-500 mr-2" />
                    Missing Critical Clauses
                  </h3>
                  <div className="space-y-3">
                    {validationResult.missing_clauses.map((clause, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                        <div>
                          <p className="font-medium text-gray-900">{clause}</p>
                          <p className="text-sm text-gray-700 mt-1">
                            This clause is important for legal completeness and protection.
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Indian Compliance Section */}
              {validationResult.compliance && (
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                    <Shield className="h-6 w-6 text-blue-600 mr-2" />
                    Indian Legal Compliance
                  </h3>
                  
                  <div className="grid md:grid-cols-3 gap-6 mb-6">
                    <div className={`p-4 rounded-lg ${validationResult.compliance.indian_contract_act ? 'bg-green-50 border border-green-100' : 'bg-red-50 border border-red-100'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">Indian Contract Act</h4>
                        {validationResult.compliance.indian_contract_act ? 
                          <CheckCircle className="h-5 w-5 text-green-500" /> :
                          <AlertTriangle className="h-5 w-5 text-red-500" />
                        }
                      </div>
                      <p className="text-sm text-gray-600">
                        {validationResult.compliance.indian_contract_act ? 
                          'Compliant with Indian Contract Act provisions' : 
                          'Does not fully comply with Indian Contract Act requirements'}
                      </p>
                    </div>
                    
                    <div className={`p-4 rounded-lg ${validationResult.compliance.labour_laws ? 'bg-green-50 border border-green-100' : 'bg-red-50 border border-red-100'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">Labour Laws</h4>
                        {validationResult.compliance.labour_laws ? 
                          <CheckCircle className="h-5 w-5 text-green-500" /> :
                          <AlertTriangle className="h-5 w-5 text-red-500" />
                        }
                      </div>
                      <p className="text-sm text-gray-600">
                        {validationResult.compliance.labour_laws ? 
                          'Aligned with Indian labour law requirements' : 
                          'Has provisions that may conflict with Indian labour laws'}
                      </p>
                    </div>
                    
                    <div className={`p-4 rounded-lg ${validationResult.compliance.gdpr_compliance ? 'bg-green-50 border border-green-100' : 'bg-yellow-50 border border-yellow-100'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">GDPR/Data Protection</h4>
                        {validationResult.compliance.gdpr_compliance ? 
                          <CheckCircle className="h-5 w-5 text-green-500" /> :
                          <AlertTriangle className="h-5 w-5 text-yellow-500" />
                        }
                      </div>
                      <p className="text-sm text-gray-600">
                        {validationResult.compliance.gdpr_compliance ? 
                          'Contains adequate data protection provisions' : 
                          'May need stronger data protection clauses'}
                      </p>
                    </div>
                  </div>
                  
                  {validationResult.compliance.compliance_notes && validationResult.compliance.compliance_notes.length > 0 && (
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                      <h4 className="font-semibold text-blue-800 mb-2">Compliance Notes</h4>
                      <ul className="space-y-2 text-sm text-blue-700">
                        {validationResult.compliance.compliance_notes.map((note, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <span>{note}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Negotiation Readiness Section */}
              {validationResult.negotiation_score && (
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                    <Scale className="h-6 w-6 text-purple-600 mr-2" />
                    Negotiation Readiness Score: {validationResult.negotiation_score}/100
                  </h3>
                  
                  <div className="w-full bg-gray-200 rounded-full h-4 mb-6">
                    <div 
                      className={`h-4 rounded-full ${
                        validationResult.negotiation_score >= 80 ? 'bg-green-500' : 
                        validationResult.negotiation_score >= 60 ? 'bg-blue-500' : 
                        validationResult.negotiation_score >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${validationResult.negotiation_score}%` }}
                    ></div>
                  </div>
                  
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-red-500">Unfavorable</span>
                    <span className="text-yellow-500">Neutral</span>
                    <span className="text-green-500">Favorable</span>
                  </div>
                  
                  <p className="text-gray-700 mt-4">
                    {validationResult.negotiation_score >= 80 
                      ? "This contract is well-balanced and favorable. You're in a strong negotiating position." 
                      : validationResult.negotiation_score >= 60
                      ? "This contract has a reasonable balance but could be improved in some areas before signing."
                      : validationResult.negotiation_score >= 40
                      ? "This contract has several areas that need negotiation before signing."
                      : "This contract is significantly unfavorable and needs major renegotiation before signing."}
                  </p>
                </div>
              )}

              <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <AlertTriangle className="h-6 w-6 text-red-500 mr-2" />
                  Areas for Improvement
                </h3>
                <div className="space-y-3">
                  {validationResult.summary.weaknesses.map((weakness, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-gray-700">{weakness}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Next Steps</h3>
              <div className="flex flex-wrap md:flex-nowrap gap-4">
                <div className="flex-1">
                  <button 
                    onClick={downloadReport}
                    className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                  >
                    <Download className="h-5 w-5" />
                    <span>Download Full Report</span>
                  </button>
                </div>
                <div className="flex-1">
                  <button 
                    onClick={() => downloadAnalysisAsJson(validationResult)}
                    className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
                  >
                    <Download className="h-5 w-5" />
                    <span>Download as JSON</span>
                  </button>
                </div>
                <div className="flex-1">
                  <button 
                    onClick={() => {
                      setFile(null);
                      setValidationResult(null);
                      setAnalysisProgress(0);
                      clearError();
                    }}
                    className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
                  >
                    <Upload className="h-5 w-5" />
                    <span>Analyze New Contract</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Detailed Analysis Modal */}
        {showDetailedAnalysis && validationResult && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              <div className="flex items-center justify-between bg-blue-600 text-white px-6 py-4">
                <h3 className="text-xl font-bold">Detailed Contract Analysis</h3>
                <button 
                  onClick={() => setShowDetailedAnalysis(false)}
                  className="p-1 hover:bg-blue-700 rounded-full"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-8">
                  {/* Overall Assessment */}
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Overall Assessment</h4>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="bg-gray-100 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold mb-1">{validationResult.overallScore}/100</div>
                        <div className="text-sm text-gray-600">Overall Score</div>
                      </div>
                      <div className={`p-4 rounded-lg text-center ${
                        validationResult.riskLevel === 'excellent' ? 'bg-green-100 text-green-800' :
                        validationResult.riskLevel === 'good' ? 'bg-blue-100 text-blue-800' :
                        validationResult.riskLevel === 'fair' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        <div className="text-2xl font-bold mb-1 capitalize">{validationResult.riskLevel}</div>
                        <div className="text-sm">Risk Level</div>
                      </div>
                      {validationResult.negotiation_score && (
                        <div className="bg-purple-100 text-purple-800 p-4 rounded-lg text-center">
                          <div className="text-2xl font-bold mb-1">{validationResult.negotiation_score}/100</div>
                          <div className="text-sm">Negotiation Readiness</div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Indian Compliance Section */}
                  {validationResult.compliance && (
                    <div>
                      <h4 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Indian Legal Compliance</h4>
                      <div className="grid md:grid-cols-3 gap-4 mb-4">
                        <div className={`p-4 rounded-lg ${validationResult.compliance.indian_contract_act ? 'bg-green-100' : 'bg-red-100'}`}>
                          <div className="font-semibold">{validationResult.compliance.indian_contract_act ? '✓' : '✗'} Indian Contract Act</div>
                          <div className="text-sm text-gray-600">Basic contract requirements</div>
                        </div>
                        <div className={`p-4 rounded-lg ${validationResult.compliance.labour_laws ? 'bg-green-100' : 'bg-red-100'}`}>
                          <div className="font-semibold">{validationResult.compliance.labour_laws ? '✓' : '✗'} Labour Laws</div>
                          <div className="text-sm text-gray-600">Employment standards compliance</div>
                        </div>
                        <div className={`p-4 rounded-lg ${validationResult.compliance.gdpr_compliance ? 'bg-green-100' : 'bg-red-100'}`}>
                          <div className="font-semibold">{validationResult.compliance.gdpr_compliance ? '✓' : '✗'} Data Protection</div>
                          <div className="text-sm text-gray-600">Privacy requirements</div>
                        </div>
                      </div>
                      
                      {validationResult.compliance.compliance_notes?.length > 0 && (
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <h5 className="font-semibold mb-2 text-blue-800">Compliance Notes:</h5>
                          <ul className="list-disc list-inside text-sm space-y-1">
                            {validationResult.compliance.compliance_notes.map((note, i) => (
                              <li key={i} className="text-blue-800">{note}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Missing Clauses Section */}
                  {validationResult.missing_clauses && validationResult.missing_clauses.length > 0 && (
                    <div>
                      <h4 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">
                        Missing Critical Clauses
                      </h4>
                      <div className="bg-yellow-50 p-4 rounded-lg">
                        <p className="text-yellow-800 mb-2">
                          Your contract is missing these important clauses:
                        </p>
                        <ul className="space-y-2">
                          {validationResult.missing_clauses.map((clause, i) => (
                            <li key={i} className="flex items-start space-x-2">
                              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                              <span className="text-yellow-800">{clause}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                  
                  {/* Summary Section */}
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Summary</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="bg-gray-100 p-3 rounded-lg text-center">
                        <div className="font-semibold text-lg">{validationResult.summary.totalClauses}</div>
                        <div className="text-xs text-gray-600">Total Clauses</div>
                      </div>
                      <div className="bg-red-50 p-3 rounded-lg text-center">
                        <div className="font-semibold text-lg text-red-700">{validationResult.summary.criticalIssues}</div>
                        <div className="text-xs text-gray-600">Critical Issues</div>
                      </div>
                      <div className="bg-yellow-50 p-3 rounded-lg text-center">
                        <div className="font-semibold text-lg text-yellow-700">{validationResult.summary.warnings}</div>
                        <div className="text-xs text-gray-600">Warnings</div>
                      </div>
                      <div className="bg-blue-50 p-3 rounded-lg text-center">
                        <div className="font-semibold text-lg text-blue-700">{validationResult.summary.suggestions}</div>
                        <div className="text-xs text-gray-600">Suggestions</div>
                      </div>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                      {validationResult.summary.strengths?.length > 0 && (
                        <div className="bg-green-50 p-4 rounded-lg">
                          <h5 className="font-semibold mb-2 text-green-800">Strengths:</h5>
                          <ul className="list-disc list-inside space-y-1">
                            {validationResult.summary.strengths.map((strength, i) => (
                              <li key={i} className="text-green-800">{strength}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {validationResult.summary.weaknesses?.length > 0 && (
                        <div className="bg-red-50 p-4 rounded-lg">
                          <h5 className="font-semibold mb-2 text-red-800">Areas for Improvement:</h5>
                          <ul className="list-disc list-inside space-y-1">
                            {validationResult.summary.weaknesses.map((weakness, i) => (
                              <li key={i} className="text-red-800">{weakness}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Clause Analysis Section */}
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Detailed Clause Analysis</h4>
                    <div className="space-y-6">
                      {validationResult.clauses.map((clause, i) => (
                        <div key={i} className="border rounded-lg overflow-hidden">
                          <div className={`p-4 ${
                            clause.riskLevel === 'low' ? 'bg-green-50' :
                            clause.riskLevel === 'medium' ? 'bg-yellow-50' :
                            clause.riskLevel === 'high' ? 'bg-orange-50' :
                            'bg-red-50'
                          }`}>
                            <div className="flex justify-between items-center">
                              <h5 className="font-bold">{clause.title}</h5>
                              <div className="flex items-center space-x-3">
                                <span className="text-gray-700">Score: {clause.score}/100</span>
                                <span className={`capitalize px-2 py-1 rounded text-sm font-semibold ${
                                  clause.riskLevel === 'low' ? 'bg-green-100 text-green-800' :
                                  clause.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                  clause.riskLevel === 'high' ? 'bg-orange-100 text-orange-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {clause.riskLevel}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="p-4 bg-white">
                            {clause.plain_language_explanation && (
                              <div className="mb-4 bg-gray-50 p-3 rounded border border-gray-200">
                                <div className="font-semibold mb-1">Plain Language Explanation:</div>
                                <p className="text-sm text-gray-700">{clause.plain_language_explanation}</p>
                              </div>
                            )}
                            
                            {clause.issues.length > 0 && (
                              <div className="mb-4">
                                <div className="font-semibold mb-1">Issues:</div>
                                <ul className="list-disc list-inside text-sm space-y-1">
                                  {clause.issues.map((issue, j) => (
                                    <li key={j} className="text-red-700">{issue}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            {clause.vague_language && clause.vague_language.length > 0 && (
                              <div className="mb-4">
                                <div className="font-semibold mb-1">Vague Language:</div>
                                <ul className="list-disc list-inside text-sm space-y-1">
                                  {clause.vague_language.map((vague, j) => (
                                    <li key={j} className="text-orange-700">{vague}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            {clause.suggested_improvements && clause.suggested_improvements.length > 0 && (
                              <div className="mb-4">
                                <div className="font-semibold mb-1">Suggested Improvements:</div>
                                <ul className="list-disc list-inside text-sm space-y-1">
                                  {clause.suggested_improvements.map((improvement, j) => (
                                    <li key={j} className="text-blue-700">{improvement}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            {clause.suggestions.length > 0 && (
                              <div>
                                <div className="font-semibold mb-1">Recommendations:</div>
                                <ul className="list-disc list-inside text-sm space-y-1">
                                  {clause.suggestions.map((suggestion, j) => (
                                    <li key={j} className="text-green-700">{suggestion}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  Analysis Time: {validationResult.analysisTime?.toFixed(1) || '0'} seconds
                </div>
                <div className="flex space-x-4">
                  <button
                    onClick={() => setShowDetailedAnalysis(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={downloadReport}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download Report</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Features Info */}
        {!validationResult && !isAnalyzing && (
          <div className="grid md:grid-cols-3 gap-8 mt-8">
            <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-100 text-center">
              <div className="inline-flex p-4 bg-blue-100 rounded-xl mb-4">
                <Shield className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="font-bold text-gray-900 text-lg mb-2">Enterprise Security</h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-2">
                Bank-level encryption with DPDP Act compliance.
              </p>
              <div className="text-xs text-blue-600">Made for Indian data privacy laws</div>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-100 text-center">
              <div className="inline-flex p-4 bg-green-100 rounded-xl mb-4">
                <BarChart3 className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="font-bold text-gray-900 text-lg mb-2">AI-Powered Analysis</h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-2">
                Specialized Indian legal AI checks compliance with Indian Contract Act.
              </p>
              <div className="text-xs text-blue-600">Indian legal standards built-in</div>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-100 text-center">
              <div className="inline-flex p-4 bg-yellow-100 rounded-xl mb-4">
                <AlertTriangle className="h-8 w-8 text-yellow-600" />
              </div>
              <h3 className="font-bold text-gray-900 text-lg mb-2">Missing Clause Detection</h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-2">
                Identifies critical missing clauses required in Indian contracts.
              </p>
              <div className="text-xs text-blue-600">GST & statutory compliance checks</div>
            </div>
          </div>
        )}

        {/* Legal Image */}
        {!validationResult && !isAnalyzing && (
          <div className="mt-12 bg-white rounded-xl shadow-lg border border-gray-100 p-8">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <img 
                  src="https://images.pexels.com/photos/5668481/pexels-photo-5668481.jpeg" 
                  alt="Legal gavel and scales of justice" 
                  className="rounded-lg shadow-md w-full h-auto"
                />
              </div>
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-gray-900">Professional Legal Analysis</h3>
                <p className="text-gray-600">
                  Our AI-powered contract validator provides professional-grade analysis that helps you identify potential issues in Indian contracts, 
                  understand complex legal terminology, and make informed decisions about your agreements.
                </p>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-800">Indian Law Compliance Checker</p>
                      <p className="text-sm text-gray-600">Ensures your contract follows Indian Contract Act and labour laws</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-800">Missing Clause Detection</p>
                      <p className="text-sm text-gray-600">Identifies important clauses that should be added to your contract</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-800">Vague Language Highlighting</p>
                      <p className="text-sm text-gray-600">Spots ambiguous wording that could lead to disputes and suggests improvements</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-800">Plain Language Explanations</p>
                      <p className="text-sm text-gray-600">Understand complex legal terms in simple language</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-800">Indian Legal Compliance</p>
                      <p className="text-sm text-gray-600">Checks against Indian Contract Act and labour laws</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-800">Vague Language Detection</p>
                      <p className="text-sm text-gray-600">Highlights ambiguous terms that need clarification</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-800">Actionable Recommendations</p>
                      <p className="text-sm text-gray-600">Get specific suggestions to improve your contracts</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-800">Negotiation Readiness</p>
                      <p className="text-sm text-gray-600">See how balanced your contract is before signing</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ContractValidator: React.FC = () => {
  return (
    <ProtectedRoute>
      {(user) => <ContractValidatorContent user={user} />}
    </ProtectedRoute>
  );
};

export default ContractValidator;