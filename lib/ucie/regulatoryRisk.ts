/**
 * Regulatory Risk Assessment for UCIE
 * 
 * Tracks regulatory status and legal risks across jurisdictions
 * Requirements: 23.1, 23.2, 23.3, 23.4, 23.5
 */

export interface JurisdictionStatus {
  jurisdiction: string;
  status: 'approved' | 'pending' | 'restricted' | 'banned' | 'unknown';
  riskLevel: 'green' | 'yellow' | 'red';
  description: string;
  lastUpdated: string;
  regulatoryBodies: string[];
  specificRestrictions: string[];
  complianceRequirements: string[];
}

export interface RegulatoryAction {
  id: string;
  date: string;
  agency: string;
  type: 'warning' | 'investigation' | 'fine' | 'lawsuit' | 'approval' | 'guidance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  outcome: string;
  impact: string;
  source: string;
}

export interface HoweyTestAssessment {
  score: number; // 0-100 (higher = more likely to be a security)
  isLikelySecur ity: boolean;
  confidence: number;
  factors: {
    investmentOfMoney: { score: number; reasoning: string };
    commonEnterprise: { score: number; reasoning: string };
    expectationOfProfits: { score: number; reasoning: string };
    effortsOfOthers: { score: number; reasoning: string };
  };
  conclusion: string;
  legalOpinion: string;
}

export interface ExchangeDelisting {
  exchange: string;
  date: string;
  reason: string;
  impact: 'low' | 'medium' | 'high';
  priceImpact: number;
  volumeImpact: number;
}

export interface LegalProceeding {
  id: string;
  type: 'lawsuit' | 'investigation' | 'settlement' | 'ruling';
  parties: string[];
  status: 'ongoing' | 'settled' | 'dismissed' | 'ruled';
  filingDate: string;
  description: string;
  potentialImpact: string;
  severity: number; // 0-100
}

export interface RegulatoryRiskReport {
  symbol: string;
  timestamp: string;
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number; // 0-100
  jurisdictions: {
    us: JurisdictionStatus;
    eu: JurisdictionStatus;
    uk: JurisdictionStatus;
    asia: JurisdictionStatus;
  };
  regulatoryActions: RegulatoryAction[];
  howeyTest: HoweyTestAssessment;
  delistings: ExchangeDelisting[];
  legalProceedings: LegalProceeding[];
  recommendations: {
    global: string;
    byJurisdiction: Record<string, string>;
  };
  complianceScore: number; // 0-100
  summary: string;
}

/**
 * Assess US regulatory status
 */
export async function assessUSStatus(symbol: string): Promise<JurisdictionStatus> {
  // In production, this would query regulatory databases and news APIs
  // For now, return structured assessment
  
  const isStablecoin = ['USDT', 'USDC', 'DAI', 'BUSD'].includes(symbol.toUpperCase());
  const isMajorCrypto = ['BTC', 'ETH'].includes(symbol.toUpperCase());
  
  let status: 'approved' | 'pending' | 'restricted' | 'banned' | 'unknown' = 'unknown';
  let riskLevel: 'green' | 'yellow' | 'red' = 'yellow';
  let description = '';
  let specificRestrictions: string[] = [];
  
  if (isMajorCrypto) {
    status = 'approved';
    riskLevel = 'green';
    description = 'Recognized as commodity by CFTC. Generally accepted across US exchanges.';
    specificRestrictions = [];
  } else if (isStablecoin) {
    status = 'pending';
    riskLevel = 'yellow';
    description = 'Under increased regulatory scrutiny. Stablecoin legislation pending.';
    specificRestrictions = [
      'May require banking charter in future',
      'Subject to reserve requirements',
      'Potential SEC oversight'
    ];
  } else {
    status = 'unknown';
    riskLevel = 'yellow';
    description = 'Regulatory status unclear. May be classified as security by SEC.';
    specificRestrictions = [
      'Potential Howey Test classification as security',
      'May face SEC enforcement action',
      'Limited availability on US exchanges'
    ];
  }
  
  return {
    jurisdiction: 'United States',
    status,
    riskLevel,
    description,
    lastUpdated: new Date().toISOString(),
    regulatoryBodies: ['SEC', 'CFTC', 'FinCEN', 'OCC'],
    specificRestrictions,
    complianceRequirements: [
      'KYC/AML compliance required',
      'Tax reporting obligations (Form 8949)',
      'State-level money transmitter licenses may apply'
    ]
  };
}

/**
 * Assess EU regulatory status
 */
export async function assessEUStatus(symbol: string): Promise<JurisdictionStatus> {
  const isMajorCrypto = ['BTC', 'ETH'].includes(symbol.toUpperCase());
  
  let status: 'approved' | 'pending' | 'restricted' | 'banned' | 'unknown' = 'pending';
  let riskLevel: 'green' | 'yellow' | 'red' = 'yellow';
  let description = '';
  
  if (isMajorCrypto) {
    status = 'approved';
    riskLevel = 'green';
    description = 'Recognized under MiCA framework. Compliant with EU regulations.';
  } else {
    status = 'pending';
    riskLevel = 'yellow';
    description = 'Under MiCA framework review. Compliance requirements being established.';
  }
  
  return {
    jurisdiction: 'European Union',
    status,
    riskLevel,
    description,
    lastUpdated: new Date().toISOString(),
    regulatoryBodies: ['ESMA', 'EBA', 'ECB'],
    specificRestrictions: [
      'MiCA compliance required by 2024',
      'Stablecoin reserve requirements',
      'Consumer protection measures'
    ],
    complianceRequirements: [
      'MiCA authorization required',
      'AML/CFT compliance (5AMLD)',
      'Consumer disclosure requirements',
      'Operational resilience standards'
    ]
  };
}

/**
 * Assess UK regulatory status
 */
export async function assessUKStatus(symbol: string): Promise<JurisdictionStatus> {
  const isMajorCrypto = ['BTC', 'ETH'].includes(symbol.toUpperCase());
  
  let status: 'approved' | 'pending' | 'restricted' | 'banned' | 'unknown' = 'pending';
  let riskLevel: 'green' | 'yellow' | 'red' = 'yellow';
  let description = '';
  
  if (isMajorCrypto) {
    status = 'approved';
    riskLevel = 'green';
    description = 'Recognized by FCA. Subject to standard crypto asset regulations.';
  } else {
    status = 'pending';
    riskLevel = 'yellow';
    description = 'Under FCA review. Regulatory framework being developed.';
  }
  
  return {
    jurisdiction: 'United Kingdom',
    status,
    riskLevel,
    description,
    lastUpdated: new Date().toISOString(),
    regulatoryBodies: ['FCA', 'Bank of England', 'HM Treasury'],
    specificRestrictions: [
      'FCA registration required for exchanges',
      'Marketing restrictions apply',
      'Potential stablecoin regulation'
    ],
    complianceRequirements: [
      'FCA authorization for crypto activities',
      'AML/CTF compliance',
      'Consumer protection standards',
      'Financial promotions regime compliance'
    ]
  };
}

/**
 * Assess Asia regulatory status (aggregated)
 */
export async function assessAsiaStatus(symbol: string): Promise<JurisdictionStatus> {
  const isMajorCrypto = ['BTC', 'ETH'].includes(symbol.toUpperCase());
  
  let status: 'approved' | 'pending' | 'restricted' | 'banned' | 'unknown' = 'restricted';
  let riskLevel: 'green' | 'yellow' | 'red' = 'yellow';
  let description = '';
  
  if (isMajorCrypto) {
    status = 'approved';
    riskLevel = 'green';
    description = 'Generally accepted in most Asian jurisdictions with varying regulations.';
  } else {
    status = 'restricted';
    riskLevel = 'yellow';
    description = 'Mixed regulatory environment. Banned in China, restricted in others, approved in some.';
  }
  
  return {
    jurisdiction: 'Asia (Aggregated)',
    status,
    riskLevel,
    description,
    lastUpdated: new Date().toISOString(),
    regulatoryBodies: ['Various (Japan FSA, Singapore MAS, Hong Kong SFC, etc.)'],
    specificRestrictions: [
      'Banned in China',
      'Restricted in India (tax implications)',
      'Approved in Japan, Singapore, Hong Kong with licensing',
      'Varying regulations across Southeast Asia'
    ],
    complianceRequirements: [
      'Jurisdiction-specific licensing',
      'AML/KYC requirements vary by country',
      'Tax reporting obligations',
      'Consumer protection measures'
    ]
  };
}

/**
 * Perform Howey Test assessment
 */
export async function performHoweyTest(
  symbol: string,
  tokenData: {
    hasICO: boolean;
    hasFoundation: boolean;
    isDecentralized: boolean;
    hasStaking: boolean;
    hasGovernance: boolean;
    marketingPromises: string[];
  }
): Promise<HoweyTestAssessment> {
  // Factor 1: Investment of Money
  const investmentScore = tokenData.hasICO ? 90 : 50;
  const investmentReasoning = tokenData.hasICO
    ? 'Token was sold through ICO/IEO, indicating investment of money'
    : 'Token can be purchased, but no direct ICO';
  
  // Factor 2: Common Enterprise
  const enterpriseScore = tokenData.hasFoundation ? 80 : 40;
  const enterpriseReasoning = tokenData.hasFoundation
    ? 'Centralized foundation manages development and funds'
    : 'Decentralized structure reduces common enterprise element';
  
  // Factor 3: Expectation of Profits
  const profitScore = tokenData.marketingPromises.length > 0 ? 85 : 45;
  const profitReasoning = tokenData.marketingPromises.length > 0
    ? `Marketing materials promise returns: ${tokenData.marketingPromises.join(', ')}`
    : 'No explicit profit promises in marketing';
  
  // Factor 4: Efforts of Others
  const effortsScore = tokenData.isDecentralized ? 30 : 85;
  const effortsReasoning = tokenData.isDecentralized
    ? 'Decentralized network reduces reliance on others\' efforts'
    : 'Success depends heavily on team/foundation efforts';
  
  // Calculate overall score
  const overallScore = (investmentScore + enterpriseScore + profitScore + effortsScore) / 4;
  const isLikelySecurity = overallScore > 60;
  
  // Calculate confidence based on data quality
  const confidence = Math.min(85, 60 + (tokenData.hasICO ? 10 : 0) + (tokenData.hasFoundation ? 10 : 0));
  
  const conclusion = isLikelySecurity
    ? `HIGH RISK: Token likely meets Howey Test criteria (score: ${overallScore.toFixed(0)}/100). May be classified as security by SEC.`
    : `LOWER RISK: Token less likely to meet Howey Test criteria (score: ${overallScore.toFixed(0)}/100). May be classified as commodity or utility token.`;
  
  const legalOpinion = isLikelySecurity
    ? 'Consult legal counsel before trading. Token may face SEC enforcement action. US investors should exercise caution.'
    : 'While risk is lower, regulatory landscape is evolving. Monitor for SEC guidance and enforcement actions.';
  
  return {
    score: overallScore,
    isLikelySecurity,
    confidence,
    factors: {
      investmentOfMoney: { score: investmentScore, reasoning: investmentReasoning },
      commonEnterprise: { score: enterpriseScore, reasoning: enterpriseReasoning },
      expectationOfProfits: { score: profitScore, reasoning: profitReasoning },
      effortsOfOthers: { score: effortsScore, reasoning: effortsReasoning }
    },
    conclusion,
    legalOpinion
  };
}

/**
 * Track regulatory actions
 */
export async function trackRegulatoryActions(symbol: string): Promise<RegulatoryAction[]> {
  // In production, this would query news APIs and regulatory databases
  // For now, return mock data structure
  return [
    {
      id: 'reg-1',
      date: '2024-01-15',
      agency: 'SEC',
      type: 'guidance',
      severity: 'medium',
      title: 'SEC Issues Guidance on Crypto Asset Securities',
      description: 'SEC clarifies which crypto assets may be considered securities',
      outcome: 'Ongoing guidance development',
      impact: 'Increased regulatory clarity for market participants',
      source: 'https://www.sec.gov/news'
    }
  ];
}

/**
 * Track exchange delistings
 */
export async function trackDelistings(symbol: string): Promise<ExchangeDelisting[]> {
  // In production, this would query exchange APIs and news
  // For now, return empty array or mock data
  return [];
}

/**
 * Track legal proceedings
 */
export async function trackLegalProceedings(symbol: string): Promise<LegalProceeding[]> {
  // In production, this would query legal databases and news
  // For now, return empty array or mock data
  return [];
}

/**
 * Calculate overall regulatory risk
 */
export function calculateRegulatoryRisk(
  jurisdictions: Record<string, JurisdictionStatus>,
  howeyTest: HoweyTestAssessment,
  actions: RegulatoryAction[],
  delistings: ExchangeDelisting[],
  proceedings: LegalProceeding[]
): { overallRisk: 'low' | 'medium' | 'high' | 'critical'; riskScore: number } {
  let riskScore = 0;
  
  // Jurisdiction risk (40% weight)
  const redCount = Object.values(jurisdictions).filter(j => j.riskLevel === 'red').length;
  const yellowCount = Object.values(jurisdictions).filter(j => j.riskLevel === 'yellow').length;
  const jurisdictionRisk = (redCount * 25 + yellowCount * 10);
  riskScore += jurisdictionRisk * 0.4;
  
  // Howey Test risk (30% weight)
  const howeyRisk = howeyTest.isLikelySecurity ? howeyTest.score * 0.8 : howeyTest.score * 0.3;
  riskScore += howeyRisk * 0.3;
  
  // Regulatory actions risk (15% weight)
  const criticalActions = actions.filter(a => a.severity === 'critical').length;
  const highActions = actions.filter(a => a.severity === 'high').length;
  const actionsRisk = Math.min(100, criticalActions * 30 + highActions * 15);
  riskScore += actionsRisk * 0.15;
  
  // Delistings risk (10% weight)
  const delistingsRisk = Math.min(100, delistings.length * 20);
  riskScore += delistingsRisk * 0.1;
  
  // Legal proceedings risk (5% weight)
  const ongoingProceedings = proceedings.filter(p => p.status === 'ongoing').length;
  const proceedingsRisk = Math.min(100, ongoingProceedings * 25);
  riskScore += proceedingsRisk * 0.05;
  
  // Determine overall risk level
  let overallRisk: 'low' | 'medium' | 'high' | 'critical' = 'low';
  if (riskScore > 75) overallRisk = 'critical';
  else if (riskScore > 50) overallRisk = 'high';
  else if (riskScore > 25) overallRisk = 'medium';
  
  return { overallRisk, riskScore };
}

/**
 * Generate jurisdiction-specific recommendations
 */
export function generateRecommendations(
  jurisdictions: Record<string, JurisdictionStatus>,
  howeyTest: HoweyTestAssessment,
  overallRisk: string
): { global: string; byJurisdiction: Record<string, string> } {
  let global = '';
  
  if (overallRisk === 'critical') {
    global = 'CRITICAL RISK: Significant regulatory concerns across multiple jurisdictions. Consult legal counsel before trading. Consider avoiding this asset until regulatory clarity improves.';
  } else if (overallRisk === 'high') {
    global = 'HIGH RISK: Notable regulatory concerns. Exercise extreme caution. Monitor regulatory developments closely. Consider reducing exposure.';
  } else if (overallRisk === 'medium') {
    global = 'MEDIUM RISK: Some regulatory uncertainty. Stay informed of regulatory developments. Ensure compliance with local regulations.';
  } else {
    global = 'LOW RISK: Generally favorable regulatory environment. Continue monitoring for changes. Maintain standard compliance practices.';
  }
  
  if (howeyTest.isLikelySecurity) {
    global += ' WARNING: Token may be classified as security. US investors should exercise particular caution.';
  }
  
  const byJurisdiction: Record<string, string> = {};
  
  Object.entries(jurisdictions).forEach(([key, jurisdiction]) => {
    if (jurisdiction.riskLevel === 'red') {
      byJurisdiction[key] = `AVOID: ${jurisdiction.jurisdiction} has banned or severely restricted this asset. Trading may be illegal.`;
    } else if (jurisdiction.riskLevel === 'yellow') {
      byJurisdiction[key] = `CAUTION: ${jurisdiction.jurisdiction} has regulatory concerns. ${jurisdiction.description}`;
    } else {
      byJurisdiction[key] = `APPROVED: ${jurisdiction.jurisdiction} generally permits trading. ${jurisdiction.description}`;
    }
  });
  
  return { global, byJurisdiction };
}

/**
 * Calculate compliance score
 */
export function calculateComplianceScore(
  jurisdictions: Record<string, JurisdictionStatus>,
  howeyTest: HoweyTestAssessment
): number {
  let score = 100;
  
  // Deduct for red jurisdictions
  const redCount = Object.values(jurisdictions).filter(j => j.riskLevel === 'red').length;
  score -= redCount * 25;
  
  // Deduct for yellow jurisdictions
  const yellowCount = Object.values(jurisdictions).filter(j => j.riskLevel === 'yellow').length;
  score -= yellowCount * 10;
  
  // Deduct for Howey Test concerns
  if (howeyTest.isLikelySecurity) {
    score -= 20;
  }
  
  return Math.max(0, score);
}

/**
 * Generate comprehensive regulatory risk report
 */
export async function generateRegulatoryRiskReport(
  symbol: string,
  tokenData: {
    hasICO: boolean;
    hasFoundation: boolean;
    isDecentralized: boolean;
    hasStaking: boolean;
    hasGovernance: boolean;
    marketingPromises: string[];
  }
): Promise<RegulatoryRiskReport> {
  // Assess all jurisdictions
  const jurisdictions = {
    us: await assessUSStatus(symbol),
    eu: await assessEUStatus(symbol),
    uk: await assessUKStatus(symbol),
    asia: await assessAsiaStatus(symbol)
  };
  
  // Perform Howey Test
  const howeyTest = await performHoweyTest(symbol, tokenData);
  
  // Track regulatory actions, delistings, and legal proceedings
  const regulatoryActions = await trackRegulatoryActions(symbol);
  const delistings = await trackDelistings(symbol);
  const legalProceedings = await trackLegalProceedings(symbol);
  
  // Calculate overall risk
  const { overallRisk, riskScore } = calculateRegulatoryRisk(
    jurisdictions,
    howeyTest,
    regulatoryActions,
    delistings,
    legalProceedings
  );
  
  // Generate recommendations
  const recommendations = generateRecommendations(jurisdictions, howeyTest, overallRisk);
  
  // Calculate compliance score
  const complianceScore = calculateComplianceScore(jurisdictions, howeyTest);
  
  // Generate summary
  const summary = `Regulatory risk: ${overallRisk.toUpperCase()} (${riskScore.toFixed(0)}/100). Compliance score: ${complianceScore}/100. ${recommendations.global}`;
  
  return {
    symbol,
    timestamp: new Date().toISOString(),
    overallRisk,
    riskScore,
    jurisdictions,
    regulatoryActions,
    howeyTest,
    delistings,
    legalProceedings,
    recommendations,
    complianceScore,
    summary
  };
}
