# CyberGuard AI - System Architecture & Design

**Version:** 1.0.0  
**Date:** January 2026  
**Status:** MVP Design Document

---

## Executive Summary

**CyberGuard AI** is a production-ready, AI-powered Security Operations Center (SOC) Copilot designed for small to mid-sized organizations, SOC teams, startups, and educational institutions. The platform ingests security logs, detects cyber threats using agentic AI workflows, explains attacks in natural language, recommends mitigation strategies, and generates comprehensive incident reports.

The architecture emphasizes **scalability, security, and multi-tenancy** while maintaining a **clean, mathematical blueprint aesthetic** that conveys precision and technical rigor.

---

## System Architecture Overview

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND LAYER                           │
│  (Next.js + React + Tailwind CSS - Mathematical Blueprint UI)   │
├─────────────────────────────────────────────────────────────────┤
│  • Dashboard (Risk Score, Timeline, Threat Distribution)        │
│  • Log Upload Interface (CSV/JSON)                              │
│  • SOC Copilot Chat Interface                                   │
│  • Incident Response Recommendations                            │
│  • Report Generator & PDF Export                                │
└────────────────────────┬────────────────────────────────────────┘
                         │ tRPC + REST APIs
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API GATEWAY LAYER                            │
│  (Express.js + tRPC - Type-Safe RPC)                           │
├─────────────────────────────────────────────────────────────────┤
│  • Authentication & Authorization (OAuth + JWT)                 │
│  • Request Validation & Rate Limiting                           │
│  • API Routing & Load Balancing                                 │
└────────────────────────┬────────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  LOG SERVICE │ │ THREAT SRVCE │ │ REPORT SRVCE │
│  (Ingestion) │ │  (Detection) │ │ (Generation) │
└──────┬───────┘ └──────┬───────┘ └──────┬───────┘
       │                │                │
       └────────────────┼────────────────┘
                        │
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ AGENTIC AI   │ │   VECTOR DB  │ │ RELATIONAL   │
│  WORKFLOWS   │ │ (Embeddings) │ │   DATABASE   │
│ (LangGraph)  │ │ (Pinecone/   │ │   (MySQL)    │
│              │ │  Chroma)     │ │              │
└──────────────┘ └──────────────┘ └──────────────┘
        │               │               │
        └───────────────┼───────────────┘
                        │
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  GOOGLE      │ │  S3 STORAGE  │ │  NOTIFICATION│
│  GEMINI LLM  │ │  (File Logs) │ │   SERVICE    │
└──────────────┘ └──────────────┘ └──────────────┘
```

### Core Components

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Frontend** | Next.js 19, React, Tailwind CSS 4 | User interface with mathematical blueprint aesthetic |
| **API Gateway** | Express.js, tRPC 11 | Type-safe RPC layer with authentication |
| **Backend Services** | Node.js (Express) + Python (FastAPI) | Microservices for logs, threats, reports |
| **AI/ML Layer** | Google Gemini LLM, LangGraph | Agentic workflows for threat detection & analysis |
| **Databases** | MySQL (Drizzle ORM), Vector DB | Relational + vector storage for logs & embeddings |
| **File Storage** | AWS S3 | Secure storage for uploaded logs and generated reports |
| **Authentication** | Manus OAuth + JWT | Secure user authentication & session management |

---

## Database Schema

### Core Tables

#### 1. Users Table
Stores user information and authentication state.

```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  openId VARCHAR(64) UNIQUE NOT NULL,
  name TEXT,
  email VARCHAR(320),
  loginMethod VARCHAR(64),
  role ENUM('user', 'admin') DEFAULT 'user',
  organization_id INT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  lastSignedIn TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 2. Organizations Table
Supports multi-tenant architecture.

```sql
CREATE TABLE organizations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  owner_id INT NOT NULL,
  industry VARCHAR(100),
  max_logs_per_month INT DEFAULT 100000,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id)
);
```

#### 3. Security Logs Table
Stores normalized security logs from various sources.

```sql
CREATE TABLE security_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  organization_id INT NOT NULL,
  source_type VARCHAR(50),
  raw_log LONGTEXT,
  normalized_log JSON,
  timestamp TIMESTAMP,
  source_ip VARCHAR(45),
  destination_ip VARCHAR(45),
  user_id VARCHAR(255),
  event_type VARCHAR(100),
  severity ENUM('low', 'medium', 'high', 'critical') DEFAULT 'low',
  log_hash VARCHAR(64) UNIQUE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id),
  INDEX idx_org_timestamp (organization_id, timestamp),
  INDEX idx_severity (severity)
);
```

#### 4. Threat Detections Table
Stores AI-detected threats and classifications.

```sql
CREATE TABLE threat_detections (
  id INT AUTO_INCREMENT PRIMARY KEY,
  organization_id INT NOT NULL,
  log_id INT,
  threat_type ENUM('phishing', 'brute_force', 'malware', 'lateral_movement', 'data_exfiltration', 'privilege_escalation', 'unknown') DEFAULT 'unknown',
  risk_score DECIMAL(5, 2),
  confidence DECIMAL(5, 2),
  mitre_attack_ids JSON,
  description TEXT,
  indicators JSON,
  affected_assets JSON,
  ai_analysis TEXT,
  status ENUM('new', 'investigating', 'confirmed', 'false_positive', 'resolved') DEFAULT 'new',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id),
  FOREIGN KEY (log_id) REFERENCES security_logs(id),
  INDEX idx_org_risk (organization_id, risk_score)
);
```

#### 5. Incident Response Recommendations Table
Stores AI-generated mitigation steps.

```sql
CREATE TABLE incident_recommendations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  threat_detection_id INT NOT NULL,
  organization_id INT NOT NULL,
  short_term_actions JSON,
  long_term_actions JSON,
  estimated_effort JSON,
  priority ENUM('critical', 'high', 'medium', 'low') DEFAULT 'high',
  ai_generated_text TEXT,
  status ENUM('pending', 'in_progress', 'completed') DEFAULT 'pending',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (threat_detection_id) REFERENCES threat_detections(id),
  FOREIGN KEY (organization_id) REFERENCES organizations(id)
);
```

#### 6. Incident Reports Table
Stores generated executive and technical reports.

```sql
CREATE TABLE incident_reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  organization_id INT NOT NULL,
  threat_detection_id INT,
  report_type ENUM('executive', 'technical', 'combined') DEFAULT 'combined',
  title VARCHAR(255),
  executive_summary TEXT,
  technical_analysis TEXT,
  recommendations TEXT,
  pdf_url VARCHAR(500),
  generated_by INT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id),
  FOREIGN KEY (threat_detection_id) REFERENCES threat_detections(id),
  FOREIGN KEY (generated_by) REFERENCES users(id)
);
```

#### 7. Chat History Table
Stores SOC Copilot conversation history.

```sql
CREATE TABLE chat_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  organization_id INT NOT NULL,
  user_id INT NOT NULL,
  session_id VARCHAR(64),
  user_message TEXT,
  ai_response TEXT,
  context JSON,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_session (session_id)
);
```

---

## API Design

### REST Endpoints

#### Authentication
- `POST /api/auth/login` - Initiate OAuth login
- `POST /api/auth/callback` - OAuth callback handler
- `POST /api/auth/logout` - Logout and clear session
- `GET /api/auth/me` - Get current user info

#### Log Management
- `POST /api/logs/upload` - Upload CSV/JSON security logs
- `GET /api/logs` - List logs for organization (paginated)
- `GET /api/logs/:id` - Get specific log details
- `DELETE /api/logs/:id` - Delete log (soft delete)
- `POST /api/logs/normalize` - Normalize raw logs to standard format

#### Threat Detection
- `POST /api/threats/analyze` - Trigger threat analysis on logs
- `GET /api/threats` - List detected threats (paginated)
- `GET /api/threats/:id` - Get threat details with analysis
- `PATCH /api/threats/:id/status` - Update threat status
- `GET /api/threats/mitre-mapping` - Get MITRE ATT&CK mappings

#### SOC Copilot Chat
- `POST /api/chat/message` - Send message to copilot
- `GET /api/chat/history` - Get chat history
- `POST /api/chat/context` - Set context (logs, threats)

#### Incident Response
- `GET /api/recommendations/:threatId` - Get recommendations for threat
- `PATCH /api/recommendations/:id/status` - Update recommendation status
- `POST /api/recommendations/execute` - Log execution of recommendation

#### Report Generation
- `POST /api/reports/generate` - Generate incident report
- `GET /api/reports` - List generated reports
- `GET /api/reports/:id` - Get report details
- `GET /api/reports/:id/download` - Download report as PDF

#### Dashboard
- `GET /api/dashboard/metrics` - Get dashboard KPIs
- `GET /api/dashboard/timeline` - Get threat timeline data
- `GET /api/dashboard/threat-distribution` - Get threat type distribution

---

## AI Agent Architecture

### Agent-Based Workflow

The system uses a multi-agent orchestration pattern to process security logs and generate insights.

#### 1. Log Analyzer Agent
**Purpose:** Normalize and parse raw security logs from diverse sources.

**Inputs:** Raw log data (CSV, JSON, syslog), Source type

**Processing:**
- Parse log format
- Extract key fields (timestamp, source IP, destination IP, user, event)
- Normalize to standard schema
- Generate embedding for semantic search

**Outputs:** Normalized log record, Vector embedding, Confidence score

#### 2. Threat Classifier Agent
**Purpose:** Classify detected threats and assign risk scores.

**Inputs:** Normalized log records, Historical threat data, MITRE ATT&CK reference

**Processing:**
- Analyze log patterns for threat indicators
- Cross-reference with known attack signatures
- Classify threat type (phishing, brute force, malware, lateral movement, etc.)
- Calculate risk score (0-100)
- Map to MITRE ATT&CK techniques

**Outputs:** Threat type, Risk score, Confidence score, MITRE ATT&CK IDs, IoCs

#### 3. Response Planner Agent
**Purpose:** Generate step-by-step incident response recommendations.

**Inputs:** Threat detection details, Organization context, Incident severity

**Processing:**
- Analyze threat impact and scope
- Generate immediate containment steps
- Develop long-term remediation strategy
- Estimate effort and resources required
- Prioritize actions by impact and urgency

**Outputs:** Short-term actions, Long-term actions, Effort estimates, Priority level

#### 4. Report Writer Agent
**Purpose:** Generate comprehensive incident reports.

**Inputs:** Threat detection details, Analysis and recommendations, Organization context

**Processing:**
- Synthesize technical analysis into executive summary
- Generate detailed technical report
- Create actionable recommendations
- Format for PDF export

**Outputs:** Executive summary, Technical analysis, Recommendations, Report metadata

---

## Data Flow: Log Upload to Report Generation

### Step 1: Log Upload & Ingestion
```
User uploads CSV/JSON file
    ↓
File stored in S3
    ↓
Log Analyzer Agent processes each row
    ↓
Normalized logs stored in MySQL
    ↓
Embeddings generated and stored in Vector DB
```

### Step 2: Threat Detection
```
Normalized logs retrieved
    ↓
Threat Classifier Agent analyzes patterns
    ↓
Risk scores calculated
    ↓
Threat records created in MySQL
    ↓
Alerts generated for high-risk threats
```

### Step 3: Incident Response
```
Threat detected
    ↓
Response Planner Agent generates recommendations
    ↓
Recommendations stored in MySQL
    ↓
User notified via dashboard
```

### Step 4: Report Generation
```
User requests report
    ↓
Report Writer Agent synthesizes analysis
    ↓
Report generated and stored
    ↓
PDF exported via S3
    ↓
Report URL returned to user
```

---

## Security Considerations

### Authentication & Authorization
- **OAuth 2.0:** Manus OAuth for user authentication
- **JWT Tokens:** Session management with secure cookies
- **Role-Based Access Control (RBAC):** Admin vs. User roles
- **Organization Isolation:** Data segregation by organization_id

### Data Protection
- **Encryption in Transit:** TLS 1.3 for all API calls
- **Encryption at Rest:** Database encryption, S3 server-side encryption
- **Sensitive Data Masking:** PII redaction in logs and reports
- **Audit Logging:** All API calls logged with user context

### Compliance
- **GDPR:** User consent for data processing, right to deletion
- **SOC 2:** Secure infrastructure, access controls, monitoring
- **HIPAA:** If handling healthcare data, additional encryption and access controls

---

## Technology Stack Summary

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Frontend** | Next.js 19, React 19, Tailwind CSS 4 | Modern, type-safe, excellent DX |
| **Backend** | Express.js, tRPC 11, Node.js | Type-safe RPC, minimal boilerplate |
| **Database** | MySQL 8.0, Drizzle ORM | Reliable, ACID compliance, type-safe ORM |
| **LLM** | Google Gemini (Manus Forge) | Advanced reasoning, cost-effective |
| **Storage** | AWS S3 | Scalable, durable, cost-effective |
| **Auth** | Manus OAuth + JWT | Secure, integrated with platform |
| **Deployment** | Docker, Kubernetes, Google Cloud Run | Cloud-native, scalable |

---

## MVP Scope & Constraints

### In Scope (MVP)
- ✅ Log upload and normalization (CSV/JSON)
- ✅ AI threat detection with risk scoring
- ✅ MITRE ATT&CK mapping
- ✅ SOC Copilot chat interface
- ✅ Incident response recommendations
- ✅ Report generation with PDF export
- ✅ Dashboard with basic visualizations
- ✅ Multi-tenant architecture
- ✅ Secure authentication

### Out of Scope (Future Enhancements)
- ❌ Real-time log streaming (Kafka integration)
- ❌ Advanced visualization (3D threat maps)
- ❌ ML model training (custom threat detection)
- ❌ SIEM integration (Splunk, ELK connectors)
- ❌ Automated response (playbook execution)
- ❌ Mobile app

### Constraints
- **Build Time:** 24-48 hours for MVP
- **Team Size:** 1-2 engineers
- **Budget:** Minimal cloud costs (use free tiers where possible)
- **Complexity:** Focus on core features, elegant implementation

---

**Document Author:** Manus AI  
**Last Updated:** January 2026  
**Next Review:** Q2 2026
