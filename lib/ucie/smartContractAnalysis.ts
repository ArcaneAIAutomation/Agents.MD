/**
 * Smart Contract Security Analysis
 * Analyzes smart contracts for vulnerabilities and security issues
 */

import { getContractSource } from './onChainData';

export interface SecurityVulnerability {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  location?: string;
}

export interface ContractSecurityScore {
  score: number; // 0-100
  isVerified: boolean;
  vulnerabilities: SecurityVulnerability[];
  redFlags: string[];
  warnings: string[];
  strengths: string[];
  auditStatus: 'not_audited' | 'self_audited' | 'third_party_audited';
  auditor?: string;
}

// Vulnerability patterns to check
const VULNERABILITY_PATTERNS = {
  reentrancy: {
    patterns: [
      /\.call\{value:/gi,
      /\.call\.value\(/gi,
      /external.*payable/gi
    ],
    severity: 'critical' as const,
    description: 'Potential reentrancy vulnerability detected'
  },
  overflow: {
    patterns: [
      /\+\+/g,
      /\-\-/g,
      /\s\+\s/g,
      /\s\-\s/g,
      /\s\*\s/g
    ],
    severity: 'medium' as const,
    description: 'Potential integer overflow/underflow (check for SafeMath usage)'
  },
  uncheckedCall: {
    patterns: [
      /\.call\(/gi,
      /\.delegatecall\(/gi,
      /\.send\(/gi
    ],
    severity: 'high' as const,
    description: 'Unchecked external call detected'
  },
  accessControl: {
    patterns: [
      /onlyOwner/gi,
      /require\(msg\.sender/gi,
      /modifier/gi
    ],
    severity: 'low' as const,
    description: 'Access control patterns found (verify implementation)'
  },
  selfDestruct: {
    patterns: [
      /selfdestruct\(/gi,
      /suicide\(/gi
    ],
    severity: 'critical' as const,
    description: 'Self-destruct function found - contract can be destroyed'
  },
  delegateCall: {
    patterns: [
      /delegatecall\(/gi
    ],
    severity: 'high' as const,
    description: 'Delegate call detected - potential for malicious code execution'
  },
  txOrigin: {
    patterns: [
      /tx\.origin/gi
    ],
    severity: 'medium' as const,
    description: 'tx.origin used for authentication (use msg.sender instead)'
  },
  timestamp: {
    patterns: [
      /block\.timestamp/gi,
      /now\s/gi
    ],
    severity: 'low' as const,
    description: 'Timestamp dependence detected (can be manipulated by miners)'
  }
};

// Red flags to check
const RED_FLAGS = {
  hiddenMint: /function\s+mint\s*\(/gi,
  pausable: /function\s+pause\s*\(/gi,
  blacklist: /blacklist/gi,
  honeypot: /function\s+sell\s*\(/gi,
  highTax: /tax|fee/gi,
  proxyPattern: /delegatecall|proxy/gi
};

/**
 * Analyze smart contract source code for vulnerabilities
 */
export async function analyzeSmartContract(
  contractAddress: string,
  chain: 'ethereum' | 'bsc' | 'polygon' = 'ethereum'
): Promise<ContractSecurityScore> {
  try {
    // Fetch contract source code
    const contractData = await getContractSource(contractAddress, chain);

    if (!contractData) {
      return {
        score: 0,
        isVerified: false,
        vulnerabilities: [],
        redFlags: ['Contract source code not available'],
        warnings: ['Unable to verify contract security'],
        strengths: [],
        auditStatus: 'not_audited'
      };
    }

    const sourceCode = contractData.SourceCode || '';
    const isVerified = contractData.ABI !== 'Contract source code not verified';
    const contractName = contractData.ContractName || 'Unknown';

    // Initialize analysis results
    const vulnerabilities: SecurityVulnerability[] = [];
    const redFlags: string[] = [];
    const warnings: string[] = [];
    const strengths: string[] = [];

    // Check if contract is verified
    if (!isVerified) {
      redFlags.push('Contract source code is not verified');
      warnings.push('Cannot perform security analysis on unverified contract');
      
      return {
        score: 20,
        isVerified: false,
        vulnerabilities: [],
        redFlags,
        warnings,
        strengths: [],
        auditStatus: 'not_audited'
      };
    }

    // Analyze for vulnerabilities
    for (const [vulnName, vulnData] of Object.entries(VULNERABILITY_PATTERNS)) {
      for (const pattern of vulnData.patterns) {
        const matches = sourceCode.match(pattern);
        if (matches && matches.length > 0) {
          vulnerabilities.push({
            type: vulnName,
            severity: vulnData.severity,
            description: vulnData.description,
            location: `Found ${matches.length} occurrence(s)`
          });
        }
      }
    }

    // Check for red flags
    for (const [flagName, pattern] of Object.entries(RED_FLAGS)) {
      if (pattern.test(sourceCode)) {
        redFlags.push(`${flagName}: Potentially dangerous pattern detected`);
      }
    }

    // Check for security strengths
    if (/SafeMath/gi.test(sourceCode)) {
      strengths.push('Uses SafeMath library for arithmetic operations');
    }
    if (/OpenZeppelin/gi.test(sourceCode)) {
      strengths.push('Uses OpenZeppelin contracts (industry standard)');
    }
    if (/ReentrancyGuard/gi.test(sourceCode)) {
      strengths.push('Implements ReentrancyGuard protection');
    }
    if (/Pausable/gi.test(sourceCode)) {
      strengths.push('Implements emergency pause functionality');
    }
    if (/require\(/gi.test(sourceCode)) {
      strengths.push('Uses require statements for input validation');
    }

    // Check for audit information
    let auditStatus: 'not_audited' | 'self_audited' | 'third_party_audited' = 'not_audited';
    let auditor: string | undefined;

    if (/audited by|audit report|security audit/gi.test(sourceCode)) {
      auditStatus = 'third_party_audited';
      
      // Try to extract auditor name
      const auditorMatch = sourceCode.match(/audited by\s+([A-Za-z\s]+)/i);
      if (auditorMatch) {
        auditor = auditorMatch[1].trim();
      }
    }

    // Calculate security score (0-100)
    let score = 100;

    // Deduct points for vulnerabilities
    vulnerabilities.forEach(vuln => {
      switch (vuln.severity) {
        case 'critical':
          score -= 25;
          break;
        case 'high':
          score -= 15;
          break;
        case 'medium':
          score -= 10;
          break;
        case 'low':
          score -= 5;
          break;
      }
    });

    // Deduct points for red flags
    score -= redFlags.length * 10;

    // Add points for strengths
    score += Math.min(strengths.length * 5, 20);

    // Add points for audit
    if (auditStatus === 'third_party_audited') {
      score += 15;
    }

    // Ensure score is between 0 and 100
    score = Math.max(0, Math.min(100, score));

    // Generate warnings based on score
    if (score < 30) {
      warnings.push('CRITICAL: This contract has severe security issues');
    } else if (score < 50) {
      warnings.push('WARNING: This contract has significant security concerns');
    } else if (score < 70) {
      warnings.push('CAUTION: This contract has some security issues to review');
    }

    return {
      score,
      isVerified,
      vulnerabilities,
      redFlags,
      warnings,
      strengths,
      auditStatus,
      auditor
    };

  } catch (error) {
    console.error('Smart contract analysis failed:', error);
    
    return {
      score: 0,
      isVerified: false,
      vulnerabilities: [],
      redFlags: ['Analysis failed'],
      warnings: ['Unable to analyze contract security'],
      strengths: [],
      auditStatus: 'not_audited'
    };
  }
}

/**
 * Quick security check for common issues
 */
export function quickSecurityCheck(sourceCode: string): {
  hasMintFunction: boolean;
  hasPauseFunction: boolean;
  hasBlacklist: boolean;
  hasHighFees: boolean;
  usesProxy: boolean;
  isOpenSource: boolean;
} {
  return {
    hasMintFunction: /function\s+mint\s*\(/gi.test(sourceCode),
    hasPauseFunction: /function\s+pause\s*\(/gi.test(sourceCode),
    hasBlacklist: /blacklist/gi.test(sourceCode),
    hasHighFees: /tax|fee/gi.test(sourceCode),
    usesProxy: /delegatecall|proxy/gi.test(sourceCode),
    isOpenSource: sourceCode.length > 0
  };
}

/**
 * Generate security report summary
 */
export function generateSecuritySummary(analysis: ContractSecurityScore): string {
  const { score, isVerified, vulnerabilities, redFlags, strengths, auditStatus } = analysis;

  let summary = `Security Score: ${score}/100\n\n`;

  if (!isVerified) {
    summary += '⚠️ Contract is NOT verified\n\n';
    return summary;
  }

  summary += `✓ Contract is verified\n\n`;

  if (auditStatus === 'third_party_audited') {
    summary += `✓ Third-party audited${analysis.auditor ? ` by ${analysis.auditor}` : ''}\n\n`;
  }

  if (vulnerabilities.length > 0) {
    summary += `Vulnerabilities Found: ${vulnerabilities.length}\n`;
    vulnerabilities.forEach(vuln => {
      summary += `  - [${vuln.severity.toUpperCase()}] ${vuln.description}\n`;
    });
    summary += '\n';
  }

  if (redFlags.length > 0) {
    summary += `Red Flags: ${redFlags.length}\n`;
    redFlags.forEach(flag => {
      summary += `  - ${flag}\n`;
    });
    summary += '\n';
  }

  if (strengths.length > 0) {
    summary += `Security Strengths:\n`;
    strengths.forEach(strength => {
      summary += `  ✓ ${strength}\n`;
    });
    summary += '\n';
  }

  return summary;
}
