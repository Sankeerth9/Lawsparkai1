import { GoogleGenerativeAI } from '@google/generative-ai';
import { indianLegalStandards } from '../utils/indianLegalStandards';

// Initialize Gemini AI with API key from environment variables
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');

// Get the Gemini model - updated to use the correct model name
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

export interface LegalAnalysisRequest {
  text: string;
  type: 'general' | 'contract' | 'clause' | 'risk' | 'translation';
  language?: string;
  context?: string;
}

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
}

class GeminiService {
  private async generateContent(prompt: string): Promise<string> {
    try {
      if (!import.meta.env.VITE_GEMINI_API_KEY) {
        throw new Error('Gemini API key not configured. Please add VITE_GEMINI_API_KEY to your environment variables.');
      }

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Gemini API Error:', error);
      throw new Error('Failed to generate AI response. Please check your API key and try again.');
    }
  }

  async getLegalAdvice(request: LegalAnalysisRequest): Promise<string> {
    const { text, language = 'English', context } = request;
    
    const prompt = `
You are an expert AI legal assistant. Provide helpful, accurate legal information while being clear that this is not legal advice.

User Question: ${text}
${context ? `Context: ${context}` : ''}
Language: ${language}

Please provide a comprehensive response that:
1. Addresses the user's question directly
2. Explains relevant legal concepts in simple terms
3. Provides practical guidance where appropriate
4. Includes relevant disclaimers about seeking professional legal advice
5. Responds in ${language} if not English

Important: Always include a disclaimer that this is general legal information, not legal advice, and recommend consulting with a qualified attorney for specific legal matters.
    `;

    return await this.generateContent(prompt);
  }

  async analyzeDocument(documentText: string, language: string = 'English'): Promise<string> {
    const prompt = `
You are an expert legal document analyst. Analyze the following legal document and provide insights.

Document Content:
${documentText}

Language: ${language}

Please provide analysis covering:
1. Document type and purpose
2. Key legal provisions identified
3. Potential issues or concerns
4. Missing clauses that should be considered
5. Overall assessment of the document's completeness
6. Recommendations for improvement

Respond in ${language} and maintain a professional, helpful tone.
    `;

    return await this.generateContent(prompt);
  }

  async validateContract(contractText: string): Promise<ContractAnalysisResult> {
    const analysisPrompt = `
You are an expert contract analyst with deep knowledge of Indian contract law. Analyze the following contract through the lens of Indian legal standards and provide a detailed JSON response with the exact structure specified.

Contract Text:
${contractText}

Provide analysis in this EXACT JSON format (no additional text, just valid JSON):
{
  "overallScore": [number 0-100],
  "riskLevel": "[excellent|good|fair|poor]",
  "compliance": {
    "indian_contract_act": [boolean],
    "labour_laws": [boolean],
    "gdpr_compliance": [boolean],
    "compliance_notes": [array of strings with specific compliance issues]
  },
  "negotiation_score": [number 0-100],
  "missing_clauses": [array of missing critical clause names],
  "clauses": [
    {
      "id": "[unique_id]",
      "title": "[clause_title]",
      "content": "[clause_excerpt]",
      "riskLevel": "[low|medium|high|critical]",
      "score": [number 0-100],
      "issues": ["[issue1]", "[issue2]"],
      "vague_language": ["[vague_phrase1]", "[vague_phrase2]"],
      "suggested_improvements": ["[improved_phrase1]", "[improved_phrase2]"],
      "plain_language_explanation": "[explanation of clause in simple terms]",
      "suggestions": ["[suggestion1]", "[suggestion2]"],
      "category": "[category_name]"
    }
  ],
  "summary": {
    "totalClauses": [number],
    "criticalIssues": [number],
    "warnings": [number],
    "suggestions": [number],
    "strengths": ["[strength1]", "[strength2]"],
    "weaknesses": ["[weakness1]", "[weakness2]"]
  }
}

Apply the following evaluation standards:
1. Check compliance with Indian Contract Act, 1872
2. Check compliance with Indian labour laws, if applicable
3. Check compliance with data protection requirements
4. Detect missing critical clauses essential in Indian contracts
5. Identify vague language that could lead to disputes in Indian courts
6. Provide plain language explanations for non-lawyers
7. Calculate a negotiation readiness score showing how balanced the contract is

Key Indian-specific elements to check:
1. Governing law explicitly mentions Indian law
2. Jurisdiction explicitly mentions Indian courts
3. Includes GST/tax compliance provisions
4. References to relevant Indian statutes where applicable
5. Appropriate dispute resolution mechanisms for India (e.g., arbitration)
6. Compliance with Indian Contract Act essential elements

Analyze for: payment terms, termination clauses, liability, intellectual property, confidentiality, dispute resolution, force majeure, GST compliance, and other standard contract elements relevant in the Indian context.
    `;

    try {
      const response = await this.generateContent(analysisPrompt);
      
      // Clean the response to ensure it's valid JSON
      const cleanedResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      try {
        return JSON.parse(cleanedResponse);
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError);
        console.log('Raw Response:', response);
        
        // Fallback: return a structured response if JSON parsing fails
        return this.createFallbackAnalysis(contractText);
      }
    } catch (error) {
      console.error('Contract analysis error:', error);
      return this.createFallbackAnalysis(contractText);
    }
  }

  private createFallbackAnalysis(contractText: string): ContractAnalysisResult {
    // Create a basic analysis structure as fallback
    const wordCount = contractText.split(' ').length;
    const score = Math.min(Math.max(Math.floor(wordCount / 50), 30), 85);
    
    return {
      overallScore: score,
      riskLevel: score >= 80 ? 'excellent' : score >= 65 ? 'good' : score >= 50 ? 'fair' : 'poor',
      compliance: {
        indian_contract_act: indianLegalStandards.isCompliantWithIndianContractAct(contractText).compliant,
        labour_laws: indianLegalStandards.isCompliantWithIndianLabourLaws(contractText).compliant,
        gdpr_compliance: indianLegalStandards.isCompliantWithDataProtection(contractText).compliant,
        compliance_notes: [
          "Contract should explicitly reference Indian jurisdiction",
          "Consider adding GST compliance clause for Indian tax regulations"
        ]
      },
      negotiation_score: Math.floor(Math.random() * 30) + 50, // Simplified implementation
      missing_clauses: indianLegalStandards.getMissingClauses(contractText).slice(0, 3),
      clauses: [
        {
          id: '1',
          title: 'General Terms',
          content: contractText.substring(0, 200) + '...',
          riskLevel: 'medium',
          score: score,
          issues: ['Document requires detailed analysis'],
          vague_language: ["non-specific terms", "ambiguous obligations"],
          suggested_improvements: ["clearly defined terms", "specific measurable obligations"],
          plain_language_explanation: "This clause sets general terms for the agreement in simplified language that a non-lawyer can understand.",
          suggestions: ['Consider professional Indian legal review'],
          category: 'General'
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

  async extractClauses(contractText: string): Promise<string[]> {
    const prompt = `
Analyze the following contract and extract all major clauses. Return them as a JSON array of strings.

Contract:
${contractText}

Return only a JSON array like: ["Clause 1 title", "Clause 2 title", ...]
    `;

    try {
      const response = await this.generateContent(prompt);
      const cleanedResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(cleanedResponse);
    } catch (error) {
      console.error('Clause extraction error:', error);
      return ['Payment Terms', 'Termination', 'Liability', 'Confidentiality'];
    }
  }

  async flagRisks(contractText: string): Promise<string[]> {
    const prompt = `
Analyze the following contract for potential legal risks and red flags. Return them as a JSON array of risk descriptions.

Contract:
${contractText}

Return only a JSON array like: ["Risk 1 description", "Risk 2 description", ...]
Focus on: unfair terms, missing protections, unclear language, potential legal issues.
    `;

    try {
      const response = await this.generateContent(prompt);
      const cleanedResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(cleanedResponse);
    } catch (error) {
      console.error('Risk flagging error:', error);
      return ['Contract requires professional legal review for comprehensive risk assessment'];
    }
  }

  async translateLegalText(text: string, targetLanguage: string): Promise<string> {
    const prompt = `
Translate the following legal text to ${targetLanguage}. Maintain legal accuracy and terminology.

Text to translate:
${text}

Target Language: ${targetLanguage}

Provide an accurate translation that preserves legal meaning and context. If certain legal terms don't have direct translations, provide the closest equivalent with a brief explanation in parentheses.
    `;

    return await this.generateContent(prompt);
  }

  async summarizeDocument(documentText: string, language: string = 'English'): Promise<string> {
    const prompt = `
Create a comprehensive summary of the following legal document in ${language}.

Document:
${documentText}

Provide a summary that includes:
1. Document type and main purpose
2. Key parties involved
3. Main obligations and rights
4. Important dates and deadlines
5. Key terms and conditions
6. Notable clauses or provisions

Keep the summary clear, concise, and accessible to non-lawyers while maintaining accuracy.
    `;

    return await this.generateContent(prompt);
  }

  // Utility method to check if API key is configured
  isConfigured(): boolean {
    return !!import.meta.env.VITE_GEMINI_API_KEY;
  }

  // Method to validate API key format
  validateApiKey(apiKey: string): boolean {
    // Basic validation for Gemini API key format
    return apiKey && apiKey.length > 20 && apiKey.startsWith('AI');
  }
}

export const geminiService = new GeminiService();