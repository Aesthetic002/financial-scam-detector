"""
Email Phishing Detector
Uses DistilBERT for text classification and pattern matching
"""

import re
from typing import Dict, List
from transformers import pipeline
import logging

logger = logging.getLogger(__name__)


class EmailPhishingDetector:
    def __init__(self):
        """Initialize email phishing detector with pre-trained model"""
        try:
            # Load pre-trained sentiment analysis model (can be fine-tuned for phishing)
            # In production, replace with a phishing-specific model
            self.classifier = pipeline(
                "text-classification",
                model="distilbert-base-uncased-finetuned-sst-2-english",
                device=-1  # CPU
            )
            logger.info("Email classifier loaded successfully")
        except Exception as e:
            logger.warning(f"Could not load ML model: {e}. Using rule-based fallback.")
            self.classifier = None
        
        # Phishing patterns
        self.urgency_patterns = [
            r'urgent(?:ly)?',
            r'immediate(?:ly)?',
            r'act now',
            r'within \d+ hours?',
            r'expires? (?:today|soon|now)',
            r'limited time',
            r'account (?:will be |has been )?(?:suspended|closed|blocked)',
            r'verify (?:immediately|now|your account)',
            r'action required',
            r'security alert',
            r'unusual activity'
        ]
        
        self.fear_patterns = [
            r'blocked',
            r'frozen',
            r'compromised',
            r'unauthorized',
            r'suspicious activity',
            r'fraud(?:ulent)? (?:activity|transaction)',
            r'legal action',
            r'lose access',
            r'permanent(?:ly)?',
            r'cancel(?:led|lation)?'
        ]
        
        self.reward_patterns = [
            r'won',
            r'winner',
            r'prize',
            r'reward',
            r'cash ?back',
            r'free',
            r'claim (?:now|your)',
            r'congratulations',
            r'you(?:\'ve| have) been selected',
            r'lottery',
            r'bonus',
            r'gift card'
        ]
        
        self.bank_keywords = [
            'bank', 'banking', 'account', 'netbanking', 'internet banking',
            'upi', 'paytm', 'phonepe', 'gpay', 'google pay',
            'transaction', 'payment', 'otp', 'cvv', 'debit', 'credit'
        ]
    
    def analyze(self, subject: str, body: str, sender: str = None, sender_domain: str = None) -> Dict:
        """
        Analyze email for phishing patterns
        
        Returns:
            {
                'phishing_score': float (0-1),
                'is_phishing': bool,
                'reasons': List[str],
                'pattern_matches': Dict
            }
        """
        text = f"{subject} {body}".lower()
        
        result = {
            'phishing_score': 0.0,
            'is_phishing': False,
            'reasons': [],
            'pattern_matches': {
                'urgency': [],
                'fear': [],
                'reward': [],
                'financial': []
            }
        }
        
        score = 0.0
        
        # Pattern matching
        urgency_matches = self._find_patterns(text, self.urgency_patterns)
        if urgency_matches:
            score += 0.3
            result['pattern_matches']['urgency'] = urgency_matches
            result['reasons'].append(f"Urgency tactics detected: {', '.join(urgency_matches[:2])}")
        
        fear_matches = self._find_patterns(text, self.fear_patterns)
        if fear_matches:
            score += 0.3
            result['pattern_matches']['fear'] = fear_matches
            result['reasons'].append(f"Fear/threat language: {', '.join(fear_matches[:2])}")
        
        reward_matches = self._find_patterns(text, self.reward_patterns)
        if reward_matches:
            score += 0.25
            result['pattern_matches']['reward'] = reward_matches
            result['reasons'].append(f"Reward/prize language: {', '.join(reward_matches[:2])}")
        
        # Financial keyword detection
        financial_keywords = [kw for kw in self.bank_keywords if kw in text]
        if financial_keywords:
            score += 0.15
            result['pattern_matches']['financial'] = financial_keywords
            if len(financial_keywords) >= 3:
                result['reasons'].append("Multiple financial keywords detected")
        
        # Sender domain mismatch
        if sender_domain:
            mismatch = self._check_sender_domain_mismatch(text, sender_domain)
            if mismatch:
                score += 0.4
                result['reasons'].append(f"Sender domain mismatch: claims to be {mismatch['claimed']} but from {sender_domain}")
        
        # ML-based classification (if available)
        if self.classifier:
            try:
                # Use subject + first 200 chars of body for classification
                ml_text = f"{subject} {body[:200]}"
                ml_result = self.classifier(ml_text)[0]
                
                # If negative sentiment detected (often correlates with phishing)
                if ml_result['label'] == 'NEGATIVE' and ml_result['score'] > 0.7:
                    score += 0.2
                    result['reasons'].append("ML model detected suspicious content")
            except Exception as e:
                logger.warning(f"ML classification failed: {e}")
        
        # Final score
        result['phishing_score'] = min(score, 1.0)
        result['is_phishing'] = result['phishing_score'] > 0.5
        
        return result
    
    def _find_patterns(self, text: str, patterns: List[str]) -> List[str]:
        """Find regex patterns in text"""
        matches = []
        for pattern in patterns:
            if re.search(pattern, text, re.IGNORECASE):
                # Extract the actual matched text
                match = re.search(pattern, text, re.IGNORECASE)
                matches.append(match.group(0))
        return matches
    
    def _check_sender_domain_mismatch(self, text: str, sender_domain: str) -> Dict:
        """Check if email claims to be from a bank but sender domain doesn't match"""
        banks = {
            'sbi': ['sbi.co.in'],
            'hdfc': ['hdfcbank.com'],
            'icici': ['icicibank.com'],
            'axis': ['axisbank.com'],
            'paytm': ['paytm.com'],
            'phonepe': ['phonepe.com']
        }
        
        for bank_name, valid_domains in banks.items():
            if bank_name in text:
                # Check if sender domain matches
                if not any(valid in sender_domain for valid in valid_domains):
                    return {
                        'claimed': bank_name.upper(),
                        'actual': sender_domain,
                        'expected': valid_domains[0]
                    }
        
        return None
