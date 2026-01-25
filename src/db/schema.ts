import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";

export const logs = pgTable("logs", {
  id: serial("id").primaryKey(),
  source: text("source").notNull(),
  message: text("message").notNull(),
  severity: text("severity").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const incidents = pgTable("incidents", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  riskScore: integer("risk_score").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});
