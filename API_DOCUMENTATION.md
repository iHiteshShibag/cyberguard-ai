# CyberGuard AI - API Documentation

## Overview

CyberGuard AI provides a comprehensive REST API through tRPC for security log ingestion, threat detection, incident response, and report generation. All endpoints are authenticated and require valid user credentials.

## Authentication

All API endpoints require authentication via Manus OAuth. The authentication flow is handled automatically by the tRPC client.

### Session Management
- Login: Redirect to Manus OAuth portal
- Logout: `POST /api/trpc/auth.logout`
- Current User: `GET /api/trpc/auth.me`

---

## API Endpoints

### 1. Log Management

#### Upload Security Logs
**Endpoint:** `POST /api/trpc/logs.upload`

**Description:** Upload and process security logs from various sources (firewall, IDS, auth servers, endpoints, SIEM).

**Request Payload:**
```json
{
  "sourceType": "firewall|ids|auth_server|endpoint|siem|other",
  "logData": "string (raw log content)",
  "fileName": "string (optional, e.g., 'firewall-logs-2026-01-24.csv')"
}
```

**Response:**
```json
{
  "success": true,
  "logsCreated": 150,
  "fileUrl": "https://s3.example.com/logs/user-123/firewall-logs.txt",
  "message": "Successfully uploaded and processed 150 logs"
}
```

**Supported Log Formats:**
- CSV with headers
- JSON arrays
- Syslog format
- Plain text logs (one per line)

**Example cURL:**
```bash
curl -X POST http://localhost:3000/api/trpc/logs.upload \
  -H "Content-Type: application/json" \
  -d '{
    "sourceType": "firewall",
    "logData": "2026-01-24 12:00:00 Connection from 192.168.1.1 to 10.0.0.1",
    "fileName": "firewall-logs.txt"
  }'
```

---

#### List Security Logs
**Endpoint:** `GET /api/trpc/logs.list`

**Query Parameters:**
- `limit`: number (default: 50, max: 1000)
- `offset`: number (default: 0)

**Response:**
```json
[
  {
    "id": 1,
    "organizationId": 1,
    "sourceType": "firewall",
    "rawLog": "2026-01-24 12:00:00 Connection from 192.168.1.1",
    "normalizedLog": {
      "timestamp": "2026-01-24T12:00:00Z",
      "sourceIp": "192.168.1.1",
      "destinationIp": "10.0.0.1",
      "userId": "admin",
      "eventType": "connection_attempt",
      "severity": "low"
    },
    "timestamp": "2026-01-24T12:00:00Z",
    "createdAt": "2026-01-24T12:05:00Z"
  }
]
```

---

### 2. Threat Detection

#### Analyze Threats
**Endpoint:** `POST /api/trpc/threats.analyze`

**Description:** Analyze uploaded logs for security threats using AI-powered threat detection.

**Request Payload:**
```json
{
  "logId": 123,
  "organizationId": 1
}
```

**Response:**
```json
{
  "success": true,
  "threatsDetected": 5,
  "message": "Analyzed 100 logs and detected 5 threats"
}
```

---

#### List Threats
**Endpoint:** `GET /api/trpc/threats.list`

**Query Parameters:**
- `limit`: number (default: 50)
- `offset`: number (default: 0)

**Response:**
```json
[
  {
    "id": 1,
    "organizationId": 1,
    "logId": 1,
    "threatType": "brute_force",
    "riskScore": 82.5,
    "confidence": 92,
    "mitreAttackIds": ["T1110.001", "T1110.003"],
    "description": "Multiple failed login attempts detected",
    "indicators": [
      "150 failed attempts in 5 minutes",
      "Unusual geographic origin",
      "Rapid authentication failures"
    ],
    "affectedAssets": {
      "sourceIp": "192.168.1.100",
      "destinationIp": "10.0.0.50",
      "userId": "john.doe"
    },
    "status": "new",
    "createdAt": "2026-01-24T12:10:00Z"
  }
]
```

**Threat Types:**
- `phishing` - Email-based social engineering
- `brute_force` - Repeated login attempts
- `malware` - Suspicious file execution
- `lateral_movement` - Unauthorized network movement
- `data_exfiltration` - Unauthorized data access/transfer
- `privilege_escalation` - Unauthorized privilege elevation
- `unknown` - Cannot classify

**Risk Score Levels:**
- 0-40: Low
- 41-60: Medium
- 61-80: High
- 81-100: Critical

---

#### Get Threat Details
**Endpoint:** `GET /api/trpc/threats.getById`

**Query Parameters:**
- `id`: number (threat detection ID)

**Response:** Single threat detection object (see threats.list response)

---

#### Update Threat Status
**Endpoint:** `POST /api/trpc/threats.updateStatus`

**Request Payload:**
```json
{
  "id": 1,
  "status": "new|investigating|confirmed|false_positive|resolved"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Threat status updated to investigating"
}
```

---

### 3. Incident Response

#### Get Recommendations
**Endpoint:** `GET /api/trpc/recommendations.getByThreatId`

**Query Parameters:**
- `threatDetectionId`: number

**Response:**
```json
{
  "id": 1,
  "threatDetectionId": 1,
  "organizationId": 1,
  "shortTermActions": [
    {
      "description": "Isolate affected system from network",
      "estimatedHours": 1,
      "complexity": "low",
      "responsibleTeam": "Infrastructure"
    }
  ],
  "longTermActions": [
    {
      "description": "Implement MFA across all systems",
      "estimatedHours": 40,
      "complexity": "high",
      "responsibleTeam": "Infrastructure"
    }
  ],
  "priority": "critical",
  "aiGeneratedText": "Immediate isolation and credential reset required"
}
```

---

### 4. Report Generation

#### Generate Incident Report
**Endpoint:** `POST /api/trpc/reports.generate`

**Request Payload:**
```json
{
  "threatDetectionId": 1,
  "organizationId": 1,
  "reportType": "executive|technical|combined"
}
```

**Response:**
```json
{
  "success": true,
  "reportId": 1,
  "message": "Report generated successfully"
}
```

**Report Types:**
- `executive` - High-level business impact and recommendations
- `technical` - Detailed technical analysis and indicators
- `combined` - Both executive and technical sections

---

#### List Reports
**Endpoint:** `GET /api/trpc/reports.list`

**Query Parameters:**
- `limit`: number (default: 50)
- `offset`: number (default: 0)

**Response:**
```json
[
  {
    "id": 1,
    "organizationId": 1,
    "threatDetectionId": 1,
    "reportType": "combined",
    "title": "Incident Report - Brute Force Attack (Risk: 82)",
    "executiveSummary": "A brute force attack targeting user authentication was detected...",
    "technicalAnalysis": "150 failed login attempts were detected from IP 192.168.1.100...",
    "recommendations": "{...}",
    "generatedBy": 1,
    "createdAt": "2026-01-24T12:15:00Z"
  }
]
```

---

### 5. SOC Copilot Chat

#### Send Chat Message
**Endpoint:** `POST /api/trpc/chat.message`

**Request Payload:**
```json
{
  "sessionId": "string (unique session identifier)",
  "message": "What threats were detected in the last hour?",
  "organizationId": 1
}
```

**Response:**
```json
{
  "success": true,
  "response": "Based on the detected threats, I found 3 security incidents in the last hour: 1. Brute force attack on user authentication (Risk: 82), 2. Suspicious file access pattern (Risk: 65), 3. Unusual network connection (Risk: 45). I recommend..."
}
```

**Example Questions:**
- "What threats were detected today?"
- "Explain the brute force attack"
- "What should we do about the malware detection?"
- "Generate a report for the critical threats"

---

#### Get Chat History
**Endpoint:** `GET /api/trpc/chat.history`

**Query Parameters:**
- `sessionId`: string
- `limit`: number (default: 50)
- `offset`: number (default: 0)

**Response:**
```json
[
  {
    "id": 1,
    "organizationId": 1,
    "userId": 1,
    "sessionId": "session-123",
    "userMessage": "What threats were detected?",
    "aiResponse": "Based on the logs, we detected 3 threats...",
    "context": {
      "threatCount": 3,
      "logCount": 150
    },
    "createdAt": "2026-01-24T12:00:00Z"
  }
]
```

---

### 6. Dashboard

#### Get Dashboard Metrics
**Endpoint:** `GET /api/trpc/dashboard.metrics`

**Response:**
```json
{
  "threatCount": 15,
  "avgRiskScore": 68.5,
  "criticalThreats": 3,
  "logsProcessed": 1250,
  "organizationId": 1
}
```

---

#### Get Threat Timeline
**Endpoint:** `GET /api/trpc/dashboard.threatTimeline`

**Response:**
```json
[
  {
    "id": 1,
    "threatType": "brute_force",
    "riskScore": 82,
    "timestamp": "2026-01-24T12:00:00Z",
    "status": "new"
  }
]
```

---

#### Get Threat Distribution
**Endpoint:** `GET /api/trpc/dashboard.threatDistribution`

**Response:**
```json
{
  "brute_force": 5,
  "phishing": 3,
  "malware": 2,
  "lateral_movement": 1,
  "data_exfiltration": 0,
  "privilege_escalation": 1,
  "unknown": 3
}
```

---

## Error Handling

All endpoints return standardized error responses:

```json
{
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "Failed to upload logs: Database connection error",
    "status": 500
  }
}
```

**Common Error Codes:**
- `UNAUTHORIZED` (401) - User not authenticated
- `FORBIDDEN` (403) - User lacks permissions
- `BAD_REQUEST` (400) - Invalid request payload
- `NOT_FOUND` (404) - Resource not found
- `INTERNAL_SERVER_ERROR` (500) - Server error

---

## Rate Limiting

API endpoints are rate-limited to prevent abuse:
- **Standard endpoints**: 100 requests per minute
- **Upload endpoint**: 10 requests per minute
- **Chat endpoint**: 30 requests per minute

---

## Data Retention

- Security logs: 90 days
- Threat detections: 180 days
- Reports: 1 year
- Chat history: 30 days

---

## Integration Examples

### Python Client
```python
import requests
import json

BASE_URL = "http://localhost:3000/api/trpc"
HEADERS = {"Content-Type": "application/json"}

# Upload logs
response = requests.post(
    f"{BASE_URL}/logs.upload",
    headers=HEADERS,
    json={
        "sourceType": "firewall",
        "logData": "2026-01-24 12:00:00 Connection from 192.168.1.1",
        "fileName": "firewall-logs.txt"
    }
)
print(response.json())

# List threats
response = requests.get(f"{BASE_URL}/threats.list?limit=10")
print(response.json())
```

### JavaScript/Node.js Client
```javascript
const trpc = createTRPCClient({
  links: [httpBatchLink({ url: "http://localhost:3000/api/trpc" })],
});

// Upload logs
const result = await trpc.logs.upload.mutate({
  sourceType: "firewall",
  logData: "2026-01-24 12:00:00 Connection from 192.168.1.1",
  fileName: "firewall-logs.txt",
});

// List threats
const threats = await trpc.threats.list.query({ limit: 10 });
```

---

## Webhook Events

CyberGuard AI can send webhook notifications for critical events:

**Critical Threat Detected**
```json
{
  "event": "threat.critical_detected",
  "threatId": 1,
  "threatType": "brute_force",
  "riskScore": 85,
  "timestamp": "2026-01-24T12:00:00Z"
}
```

---

## Support

For API support, contact: support@cyberguard-ai.com
