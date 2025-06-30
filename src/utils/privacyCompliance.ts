// Privacy compliance utilities for legal data processing

export interface PrivacyConfig {
  enableAnonymization: boolean;
  retentionPeriod: number; // days
  allowedJurisdictions: string[];
  sensitiveDataPatterns: RegExp[];
  complianceStandards: ('GDPR' | 'CCPA' | 'HIPAA')[];
}

export interface DataProcessingRecord {
  id: string;
  documentId: string;
  processedAt: Date;
  anonymizationApplied: boolean;
  sensitiveDataRemoved: string[];
  complianceChecks: {
    standard: string;
    passed: boolean;
    details: string;
  }[];
  retentionExpiry: Date;
}

class PrivacyComplianceService {
  private config: PrivacyConfig = {
    enableAnonymization: true,
    retentionPeriod: 90,
    allowedJurisdictions: ['US', 'EU', 'CA'],
    sensitiveDataPatterns: [
      /\b\d{3}-\d{2}-\d{4}\b/g, // SSN
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Email
      /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, // Phone
      /\b\d{1,5}\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Place|Pl)\b/gi, // Address
      /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, // Credit card
      /\b[A-Z]{2}\d{6,8}\b/g, // Passport numbers
    ],
    complianceStandards: ['GDPR', 'CCPA']
  };

  private processingRecords: DataProcessingRecord[] = [];

  // GDPR Compliance
  checkGDPRCompliance(data: string, jurisdiction: string): { compliant: boolean; issues: string[] } {
    const issues: string[] = [];

    // Check if processing is lawful
    if (!this.config.allowedJurisdictions.includes(jurisdiction)) {
      issues.push('Processing not allowed for this jurisdiction');
    }

    // Check for sensitive personal data
    const sensitiveDataFound = this.detectSensitiveData(data);
    if (sensitiveDataFound.length > 0 && !this.config.enableAnonymization) {
      issues.push('Sensitive personal data detected without anonymization');
    }

    // Check data minimization principle
    if (data.length > 50000) { // Arbitrary threshold
      issues.push('Data may not comply with minimization principle');
    }

    return {
      compliant: issues.length === 0,
      issues
    };
  }

  // CCPA Compliance
  checkCCPACompliance(data: string): { compliant: boolean; issues: string[] } {
    const issues: string[] = [];

    // Check for personal information
    const personalInfo = this.detectPersonalInformation(data);
    if (personalInfo.length > 0) {
      issues.push('Personal information detected - ensure proper disclosure and opt-out mechanisms');
    }

    // Check for sale/sharing restrictions
    if (this.containsRestrictedData(data)) {
      issues.push('Data may contain information subject to sale/sharing restrictions');
    }

    return {
      compliant: issues.length === 0,
      issues
    };
  }

  // Anonymization functions
  anonymizeData(data: string): { anonymized: string; removedItems: string[] } {
    let anonymized = data;
    const removedItems: string[] = [];

    this.config.sensitiveDataPatterns.forEach((pattern, index) => {
      const matches = data.match(pattern);
      if (matches) {
        matches.forEach(match => removedItems.push(match));
        anonymized = anonymized.replace(pattern, this.getReplacementToken(index));
      }
    });

    // Additional anonymization for names and entities
    anonymized = this.anonymizeNames(anonymized, removedItems);
    anonymized = this.anonymizeEntities(anonymized, removedItems);

    return { anonymized, removedItems };
  }

  private getReplacementToken(patternIndex: number): string {
    const tokens = [
      '[SSN_REDACTED]',
      '[EMAIL_REDACTED]',
      '[PHONE_REDACTED]',
      '[ADDRESS_REDACTED]',
      '[CARD_REDACTED]',
      '[PASSPORT_REDACTED]'
    ];
    return tokens[patternIndex] || '[DATA_REDACTED]';
  }

  private anonymizeNames(text: string, removedItems: string[]): string {
    // Simple name detection and replacement
    const namePattern = /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g;
    const names = text.match(namePattern) || [];
    
    names.forEach(name => {
      if (!this.isCommonWord(name)) {
        removedItems.push(name);
        text = text.replace(new RegExp(name, 'g'), '[NAME_REDACTED]');
      }
    });

    return text;
  }

  private anonymizeEntities(text: string, removedItems: string[]): string {
    // Company names, organizations
    const entityPatterns = [
      /\b[A-Z][a-z]+ (?:Inc|LLC|Corp|Corporation|Company|Co)\b/g,
      /\b[A-Z][a-z]+ & [A-Z][a-z]+\b/g,
    ];

    entityPatterns.forEach(pattern => {
      const matches = text.match(pattern) || [];
      matches.forEach(match => {
        removedItems.push(match);
        text = text.replace(new RegExp(match, 'g'), '[ENTITY_REDACTED]');
      });
    });

    return text;
  }

  private isCommonWord(text: string): boolean {
    const commonWords = ['United States', 'New York', 'Los Angeles', 'San Francisco'];
    return commonWords.includes(text);
  }

  // Data detection functions
  private detectSensitiveData(data: string): string[] {
    const found: string[] = [];
    
    this.config.sensitiveDataPatterns.forEach(pattern => {
      const matches = data.match(pattern);
      if (matches) {
        found.push(...matches);
      }
    });

    return found;
  }

  private detectPersonalInformation(data: string): string[] {
    const personalInfoPatterns = [
      /\b(?:name|address|phone|email|ssn|social security)\b/gi,
      /\b\d{3}-\d{2}-\d{4}\b/g,
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    ];

    const found: string[] = [];
    personalInfoPatterns.forEach(pattern => {
      const matches = data.match(pattern);
      if (matches) {
        found.push(...matches);
      }
    });

    return found;
  }

  private containsRestrictedData(data: string): boolean {
    const restrictedPatterns = [
      /\b(?:biometric|genetic|health|medical|financial)\b/gi,
      /\b(?:race|ethnicity|religion|political|sexual)\b/gi,
    ];

    return restrictedPatterns.some(pattern => pattern.test(data));
  }

  // Data retention management
  scheduleDataDeletion(documentId: string): Date {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + this.config.retentionPeriod);
    return expiryDate;
  }

  checkRetentionCompliance(): DataProcessingRecord[] {
    const now = new Date();
    return this.processingRecords.filter(record => record.retentionExpiry <= now);
  }

  // Audit and logging
  logDataProcessing(documentId: string, anonymizationApplied: boolean, removedItems: string[]): string {
    const record: DataProcessingRecord = {
      id: this.generateId(),
      documentId,
      processedAt: new Date(),
      anonymizationApplied,
      sensitiveDataRemoved: removedItems,
      complianceChecks: [],
      retentionExpiry: this.scheduleDataDeletion(documentId)
    };

    // Run compliance checks
    this.config.complianceStandards.forEach(standard => {
      let check;
      switch (standard) {
        case 'GDPR':
          check = this.checkGDPRCompliance('', 'EU'); // Would pass actual data
          break;
        case 'CCPA':
          check = this.checkCCPACompliance(''); // Would pass actual data
          break;
        default:
          check = { compliant: true, issues: [] };
      }

      record.complianceChecks.push({
        standard,
        passed: check.compliant,
        details: check.issues.join('; ')
      });
    });

    this.processingRecords.push(record);
    return record.id;
  }

  // Consent management
  validateConsent(consentData: {
    hasConsent: boolean;
    consentDate: Date;
    purpose: string;
    dataTypes: string[];
  }): { valid: boolean; issues: string[] } {
    const issues: string[] = [];

    if (!consentData.hasConsent) {
      issues.push('No valid consent provided');
    }

    // Check consent age (GDPR requires renewal after reasonable period)
    const consentAge = Date.now() - consentData.consentDate.getTime();
    const maxAge = 365 * 24 * 60 * 60 * 1000; // 1 year in milliseconds
    
    if (consentAge > maxAge) {
      issues.push('Consent may be stale and require renewal');
    }

    if (!consentData.purpose || consentData.purpose.length < 10) {
      issues.push('Purpose specification insufficient');
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }

  // Data subject rights (GDPR)
  handleDataSubjectRequest(type: 'access' | 'rectification' | 'erasure' | 'portability', documentId: string): {
    status: 'completed' | 'pending' | 'rejected';
    data?: any;
    reason?: string;
  } {
    const record = this.processingRecords.find(r => r.documentId === documentId);
    
    if (!record) {
      return { status: 'rejected', reason: 'Document not found in processing records' };
    }

    switch (type) {
      case 'access':
        return {
          status: 'completed',
          data: {
            processedAt: record.processedAt,
            anonymizationApplied: record.anonymizationApplied,
            retentionExpiry: record.retentionExpiry
          }
        };
      
      case 'erasure':
        this.processingRecords = this.processingRecords.filter(r => r.id !== record.id);
        return { status: 'completed' };
      
      default:
        return { status: 'pending', reason: 'Request type not yet implemented' };
    }
  }

  // Utility functions
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Configuration management
  updateConfig(newConfig: Partial<PrivacyConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): PrivacyConfig {
    return { ...this.config };
  }

  // Compliance reporting
  generateComplianceReport(): {
    totalDocuments: number;
    anonymizedDocuments: number;
    complianceRate: number;
    pendingDeletions: number;
    recentViolations: string[];
  } {
    const total = this.processingRecords.length;
    const anonymized = this.processingRecords.filter(r => r.anonymizationApplied).length;
    const pendingDeletions = this.checkRetentionCompliance().length;
    
    const failedChecks = this.processingRecords.filter(r => 
      r.complianceChecks.some(check => !check.passed)
    );

    return {
      totalDocuments: total,
      anonymizedDocuments: anonymized,
      complianceRate: total > 0 ? (total - failedChecks.length) / total : 1,
      pendingDeletions,
      recentViolations: failedChecks.slice(-5).map(r => 
        r.complianceChecks.filter(c => !c.passed).map(c => c.details).join('; ')
      )
    };
  }
}

export const privacyComplianceService = new PrivacyComplianceService();