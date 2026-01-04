"""
Webpage Classifier
Uses BERT-based model for financial page classification
"""

from typing import Dict
from transformers import pipeline
import re
import logging

logger = logging.getLogger(__name__)


class WebpageClassifier:
    def __init__(self):
        """Initialize webpage classifier with pre-trained BERT model"""
        try:
            # Load zero-shot classification model
            # This can classify text into custom categories without fine-tuning
            self.classifier = pipeline(
                "zero-shot-classification",
                model="facebook/bart-large-mnli",
                device=-1  # CPU
            )
            logger.info("Webpage classifier loaded successfully")
        except Exception as e:
            logger.warning(f"Could not load ML model: {e}. Using rule-based fallback.")
            self.classifier = None
        
        # Financial keywords
        self.financial_keywords = [
            'bank', 'banking', 'login', 'password', 'otp', 'cvv', 'pin',
            'upi', 'payment', 'transaction', 'account', 'netbanking',
            'debit', 'credit', 'card number', 'transfer', 'balance'
        ]
        
        self.phishing_indicators = [
            'verify your account', 'confirm your identity', 'urgent action',
            'suspended account', 'unusual activity', 'click here immediately',
            'enter your password', 'update your information'
        ]
    
    def classify(self, text: str, url: str) -> Dict:
        """
        Classify webpage content as financial/phishing
        
        Returns:
            {
                'is_financial': bool,
                'is_phishing': bool,
                'phishing_score': float (0-1),
                'confidence': float,
                'category': str
            }
        """
        result = {
            'is_financial': False,
            'is_phishing': False,
            'phishing_score': 0.0,
            'confidence': 0.0,
            'category': 'unknown'
        }
        
        # Truncate text for processing (first 1000 chars)
        text_sample = text[:1000].lower()
        
        # Rule-based checks
        financial_score = self._count_keywords(text_sample, self.financial_keywords)
        phishing_score = self._count_keywords(text_sample, self.phishing_indicators)
        
        # Determine if financial
        if financial_score >= 3:
            result['is_financial'] = True
            result['category'] = 'financial'
        
        # Calculate phishing score
        score = 0.0
        
        if phishing_score > 0:
            score += min(phishing_score * 0.15, 0.4)
        
        if financial_score > 0 and phishing_score > 0:
            # Financial + phishing indicators = high risk
            score += 0.3
        
        # Use ML model if available
        if self.classifier:
            try:
                # Define categories
                categories = [
                    "legitimate banking website",
                    "phishing or scam website",
                    "legitimate e-commerce",
                    "informational website"
                ]
                
                ml_result = self.classifier(text_sample, categories)
                
                # Get phishing category score
                labels = ml_result['labels']
                scores = ml_result['scores']
                
                phishing_idx = labels.index("phishing or scam website") if "phishing or scam website" in labels else -1
                
                if phishing_idx >= 0:
                    ml_phishing_score = scores[phishing_idx]
                    # Blend with rule-based score
                    score = (score * 0.6) + (ml_phishing_score * 0.4)
                    result['confidence'] = ml_phishing_score
                    
            except Exception as e:
                logger.warning(f"ML classification failed: {e}")
        
        result['phishing_score'] = min(score, 1.0)
        result['is_phishing'] = result['phishing_score'] > 0.5
        
        return result
    
    def _count_keywords(self, text: str, keywords: list) -> int:
        """Count how many keywords appear in text"""
        count = 0
        for keyword in keywords:
            if keyword in text:
                count += 1
        return count
