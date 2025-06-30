// Utility functions for processing uploaded documents

export interface ProcessedDocument {
  text: string;
  metadata: {
    fileName: string;
    fileSize: number;
    fileType: string;
    processedAt: Date;
    wordCount: number;
    pageCount?: number;
  };
}

export class DocumentProcessor {
  static async processFile(file: File): Promise<ProcessedDocument> {
    const text = await this.extractTextFromFile(file);
    const wordCount = this.countWords(text);
    
    return {
      text,
      metadata: {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        processedAt: new Date(),
        wordCount,
        pageCount: this.estimatePageCount(text)
      }
    };
  }

  private static async extractTextFromFile(file: File): Promise<string> {
    const fileType = file.type;
    
    if (fileType === 'text/plain') {
      return await this.extractTextFromTxt(file);
    } else if (fileType === 'application/pdf') {
      // For PDF files, we'll return a placeholder since PDF parsing requires additional libraries
      // In a production environment, you'd use libraries like pdf-parse or PDF.js
      return `[PDF Document: ${file.name}]\n\nThis is a PDF document that would be processed by a PDF parser in a production environment. The actual text content would be extracted here.`;
    } else if (fileType.includes('word') || fileType.includes('document')) {
      // For Word documents, similar to PDF, you'd use libraries like mammoth.js
      return `[Word Document: ${file.name}]\n\nThis is a Word document that would be processed by a document parser in a production environment. The actual text content would be extracted here.`;
    } else {
      throw new Error(`Unsupported file type: ${fileType}`);
    }
  }

  private static async extractTextFromTxt(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        resolve(text);
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  private static countWords(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  private static estimatePageCount(text: string): number {
    // Rough estimate: 250 words per page
    const wordsPerPage = 250;
    const wordCount = this.countWords(text);
    return Math.ceil(wordCount / wordsPerPage);
  }

  static validateFile(file: File): { isValid: boolean; error?: string } {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      'text/plain',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (file.size > maxSize) {
      return {
        isValid: false,
        error: 'File size must be less than 10MB'
      };
    }

    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: 'Please upload a PDF, DOC, DOCX, or TXT file'
      };
    }

    return { isValid: true };
  }

  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}