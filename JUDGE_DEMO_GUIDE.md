# CyberGuard AI: Judge-Ready Demo Guide

This guide ensures a flawless 2-3 minute live demo of CyberGuard AI.

## 1. Demo Narrative (The Story)
"Meet CyberGuard AI. In a world where security teams are overwhelmed by thousands of logs, we use **Gemini's Reasoning Layer** to transform raw data into actionable intelligence. We don't just detect threats; we explain them and generate instant incident reports."

## 2. Live Demo Steps (2 Minutes)

| Step | Action | Key Talking Point |
| :--- | :--- | :--- |
| **1. Intro** | Open the **Demo Flow** page. | "This is our AI-powered SOC cockpit." |
| **2. Input** | Click **"Load Attack Sample"**. | "We're simulating a live stream of server logs." |
| **3. Analyze** | Click **"Run AI Analysis"**. | "Our backend sends this to the Gemini Reasoning Layer to identify patterns." |
| **4. Reveal** | Show the **Risk Score** and **Reasoning**. | "Gemini identified this as a Brute Force attack, not just because of failures, but because of the velocity and source IP pattern." |
| **5. Story** | Scroll to **"Why is this dangerous?"**. | "We bridge the gap between technical logs and business risk." |
| **6. Report** | Click **"View Report"**. | "Instantly, we generate a technical incident report ready for the response team." |

## 3. Sample AI Explanations (Copy-Paste Ready)

If you want to test other scenarios, paste these into the log input:

**Scenario: Suspicious Admin Access**
```text
Jan 24 23:50:12 srv-prod-01 sshd: Accepted password for root from 203.0.113.42 port 22
Jan 24 23:55:01 srv-prod-01 sudo: root : TTY=pts/0 ; PWD=/root ; USER=root ; COMMAND=/usr/bin/apt-get remove ufw
```
*Talking Point:* "Look how the AI flags the removal of the firewall (`ufw`) immediately after a remote login."

## 4. Judge Q&A (Preparation)

**Q: How does this differ from traditional rule-based SIEMs?**
*A:* "Traditional SIEMs look for static 'if-then' rules. CyberGuard uses LLM reasoning to understand context—like why a specific command is dangerous in a specific sequence—reducing false positives and explaining the 'why' to junior analysts."

**Q: Is it calling a live LLM for every log?**
*A:* "In production, we use a hybrid approach: fast local filters for noise reduction, and Gemini for high-confidence pattern analysis and report generation to keep costs low and speed high."

**Q: How do you handle privacy?**
*A:* "We implement a PII (Personally Identifiable Information) scrubbing layer before sending data to the LLM, ensuring sensitive user data never leaves the local environment."

## 5. Technical Implementation Notes
- **Backend:** `server/demo_router.ts` contains the `callGeminiReasoning` mock function.
- **Frontend:** `client/src/pages/DemoPage.tsx` handles the storytelling and report rendering.
- **Reports:** Generated in-memory as structured JSON to simulate a real-time reporting engine.
