import { useState, useCallback } from 'react';
import { geminiService, LegalAnalysisRequest, ContractAnalysisResult } from '../services/geminiService';

export interface UseGeminiAIReturn {
  isLoading: boolean;
  error: string | null;
  getLegalAdvice: (request: LegalAnalysisRequest) => Promise<string>;
  analyzeContract: (contractText: string) => Promise<ContractAnalysisResult>;
  analyzeDocument: (documentText: string, language?: string) => Promise<string>;
  translateText: (text: string, targetLanguage: string) => Promise<string>;
  summarizeDocument: (documentText: string, language?: string) => Promise<string>;
  clearError: () => void;
  isConfigured: boolean;
}

export const useGeminiAI = (): UseGeminiAIReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const handleRequest = useCallback(async <T>(
    requestFn: () => Promise<T>
  ): Promise<T> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await requestFn();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getLegalAdvice = useCallback(async (request: LegalAnalysisRequest): Promise<string> => {
    return handleRequest(() => geminiService.getLegalAdvice(request));
  }, [handleRequest]);

  const analyzeContract = useCallback(async (contractText: string): Promise<ContractAnalysisResult> => {
    return handleRequest(() => geminiService.validateContract(contractText));
  }, [handleRequest]);

  const analyzeDocument = useCallback(async (documentText: string, language = 'English'): Promise<string> => {
    return handleRequest(() => geminiService.analyzeDocument(documentText, language));
  }, [handleRequest]);

  const translateText = useCallback(async (text: string, targetLanguage: string): Promise<string> => {
    return handleRequest(() => geminiService.translateLegalText(text, targetLanguage));
  }, [handleRequest]);

  const summarizeDocument = useCallback(async (documentText: string, language = 'English'): Promise<string> => {
    return handleRequest(() => geminiService.summarizeDocument(documentText, language));
  }, [handleRequest]);

  return {
    isLoading,
    error,
    getLegalAdvice,
    analyzeContract,
    analyzeDocument,
    translateText,
    summarizeDocument,
    clearError,
    isConfigured: geminiService.isConfigured()
  };
};