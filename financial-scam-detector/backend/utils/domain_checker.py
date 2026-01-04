"""
Domain Checker
Checks domain age, WHOIS data, and reputation
"""

import whois
from datetime import datetime
from typing import Dict
import logging
import socket

logger = logging.getLogger(__name__)


class DomainChecker:
    def __init__(self):
        """Initialize domain checker"""
        self.new_domain_threshold_days = 90
    
    def check_age(self, domain: str) -> Dict:
        """
        Check domain registration age
        
        Returns:
            {
                'age_days': int,
                'is_new': bool,
                'registration_date': str,
                'registrar': str
            }
        """
        result = {
            'age_days': -1,
            'is_new': False,
            'registration_date': None,
            'registrar': None
        }
        
        try:
            # Clean domain (remove www, protocols, etc.)
            clean_domain = self._clean_domain(domain)
            
            # Query WHOIS
            w = whois.whois(clean_domain)
            
            # Get creation date
            creation_date = w.creation_date
            
            # WHOIS can return a list or single date
            if isinstance(creation_date, list):
                creation_date = creation_date[0]
            
            if creation_date:
                # Calculate age
                age = datetime.now() - creation_date
                result['age_days'] = age.days
                result['registration_date'] = creation_date.isoformat()
                result['is_new'] = age.days < self.new_domain_threshold_days
                
                # Get registrar if available
                if hasattr(w, 'registrar'):
                    result['registrar'] = w.registrar
                
                logger.info(f"Domain {clean_domain} age: {result['age_days']} days")
            
        except Exception as e:
            logger.warning(f"WHOIS lookup failed for {domain}: {e}")
            # Return default values on error
            result['age_days'] = -1
            result['is_new'] = False
        
        return result
    
    def check_dns(self, domain: str) -> Dict:
        """Check if domain resolves to IP"""
        result = {
            'resolves': False,
            'ip_addresses': []
        }
        
        try:
            clean_domain = self._clean_domain(domain)
            ip_addresses = socket.gethostbyname_ex(clean_domain)[2]
            
            result['resolves'] = True
            result['ip_addresses'] = ip_addresses
            
        except socket.gaierror:
            logger.warning(f"DNS lookup failed for {domain}")
        except Exception as e:
            logger.error(f"DNS check error: {e}")
        
        return result
    
    def _clean_domain(self, domain: str) -> str:
        """Clean domain string"""
        # Remove protocol
        domain = domain.replace('http://', '').replace('https://', '')
        
        # Remove www
        domain = domain.replace('www.', '')
        
        # Remove path
        if '/' in domain:
            domain = domain.split('/')[0]
        
        # Remove port
        if ':' in domain:
            domain = domain.split(':')[0]
        
        return domain.strip()
