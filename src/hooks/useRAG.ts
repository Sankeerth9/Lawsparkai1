import { useState, useCallback } from 'react';
import { ragService, SearchFilter } from '../services/ragService';

export interface UseRAGReturn {
  isLoading: boolean;
  error: string | null;
  searchDocuments: (query: string, options?: { limit?: number; filter?: SearchFilter }) => Promise<any>;
  processQuery: (query: string, options?: { filter?: SearchFilter }) => Promise<{
    answer: string;
    sources: Array<{
      text: string;
      document_title: string;
      document_id: string;
    }>;
  }>;
  generateEmbeddings: (documentId: string) => Promise<any>;
  clearError: () => void;
}

export const useRAG = (): UseRAGReturn => {
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

  const searchDocuments = useCallback(async (query: string, options?: { limit?: number; filter?: SearchFilter }): Promise<any> => {
    return handleRequest(() => ragService.searchDocuments(query, options));
  }, [handleRequest]);

  const processQuery = useCallback(async (query: string, options?: { filter?: SearchFilter }): Promise<{
    answer: string;
    sources: Array<{
      text: string;
      document_title: string;
      document_id: string;
    }>;
  }> => {
    return handleRequest(() => ragService.processLegalQuery(query, options));
  }, [handleRequest]);

  const generateEmbeddings = useCallback(async (documentId: string): Promise<any> => {
    return handleRequest(() => ragService.generateEmbeddings(documentId));
  }, [handleRequest]);

  return {
    isLoading,
    error,
    searchDocuments,
    processQuery,
    generateEmbeddings,
    clearError
  };
};