import { decimal, int, json, longtext, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  organizationId: int("organizationId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Organizations table for multi-tenant support
export const organizations = mysqlTable("organizations", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  ownerId: int("ownerId").notNull(),
  industry: varchar("industry", { length: 100 }),
  maxLogsPerMonth: int("maxLogsPerMonth").default(100000),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = typeof organizations.$inferInsert;

// Security logs table
export const securityLogs = mysqlTable("security_logs", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  sourceType: varchar("sourceType", { length: 50 }),
  rawLog: longtext("rawLog"),
  normalizedLog: json("normalizedLog"),
  timestamp: timestamp("timestamp"),
  sourceIp: varchar("sourceIp", { length: 45 }),
  destinationIp: varchar("destinationIp", { length: 45 }),
  userId: varchar("userId", { length: 255 }),
  eventType: varchar("eventType", { length: 100 }),
  severity: mysqlEnum("severity", ["low", "medium", "high", "critical"]).default("low"),
  logHash: varchar("logHash", { length: 64 }).unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SecurityLog = typeof securityLogs.$inferSelect;
export type InsertSecurityLog = typeof securityLogs.$inferInsert;

// Threat detections table
export const threatDetections = mysqlTable("threat_detections", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  logId: int("logId"),
  threatType: mysqlEnum("threatType", [
    "phishing",
    "brute_force",
    "malware",
    "lateral_movement",
    "data_exfiltration",
    "privilege_escalation",
    "unknown",
  ]).default("unknown"),
  riskScore: decimal("riskScore", { precision: 5, scale: 2 }),
  confidence: decimal("confidence", { precision: 5, scale: 2 }),
  mitreAttackIds: json("mitreAttackIds"),
  description: text("description"),
  indicators: json("indicators"),
  affectedAssets: json("affectedAssets"),
  aiAnalysis: text("aiAnalysis"),
  status: mysqlEnum("status", [
    "new",
    "investigating",
    "confirmed",
    "false_positive",
    "resolved",
  ]).default("new"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ThreatDetection = typeof threatDetections.$inferSelect;
export type InsertThreatDetection = typeof threatDetections.$inferInsert;

// Incident recommendations table
export const incidentRecommendations = mysqlTable("incident_recommendations", {
  id: int("id").autoincrement().primaryKey(),
  threatDetectionId: int("threatDetectionId").notNull(),
  organizationId: int("organizationId").notNull(),
  shortTermActions: json("shortTermActions"),
  longTermActions: json("longTermActions"),
  estimatedEffort: json("estimatedEffort"),
  priority: mysqlEnum("priority", ["critical", "high", "medium", "low"]).default("high"),
  aiGeneratedText: text("aiGeneratedText"),
  status: mysqlEnum("recStatus", ["pending", "in_progress", "completed"]).default("pending"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type IncidentRecommendation = typeof incidentRecommendations.$inferSelect;
export type InsertIncidentRecommendation = typeof incidentRecommendations.$inferInsert;

// Incident reports table
export const incidentReports = mysqlTable("incident_reports", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  threatDetectionId: int("threatDetectionId"),
  reportType: mysqlEnum("reportType", ["executive", "technical", "combined"]).default("combined"),
  title: varchar("title", { length: 255 }),
  executiveSummary: text("executiveSummary"),
  technicalAnalysis: text("technicalAnalysis"),
  recommendations: text("recommendations"),
  pdfUrl: varchar("pdfUrl", { length: 500 }),
  generatedBy: int("generatedBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type IncidentReport = typeof incidentReports.$inferSelect;
export type InsertIncidentReport = typeof incidentReports.$inferInsert;

// Chat history table
export const chatHistory = mysqlTable("chat_history", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  userId: int("userId").notNull(),
  sessionId: varchar("sessionId", { length: 64 }),
  userMessage: text("userMessage"),
  aiResponse: text("aiResponse"),
  context: json("context"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ChatHistoryRecord = typeof chatHistory.$inferSelect;
export type InsertChatHistoryRecord = typeof chatHistory.$inferInsert;