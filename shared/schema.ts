import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  decimal,
  date,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  mobile: varchar("mobile"), // Mobile number for OTP authentication
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// OTP verification table for mobile authentication
export const otpVerifications = pgTable("otp_verifications", {
  id: serial("id").primaryKey(),
  mobile: varchar("mobile").notNull(),
  email: varchar("email"),
  otp: varchar("otp").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  isVerified: text("is_verified").default("false"),
  attempts: varchar("attempts").default("0"),
  createdAt: timestamp("created_at").defaultNow(),
});

// User profiles table for financial and personal information
export const userProfiles = pgTable("user_profiles", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  monthlyNetSalary: decimal("monthly_net_salary", { precision: 10, scale: 2 }),
  annualGrossSalary: decimal("annual_gross_salary", { precision: 12, scale: 2 }),
  occupation: varchar("occupation"),
  dateOfBirth: date("date_of_birth"),
  gender: varchar("gender"),
  mobile: varchar("mobile"),
  isSetupComplete: text("is_setup_complete").default("false"),
  encryptedData: text("encrypted_data"), // For storing encrypted personal data
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Expenses table
export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  category: varchar("category").notNull(),
  description: text("description"),
  date: date("date").notNull(),
  encryptedData: text("encrypted_data"), // For storing any additional encrypted expense data
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Schema definitions for validation
export const insertUserProfileSchema = createInsertSchema(userProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  monthlyNetSalary: z.union([z.string(), z.number()]).transform((val) => String(val)).optional(),
  annualGrossSalary: z.union([z.string(), z.number()]).transform((val) => String(val)).optional(),
});

export const insertExpenseSchema = createInsertSchema(expenses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  amount: z.union([z.string(), z.number()]).transform((val) => String(val)),
  date: z.union([z.string(), z.date()]).transform((val) => val instanceof Date ? val.toISOString().split('T')[0] : val),
});

// OTP schema
export const insertOtpSchema = createInsertSchema(otpVerifications).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;
export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type OtpVerification = typeof otpVerifications.$inferSelect;
export type InsertOtp = z.infer<typeof insertOtpSchema>;
