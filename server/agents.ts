import {
  analyzeLogsWithGemini,
  classifyThreat,
  generateIncidentReport,
  socCopilotChat,
} from "./gemini";

/**
 * Log Analyzer Agent
 * Normalizes raw security logs from diverse sources
 */
export async function analyzeLog(rawLog: string, sourceType: string) {
  const systemPrompt = `You are a security log normalization expert. Your task is to parse raw security logs and extract key fields in a standardized format.

You must respond with valid JSON containing:
- timestamp: ISO 8601 format (e.g., "2026-01-23T12:34:56Z")
- sourceIp: Source IP address (IPv4 or IPv6)
- destinationIp: Destination IP address
- userId: User identifier (username, email, or ID)
- eventType: Type of event (e.g., "login_attempt", "file_access", "network_connection", "authentication_failure")
- severity: "low", "medium", "high", or "critical"
- description: Brief description of the event
- additionalContext: Object with any extra relevant fields`;

  const userPrompt = `Parse this raw security log from a ${sourceType} source and extract key fields:

${rawLog}

Respond ONLY with valid JSON, no other text.`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "normalized_log",
          strict: true,
          schema: {
            type: "object",
            properties: {
              timestamp: { type: "string", description: "ISO 8601 timestamp" },
              sourceIp: { type: "string", description: "Source IP address" },
              destinationIp: { type: "string", description: "Destination IP address" },
              userId: { type: "string", description: "User identifier" },
              eventType: { type: "string", description: "Type of security event" },
              severity: { type: "string", enum: ["low", "medium", "high", "critical"] },
              description: { type: "string", description: "Event description" },
              additionalContext: { type: "object", description: "Additional fields" },
            },
            required: ["timestamp", "eventType", "severity", "description"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0]?.message.content;
    if (!content) throw new Error("No response from LLM");

    return JSON.parse(typeof content === "string" ? content : JSON.stringify(content));
  } catch (error) {
    console.error("[Log Analyzer] Error:", error);
    throw error;
  }
}

/**
 * Threat Classifier Agent
 * Classifies detected threats and assigns risk scores
 */
export async function classifyThreat(normalizedLog: Record<string, unknown>) {
  const systemPrompt = `You are a cybersecurity threat analyst expert. Your task is to analyze security logs and classify threats.

Threat classification options:
- phishing: Email-based social engineering attacks
- brute_force: Repeated login attempts with different passwords
- malware: Suspicious file execution or behavior
- lateral_movement: Unauthorized movement within network
- data_exfiltration: Unauthorized data access/transfer
- privilege_escalation: Unauthorized elevation of privileges
- unknown: Cannot classify

You must respond with valid JSON containing:
- threatType: Selected classification
- riskScore: 0-100 (0=no threat, 100=critical)
- confidence: 0-100 (confidence in classification)
- mitreAttackIds: Array of relevant MITRE ATT&CK IDs (e.g., ["T1566.002", "T1589.001"])
- indicators: Array of indicators of compromise
- reasoning: Explanation of classification`;

  const userPrompt = `Analyze this security log and classify the threat:

${JSON.stringify(normalizedLog, null, 2)}

Respond ONLY with valid JSON, no other text.`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "threat_classification",
          strict: true,
          schema: {
            type: "object",
            properties: {
              threatType: {
                type: "string",
                enum: [
                  "phishing",
                  "brute_force",
                  "malware",
                  "lateral_movement",
                  "data_exfiltration",
                  "privilege_escalation",
                  "unknown",
                ],
              },
              riskScore: { type: "number", minimum: 0, maximum: 100 },
              confidence: { type: "number", minimum: 0, maximum: 100 },
              mitreAttackIds: { type: "array", items: { type: "string" } },
              indicators: { type: "array", items: { type: "string" } },
              reasoning: { type: "string" },
            },
            required: ["threatType", "riskScore", "confidence", "mitreAttackIds", "indicators", "reasoning"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0]?.message.content;
    if (!content) throw new Error("No response from LLM");

    return JSON.parse(typeof content === "string" ? content : JSON.stringify(content));
  } catch (error) {
    console.error("[Threat Classifier] Error:", error);
    throw error;
  }
}

/**
 * Response Planner Agent
 * Generates step-by-step incident response recommendations
 */
export async function planResponse(
  threatType: string,
  riskScore: number,
  affectedAssets: string[],
  organizationSize: string = "medium",
  industry: string = "technology"
) {
  const systemPrompt = `You are an incident response specialist. Your task is to generate step-by-step mitigation recommendations for detected threats.

For each action, provide:
- description: Clear action description
- estimatedHours: Time to complete (number)
- complexity: "low", "medium", or "high"
- responsibleTeam: Who should execute (e.g., "SOC", "Infrastructure", "Security", "Management")

You must respond with valid JSON containing:
- shortTermActions: Array of immediate actions (0-24 hours)
- longTermActions: Array of strategic actions (1-30 days)
- priority: "critical", "high", "medium", or "low"
- summary: Brief summary of the response plan`;

  const userPrompt = `Generate incident response recommendations for:
- Threat Type: ${threatType}
- Risk Score: ${riskScore}/100
- Affected Assets: ${affectedAssets.join(", ")}
- Organization Size: ${organizationSize}
- Industry: ${industry}

Respond ONLY with valid JSON, no other text.`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "response_plan",
          strict: true,
          schema: {
            type: "object",
            properties: {
              shortTermActions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    description: { type: "string" },
                    estimatedHours: { type: "number" },
                    complexity: { type: "string", enum: ["low", "medium", "high"] },
                    responsibleTeam: { type: "string" },
                  },
                  required: ["description", "estimatedHours", "complexity", "responsibleTeam"],
                },
              },
              longTermActions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    description: { type: "string" },
                    estimatedHours: { type: "number" },
                    complexity: { type: "string", enum: ["low", "medium", "high"] },
                    responsibleTeam: { type: "string" },
                  },
                  required: ["description", "estimatedHours", "complexity", "responsibleTeam"],
                },
              },
              priority: { type: "string", enum: ["critical", "high", "medium", "low"] },
              summary: { type: "string" },
            },
            required: ["shortTermActions", "longTermActions", "priority", "summary"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0]?.message.content;
    if (!content) throw new Error("No response from LLM");

    return JSON.parse(typeof content === "string" ? content : JSON.stringify(content));
  } catch (error) {
    console.error("[Response Planner] Error:", error);
    throw error;
  }
}

/**
 * Report Writer Agent
 * Generates comprehensive incident reports
 */
export async function generateReport(
  threatType: string,
  riskScore: number,
  detectionTime: string,
  affectedAssets: string[],
  technicalAnalysis: string,
  recommendations: Record<string, unknown>
) {
  const systemPrompt = `You are a cybersecurity report writer. Your task is to generate comprehensive incident reports.

You must respond with valid JSON containing:
- executiveSummary: 1-2 paragraph business-level summary
- technicalDetails: Detailed technical analysis
- immediateActions: List of immediate actions to take
- longTermImprovements: List of long-term improvements
- estimatedImpact: Business impact assessment
- references: List of relevant resources and standards`;

  const userPrompt = `Generate an incident report for:
- Threat Type: ${threatType}
- Risk Score: ${riskScore}/100
- Detection Time: ${detectionTime}
- Affected Assets: ${affectedAssets.join(", ")}

Technical Analysis:
${technicalAnalysis}

Recommendations:
${JSON.stringify(recommendations, null, 2)}

Respond ONLY with valid JSON, no other text.`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "incident_report",
          strict: true,
          schema: {
            type: "object",
            properties: {
              executiveSummary: { type: "string" },
              technicalDetails: { type: "string" },
              immediateActions: { type: "array", items: { type: "string" } },
              longTermImprovements: { type: "array", items: { type: "string" } },
              estimatedImpact: { type: "string" },
              references: { type: "array", items: { type: "string" } },
            },
            required: [
              "executiveSummary",
              "technicalDetails",
              "immediateActions",
              "longTermImprovements",
              "estimatedImpact",
              "references",
            ],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0]?.message.content;
    if (!content) throw new Error("No response from LLM");

    return JSON.parse(typeof content === "string" ? content : JSON.stringify(content));
  } catch (error) {
    console.error("[Report Writer] Error:", error);
    throw error;
  }
}

/**
 * SOC Copilot Agent
 * Answers questions about security logs and threats
 */
export async function socCopilotChat(
  userMessage: string,
  context: {
    recentThreats?: Array<{ threatType: string; riskScore: number }>;
    recentLogs?: Array<{ eventType: string; severity: string }>;
    organizationContext?: string;
  }
) {
  const systemPrompt = `You are a Security Operations Center (SOC) Copilot AI assistant. Your role is to help security analysts understand security logs, threats, and recommend actions.

You have access to:
- Recent threat detections
- Security log events
- Organization context

Provide clear, actionable insights. Be concise but thorough. Always explain the business impact and recommended next steps.`;

  const contextStr = context
    ? `Context:
Recent Threats: ${JSON.stringify(context.recentThreats || [])}
Recent Logs: ${JSON.stringify(context.recentLogs || [])}
Organization: ${context.organizationContext || "Unknown"}`
    : "";

  const userPrompt = `${contextStr}

User Question: ${userMessage}`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const content = response.choices[0]?.message.content;
    if (!content) throw new Error("No response from LLM");

    return typeof content === "string" ? content : JSON.stringify(content);
  } catch (error) {
    console.error("[SOC Copilot] Error:", error);
    throw error;
  }
}
