"""
Risk Scorer
Combines multiple signals into final risk assessment
"""

from typing import Dict, Optional
import numpy as np
from sklearn.ensemble import RandomForestClassifier
import logging

logger = logging.getLogger(__name__)


class RiskScorer:
    def __init__(self):
        """Initialize risk scorer"""
        # In production, load a pre-trained ensemble model
        self.model = None
        
        # Define signal weights
        self.weights = {
            'websiteTrust': 0.25,
            'urlPhishing': 0.20,
            'financialIntent': 0.30,  # Higher weight
            'otpMisuse': 0.15,
            'upiScam': 0.10
        }
    
    def calculate(self, signals: Dict) -> Dict:
        """
        Calculate overall risk score from signals
        
        Args:
            signals: Dict with keys websiteTrust, urlPhishing, financialIntent, otpMisuse, upiScam
        
        Returns:
            {
                'risk_score': float (0-1),
                'risk_level': str ('low', 'medium', 'high'),
                'explanation': str,
                'confidence': float
            }
        """
        result = {
            'risk_score': 0.0,
            'risk_level': 'low',
            'explanation': '',
            'confidence': 0.0
        }
        
        # Calculate weighted score
        total_score = 0.0
        total_weight = 0.0
        
        for signal_name, weight in self.weights.items():
            signal_value = signals.get(signal_name)
            
            if signal_value is not None:
                # Normalize signal value to 0-1 range
                if signal_name == 'websiteTrust':
                    # Trust score: high trust = low risk, so invert
                    normalized = 1.0 - signal_value
                else:
                    normalized = signal_value
                
                total_score += normalized * weight
                total_weight += weight
        
        # Calculate final score
        if total_weight > 0:
            result['risk_score'] = total_score / total_weight
        
        # Apply financial intent multiplier
        if signals.get('financialIntent', 0) > 0.5:
            # Financial activity detected - amplify risk
            result['risk_score'] *= 1.3
            result['risk_score'] = min(result['risk_score'], 1.0)
        
        # Determine risk level
        if result['risk_score'] >= 0.7:
            result['risk_level'] = 'high'
            result['explanation'] = self._generate_explanation('high', signals)
        elif result['risk_score'] >= 0.4:
            result['risk_level'] = 'medium'
            result['explanation'] = self._generate_explanation('medium', signals)
        else:
            result['risk_level'] = 'low'
            result['explanation'] = 'This page appears safe based on our analysis.'
        
        # Confidence is based on how many signals were available
        available_signals = sum(1 for v in signals.values() if v is not None)
        result['confidence'] = available_signals / len(self.weights)
        
        return result
    
    def _generate_explanation(self, risk_level: str, signals: Dict) -> str:
        """Generate human-readable explanation"""
        if risk_level == 'high':
            explanation = "⚠️ HIGH RISK - DO NOT PROCEED. "
            
            if signals.get('upiScam', 0) > 0.7:
                explanation += "This appears to be a UPI scam. "
            elif signals.get('otpMisuse', 0) > 0.7:
                explanation += "This site is asking for sensitive information but is not trustworthy. "
            elif signals.get('urlPhishing', 0) > 0.7:
                explanation += "The URL shows strong phishing indicators. "
            
            explanation += "We strongly recommend leaving this website."
            
        elif risk_level == 'medium':
            explanation = "⚠️ CAUTION ADVISED. "
            
            if signals.get('financialIntent', 0) > 0.5:
                explanation += "This page involves financial activity. "
            
            explanation += "Verify the website authenticity before proceeding."
        
        return explanation
