import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error("GEMINI_API_KEY environment variable is not set");
}

const client = new GoogleGenerativeAI(apiKey);

export async function analyzeLogsWithGemini(logs: string): Promise<string> {
  const model = client.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `You are a cybersecurity expert. Analyze the following security logs and identify threats:

${logs}

Provide:
1. Threat type (phishing, brute_force, malware, lateral_movement, data_exfiltration, privilege_escalation, unknown)
2. Risk score (0-100)
3. Confidence level (0-100)
4. MITRE ATT&CK IDs
5. Indicators of compromise
6. Recommended actions

Format as JSON.`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}

export async function classifyThreat(threatDescription: string): Promise<string> {
  const model = client.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `As a cybersecurity analyst, classify this threat and provide detailed analysis:

${threatDescription}

Provide:
1. Threat classification
2. Risk assessment
3. Immediate actions
4. Long-term recommendations

Format as JSON.`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}

export async function generateIncidentReport(threatData: any): Promise<string> {
  const model = client.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `Generate a professional incident report for this security threat:

${JSON.stringify(threatData, null, 2)}

Include:
1. Executive summary
2. Technical analysis
3. Timeline of events
4. Affected assets
5. Remediation steps
6. Preventive measures

Format as markdown.`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}

export async function socCopilotChat(userMessage: string, context: any): Promise<string> {
  const model = client.getGenerativeModel({ model: "gemini-1.5-flash" });

  const systemPrompt = `You are CyberGuard AI, an expert SOC (Security Operations Center) Copilot. 
You help security teams understand threats, respond to incidents, and improve their security posture.
Be concise, actionable, and security-focused.`;

  const prompt = `${systemPrompt}

Context:
${JSON.stringify(context, null, 2)}

User: ${userMessage}

Provide a helpful, security-focused response.`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}