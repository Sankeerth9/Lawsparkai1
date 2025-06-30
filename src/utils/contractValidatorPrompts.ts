/**
 * Specialized prompts for contract validation and analysis
 * These prompts are designed to extract meaningful insights from legal contracts
 */

/**
 * Main contract analysis prompt
 * Performs comprehensive analysis of the entire contract
 * @param contractText The full text of the contract to analyze
 * @returns Formatted prompt for contract analysis
 */
export function getContractAnalysisPrompt(contractText: string): string {
  return `
You are an expert contract analyst with years of experience reviewing legal agreements. Analyze the following contract and provide a detailed JSON response with the exact structure specified.

Contract Text:
${contractText}

Provide analysis in this EXACT JSON format (no additional text, just valid JSON):
{
  "overallScore": [number 0-100],
  "riskLevel": "[excellent|good|fair|poor]",
  "clauses": [
    {
      "id": "[unique_id]",
      "title": "[clause_title]",
      "content": "[clause_excerpt]",
      "riskLevel": "[low|medium|high|critical]",
      "score": [number 0-100],
      "issues": ["[issue1]", "[issue2]"],
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

Analyze for these key contract elements:
- Payment terms and conditions
- Termination clauses and notice periods
- Liability limitations and indemnification
- Intellectual property rights and ownership
- Confidentiality and data protection
- Dispute resolution mechanisms
- Force majeure provisions
- Non-compete and non-solicitation
- Warranties and representations
- Assignment and delegation rights

For each clause:
1. Identify its purpose and category
2. Assess its risk level based on fairness, clarity, and legal protection
3. Flag any unusual, one-sided, or potentially problematic language
4. Provide specific suggestions for improvement
5. Assign a numerical score (0-100) based on overall quality

The overall score should reflect:
- Comprehensiveness (covers all necessary areas)
- Balance (fair to both parties)
- Clarity (clear, unambiguous language)
- Legal protection (adequately protects rights)
- Risk management (properly allocates risks)
`;
}

/**
 * Clause extraction prompt
 * Identifies and extracts individual clauses from a contract
 * @param contractText The full text of the contract
 * @returns Formatted prompt for clause extraction
 */
export function getClauseExtractionPrompt(contractText: string): string {
  return `
You are an expert legal analyst specializing in contract structure. Extract all distinct clauses from the following contract.

Contract Text:
${contractText}

For each clause, provide:
1. The clause title/heading
2. The full text of the clause
3. The clause category (e.g., payment, termination, liability, etc.)
4. Line numbers or section references if available

Return the results as a JSON array with this structure:
[
  {
    "title": "clause title",
    "content": "full clause text",
    "category": "clause category",
    "reference": "section number or line reference"
  }
]

Focus on identifying distinct contractual provisions rather than general text. Each clause should represent a specific contractual obligation, right, or condition.
`;
}

/**
 * Clause explanation prompt
 * Provides a plain-language explanation of a specific clause
 * @param clauseText The text of the specific clause to explain
 * @param contractType The type of contract (e.g., employment, NDA, etc.)
 * @returns Formatted prompt for clause explanation
 */
export function getClauseExplanationPrompt(clauseText: string, contractType: string = 'general'): string {
  return `
You are an expert contract attorney specializing in making legal language accessible to non-lawyers. Explain the following ${contractType} contract clause in plain, simple language.

Clause:
"${clauseText}"

Provide an explanation that:
1. Identifies the main purpose of this clause in 1-2 sentences
2. Explains what rights and obligations it creates for each party
3. Highlights any potential risks or benefits
4. Uses everyday language without legal jargon
5. Provides context about why this clause exists in this type of contract
6. Mentions if this clause is standard or unusual for this type of contract

Your explanation should be comprehensive but easy to understand for someone without legal training. Use analogies or examples if helpful.

If there are any particularly important or unusual aspects of this clause, please point them out. If the clause contains vague or ambiguous language, note this as well.
`;
}

/**
 * Risk assessment prompt
 * Identifies potential risks and red flags in a contract
 * @param contractText The full text of the contract
 * @returns Formatted prompt for risk assessment
 */
export function getRiskAssessmentPrompt(contractText: string): string {
  return `
You are an expert risk analyst specializing in legal contracts. Analyze the following contract and identify all potential risks, red flags, and concerning provisions.

Contract Text:
${contractText}

Provide a comprehensive risk assessment that includes:

1. High-Risk Issues (critical problems that could lead to significant legal or financial exposure)
2. Medium-Risk Issues (concerning elements that should be addressed)
3. Low-Risk Issues (minor concerns or suggestions for improvement)

For each identified risk:
- Quote the specific language causing concern
- Explain why it's problematic
- Rate the severity (high/medium/low)
- Suggest specific revisions or alternatives

Also identify:
- Missing provisions that should be included
- Vague or ambiguous language
- One-sided or unfair terms
- Compliance issues with relevant laws or regulations
- Inconsistencies or contradictions within the document

Format your response as a structured report with clear headings and categorized risks. Focus on practical implications rather than theoretical concerns.
`;
}

/**
 * Plain language summary prompt
 * Creates a simplified summary of a contract in everyday language
 * @param contractText The full text of the contract
 * @returns Formatted prompt for plain language summary
 */
export function getPlainLanguageSummaryPrompt(contractText: string): string {
  return `
You are an expert at translating complex legal documents into plain, accessible language. Create a comprehensive summary of the following contract in simple terms that anyone can understand.

Contract Text:
${contractText}

Your summary should:
1. Identify the type of contract and its main purpose
2. Explain the key obligations for each party in simple terms
3. Highlight important dates, deadlines, or time periods
4. Explain payment terms and financial obligations clearly
5. Describe what happens if someone breaks the agreement
6. Point out any unusual or particularly important provisions
7. Avoid legal jargon and technical terms
8. Use short sentences and everyday language

Structure the summary with clear headings and bullet points where appropriate. The goal is to make the contract's content accessible to someone without legal training while preserving all important information.
`;
}

/**
 * Comparative analysis prompt
 * Compares a contract against industry standards or best practices
 * @param contractText The full text of the contract
 * @param contractType The type of contract (e.g., employment, NDA, etc.)
 * @returns Formatted prompt for comparative analysis
 */
export function getComparativeAnalysisPrompt(contractText: string, contractType: string): string {
  return `
You are an expert contract attorney with extensive knowledge of industry standards and best practices. Compare the following ${contractType} contract against typical standards and best practices for this type of agreement.

Contract Text:
${contractText}

Provide a comparative analysis that:
1. Identifies standard provisions that are present and well-drafted
2. Highlights standard provisions that are missing or inadequate
3. Notes any unusual or non-standard provisions
4. Compares the balance and fairness against industry norms
5. Evaluates the overall quality relative to typical ${contractType} contracts

For each major section or clause type, provide:
- What's typically included in standard ${contractType} contracts
- How this contract compares to those standards
- Whether the approach is better, worse, or typical
- Specific recommendations for improvement

Focus on substantive differences rather than stylistic variations. Consider both legal protections and business implications in your analysis.
`;
}

/**
 * Negotiation guidance prompt
 * Provides advice on negotiating specific contract terms
 * @param contractText The full text of the contract
 * @returns Formatted prompt for negotiation guidance
 */
export function getNegotiationGuidancePrompt(contractText: string): string {
  return `
You are an expert contract negotiator with years of experience helping clients secure favorable terms. Review the following contract and provide strategic negotiation advice.

Contract Text:
${contractText}

Provide negotiation guidance that:
1. Identifies the most problematic terms that should be prioritized for negotiation
2. Suggests specific alternative language for each problematic term
3. Explains the rationale behind each suggested change
4. Provides fallback positions if the ideal changes are rejected
5. Highlights terms that are already favorable and should be preserved

For each negotiation point, include:
- The current language
- Proposed revision
- Explanation of why this change matters
- Potential counterarguments from the other party
- Responses to those counterarguments

Focus on practical, achievable changes rather than complete rewrites. Consider the relative bargaining power of the parties and industry norms when making suggestions.
`;
}

/**
 * Compliance check prompt
 * Verifies a contract's compliance with specific laws or regulations
 * @param contractText The full text of the contract
 * @param jurisdiction The legal jurisdiction (e.g., "California", "EU")
 * @param regulations Specific regulations to check against (e.g., "GDPR", "CCPA")
 * @returns Formatted prompt for compliance checking
 */
export function getComplianceCheckPrompt(contractText: string, jurisdiction: string, regulations: string[]): string {
  return `
You are an expert legal compliance officer specializing in ${jurisdiction} law and ${regulations.join(', ')} regulations. Review the following contract for compliance issues.

Contract Text:
${contractText}

Jurisdiction: ${jurisdiction}
Regulations to check: ${regulations.join(', ')}

Provide a comprehensive compliance analysis that:
1. Identifies any provisions that may violate applicable laws or regulations
2. Highlights required provisions that are missing
3. Notes any language that should be modified to ensure compliance
4. Explains the specific legal requirements that apply
5. Suggests compliant alternative language where needed

For each compliance issue, include:
- The relevant section of the contract
- The specific law or regulation at issue
- The nature of the compliance problem
- Recommended changes to address the issue
- Potential consequences of non-compliance

Focus on substantive compliance issues rather than minor technical details. Prioritize issues by severity and risk.
`;
}

/**
 * Specialized clause drafting prompt
 * Creates custom clause language for specific situations
 * @param clauseType The type of clause to draft
 * @param requirements Specific requirements for the clause
 * @param contractContext Additional context about the contract
 * @returns Formatted prompt for clause drafting
 */
export function getClauseDraftingPrompt(clauseType: string, requirements: string[], contractContext: string): string {
  return `
You are an expert contract drafter with extensive experience creating precise, effective legal language. Draft a ${clauseType} clause that meets the following requirements.

Requirements:
${requirements.map(req => `- ${req}`).join('\n')}

Contract Context:
${contractContext}

Provide:
1. The complete clause text, ready to insert into a contract
2. A brief explanation of how the clause addresses each requirement
3. Any optional additions or variations that might be considered
4. Notes on how this clause interacts with other typical contract provisions

The clause should be:
- Clear and unambiguous
- Legally sound and enforceable
- Balanced and reasonable
- Comprehensive in addressing the requirements
- Written in standard contract language

Draft the clause as if it will be used in an actual contract, with proper legal terminology and structure.
`;
}

/**
 * Contract completion prompt
 * Suggests additional clauses or provisions that should be added
 * @param contractText The full text of the contract
 * @param contractType The type of contract (e.g., employment, NDA, etc.)
 * @returns Formatted prompt for contract completion
 */
export function getContractCompletionPrompt(contractText: string, contractType: string): string {
  return `
You are an expert contract attorney specializing in ${contractType} agreements. Review the following contract and identify important provisions that are missing or incomplete.

Contract Text:
${contractText}

Provide a comprehensive analysis of missing or incomplete elements:
1. Identify standard clauses that are entirely missing from this contract
2. Highlight existing clauses that are incomplete or inadequately detailed
3. Suggest specific language to add for each missing or incomplete provision
4. Explain why each suggested addition is important

For each recommendation, include:
- The type of provision
- Suggested language to add
- Explanation of its purpose and importance
- Where in the contract it should be placed

Focus on substantive provisions that affect rights, obligations, and protections rather than stylistic elements. Consider both legal necessities and business best practices for ${contractType} contracts.
`;
}

/**
 * Definitions analysis prompt
 * Reviews and improves the definitions section of a contract
 * @param definitionsText The text of the definitions section
 * @param contractContext Additional context about the contract
 * @returns Formatted prompt for definitions analysis
 */
export function getDefinitionsAnalysisPrompt(definitionsText: string, contractContext: string): string {
  return `
You are an expert contract drafter specializing in precise legal definitions. Review the following definitions section from a contract and provide analysis and improvements.

Definitions Section:
${definitionsText}

Contract Context:
${contractContext}

Provide a comprehensive analysis that:
1. Identifies any defined terms that are unclear, circular, or problematic
2. Highlights important terms used in the contract that should be defined but aren't
3. Notes any definitions that are unnecessarily complex or could be simplified
4. Suggests improved language for problematic definitions
5. Proposes definitions for important undefined terms

For each definition, consider:
- Clarity and precision
- Consistency with how the term is used in the contract
- Potential for misinterpretation
- Alignment with legal standards and common usage
- Interaction with other defined terms

Focus on substantive improvements that enhance clarity and reduce potential disputes rather than stylistic preferences.
`;
}

/**
 * Termination clause analysis prompt
 * Specifically analyzes termination provisions
 * @param terminationText The text of the termination clause(s)
 * @returns Formatted prompt for termination clause analysis
 */
export function getTerminationClauseAnalysisPrompt(terminationText: string): string {
  return `
You are an expert contract attorney specializing in termination provisions. Analyze the following termination clause(s) and provide a detailed assessment.

Termination Clause(s):
${terminationText}

Provide a comprehensive analysis that:
1. Identifies all termination scenarios covered (e.g., for cause, for convenience, etc.)
2. Highlights any important termination scenarios that are not addressed
3. Analyzes notice requirements and termination procedures
4. Assesses post-termination obligations and survival provisions
5. Evaluates the balance between parties' termination rights
6. Identifies any unusual or potentially problematic language

For each termination right, analyze:
- Who can exercise it
- Under what conditions
- With what notice period
- With what consequences
- Any limitations or exceptions

Also consider:
- Clarity and enforceability
- Potential for abuse or misuse
- Interaction with other contract provisions
- Practical implications for both parties

Provide specific recommendations for improving the termination provisions to better protect both parties' interests and provide clarity around the end of the contractual relationship.
`;
}

/**
 * Liability clause analysis prompt
 * Specifically analyzes liability and indemnification provisions
 * @param liabilityText The text of the liability clause(s)
 * @returns Formatted prompt for liability clause analysis
 */
export function getLiabilityClauseAnalysisPrompt(liabilityText: string): string {
  return `
You are an expert contract attorney specializing in liability and indemnification provisions. Analyze the following liability-related clause(s) and provide a detailed assessment.

Liability Clause(s):
${liabilityText}

Provide a comprehensive analysis that:
1. Identifies all types of liability addressed (direct, indirect, consequential, etc.)
2. Analyzes any liability caps or limitations
3. Evaluates indemnification obligations for both parties
4. Highlights any exclusions or carve-outs from liability limitations
5. Assesses the overall balance and fairness of risk allocation
6. Identifies any unusual or potentially unenforceable provisions

For each liability provision, analyze:
- Scope and coverage
- Monetary limitations
- Exceptions and exclusions
- Procedural requirements
- Interaction with insurance requirements

Also consider:
- Enforceability under common law principles
- Clarity and potential for misinterpretation
- Alignment with industry standards
- Practical implications for risk management

Provide specific recommendations for improving the liability provisions to create a fair and enforceable risk allocation framework that protects both parties' legitimate interests.
`;
}

/**
 * Intellectual property clause analysis prompt
 * Specifically analyzes IP-related provisions
 * @param ipText The text of the IP clause(s)
 * @returns Formatted prompt for IP clause analysis
 */
export function getIntellectualPropertyClauseAnalysisPrompt(ipText: string): string {
  return `
You are an expert intellectual property attorney specializing in contract provisions. Analyze the following intellectual property clause(s) and provide a detailed assessment.

Intellectual Property Clause(s):
${ipText}

Provide a comprehensive analysis that:
1. Identifies all types of IP addressed (copyrights, patents, trademarks, trade secrets, etc.)
2. Analyzes ownership provisions for pre-existing IP and newly created IP
3. Evaluates license grants, including scope, duration, and limitations
4. Assesses IP representations and warranties
5. Identifies any IP indemnification provisions
6. Highlights any unusual or potentially problematic language

For each IP provision, analyze:
- Clarity of ownership and rights allocation
- Scope of licenses granted
- Limitations and restrictions
- Protection mechanisms
- Termination effects on IP rights

Also consider:
- Alignment with the purpose of the agreement
- Potential unintended consequences
- Interaction with confidentiality provisions
- Practical implications for both parties' business interests

Provide specific recommendations for improving the IP provisions to better protect both parties' intellectual property rights while enabling the intended business relationship.
`;
}

/**
 * Confidentiality clause analysis prompt
 * Specifically analyzes confidentiality and non-disclosure provisions
 * @param confidentialityText The text of the confidentiality clause(s)
 * @returns Formatted prompt for confidentiality clause analysis
 */
export function getConfidentialityClauseAnalysisPrompt(confidentialityText: string): string {
  return `
You are an expert attorney specializing in confidentiality and data protection provisions. Analyze the following confidentiality clause(s) and provide a detailed assessment.

Confidentiality Clause(s):
${confidentialityText}

Provide a comprehensive analysis that:
1. Identifies the definition and scope of confidential information
2. Analyzes exclusions from confidential information
3. Evaluates permitted uses and disclosure restrictions
4. Assesses the duration of confidentiality obligations
5. Identifies any security measures or standards required
6. Analyzes return/destruction requirements for confidential information
7. Highlights any unusual or potentially problematic language

For each confidentiality provision, analyze:
- Clarity and breadth of definitions
- Reasonableness of obligations
- Practical enforceability
- Exceptions and carve-outs
- Remedies for breach

Also consider:
- Alignment with any applicable data protection laws
- Interaction with other contract provisions
- Practical implications for information sharing
- Industry standards for similar agreements

Provide specific recommendations for improving the confidentiality provisions to better protect sensitive information while enabling necessary business operations.
`;
}

/**
 * Payment terms analysis prompt
 * Specifically analyzes payment-related provisions
 * @param paymentText The text of the payment clause(s)
 * @returns Formatted prompt for payment terms analysis
 */
export function getPaymentTermsAnalysisPrompt(paymentText: string): string {
  return `
You are an expert contract attorney specializing in financial provisions. Analyze the following payment clause(s) and provide a detailed assessment.

Payment Clause(s):
${paymentText}

Provide a comprehensive analysis that:
1. Identifies all payment obligations (amounts, timing, methods)
2. Analyzes any conditions or prerequisites for payment
3. Evaluates late payment consequences and interest provisions
4. Assesses any price adjustment mechanisms
5. Identifies tax-related provisions
6. Analyzes invoice requirements and procedures
7. Highlights any unusual or potentially problematic language

For each payment provision, analyze:
- Clarity and specificity
- Payment timing and terms
- Currency and payment method requirements
- Documentation requirements
- Remedies for non-payment

Also consider:
- Alignment with industry standards
- Potential cash flow implications
- Interaction with delivery or performance obligations
- Practical enforceability

Provide specific recommendations for improving the payment provisions to create clear, fair, and enforceable payment terms that protect both parties' interests.
`;
}

/**
 * Dispute resolution analysis prompt
 * Specifically analyzes dispute resolution provisions
 * @param disputeText The text of the dispute resolution clause(s)
 * @returns Formatted prompt for dispute resolution analysis
 */
export function getDisputeResolutionAnalysisPrompt(disputeText: string): string {
  return `
You are an expert contract attorney specializing in dispute resolution provisions. Analyze the following dispute resolution clause(s) and provide a detailed assessment.

Dispute Resolution Clause(s):
${disputeText}

Provide a comprehensive analysis that:
1. Identifies the primary dispute resolution mechanism(s) (litigation, arbitration, mediation, etc.)
2. Analyzes jurisdiction, venue, and governing law provisions
3. Evaluates any required pre-litigation procedures (negotiation, mediation, etc.)
4. Assesses arbitration specifics (if applicable) - forum, rules, arbitrator selection, etc.
5. Identifies any provisions regarding remedies, injunctive relief, or specific performance
6. Analyzes fee-shifting provisions (attorneys' fees, costs)
7. Highlights any unusual or potentially problematic language

For each dispute resolution provision, analyze:
- Clarity and enforceability
- Procedural requirements
- Potential costs and time implications
- Limitations on available remedies
- Balance between parties

Also consider:
- Enforceability in relevant jurisdictions
- Practical implications for dispute resolution
- Alignment with the nature of likely disputes
- Industry standards for similar agreements

Provide specific recommendations for improving the dispute resolution provisions to create a fair, efficient, and enforceable framework for resolving potential disputes.
`;
}

/**
 * Force majeure analysis prompt
 * Specifically analyzes force majeure provisions
 * @param forceText The text of the force majeure clause(s)
 * @returns Formatted prompt for force majeure analysis
 */
export function getForceMajeureAnalysisPrompt(forceText: string): string {
  return `
You are an expert contract attorney specializing in force majeure and risk allocation provisions. Analyze the following force majeure clause(s) and provide a detailed assessment.

Force Majeure Clause(s):
${forceText}

Provide a comprehensive analysis that:
1. Identifies the specific events that qualify as force majeure
2. Analyzes the required impact of those events (prevention, delay, hindrance, etc.)
3. Evaluates notice requirements and procedures
4. Assesses the consequences of a force majeure event (suspension, termination, etc.)
5. Identifies any exclusions or limitations
6. Analyzes the duration of relief provided
7. Highlights any unusual or potentially problematic language

For each force majeure provision, analyze:
- Breadth and specificity of covered events
- Clarity of impact threshold
- Procedural requirements
- Remedies and relief provided
- Balance between parties

Also consider:
- Recent developments in force majeure interpretation (e.g., pandemic-related)
- Interaction with other risk allocation provisions
- Practical implications for business continuity
- Industry standards for similar agreements

Provide specific recommendations for improving the force majeure provisions to create a clear, fair, and enforceable framework for addressing unforeseeable events that impact performance.
`;
}

/**
 * Non-compete analysis prompt
 * Specifically analyzes non-compete and restrictive covenant provisions
 * @param nonCompeteText The text of the non-compete clause(s)
 * @param jurisdiction The legal jurisdiction (important for non-compete analysis)
 * @returns Formatted prompt for non-compete analysis
 */
export function getNonCompeteAnalysisPrompt(nonCompeteText: string, jurisdiction: string): string {
  return `
You are an expert employment attorney specializing in restrictive covenants. Analyze the following non-compete and/or restrictive covenant clause(s) and provide a detailed assessment.

Non-Compete/Restrictive Covenant Clause(s):
${nonCompeteText}

Jurisdiction: ${jurisdiction}

Provide a comprehensive analysis that:
1. Identifies all types of restrictions (non-compete, non-solicitation, non-disclosure, etc.)
2. Analyzes the geographic scope of restrictions
3. Evaluates the temporal duration of restrictions
4. Assesses the substantive scope of restricted activities
5. Identifies any consideration provided for the restrictions
6. Analyzes enforceability under ${jurisdiction} law
7. Highlights any unusual or potentially problematic language

For each restrictive covenant, analyze:
- Reasonableness of scope, geography, and duration
- Protection of legitimate business interests
- Undue hardship on the restricted party
- Public interest considerations
- Severability and blue-pencil provisions

Also consider:
- Recent legal developments in ${jurisdiction} regarding restrictive covenants
- Industry standards for similar positions and agreements
- Practical implications for future employment or business activities
- Potential enforcement challenges

Provide specific recommendations for improving the restrictive covenant provisions to create enforceable restrictions that protect legitimate business interests while complying with ${jurisdiction} law.
`;
}

/**
 * Contract risk scoring criteria
 * Defines how risk levels and scores are determined
 */
export const riskScoringCriteria = {
  overallScore: {
    excellent: { range: [90, 100], description: "Comprehensive, balanced contract with clear terms and strong protections" },
    good: { range: [75, 89], description: "Solid contract with minor issues that could be improved" },
    fair: { range: [60, 74], description: "Adequate contract with several areas needing attention" },
    poor: { range: [0, 59], description: "Problematic contract with significant issues requiring major revision" }
  },
  
  clauseRisk: {
    low: { description: "Well-drafted clause with clear, fair, and enforceable terms" },
    medium: { description: "Clause with minor issues that could be improved for clarity or balance" },
    high: { description: "Problematic clause with significant issues that should be addressed" },
    critical: { description: "Severely problematic clause that creates major risk and requires immediate attention" }
  },
  
  scoringFactors: [
    "Clarity and precision of language",
    "Fairness and balance between parties",
    "Comprehensiveness of coverage",
    "Alignment with applicable laws",
    "Protection of client interests",
    "Appropriate risk allocation",
    "Enforceability of terms",
    "Presence of standard protections"
  ]
};

/**
 * Common contract clause categories
 * Used for classification and organization
 */
export const clauseCategories = [
  "payment_terms",
  "termination",
  "liability",
  "indemnification",
  "intellectual_property",
  "confidentiality",
  "warranties",
  "force_majeure",
  "dispute_resolution",
  "governing_law",
  "assignment",
  "amendment",
  "entire_agreement",
  "severability",
  "notices",
  "non_compete",
  "non_solicitation",
  "data_protection",
  "compliance",
  "term_duration"
];

/**
 * Common contract types
 * Used for context-specific analysis
 */
export const contractTypes = [
  "employment",
  "service_agreement",
  "sales_contract",
  "lease_agreement",
  "non_disclosure",
  "licensing",
  "partnership",
  "loan_agreement",
  "settlement",
  "merger_acquisition"
];