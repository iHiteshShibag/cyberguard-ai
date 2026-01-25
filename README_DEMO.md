# CyberGuard AI - End-to-End Demo Flow

This document outlines the minimal end-to-end demo flow implemented for the CyberGuard AI hackathon-ready project.

## Demo Goal
A user uploads or pastes a security log → the backend analyzes it for Brute Force patterns → the frontend displays the threat type, risk score, AI explanation, and recommended action.

## 1. Backend Code (`server/demo_router.ts`)
The backend provides a simple `POST /api/analyze` endpoint that implements rule-based detection.

```typescript
import { Router } from "express";

const router = Router();

router.post("/analyze", (req, res) => {
  const { logData } = req.body;

  if (!logData) {
    return res.status(400).json({ error: "No log data provided" });
  }

  // Basic rule-based detection for Brute Force patterns
  const isBruteForce = logData.toLowerCase().includes("failed") || 
                       logData.toLowerCase().includes("invalid") ||
                       logData.toLowerCase().includes("denied");

  let response;

  if (isBruteForce) {
    response = {
      threat_type: "Brute Force Attack",
      risk_score: 85,
      explanation: "AI Analysis: Detected multiple failed login attempts from a single source IP (192.168.1.105) targeting the 'admin' account within a short timeframe. This pattern is highly indicative of a password-spraying or brute-force attempt.",
      recommendation: "Immediately block the source IP 192.168.1.105 at the firewall and trigger a mandatory password reset for the 'admin' account. Enable Multi-Factor Authentication (MFA) if not already active.",
    };
  } else {
    response = {
      threat_type: "None / Low Risk",
      risk_score: 10,
      explanation: "AI Analysis: The provided log entry appears to be routine system activity. No suspicious patterns or known attack signatures were identified.",
      recommendation: "No immediate action required. Continue regular monitoring of system logs.",
    };
  }

  // NOTE: Future Gemini integration will replace this rule-based logic
  return res.json(response);
});

export default router;
```

## 2. Frontend Code Snippet (`client/src/pages/DemoPage.tsx`)
The frontend uses the standard `fetch` API to communicate with the demo endpoint.

```tsx
const handleAnalyze = async () => {
  if (!logData.trim()) return;

  setIsLoading(true);
  try {
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ logData }),
    });

    const data = await response.json();
    setResult(data);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    setIsLoading(false);
  }
};
```

## 3. Example Request and Response

**Request:**
```json
{
  "logData": "Jan 24 10:15:03 auth-server sshd: Failed password for admin from 192.168.1.105"
}
```

**Response:**
```json
{
  "threat_type": "Brute Force Attack",
  "risk_score": 85,
  "explanation": "AI Analysis: Detected multiple failed login attempts...",
  "recommendation": "Immediately block the source IP 192.168.1.105..."
}
```

## 4. Demo Flow Explanation
1. **Input:** The user navigates to the **Demo Flow** page via the sidebar.
2. **Action:** The user pastes logs into the text area or clicks "Load Sample" to populate a Brute Force scenario.
3. **Processing:** Upon clicking "Analyze Logs", the frontend sends the data to the backend.
4. **Detection:** The backend checks for keywords like "failed" or "invalid".
5. **Display:** The UI updates to show a high-risk alert with a clear explanation and specific remediation steps, simulating AI reasoning.
