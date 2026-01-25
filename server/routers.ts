import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import * as agents from "./agents";
import { storagePut } from "./storage";
import crypto from "crypto";

/* =========================
   Validation Schemas
========================= */

const logUploadSchema = z.object({
  sourceType: z.enum(["firewall", "ids", "auth_server", "endpoint", "siem", "other"]),
  logData: z.string(),
  fileName: z.string().optional(),
});

const threatAnalysisSchema = z.object({
  logId: z.number().optional(),
  organizationId: z.number(),
});

const chatMessageSchema = z.object({
  sessionId: z.string(),
  message: z.string(),
  organizationId: z.number(),
});

const reportGenerationSchema = z.object({
  threatDetectionId: z.number(),
  organizationId: z.number(),
  reportType: z.enum(["executive", "technical", "combined"]).default("combined"),
});

/* =========================
   App Router
========================= */

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  /* ---------- Logs ---------- */
  logs: router({
    upload: protectedProcedure
      .input(logUploadSchema)
      .mutation(async ({ input, ctx }) => {
        const org = await db.getOrganizationById(ctx.user.organizationId || 1);
        if (!org) throw new Error("Organization not found");

        const fileName = input.fileName || `logs-${Date.now()}.txt`;
        const fileKey = `logs/${ctx.user.id}/${fileName}-${crypto.randomBytes(8).toString("hex")}`;
        const { url } = await storagePut(fileKey, input.logData, "text/plain");

        const logLines = input.logData.split("\n").filter(Boolean);
        let created = 0;

        for (const line of logLines) {
          try {
            const normalized = await agents.analyzeLog(line, input.sourceType);
            const logHash = crypto.createHash("sha256").update(line).digest("hex");

            await db.createSecurityLog({
              organizationId: org.id,
              sourceType: input.sourceType,
              rawLog: line,
              normalizedLog: normalized,
              timestamp: normalized.timestamp ? new Date(normalized.timestamp) : new Date(),
              sourceIp: normalized.sourceIp,
              destinationIp: normalized.destinationIp,
              userId: normalized.userId,
              eventType: normalized.eventType,
              severity: normalized.severity || "low",
              logHash,
            });

            created++;
          } catch (err) {
            console.error("[Log Upload] Skipped line:", err);
          }
        }

        return {
          success: true,
          logsCreated: created,
          fileUrl: url,
        };
      }),

    list: protectedProcedure
      .input(z.object({ limit: z.number().default(50), offset: z.number().default(0) }))
      .query(async ({ input, ctx }) => {
        const org = await db.getOrganizationById(ctx.user.organizationId || 1);
        if (!org) return [];
        return db.getSecurityLogsByOrganization(org.id, input.limit, input.offset);
      }),
  }),

  /* ---------- Threats ---------- */
  threats: router({
    analyze: protectedProcedure
      .input(threatAnalysisSchema)
      .mutation(async ({ input }) => {
        const org = await db.getOrganizationById(input.organizationId);
        if (!org) throw new Error("Organization not found");

        const logs = await db.getSecurityLogsByOrganization(org.id, 100, 0);
        if (!logs.length) return { success: false, message: "No logs found" };

        let detected = 0;

        for (const log of logs) {
          try {
            const classification = await agents.classifyThreat(log.normalizedLog as any);
            await db.createThreatDetection({
              organizationId: org.id,
              logId: log.id,
              threatType: classification.threatType,
              riskScore: classification.riskScore,
              confidence: classification.confidence,
              description: classification.reasoning,
              aiAnalysis: classification.reasoning,
              status: "new",
            });
            detected++;
          } catch (err) {
            console.error("[Threat Analysis] Error:", err);
          }
        }

        return {
          success: true,
          threatsDetected: detected,
        };
      }),
  }),

  /* ---------- Reports ---------- */
  reports: router({
    generate: protectedProcedure
      .input(reportGenerationSchema)
      .mutation(async ({ input, ctx }) => {
        const threat = await db.getThreatDetectionById(input.threatDetectionId);
        if (!threat) throw new Error("Threat not found");

        const report = await db.createIncidentReport({
          organizationId: input.organizationId,
          threatDetectionId: input.threatDetectionId,
          reportType: input.reportType,
          title: `Incident Report - ${threat.threatType}`,
          executiveSummary: threat.aiAnalysis || "",
          technicalAnalysis: threat.aiAnalysis || "",
          recommendations: "{}",
          generatedBy: ctx.user.id,
        });

        return { success: true, reportId: report.id };
      }),
  }),

  /* ---------- Chat (SOC Copilot) ---------- */
  chat: router({
    message: protectedProcedure
      .input(chatMessageSchema)
      .mutation(async ({ input }) => {
        return {
          success: true,
          response:
            "SOC Copilot is running in deterministic demo mode. Live Gemini integration is supported in production.",
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;
