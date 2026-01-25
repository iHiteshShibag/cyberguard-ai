import { eq, and, desc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  InsertThreatDetection,
  InsertSecurityLog,
  InsertIncidentRecommendation,
  InsertIncidentReport,
  InsertChatHistoryRecord,
  users,
  organizations,
  securityLogs,
  threatDetections,
  incidentRecommendations,
  incidentReports,
  chatHistory,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: Partial<InsertUser> = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Organization queries
export async function createOrganization(
  name: string,
  ownerId: number,
  industry?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(organizations).values({
    name,
    ownerId,
    industry,
  });
  return result;
}

export async function getOrganizationById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, id))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Security logs queries
export async function createSecurityLog(data: InsertSecurityLog) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(securityLogs).values(data);
  return result;
}

export async function getSecurityLogsByOrganization(
  organizationId: number,
  limit = 50,
  offset = 0
) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(securityLogs)
    .where(eq(securityLogs.organizationId, organizationId))
    .orderBy(desc(securityLogs.createdAt))
    .limit(limit)
    .offset(offset);
}

// Threat detection queries
export async function createThreatDetection(data: InsertThreatDetection) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(threatDetections).values(data);
  return result;
}

export async function getThreatDetectionsByOrganization(
  organizationId: number,
  limit = 50,
  offset = 0
) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(threatDetections)
    .where(eq(threatDetections.organizationId, organizationId))
    .orderBy(desc(threatDetections.riskScore))
    .limit(limit)
    .offset(offset);
}

export async function getThreatDetectionById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(threatDetections)
    .where(eq(threatDetections.id, id))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function updateThreatDetectionStatus(
  id: number,
  status: "new" | "investigating" | "confirmed" | "false_positive" | "resolved"
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .update(threatDetections)
    .set({ status, updatedAt: new Date() })
    .where(eq(threatDetections.id, id));
}

// Incident recommendations queries
export async function createIncidentRecommendation(data: InsertIncidentRecommendation) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(incidentRecommendations).values(data);
  return result;
}

export async function getRecommendationsByThreatId(threatDetectionId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(incidentRecommendations)
    .where(eq(incidentRecommendations.threatDetectionId, threatDetectionId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Incident reports queries
export async function createIncidentReport(data: InsertIncidentReport) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(incidentReports).values(data);
  return result;
}

export async function getReportsByOrganization(
  organizationId: number,
  limit = 50,
  offset = 0
) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(incidentReports)
    .where(eq(incidentReports.organizationId, organizationId))
    .orderBy(desc(incidentReports.createdAt))
    .limit(limit)
    .offset(offset);
}

// Chat history queries
export async function createChatMessage(data: InsertChatHistoryRecord) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(chatHistory).values(data);
  return result;
}

export async function getChatHistory(
  sessionId: string,
  limit = 50,
  offset = 0
) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(chatHistory)
    .where(eq(chatHistory.sessionId, sessionId))
    .orderBy(desc(chatHistory.createdAt))
    .limit(limit)
    .offset(offset);
}

// Dashboard metrics
export async function getDashboardMetrics(organizationId: number) {
  const db = await getDb();
  if (!db) return null;

  const threatCount = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(threatDetections)
    .where(eq(threatDetections.organizationId, organizationId));

  const avgRiskScore = await db
    .select({ avg: sql<number>`AVG(riskScore)` })
    .from(threatDetections)
    .where(eq(threatDetections.organizationId, organizationId));

  const criticalThreats = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(threatDetections)
    .where(
      and(
        eq(threatDetections.organizationId, organizationId),
        sql`riskScore >= 80`
      )
    );

  return {
    threatCount: threatCount[0]?.count || 0,
    avgRiskScore: avgRiskScore[0]?.avg || 0,
    criticalThreats: criticalThreats[0]?.count || 0,
  };
}
