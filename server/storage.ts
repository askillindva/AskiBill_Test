import {
  users,
  userProfiles,
  expenses,
  otpVerifications,
  bankAccounts,
  bankTransactions,
  type User,
  type UpsertUser,
  type UserProfile,
  type InsertUserProfile,
  type Expense,
  type InsertExpense,
  type OtpVerification,
  type InsertOtp,
  type BankAccount,
  type InsertBankAccount,
  type BankTransaction,
  type InsertBankTransaction,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations (IMPORTANT) these user operations are mandatory for Replit Auth.
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getUserByMobile(mobile: string): Promise<User | undefined>;
  createUserWithMobile(userData: UpsertUser): Promise<User>;
  
  // Profile operations
  getUserProfile(userId: string): Promise<UserProfile | undefined>;
  createUserProfile(profile: InsertUserProfile): Promise<UserProfile>;
  updateUserProfile(userId: string, profile: Partial<InsertUserProfile>): Promise<UserProfile>;
  
  // Expense operations
  createExpense(expense: InsertExpense): Promise<Expense>;
  getUserExpenses(userId: string, limit?: number): Promise<Expense[]>;
  getUserExpensesByDateRange(userId: string, startDate: Date, endDate: Date): Promise<Expense[]>;
  getUserExpensesByCategory(userId: string, category: string): Promise<Expense[]>;
  deleteExpense(id: number, userId: string): Promise<boolean>;
  
  // OTP operations
  createOtp(otpData: InsertOtp): Promise<OtpVerification>;
  verifyOtp(mobile: string, otp: string): Promise<boolean>;
  
  // Bank account operations
  createBankAccount(account: InsertBankAccount): Promise<BankAccount>;
  getUserBankAccounts(userId: string): Promise<BankAccount[]>;
  getBankAccount(id: number, userId: string): Promise<BankAccount | undefined>;
  updateBankAccount(id: number, userId: string, account: Partial<InsertBankAccount>): Promise<BankAccount>;
  deleteBankAccount(id: number, userId: string): Promise<boolean>;
  
  // Bank transaction operations
  createBankTransaction(transaction: InsertBankTransaction): Promise<BankTransaction>;
  getBankAccountTransactions(bankAccountId: number): Promise<BankTransaction[]>;
  getUserBankTransactions(userId: string): Promise<BankTransaction[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations (IMPORTANT) these user operations are mandatory for Replit Auth.
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Profile operations
  async getUserProfile(userId: string): Promise<UserProfile | undefined> {
    const [profile] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId));
    return profile;
  }

  async createUserProfile(profile: InsertUserProfile): Promise<UserProfile> {
    const [newProfile] = await db
      .insert(userProfiles)
      .values(profile)
      .returning();
    return newProfile;
  }

  async updateUserProfile(userId: string, profile: Partial<InsertUserProfile>): Promise<UserProfile> {
    const [updatedProfile] = await db
      .update(userProfiles)
      .set({ ...profile, updatedAt: new Date() })
      .where(eq(userProfiles.userId, userId))
      .returning();
    return updatedProfile;
  }

  // Expense operations
  async createExpense(expense: InsertExpense): Promise<Expense> {
    const [newExpense] = await db
      .insert(expenses)
      .values(expense)
      .returning();
    return newExpense;
  }

  async getUserExpenses(userId: string, limit = 50): Promise<Expense[]> {
    return await db
      .select()
      .from(expenses)
      .where(eq(expenses.userId, userId))
      .orderBy(desc(expenses.date), desc(expenses.createdAt))
      .limit(limit);
  }

  async getUserExpensesByDateRange(userId: string, startDate: Date, endDate: Date): Promise<Expense[]> {
    return await db
      .select()
      .from(expenses)
      .where(
        and(
          eq(expenses.userId, userId),
          gte(expenses.date, startDate.toISOString().split('T')[0]),
          lte(expenses.date, endDate.toISOString().split('T')[0])
        )
      )
      .orderBy(desc(expenses.date));
  }

  async getUserExpensesByCategory(userId: string, category: string): Promise<Expense[]> {
    return await db
      .select()
      .from(expenses)
      .where(
        and(
          eq(expenses.userId, userId),
          eq(expenses.category, category)
        )
      )
      .orderBy(desc(expenses.date));
  }

  async deleteExpense(id: number, userId: string): Promise<boolean> {
    const result = await db
      .delete(expenses)
      .where(
        and(
          eq(expenses.id, id),
          eq(expenses.userId, userId)
        )
      );
    return (result.rowCount ?? 0) > 0;
  }

  // Mobile authentication methods
  async getUserByMobile(mobile: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.mobile, mobile));
    return user;
  }

  async createUserWithMobile(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  // OTP methods
  async createOtp(otpData: InsertOtp): Promise<OtpVerification> {
    // Clean up old OTPs for this mobile number
    await db
      .delete(otpVerifications)
      .where(eq(otpVerifications.mobile, otpData.mobile));

    const [otp] = await db
      .insert(otpVerifications)
      .values(otpData)
      .returning();
    return otp;
  }

  async verifyOtp(mobile: string, otp: string): Promise<boolean> {
    const [otpRecord] = await db
      .select()
      .from(otpVerifications)
      .where(
        and(
          eq(otpVerifications.mobile, mobile),
          eq(otpVerifications.otp, otp),
          eq(otpVerifications.isVerified, "false"),
          gte(otpVerifications.expiresAt, new Date())
        )
      );

    if (!otpRecord) {
      return false;
    }

    // Mark as verified
    await db
      .update(otpVerifications)
      .set({ isVerified: "true" })
      .where(eq(otpVerifications.id, otpRecord.id));

    return true;
  }

  // Bank account operations
  async createBankAccount(account: InsertBankAccount): Promise<BankAccount> {
    const [bankAccount] = await db
      .insert(bankAccounts)
      .values(account)
      .returning();
    return bankAccount;
  }

  async getUserBankAccounts(userId: string): Promise<BankAccount[]> {
    return await db
      .select()
      .from(bankAccounts)
      .where(and(eq(bankAccounts.userId, userId), eq(bankAccounts.isActive, "true")))
      .orderBy(desc(bankAccounts.createdAt));
  }

  async getBankAccount(id: number, userId: string): Promise<BankAccount | undefined> {
    const [account] = await db
      .select()
      .from(bankAccounts)
      .where(and(eq(bankAccounts.id, id), eq(bankAccounts.userId, userId)))
      .limit(1);
    return account;
  }

  async updateBankAccount(id: number, userId: string, account: Partial<InsertBankAccount>): Promise<BankAccount> {
    const [updatedAccount] = await db
      .update(bankAccounts)
      .set({ ...account, updatedAt: new Date() })
      .where(and(eq(bankAccounts.id, id), eq(bankAccounts.userId, userId)))
      .returning();
    return updatedAccount;
  }

  async deleteBankAccount(id: number, userId: string): Promise<boolean> {
    const result = await db
      .update(bankAccounts)
      .set({ isActive: "false", updatedAt: new Date() })
      .where(and(eq(bankAccounts.id, id), eq(bankAccounts.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  // Bank transaction operations
  async createBankTransaction(transaction: InsertBankTransaction): Promise<BankTransaction> {
    const [bankTransaction] = await db
      .insert(bankTransactions)
      .values(transaction)
      .returning();
    return bankTransaction;
  }

  async getBankAccountTransactions(bankAccountId: number): Promise<BankTransaction[]> {
    return await db
      .select()
      .from(bankTransactions)
      .where(eq(bankTransactions.bankAccountId, bankAccountId))
      .orderBy(desc(bankTransactions.date));
  }

  async getUserBankTransactions(userId: string): Promise<BankTransaction[]> {
    return await db
      .select({
        id: bankTransactions.id,
        bankAccountId: bankTransactions.bankAccountId,
        transactionId: bankTransactions.transactionId,
        amount: bankTransactions.amount,
        transactionType: bankTransactions.transactionType,
        description: bankTransactions.description,
        category: bankTransactions.category,
        date: bankTransactions.date,
        balance: bankTransactions.balance,
        createdAt: bankTransactions.createdAt,
      })
      .from(bankTransactions)
      .innerJoin(bankAccounts, eq(bankTransactions.bankAccountId, bankAccounts.id))
      .where(eq(bankAccounts.userId, userId))
      .orderBy(desc(bankTransactions.date));
  }
}

export const storage = new DatabaseStorage();
