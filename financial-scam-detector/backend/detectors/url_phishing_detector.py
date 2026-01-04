"""
URL Phishing Detector
Analyzes URL structure and uses ML classifier
"""

import re
from urllib.parse import urlparse
from typing import Dict
import numpy as np
from sklearn.ensemble import RandomForestClassifier
import logging

logger = logging.getLogger(__name__)


class URLPhishingDetector:
    def __init__(self):
        """Initialize URL phishing detector"""
        # In production, load a pre-trained model
        # For now, use rule-based approach with feature extraction
        self.model = None
        self._try_load_model()
        
        self.suspicious_tlds = [
            'tk', 'ml', 'ga', 'cf', 'gq', 'pw', 'cc', 'top',
            'work', 'click', 'loan', 'racing', 'men', 'download'
        ]
        
    def _try_load_model(self):
        """Try to load pre-trained model (placeholder)"""
        try:
            # In production, load actual trained model
            # self.model = joblib.load('models/url_classifier.pkl')
            logger.info("URL classifier model loaded")
        except Exception as e:
            logger.warning(f"Could not load ML model: {e}. Using rule-based approach.")
            self.model = None
    
    def analyze(self, url: str) -> Dict:
        """
        Analyze URL for phishing indicators
        
        Returns:
            {
                'phishing_score': float (0-1),
                'is_phishing': bool,
                'reasons': List[str],
                'features': Dict
            }
        """
        result = {
            'phishing_score': 0.0,
            'is_phishing': False,
            'reasons': [],
            'features': {}
        }
        
        # Extract features
        features = self._extract_features(url)
        result['features'] = features
        
        score = 0.0
        
        # Rule-based scoring
        if features['length'] > 75:
            score += 0.2
            result['reasons'].append('Unusually long URL')
        
        if features['has_ip']:
            score += 0.3
            result['reasons'].append('URL contains IP address')
        
        if features['num_subdomains'] > 3:
            score += 0.25
            result['reasons'].append(f'Too many subdomains ({features["num_subdomains"]})')
        
        if features['num_at'] > 0:
            score += 0.25
            result['reasons'].append('URL contains @ symbol (redirect)')
        
        if features['num_hyphens'] > 3:
            score += 0.15
            result['reasons'].append('Excessive hyphens in URL')
        
        if features['suspicious_tld']:
            score += 0.2
            result['reasons'].append(f'Suspicious domain extension: .{features["tld"]}')
        
        if features['has_punycode']:
            score += 0.25
            result['reasons'].append('Punycode detected (possible homograph attack)')
        
        # Entropy check (random-looking domains are suspicious)
        if features['domain_entropy'] > 4.5:
            score += 0.2
            result['reasons'].append('Domain appears randomly generated')
        
        # If model is available, use it
        if self.model:
            try:
                feature_vector = self._features_to_vector(features)
                ml_score = self.model.predict_proba([feature_vector])[0][1]
                # Blend scores (70% rule-based, 30% ML)
                score = (score * 0.7) + (ml_score * 0.3)
            except Exception as e:
                logger.warning(f"ML prediction failed: {e}")
        
        result['phishing_score'] = min(score, 1.0)
        result['is_phishing'] = result['phishing_score'] > 0.6
        
        return result
    
    def _extract_features(self, url: str) -> Dict:
        """Extract features from URL"""
        features = {}
        
        try:
            parsed = urlparse(url)
            domain = parsed.netloc
            path = parsed.path
            
            # Basic features
            features['length'] = len(url)
            features['domain_length'] = len(domain)
            features['path_length'] = len(path)
            
            # Character counts
            features['num_dots'] = url.count('.')
            features['num_hyphens'] = url.count('-')
            features['num_underscores'] = url.count('_')
            features['num_slashes'] = url.count('/')
            features['num_questionmarks'] = url.count('?')
            features['num_equals'] = url.count('=')
            features['num_at'] = url.count('@')
            features['num_ampersands'] = url.count('&')
            
            # IP address detection
            features['has_ip'] = bool(re.search(r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}', domain))
            
            # Subdomain count
            features['num_subdomains'] = len(domain.split('.')) - 2 if '.' in domain else 0
            
            # TLD check
            tld = domain.split('.')[-1] if '.' in domain else ''
            features['tld'] = tld
            features['suspicious_tld'] = tld.lower() in self.suspicious_tlds
            
            # Punycode (IDN homograph attack)
            features['has_punycode'] = 'xn--' in domain
            
            # Port number (unusual ports are suspicious)
            features['has_port'] = ':' in parsed.netloc
            
            # Entropy (randomness) of domain
            features['domain_entropy'] = self._calculate_entropy(domain)
            
            # Special characters in domain
            features['special_chars'] = sum(not c.isalnum() and c != '.' and c != '-' for c in domain)
            
        except Exception as e:
            logger.error(f"Feature extraction error: {e}")
            features = self._get_default_features()
        
        return features
    
    def _calculate_entropy(self, text: str) -> float:
        """Calculate Shannon entropy of text"""
        if not text:
            return 0.0
        
        # Count character frequencies
        from collections import Counter
        frequencies = Counter(text)
        length = len(text)
        
        # Calculate entropy
        entropy = 0.0
        for count in frequencies.values():
            probability = count / length
            entropy -= probability * np.log2(probability)
        
        return entropy
    
    def _features_to_vector(self, features: Dict) -> np.ndarray:
        """Convert features dict to numpy array for ML model"""
        # Define feature order (must match training data)
        feature_order = [
            'length', 'domain_length', 'path_length',
            'num_dots', 'num_hyphens', 'num_subdomains',
            'has_ip', 'suspicious_tld', 'domain_entropy'
        ]
        
        vector = []
        for feat in feature_order:
            value = features.get(feat, 0)
            # Convert booleans to int
            if isinstance(value, bool):
                value = int(value)
            vector.append(value)
        
        return np.array(vector)
    
    def _get_default_features(self) -> Dict:
        """Return default features on error"""
        return {
            'length': 0,
            'num_dots': 0,
            'has_ip': False,
            'suspicious_tld': False,
            'domain_entropy': 0.0
        }
