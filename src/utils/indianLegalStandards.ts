/**
 * Indian legal compliance standards and checks for contract validation
 */

export interface IndianLegalStandard {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  requiredClauses: string[];
}

export const indianLegalStandards = {
  // Indian Contract Act, 1872
  contractAct: {
    id: 'indian_contract_act',
    name: 'Indian Contract Act, 1872',
    description: 'The fundamental law governing contracts in India',
    keywords: [
      'offer', 'acceptance', 'consideration', 'competence', 'consent', 'void', 'voidable',
      'contingent', 'performance', 'breach', 'indemnity', 'guarantee', 'bailment', 'pledge', 'agency'
    ],
    requiredClauses: [
      'Offer and Acceptance',
      'Consideration',
      'Competent Parties',
      'Free Consent',
      'Lawful Object',
      'Not Expressly Declared Void'
    ],
    essentialElements: [
      {
        name: 'Free Consent',
        description: 'Contract must be entered without coercion, undue influence, fraud, misrepresentation, or mistake',
        keywords: ['consent', 'agree', 'coercion', 'influence', 'fraud', 'misrepresentation', 'mistake']
      },
      {
        name: 'Lawful Consideration',
        description: 'The consideration and object must be lawful and not forbidden by law',
        keywords: ['consideration', 'payment', 'compensation', 'remuneration']
      },
      {
        name: 'Capacity to Contract',
        description: 'Parties must be of legal age (18) and sound mind',
        keywords: ['capacity', 'age', 'minor', 'sound mind', 'legal age']
      },
      {
        name: 'Lawful Object',
        description: 'The purpose of the contract must not be forbidden by law or contrary to public policy',
        keywords: ['object', 'purpose', 'intention', 'aim', 'goal']
      }
    ]
  },

  // Labour laws in India
  labourLaws: {
    id: 'indian_labour_laws',
    name: 'Indian Labour Laws',
    description: 'Laws governing employment relationships in India',
    keywords: [
      'employment', 'worker', 'salary', 'wage', 'compensation', 'benefits', 'termination', 
      'notice period', 'working hours', 'leave', 'provident fund', 'gratuity', 'bonus', 
      'overtime', 'minimum wage', 'social security'
    ],
    requiredClauses: [
      'Working Hours',
      'Compensation Structure',
      'Leave Entitlement',
      'Termination Process',
      'Non-Discrimination',
      'Grievance Redressal'
    ],
    specificLaws: [
      {
        name: 'Minimum Wages Act, 1948',
        description: 'Ensures minimum wage rates for different categories of employment',
        keywords: ['minimum wage', 'salary', 'compensation']
      },
      {
        name: 'Payment of Wages Act, 1936',
        description: 'Regulates payment of wages to employees',
        keywords: ['payment', 'wage', 'salary', 'deduction']
      },
      {
        name: 'Industrial Disputes Act, 1947',
        description: 'Provides machinery for settlement of disputes in industrial establishments',
        keywords: ['dispute', 'strike', 'lockout', 'layoff', 'retrenchment', 'termination']
      },
      {
        name: 'Employees Provident Fund Act, 1952',
        description: 'Provides for compulsory contributory fund for employees',
        keywords: ['provident fund', 'PF', 'retirement', 'pension']
      }
    ]
  },

  // Indian data protection requirements
  dataProtection: {
    id: 'indian_data_protection',
    name: 'Indian Data Protection Requirements',
    description: 'Current data protection requirements applicable in India',
    keywords: [
      'data', 'privacy', 'personal information', 'confidential', 'disclosure', 'consent',
      'data breach', 'sensitive data', 'processing', 'collection', 'retention', 'data subject'
    ],
    requiredClauses: [
      'Data Collection Purpose',
      'Consent for Data Processing',
      'Data Security Measures',
      'Data Breach Notification',
      'Data Subject Rights',
      'Data Retention Period'
    ],
    applicableLaws: [
      {
        name: 'Information Technology Act, 2000 (IT Act)',
        description: 'Provides legal framework for electronic governance and commerce',
        keywords: ['IT Act', 'electronic', 'digital', 'cyber', 'information technology']
      },
      {
        name: 'Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011',
        description: 'Rules for protection of sensitive personal data',
        keywords: ['sensitive personal data', 'security practices', 'SPDI', 'IT Rules']
      },
      {
        name: 'Digital Personal Data Protection Act, 2023',
        description: 'Comprehensive law for personal data protection in India (pending implementation)',
        keywords: ['DPDP', 'personal data', 'data protection', 'data fiduciary', 'data principal']
      }
    ]
  },

  // Critical contract clauses for Indian context
  criticalClauses: [
    'Governing Law (Indian Law)',
    'Jurisdiction (Indian Courts)',
    'Dispute Resolution/Arbitration',
    'Force Majeure',
    'Confidentiality',
    'Intellectual Property Rights',
    'Termination',
    'Indemnification',
    'Limitation of Liability',
    'Notices',
    'Amendment/Modification',
    'Entire Agreement',
    'Severability',
    'Assignment',
    'Waiver',
    'Payment Terms',
    'GST Compliance',
    'Non-Compete/Non-Solicitation',
    'Data Protection/Privacy'
  ],

  // Helper functions for compliance checking
  isCompliantWithIndianContractAct: (contractText: string): { compliant: boolean, issues: string[] } => {
    // This is a simplified check - in a real implementation, this would be more sophisticated
    const issues = [];
    const lowerText = contractText.toLowerCase();
    
    // Check for essential elements
    if (!lowerText.includes('agree') && !lowerText.includes('accept')) {
      issues.push('No clear offer and acceptance language');
    }
    
    if (!lowerText.includes('consider') && !lowerText.includes('payment') && !lowerText.includes('amount')) {
      issues.push('No clear consideration mentioned');
    }
    
    if (!lowerText.includes('law') && !lowerText.includes('legal')) {
      issues.push('No reference to lawful object or purpose');
    }
    
    return { 
      compliant: issues.length === 0,
      issues
    };
  },

  isCompliantWithIndianLabourLaws: (contractText: string): { compliant: boolean, issues: string[] } => {
    // This is a simplified check - in a real implementation, this would be more sophisticated
    const issues = [];
    const lowerText = contractText.toLowerCase();
    
    // Check for essential labour law elements
    if (!lowerText.includes('hour') && !lowerText.includes('time')) {
      issues.push('No clear working hours defined');
    }
    
    if (!lowerText.includes('terminat') && !lowerText.includes('notice period')) {
      issues.push('No termination or notice period provisions');
    }
    
    if (!lowerText.includes('leave') && !lowerText.includes('holiday') && !lowerText.includes('absence')) {
      issues.push('No leave entitlement provisions');
    }
    
    return { 
      compliant: issues.length === 0, 
      issues
    };
  },

  isCompliantWithDataProtection: (contractText: string): { compliant: boolean, issues: string[] } => {
    // This is a simplified check - in a real implementation, this would be more sophisticated
    const issues = [];
    const lowerText = contractText.toLowerCase();
    
    // Check for essential data protection elements
    if (!lowerText.includes('data') && !lowerText.includes('information') && !lowerText.includes('privacy')) {
      issues.push('No data protection or privacy provisions');
    }
    
    if (!lowerText.includes('consent') && !lowerText.includes('agree')) {
      issues.push('No consent provisions for data processing');
    }
    
    if (!lowerText.includes('security') && !lowerText.includes('protect')) {
      issues.push('No data security measures mentioned');
    }
    
    return { 
      compliant: issues.length === 0, 
      issues
    };
  },

  getMissingClauses: (contractText: string): string[] => {
    const missingClauses = [];
    const criticalClauses = indianLegalStandards.criticalClauses;
    const lowerText = contractText.toLowerCase();
    
    // Check for each critical clause
    if (!lowerText.includes('govern') && !lowerText.includes('law')) {
      missingClauses.push('Governing Law Clause');
    }
    
    if (!lowerText.includes('jurisdict') && !lowerText.includes('court')) {
      missingClauses.push('Jurisdiction Clause');
    }
    
    if (!lowerText.includes('disput') && !lowerText.includes('arbitrat') && !lowerText.includes('mediat')) {
      missingClauses.push('Dispute Resolution/Arbitration Clause');
    }
    
    if (!lowerText.includes('force majeure') && !lowerText.includes('act of god')) {
      missingClauses.push('Force Majeure Clause');
    }
    
    if (!lowerText.includes('terminat') && !lowerText.includes('cancel')) {
      missingClauses.push('Termination Clause');
    }
    
    if (!lowerText.includes('confiden')) {
      missingClauses.push('Confidentiality Clause');
    }
    
    if (!lowerText.includes('intellectual property') && !lowerText.includes('ip') && 
        !lowerText.includes('copyright') && !lowerText.includes('trademark')) {
      missingClauses.push('Intellectual Property Clause');
    }
    
    if (!lowerText.includes('indemn')) {
      missingClauses.push('Indemnification Clause');
    }
    
    if (!lowerText.includes('liab')) {
      missingClauses.push('Limitation of Liability Clause');
    }
    
    if (!lowerText.includes('notic')) {
      missingClauses.push('Notices Clause');
    }
    
    if (!lowerText.includes('amend') && !lowerText.includes('modif')) {
      missingClauses.push('Amendment Clause');
    }
    
    if (!lowerText.includes('entire') && !lowerText.includes('whole')) {
      missingClauses.push('Entire Agreement Clause');
    }
    
    if (!lowerText.includes('sever')) {
      missingClauses.push('Severability Clause');
    }
    
    if (!lowerText.includes('assign')) {
      missingClauses.push('Assignment Clause');
    }
    
    if (!lowerText.includes('waiv')) {
      missingClauses.push('Waiver Clause');
    }
    
    if (!lowerText.includes('gst') && !lowerText.includes('tax')) {
      missingClauses.push('GST Compliance Clause');
    }
    
    return missingClauses;
  }
};