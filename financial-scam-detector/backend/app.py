"""
Financial Scam Detector - Backend ML API
FastAPI server with pre-trained NLP models for phishing detection
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict
import uvicorn
import logging
import os
from datetime import datetime

# Detection modules imported lazily to avoid slow startup
EmailPhishingDetector = None
URLPhishingDetector = None
WebpageClassifier = None
RiskScorer = None
DomainChecker = None

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Financial Scam Detector API",
    description="AI-powered API for detecting financial scams and phishing",
    version="1.0.0"
)

# CORS middleware for browser extension
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize detectors (loaded once at startup)
email_detector = None
url_detector = None
webpage_classifier = None
risk_scorer = None
domain_checker = None

@app.on_event("startup")
async def startup_event():
    """Initialize ML models on server startup"""
    global email_detector, url_detector, webpage_classifier, risk_scorer, domain_checker
    global EmailPhishingDetector, URLPhishingDetector, WebpageClassifier, RiskScorer, DomainChecker
    
    logger.info("Initializing ML models...")
    
    try:
        # Import modules at startup instead of top-level
        from detectors.email_phishing_detector import EmailPhishingDetector as EPD
        from detectors.url_phishing_detector import URLPhishingDetector as UPD
        from detectors.webpage_classifier import WebpageClassifier as WC
        from detectors.risk_scorer import RiskScorer as RS
        from utils.domain_checker import DomainChecker as DC
        
        EmailPhishingDetector = EPD
        URLPhishingDetector = UPD
        WebpageClassifier = WC
        RiskScorer = RS
        DomainChecker = DC
        
        email_detector = EmailPhishingDetector()
        logger.info("✓ Email phishing detector loaded")
        
        url_detector = URLPhishingDetector()
        logger.info("✓ URL phishing detector loaded")
        
        webpage_classifier = WebpageClassifier()
        logger.info("✓ Webpage classifier loaded")
        
        risk_scorer = RiskScorer()
        logger.info("✓ Risk scorer loaded")
        
        domain_checker = DomainChecker()
        logger.info("✓ Domain checker loaded")
        
        logger.info("All models initialized successfully!")
    except Exception as e:
        logger.error(f"Error initializing models: {e}")


# Request/Response Models
class EmailAnalysisRequest(BaseModel):
    subject: str
    body: str
    sender: Optional[str] = None
    sender_domain: Optional[str] = None

class URLAnalysisRequest(BaseModel):
    url: str

class WebpageAnalysisRequest(BaseModel):
    text: str
    url: str

class RiskScoreRequest(BaseModel):
    websiteTrust: Optional[float] = None
    urlPhishing: Optional[float] = None
    financialIntent: Optional[float] = None
    otpMisuse: Optional[float] = None
    upiScam: Optional[float] = None


# API Endpoints
@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "online",
        "service": "Financial Scam Detector API",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health")
async def health():
    """Detailed health check"""
    return {
        "status": "healthy",
        "models": {
            "email_detector": email_detector is not None,
            "url_detector": url_detector is not None,
            "webpage_classifier": webpage_classifier is not None,
            "risk_scorer": risk_scorer is not None,
            "domain_checker": domain_checker is not None
        },
        "timestamp": datetime.now().isoformat()
    }

@app.post("/api/analyze/email")
async def analyze_email(request: EmailAnalysisRequest):
    """
    Analyze email content for phishing patterns
    Uses NLP to detect urgency, fear, and impersonation
    """
    try:
        if not email_detector:
            raise HTTPException(status_code=503, detail="Email detector not initialized")
        
        result = email_detector.analyze(
            subject=request.subject,
            body=request.body,
            sender=request.sender,
            sender_domain=request.sender_domain
        )
        
        return result
    except Exception as e:
        logger.error(f"Email analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/analyze/url")
async def analyze_url(request: URLAnalysisRequest):
    """
    Analyze URL for phishing indicators
    Extracts features and uses ML classifier
    """
    try:
        if not url_detector:
            raise HTTPException(status_code=503, detail="URL detector not initialized")
        
        result = url_detector.analyze(request.url)
        
        return result
    except Exception as e:
        logger.error(f"URL analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/analyze/webpage")
async def analyze_webpage(request: WebpageAnalysisRequest):
    """
    Classify webpage content as phishing or legitimate
    Uses BERT-based text classifier
    """
    try:
        if not webpage_classifier:
            raise HTTPException(status_code=503, detail="Webpage classifier not initialized")
        
        result = webpage_classifier.classify(
            text=request.text,
            url=request.url
        )
        
        return result
    except Exception as e:
        logger.error(f"Webpage analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/risk-score")
async def calculate_risk_score(request: RiskScoreRequest):
    """
    Calculate overall risk score from multiple signals
    Uses ensemble method combining rule-based and ML approaches
    """
    try:
        if not risk_scorer:
            raise HTTPException(status_code=503, detail="Risk scorer not initialized")
        
        signals = {
            'websiteTrust': request.websiteTrust,
            'urlPhishing': request.urlPhishing,
            'financialIntent': request.financialIntent,
            'otpMisuse': request.otpMisuse,
            'upiScam': request.upiScam
        }
        
        result = risk_scorer.calculate(signals)
        
        return result
    except Exception as e:
        logger.error(f"Risk scoring error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/domain-age/{domain}")
async def check_domain_age(domain: str):
    """
    Check domain registration age using WHOIS
    Returns age in days and whether it's newly registered
    """
    try:
        if not domain_checker:
            raise HTTPException(status_code=503, detail="Domain checker not initialized")
        
        result = domain_checker.check_age(domain)
        
        return result
    except Exception as e:
        logger.error(f"Domain age check error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=port,
        reload=True,
        log_level="info"
    )
