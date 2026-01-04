/**
 * Risk Scoring Engine
 * Combines all detection signals to produce final risk assessment
 */

const RiskScoringEngine = {
  
  /**
   * Calculate overall risk score from all signals
   */
  async calculate(signals) {
    const result = {
      risk_score: 0,
      risk_level: 'low', // 'low', 'medium', 'high'
      explanation: '',
      reasons: [],
      signal_weights: {},
      detailed_breakdown: {}
    };
    
    // Define weights for each signal
    const weights = {
      websiteSecurity: 0.20,
      urlPhishing: 0.15,
      financialIntent: 0.25, // Higher weight because it triggers stricter checks
      otpMisuse: 0.20,
      upiScam: 0.20
    };
    
    result.signal_weights = weights;
    
    // Calculate weighted score for each component
    let totalScore = 0;
    let activeSignals = 0;
    
    // Website Security Score
    if (signals.websiteSecurity) {
      const secScore = 1 - signals.websiteSecurity.score; // Invert (low score = high risk)
      const weightedScore = secScore * weights.websiteSecurity;
      totalScore += weightedScore;
      activeSignals++;
      
      result.detailed_breakdown.websiteSecurity = {
        raw_score: secScore,
        weighted_score: weightedScore,
        issues: signals.websiteSecurity.issues
      };
      
      if (signals.websiteSecurity.issues.length > 0) {
        result.reasons.push(...signals.websiteSecurity.issues);
      }
    }
    
    // URL Phishing Score
    if (signals.urlPhishing) {
      const weightedScore = signals.urlPhishing.score * weights.urlPhishing;
      totalScore += weightedScore;
      activeSignals++;
      
      result.detailed_breakdown.urlPhishing = {
        raw_score: signals.urlPhishing.score,
        weighted_score: weightedScore,
        is_phishing: signals.urlPhishing.isPhishing
      };
      
      if (signals.urlPhishing.reasons.length > 0) {
        result.reasons.push(...signals.urlPhishing.reasons);
      }
    }
    
    // Financial Intent (multiplier effect)
    if (signals.financialIntent) {
      const isFinancial = signals.financialIntent.isFinancial;
      
      result.detailed_breakdown.financialIntent = {
        is_financial: isFinancial,
        intent: signals.financialIntent.intent,
        confidence: signals.financialIntent.confidence
      };
      
      if (isFinancial) {
        // Financial activity detected - amplify other risk signals
        totalScore *= 1.5; // Multiply existing risk by 1.5
        result.reasons.push(`Financial activity detected: ${signals.financialIntent.intent}`);
        
        // Add specific financial indicators
        if (signals.financialIntent.indicators.length > 0) {
          result.reasons.push(...signals.financialIntent.indicators);
        }
      }
    }
    
    // OTP Misuse Score (only if financial intent detected)
    if (signals.otpMisuse && signals.financialIntent?.isFinancial) {
      const otpScore = signals.otpMisuse.score;
      const weightedScore = otpScore * weights.otpMisuse;
      totalScore += weightedScore;
      activeSignals++;
      
      result.detailed_breakdown.otpMisuse = {
        raw_score: otpScore,
        weighted_score: weightedScore,
        is_misuse: signals.otpMisuse.isMisuse,
        severity: signals.otpMisuse.severity
      };
      
      if (signals.otpMisuse.warnings.length > 0) {
        result.reasons.push(...signals.otpMisuse.warnings);
      }
      
      // High severity OTP misuse is critical
      if (signals.otpMisuse.severity === 'high') {
        totalScore = Math.max(totalScore, 0.9); // Force high risk
      }
    }
    
    // UPI Scam Score (only if financial intent detected)
    if (signals.upiScam && signals.financialIntent?.isFinancial) {
      const upiScore = signals.upiScam.confidence;
      const weightedScore = upiScore * weights.upiScam;
      totalScore += weightedScore;
      activeSignals++;
      
      result.detailed_breakdown.upiScam = {
        raw_score: upiScore,
        weighted_score: weightedScore,
        is_scam: signals.upiScam.isScam,
        scam_type: signals.upiScam.scamType
      };
      
      if (signals.upiScam.warnings.length > 0) {
        result.reasons.push(...signals.upiScam.warnings);
      }
      
      // UPI scam detected is critical
      if (signals.upiScam.isScam) {
        totalScore = Math.max(totalScore, 0.85); // Force high risk
      }
    }
    
    // Ensure score is in valid range
    result.risk_score = Math.min(Math.max(totalScore, 0), 1.0);
    
    // Determine risk level
    if (result.risk_score >= 0.7) {
      result.risk_level = 'high';
      result.explanation = this.generateHighRiskExplanation(signals);
    } else if (result.risk_score >= 0.4) {
      result.risk_level = 'medium';
      result.explanation = this.generateMediumRiskExplanation(signals);
    } else {
      result.risk_level = 'low';
      result.explanation = 'This page appears safe, but always verify before entering sensitive information.';
    }
    
    // Try to get ML-based risk score as well (optional enhancement)
    try {
      const mlRisk = await this.getMLRiskScore(signals);
      if (mlRisk) {
        // Blend ML score with rule-based score (70% rule-based, 30% ML)
        result.risk_score = (result.risk_score * 0.7) + (mlRisk.risk_score * 0.3);
        
        // Re-determine risk level
        if (result.risk_score >= 0.7) {
          result.risk_level = 'high';
        } else if (result.risk_score >= 0.4) {
          result.risk_level = 'medium';
        } else {
          result.risk_level = 'low';
        }
      }
    } catch (error) {
      console.warn('ML risk scoring not available:', error);
    }
    
    return result;
  },
  
  /**
   * Generate explanation for high risk
   */
  generateHighRiskExplanation(signals) {
    let explanation = '⚠️ HIGH RISK DETECTED - DO NOT PROCEED\n\n';
    
    if (signals.upiScam?.isScam) {
      explanation += '🚨 This appears to be a UPI SCAM attempting to trick you into sending money.\n\n';
    } else if (signals.otpMisuse?.severity === 'high') {
      explanation += '🚨 This website is asking for sensitive information (OTP/Password) but is NOT trustworthy.\n\n';
    } else if (signals.websiteSecurity?.details?.lookalike?.isLookAlike) {
      explanation += `🚨 This website looks like ${signals.websiteSecurity.details.lookalike.matchedDomain} but is NOT the real site.\n\n`;
    } else {
      explanation += '🚨 Multiple security issues detected on this page.\n\n';
    }
    
    explanation += 'RECOMMENDATION: Leave this website immediately and verify through official channels.';
    
    return explanation;
  },
  
  /**
   * Generate explanation for medium risk
   */
  generateMediumRiskExplanation(signals) {
    let explanation = '⚠️ CAUTION ADVISED\n\n';
    
    if (signals.financialIntent?.isFinancial) {
      explanation += 'This page involves financial activity. ';
    }
    
    if (signals.websiteSecurity?.issues.length > 0) {
      explanation += 'Some security issues were detected. ';
    }
    
    if (signals.urlPhishing?.isPhishing) {
      explanation += 'The URL shows suspicious patterns. ';
    }
    
    explanation += '\n\nRECOMMENDATION: Verify the website authenticity before entering any sensitive information.';
    
    return explanation;
  },
  
  /**
   * Get ML-based risk score (optional)
   */
  async getMLRiskScore(signals) {
    try {
      return await ScamDetectorHelpers.sendMessageToBackground('getRiskScore', signals);
    } catch (error) {
      console.warn('ML risk scoring not available:', error);
      return null;
    }
  }
};

// Export for content script
if (typeof window !== 'undefined') {
  window.RiskScoringEngine = RiskScoringEngine;
}
