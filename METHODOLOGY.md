# Financial Scam Detector — Methodology & Architecture

**Last updated:** January 5, 2026

## **Overview**
- **Project goal:** Provide a real-time browser-based system that detects financial scams (phishing, UPI scams, OTP misuse, credential harvesting) and warns users with actionable, explainable reasons.
- **Approach:** Hybrid client+server architecture that combines lightweight, explainable client-side heuristics with server-side ML models for deeper analysis.

---

## **System Architecture**

**High-level components:**

- **Chrome Extension (Client)**
  - `content.js` (content script): orchestrates per-page analysis and collects signals.
  - `background.js` (service worker): performs long-running tasks, background checks, and communicates with the backend via HTTP and message passing.
  - `popup/*` UI: displays warnings, risk score, and detection details to the user.
  - `detectors/` (client-side JS detectors): per-signal detectors implemented as modular JS objects (e.g., `websiteSecurityDetector.js`, `urlPhishingDetector.js`, `financialIntentDetector.js`, `otpMisuseDetector.js`, `upiScamDetector.js`, `websiteSecurityDetector.js`).

- **Backend (Local ML Server)**
  - FastAPI app (`backend/app.py`) served by Uvicorn on `localhost:8000`.
  - ML components:
    - `email_phishing_detector` (text classifier)
    - `url_phishing` (URL feature + ML model)
    - `webpage_classifier` (BART / NLI-style classifier for page content)
    - `risk_scorer` (aggregates ML outputs into a single score)
    - `domain_checker` (WHOIS/domain-age checks)

- **Communication & Flow**
  1. Content script runs when a page loads and executes detectors.
  2. Lightweight heuristics run first (regex UPI extraction, OTP field detection, visual checks like presence of UPI IDs, countdown timers, payment amounts, HTTPS check).
  3. For deeper analysis, the content script calls backend endpoints (e.g., `/api/classify_webpage`, `/api/url_phish`) to run ML models and get normalized scores.
  4. All signals (heuristic + ML) are fed to a client-side risk scoring engine which applies weights to compute the final risk level (low/medium/high) and a percentage score.
  5. The popup UI displays the result and a short, explainable list of warnings.

**Diagram (textual):**

Browser Page → `content.js` → [Local heuristics detectors] → (call backend) → Local ML server → results → risk scorer → popup UI

---

## **Detection Methodology (Per Detector)**

**1) Website Security Detector**
- Checks for HTTPS, insecure resources, domain age (WHOIS via backend), brand mismatches, lookalike domains.
- Timeouts and graceful failure: domain-age queries use a 5s timeout to avoid blocking analysis.

**2) URL Phishing Detector**
- Client extracts URL features (length, suspicious TLDs, IPs in URL, repetition patterns).
- Optionally calls backend ML URL model for probabilistic phishing score.

**3) Financial Intent Detector**
- Uses keyword/semantic matching plus a local ML call to determine if the page is demonstrating financial intent (e.g., requests payment or approval flows).
- Flags `upi_payment`, `refund_claim`, `loan_offer`, etc.

**4) OTP Misuse Detector**
- Scans DOM for OTP input fields, suspicious copy/paste restrictions, messages instructing OTP sharing.
- Checks for presence of fields labeled OTP, verification, or one-time password.
- Reports misuse risk and severity.

**5) UPI Scam Detector**
- Core improvements implemented:
  - Regex extraction of UPI IDs from page text: `username@provider` where provider matches common UPI apps (paytm, phonepe, googlepay, ybl, oksbi, okaxis, okicici, okhdfcbank, axl, ibl, upi).
  - Username inspection for suspicious keywords (`winner`, `prize`, `lottery`, `refund`, `verify`) and numeric patterns (e.g., `scammer12345`).
  - Context analysis: detect payment instruction keywords and currency symbols (₹, rupees) near found UPI IDs.
  - Scoring: heuristic weights add evidence (keyword +0.6, random-number pattern +0.3, payment request context +0.4) and cap at 1.0. Detection threshold > 0.5.
- Returns `foundUPIs`, `warnings`, `confidence` and `scamType`.

**6) Webpage Classifier (Backend)**
- Uses an NLU model (BART/MNLI style) to classify the overall page intent and to corroborate client heuristics.

**7) Risk Scoring Engine**
- Aggregates signals into a single normalized risk score.
- Example weighting (configurable): security: 0.6, url: 0.2, financial: 0.4, otp: 0.8, upi: 1.0.
- Thresholds: high > 0.6, medium 0.3–0.6, low < 0.3.
- Designed to be tunable based on testing data.

---

## **Why this Design (Advantages vs. Existing Tools)**

- **Hybrid detection:** Combines quick, privacy-conscious client heuristics with heavier ML inference on a local server for accuracy. This reduces latency and preserves user privacy compared to purely cloud solutions.
- **Explainability:** Each detector returns human-readable warnings (e.g., `🚨 SCAM UPI ID DETECTED: winner.prize@paytm`) so users understand why an alert was triggered. Many commercial tools provide opaque scores without context.
- **Local-first & privacy-aware:** ML inference runs on the user's machine (localhost) — no page content needs to be uploaded to third-party servers. This makes the system safer for sensitive browsing contexts.
- **Extensibility & modularity:** Detectors are modular JS components; adding a new detector or tuning weights is straightforward.
- **Practical heuristics for modern scams:** UPI-ID scanning, random-number detection, and payment-context correlation specifically target modern UPI scams and prize/lure scams that many existing URL-only detectors miss.
- **Graceful degradation:** If the backend ML server is unavailable, the client still reports heuristic findings; users still get protection.

---

## **Tools & Libraries Used**

**Backend (Python):**
- `FastAPI` + `Uvicorn` — HTTP API server
- `transformers` — Pretrained transformer models for webpage/email classification
- `scikit-learn` — Feature-based models for URL classification / risk scoring
- `pandas`, `numpy` — Data handling

**Frontend (Extension / JS):**
- Chrome Extension APIs (Manifest V3): content scripts, background service worker, message passing
- Vanilla JavaScript (ES6) for detectors and UI
- Regex and DOM parsing for heuristics

**Dev / Testing:**
- Local test pages (`test-phishing.html`, `test-upi-scam.html`, `test-lottery-scam.html`, `test-phishing-hdfc.html`)
- PowerShell for environment management on Windows

---

## **Privacy & Security Considerations**
- All page text used for ML is processed locally — no page screenshots or raw content is sent to external services.
- The backend listens on `localhost` only; firewalls can block external access if desired.
- Timeouts for external lookups (domain age) prevent hangs and leakage.
- Extension uses least-privilege permissions required for analysis.

---

## **Explainability & User Experience**
- The popup shows a concise risk level and percentage, plus a short list of warnings explaining the most important triggers.
- Console logs are verbose during testing but can be disabled for production.
- Warnings are prioritized (e.g., UPI ID + payment instruction > single keyword match) so users see the most relevant advice.

---

## **Limitations & Future Work**
- **False positives/negatives:** Heuristics and thresholds need tuning on real-world datasets.
- **Language coverage:** Current keyword lists are English-focused; adding regional languages will improve detection.
- **Advanced evasion:** Scammers can obfuscate UPI IDs (images, SVGs); OCR or image analysis would be needed to detect those.
- **Model updates:** Periodic retraining with new scam patterns will be required.

---

## **Operational Notes**
- Start backend before testing extension.
- Keep model weights up-to-date when improvements are available.
- Use test suite (provided HTML files) to validate changes after each update.

---

## **Appendix — Example Decision Flow for a Lottery Scam**
1. Content script loads page and runs `websiteSecurityDetector` → finds no HTTPS.
2. `financialIntentDetector` finds `₹ 50,00,000`, `Processing Fee`, detects `upi_payment` intent.
3. `upiScamDetector` extracts `winner.prize@paytm` via regex.
4. UPI username contains `winner` and `prize` (+0.6 each), page requests `₹8,960` (+0.4) → confidence capped at `1.0`.
5. Risk scoring engine aggregates: security (0.6), upi (1.0), otp (0) → normalized score ≈ 0.595 (medium/high depending on configuration). Popup shows a clear HIGH-RISK advisory and lists the UPI ID and payment request as reasons.

---

## **Contact & Next Steps**
- For improving detection, provide anonymized real scam examples and legitimate page samples to tune weights and retrain models.
- Consider adding OCR capability to extract text from images to detect obfuscated UPI IDs.


*File created at:* `D:\DTLEL\METHODOLOGY.md`
