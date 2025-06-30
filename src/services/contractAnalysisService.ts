import { geminiService } from './geminiService';
import { 
  getContractAnalysisPrompt,
  getClauseExtractionPrompt,
  getClauseExplanationPrompt,
  getRiskAssessmentPrompt,
  getPlainLanguageSummaryPrompt,
  getComparativeAnalysisPrompt,
  getNegotiationGuidancePrompt,
  getComplianceCheckPrompt,
  getTerminationClauseAnalysisPrompt,
  getLiabilityClauseAnalysisPrompt,
  getIntellectualPropertyClauseAnalysisPrompt,
  getConfidentialityClauseAnalysisPrompt,
  getPaymentTermsAnalysisPrompt,
  getDisputeResolutionAnalysisPrompt,
  getForceMajeureAnalysisPrompt,
  getNonCompeteAnalysisPrompt
} from '../utils/contractValidatorPrompts';

export interface ContractAnalysisResult {
  overallScore: number;
  riskLevel: 'excellent' | 'good' | 'fair' | 'poor';
  clauses: ClauseAnalysis[];
  summary: {
    totalClauses: number;
    criticalIssues: number;
    warnings: number;
    suggestions: number;
    strengths: string[];
    weaknesses: string[];
  };
  analysisTime?: number;
}

export interface ClauseAnalysis {
  id: string;
  title: string;
  content: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  score: number;
  issues: string[];
  suggestions: string[];
  category: string;
  lineNumbers?: number[];
}

export interface ClauseExtractionResult {
  title: string;
  content: string;
  category: string;
  reference?: string;
}

export interface RiskAssessmentResult {
  highRisks: Array<{issue: string, explanation: string, suggestion: string}>;
  mediumRisks: Array<{issue: string, explanation: string, suggestion: string}>;
  lowRisks: Array<{issue: string, explanation: string, suggestion: string}>;
  missingProvisions: string[];
}

export interface ComplianceCheckResult {
  compliant: boolean;
  issues: Array<{
    provision: string;
    regulation: string;
    issue: string;
    suggestion: string;
    severity: 'high' | 'medium' | 'low';
  }>;
  missingRequiredProvisions: Array<{
    description: string;
    regulation: string;
    suggestion: string;
  }>;
  overallAssessment: string;
}

/**
 * Service for analyzing contracts and providing insights
 */
class ContractAnalysisService {
  /**
   * Perform comprehensive analysis of a contract
   * @param contractText The full text of the contract
   * @returns Analysis results
   */
  async analyzeContract(contractText: string): Promise<ContractAnalysisResult> {
    try {
      const prompt = getContractAnalysisPrompt(contractText);
      const response = await geminiService.generateContent(prompt);
      
      // Parse the JSON response
      try {
        const result = JSON.parse(response);
        return result as ContractAnalysisResult;
      } catch (parseError) {
        console.error('Error parsing contract analysis result:', parseError);
        return this.createFallbackAnalysis(contractText);
      }
    } catch (error) {
      console.error('Contract analysis error:', error);
      return this.createFallbackAnalysis(contractText);
    }
  }

  /**
   * Extract individual clauses from a contract
   * @param contractText The full text of the contract
   * @returns Array of extracted clauses
   */
  async extractClauses(contractText: string): Promise<ClauseExtractionResult[]> {
    try {
      const prompt = getClauseExtractionPrompt(contractText);
      const response = await geminiService.generateContent(prompt);
      
      // Parse the JSON response
      try {
        const result = JSON.parse(response);
        return result as ClauseExtractionResult[];
      } catch (parseError) {
        console.error('Error parsing clause extraction result:', parseError);
        return this.createFallbackClauseExtraction(contractText);
      }
    } catch (error) {
      console.error('Clause extraction error:', error);
      return this.createFallbackClauseExtraction(contractText);
    }
  }

  /**
   * Get a plain language explanation of a specific clause
   * @param clauseText The text of the clause to explain
   * @param contractType The type of contract (e.g., employment, NDA)
   * @returns Plain language explanation
   */
  async explainClause(clauseText: string, contractType: string = 'general'): Promise<string> {
    try {
      const prompt = getClauseExplanationPrompt(clauseText, contractType);
      return await geminiService.generateContent(prompt);
    } catch (error) {
      console.error('Clause explanation error:', error);
      return `Unable to explain this clause due to an error. Please try again with a different clause or contact support if the problem persists.`;
    }
  }

  /**
   * Assess risks in a contract
   * @param contractText The full text of the contract
   * @returns Risk assessment results
   */
  async assessRisks(contractText: string): Promise<RiskAssessmentResult> {
    try {
      const prompt = getRiskAssessmentPrompt(contractText);
      const response = await geminiService.generateContent(prompt);
      
      // For this function, we expect a structured text response rather than JSON
      // We'll parse it into our expected format
      const highRisks = this.extractRisksFromSection(response, 'High-Risk Issues');
      const mediumRisks = this.extractRisksFromSection(response, 'Medium-Risk Issues');
      const lowRisks = this.extractRisksFromSection(response, 'Low-Risk Issues');
      const missingProvisions = this.extractMissingProvisions(response);
      
      return {
        highRisks,
        mediumRisks,
        lowRisks,
        missingProvisions
      };
    } catch (error) {
      console.error('Risk assessment error:', error);
      return this.createFallbackRiskAssessment();
    }
  }

  /**
   * Create a plain language summary of a contract
   * @param contractText The full text of the contract
   * @returns Plain language summary
   */
  async createPlainLanguageSummary(contractText: string): Promise<string> {
    try {
      const prompt = getPlainLanguageSummaryPrompt(contractText);
      return await geminiService.generateContent(prompt);
    } catch (error) {
      console.error('Plain language summary error:', error);
      return `Unable to generate a summary due to an error. Please try again or contact support if the problem persists.`;
    }
  }

  /**
   * Compare a contract against industry standards
   * @param contractText The full text of the contract
   * @param contractType The type of contract (e.g., employment, NDA)
   * @returns Comparative analysis
   */
  async compareToStandards(contractText: string, contractType: string): Promise<string> {
    try {
      const prompt = getComparativeAnalysisPrompt(contractText, contractType);
      return await geminiService.generateContent(prompt);
    } catch (error) {
      console.error('Comparative analysis error:', error);
      return `Unable to compare this contract to standards due to an error. Please try again or contact support if the problem persists.`;
    }
  }

  /**
   * Get negotiation guidance for a contract
   * @param contractText The full text of the contract
   * @returns Negotiation guidance
   */
  async getNegotiationGuidance(contractText: string): Promise<string> {
    try {
      const prompt = getNegotiationGuidancePrompt(contractText);
      return await geminiService.generateContent(prompt);
    } catch (error) {
      console.error('Negotiation guidance error:', error);
      return `Unable to provide negotiation guidance due to an error. Please try again or contact support if the problem persists.`;
    }
  }

  /**
   * Check a contract for compliance with specific regulations
   * @param contractText The full text of the contract
   * @param jurisdiction The legal jurisdiction
   * @param regulations Array of regulations to check against
   * @returns Compliance check results
   */
  async checkCompliance(contractText: string, jurisdiction: string, regulations: string[]): Promise<ComplianceCheckResult> {
    try {
      const prompt = getComplianceCheckPrompt(contractText, jurisdiction, regulations);
      const response = await geminiService.generateContent(prompt);
      
      // For this function, we expect a structured text response rather than JSON
      // We'll parse it into our expected format
      const issues = this.extractComplianceIssues(response);
      const missingProvisions = this.extractMissingRequiredProvisions(response);
      const compliant = issues.length === 0 && missingProvisions.length === 0;
      const overallAssessment = this.extractOverallAssessment(response);
      
      return {
        compliant,
        issues,
        missingRequiredProvisions: missingProvisions,
        overallAssessment
      };
    } catch (error) {
      console.error('Compliance check error:', error);
      return this.createFallbackComplianceCheck(jurisdiction, regulations);
    }
  }

  /**
   * Analyze a specific termination clause
   * @param terminationText The text of the termination clause
   * @returns Analysis of the termination clause
   */
  async analyzeTerminationClause(terminationText: string): Promise<string> {
    try {
      const prompt = getTerminationClauseAnalysisPrompt(terminationText);
      return await geminiService.generateContent(prompt);
    } catch (error) {
      console.error('Termination clause analysis error:', error);
      return `Unable to analyze this termination clause due to an error. Please try again or contact support if the problem persists.`;
    }
  }

  /**
   * Analyze a specific liability clause
   * @param liabilityText The text of the liability clause
   * @returns Analysis of the liability clause
   */
  async analyzeLiabilityClause(liabilityText: string): Promise<string> {
    try {
      const prompt = getLiabilityClauseAnalysisPrompt(liabilityText);
      return await geminiService.generateContent(prompt);
    } catch (error) {
      console.error('Liability clause analysis error:', error);
      return `Unable to analyze this liability clause due to an error. Please try again or contact support if the problem persists.`;
    }
  }

  /**
   * Analyze a specific intellectual property clause
   * @param ipText The text of the IP clause
   * @returns Analysis of the IP clause
   */
  async analyzeIntellectualPropertyClause(ipText: string): Promise<string> {
    try {
      const prompt = getIntellectualPropertyClauseAnalysisPrompt(ipText);
      return await geminiService.generateContent(prompt);
    } catch (error) {
      console.error('IP clause analysis error:', error);
      return `Unable to analyze this intellectual property clause due to an error. Please try again or contact support if the problem persists.`;
    }
  }

  /**
   * Analyze a specific confidentiality clause
   * @param confidentialityText The text of the confidentiality clause
   * @returns Analysis of the confidentiality clause
   */
  async analyzeConfidentialityClause(confidentialityText: string): Promise<string> {
    try {
      const prompt = getConfidentialityClauseAnalysisPrompt(confidentialityText);
      return await geminiService.generateContent(prompt);
    } catch (error) {
      console.error('Confidentiality clause analysis error:', error);
      return `Unable to analyze this confidentiality clause due to an error. Please try again or contact support if the problem persists.`;
    }
  }

  /**
   * Analyze specific payment terms
   * @param paymentText The text of the payment terms
   * @returns Analysis of the payment terms
   */
  async analyzePaymentTerms(paymentText: string): Promise<string> {
    try {
      const prompt = getPaymentTermsAnalysisPrompt(paymentText);
      return await geminiService.generateContent(prompt);
    } catch (error) {
      console.error('Payment terms analysis error:', error);
      return `Unable to analyze these payment terms due to an error. Please try again or contact support if the problem persists.`;
    }
  }

  /**
   * Analyze a specific dispute resolution clause
   * @param disputeText The text of the dispute resolution clause
   * @returns Analysis of the dispute resolution clause
   */
  async analyzeDisputeResolutionClause(disputeText: string): Promise<string> {
    try {
      const prompt = getDisputeResolutionAnalysisPrompt(disputeText);
      return await geminiService.generateContent(prompt);
    } catch (error) {
      console.error('Dispute resolution clause analysis error:', error);
      return `Unable to analyze this dispute resolution clause due to an error. Please try again or contact support if the problem persists.`;
    }
  }

  /**
   * Analyze a specific force majeure clause
   * @param forceText The text of the force majeure clause
   * @returns Analysis of the force majeure clause
   */
  async analyzeForceMajeureClause(forceText: string): Promise<string> {
    try {
      const prompt = getForceMajeureAnalysisPrompt(forceText);
      return await geminiService.generateContent(prompt);
    } catch (error) {
      console.error('Force majeure clause analysis error:', error);
      return `Unable to analyze this force majeure clause due to an error. Please try again or contact support if the problem persists.`;
    }
  }

  /**
   * Analyze a specific non-compete clause
   * @param nonCompeteText The text of the non-compete clause
   * @param jurisdiction The legal jurisdiction
   * @returns Analysis of the non-compete clause
   */
  async analyzeNonCompeteClause(nonCompeteText: string, jurisdiction: string): Promise<string> {
    try {
      const prompt = getNonCompeteAnalysisPrompt(nonCompeteText, jurisdiction);
      return await geminiService.generateContent(prompt);
    } catch (error) {
      console.error('Non-compete clause analysis error:', error);
      return `Unable to analyze this non-compete clause due to an error. Please try again or contact support if the problem persists.`;
    }
  }

  // Helper methods for parsing responses

  private extractRisksFromSection(response: string, sectionTitle: string): Array<{issue: string, explanation: string, suggestion: string}> {
    const risks: Array<{issue: string, explanation: string, suggestion: string}> = [];
    
    // Simple regex-based extraction - in production, use more robust parsing
    const sectionRegex = new RegExp(`${sectionTitle}[:\\s]*(.*?)(?=\\n\\s*\\d+\\.|\\n\\s*[A-Z][a-z]+-Risk Issues|$)`, 's');
    const sectionMatch = response.match(sectionRegex);
    
    if (sectionMatch && sectionMatch[1]) {
      const sectionContent = sectionMatch[1].trim();
      const issueMatches = sectionContent.split(/\n\s*[-•*]\s+/);
      
      for (const issueMatch of issueMatches) {
        if (issueMatch.trim()) {
          // Try to extract issue, explanation, and suggestion
          const parts = issueMatch.split(/:\s+|--\s+/);
          
          if (parts.length >= 2) {
            risks.push({
              issue: parts[0].trim(),
              explanation: parts[1].trim(),
              suggestion: parts[2] ? parts[2].trim() : 'No specific suggestion provided.'
            });
          } else {
            risks.push({
              issue: issueMatch.trim(),
              explanation: 'No detailed explanation provided.',
              suggestion: 'No specific suggestion provided.'
            });
          }
        }
      }
    }
    
    return risks;
  }

  private extractMissingProvisions(response: string): string[] {
    const missingProvisions: string[] = [];
    
    // Simple regex-based extraction - in production, use more robust parsing
    const sectionRegex = /Missing provisions[:\s]*(.*?)(?=\n\s*\d+\.|\n\s*[A-Z]|$)/s;
    const sectionMatch = response.match(sectionRegex);
    
    if (sectionMatch && sectionMatch[1]) {
      const sectionContent = sectionMatch[1].trim();
      const provisionMatches = sectionContent.split(/\n\s*[-•*]\s+/);
      
      for (const provisionMatch of provisionMatches) {
        if (provisionMatch.trim()) {
          missingProvisions.push(provisionMatch.trim());
        }
      }
    }
    
    return missingProvisions;
  }

  private extractComplianceIssues(response: string): Array<{
    provision: string;
    regulation: string;
    issue: string;
    suggestion: string;
    severity: 'high' | 'medium' | 'low';
  }> {
    const issues: Array<{
      provision: string;
      regulation: string;
      issue: string;
      suggestion: string;
      severity: 'high' | 'medium' | 'low';
    }> = [];
    
    // Simple regex-based extraction - in production, use more robust parsing
    const issueRegex = /(?:High|Medium|Low)[\s-]*Severity[:\s]*(.*?)(?=\n\s*(?:High|Medium|Low)[\s-]*Severity|$)/gs;
    let issueMatch;
    
    while ((issueMatch = issueRegex.exec(response)) !== null) {
      const issueContent = issueMatch[1].trim();
      
      // Try to extract components
      const provisionMatch = issueContent.match(/Provision[:\s]*(.*?)(?=\n|$)/);
      const regulationMatch = issueContent.match(/Regulation[:\s]*(.*?)(?=\n|$)/);
      const issueDescMatch = issueContent.match(/Issue[:\s]*(.*?)(?=\n|$)/);
      const suggestionMatch = issueContent.match(/Suggestion[:\s]*(.*?)(?=\n|$)/);
      const severityMatch = issueMatch[0].match(/^(High|Medium|Low)/i);
      
      issues.push({
        provision: provisionMatch ? provisionMatch[1].trim() : 'Unspecified provision',
        regulation: regulationMatch ? regulationMatch[1].trim() : 'Unspecified regulation',
        issue: issueDescMatch ? issueDescMatch[1].trim() : issueContent,
        suggestion: suggestionMatch ? suggestionMatch[1].trim() : 'No specific suggestion provided',
        severity: (severityMatch ? severityMatch[1].toLowerCase() : 'medium') as 'high' | 'medium' | 'low'
      });
    }
    
    return issues;
  }

  private extractMissingRequiredProvisions(response: string): Array<{
    description: string;
    regulation: string;
    suggestion: string;
  }> {
    const missingProvisions: Array<{
      description: string;
      regulation: string;
      suggestion: string;
    }> = [];
    
    // Simple regex-based extraction - in production, use more robust parsing
    const sectionRegex = /Missing Required Provisions[:\s]*(.*?)(?=\n\s*\d+\.|\n\s*[A-Z]|$)/s;
    const sectionMatch = response.match(sectionRegex);
    
    if (sectionMatch && sectionMatch[1]) {
      const sectionContent = sectionMatch[1].trim();
      const provisionMatches = sectionContent.split(/\n\s*[-•*]\s+/);
      
      for (const provisionMatch of provisionMatches) {
        if (provisionMatch.trim()) {
          // Try to extract components
          const parts = provisionMatch.split(/:\s+|--\s+/);
          
          if (parts.length >= 2) {
            missingProvisions.push({
              description: parts[0].trim(),
              regulation: parts[1].trim(),
              suggestion: parts[2] ? parts[2].trim() : 'No specific suggestion provided'
            });
          } else {
            missingProvisions.push({
              description: provisionMatch.trim(),
              regulation: 'Unspecified regulation',
              suggestion: 'No specific suggestion provided'
            });
          }
        }
      }
    }
    
    return missingProvisions;
  }

  private extractOverallAssessment(response: string): string {
    // Simple regex-based extraction - in production, use more robust parsing
    const sectionRegex = /Overall Assessment[:\s]*(.*?)(?=\n\s*\d+\.|\n\s*[A-Z]|$)/s;
    const sectionMatch = response.match(sectionRegex);
    
    if (sectionMatch && sectionMatch[1]) {
      return sectionMatch[1].trim();
    }
    
    return 'No overall assessment provided.';
  }

  // Fallback methods for error handling

  private createFallbackAnalysis(contractText: string): ContractAnalysisResult {
    // Create a basic analysis structure as fallback
    const wordCount = contractText.split(' ').length;
    const score = Math.min(Math.max(Math.floor(wordCount / 50), 30), 85);
    
    return {
      overallScore: score,
      riskLevel: score >= 80 ? 'excellent' : score >= 65 ? 'good' : score >= 50 ? 'fair' : 'poor',
      clauses: [
        {
          id: '1',
          title: 'General Terms',
          content: contractText.substring(0, 200) + '...',
          riskLevel: 'medium',
          score: score,
          issues: ['Document requires detailed analysis'],
          suggestions: ['Consider professional legal review'],
          category: 'general'
        }
      ],
      summary: {
        totalClauses: 1,
        criticalIssues: 0,
        warnings: 1,
        suggestions: 1,
        strengths: ['Document structure appears organized'],
        weaknesses: ['Requires detailed professional analysis']
      }
    };
  }

  private createFallbackClauseExtraction(contractText: string): ClauseExtractionResult[] {
    // Create a basic clause extraction as fallback
    const paragraphs = contractText.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    const results: ClauseExtractionResult[] = [];
    
    // Take up to 5 paragraphs as sample clauses
    for (let i = 0; i < Math.min(paragraphs.length, 5); i++) {
      const paragraph = paragraphs[i].trim();
      const firstLine = paragraph.split('\n')[0].trim();
      
      results.push({
        title: firstLine.length > 10 ? firstLine : `Section ${i + 1}`,
        content: paragraph,
        category: 'general'
      });
    }
    
    return results;
  }

  private createFallbackRiskAssessment(): RiskAssessmentResult {
    return {
      highRisks: [{
        issue: 'Unable to perform detailed risk assessment',
        explanation: 'The system encountered an error while analyzing risks.',
        suggestion: 'Please try again or consult with a legal professional for a thorough review.'
      }],
      mediumRisks: [],
      lowRisks: [],
      missingProvisions: ['Unable to determine missing provisions']
    };
  }

  private createFallbackComplianceCheck(jurisdiction: string, regulations: string[]): ComplianceCheckResult {
    return {
      compliant: false,
      issues: [{
        provision: 'Unable to analyze compliance',
        regulation: regulations.join(', '),
        issue: 'The system encountered an error while checking compliance.',
        suggestion: 'Please try again or consult with a legal professional for a thorough review.',
        severity: 'medium'
      }],
      missingRequiredProvisions: [{
        description: 'Unable to determine missing required provisions',
        regulation: regulations.join(', '),
        suggestion: 'Please consult with a legal professional familiar with these regulations.'
      }],
      overallAssessment: `Unable to perform a complete compliance check for ${jurisdiction} jurisdiction and ${regulations.join(', ')} regulations. Please try again or consult with a legal professional.`
    };
  }
}

export const contractAnalysisService = new ContractAnalysisService();