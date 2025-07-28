import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertUserProfileSchema, insertExpenseSchema, insertOtpSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Mobile OTP Authentication Routes
  app.post('/api/auth/send-otp', async (req, res) => {
    try {
      const { mobile } = req.body;
      
      if (!mobile) {
        return res.status(400).json({ message: "Mobile number is required" });
      }

      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes for easier testing

      // Save OTP to database
      await storage.createOtp({
        mobile,
        email: null,
        otp,
        expiresAt,
        isVerified: "false",
        attempts: "0",
      });

      // In a real application, you would send SMS here
      // For demo purposes, we'll log the OTP (remove in production)
      console.log(`OTP for ${mobile}: ${otp}`);
      
      // Simulate SMS sending success
      res.json({ 
        message: "OTP sent successfully",
        // For demo only - remove in production
        debug_otp: otp 
      });
    } catch (error) {
      console.error("Error sending OTP:", error);
      res.status(500).json({ message: "Failed to send OTP" });
    }
  });

  app.post('/api/auth/verify-otp', async (req, res) => {
    try {
      const { mobile, otp } = req.body;
      
      if (!mobile || !otp) {
        return res.status(400).json({ message: "Mobile number and OTP are required" });
      }

      // Verify OTP
      const isValid = await storage.verifyOtp(mobile, otp);
      
      if (!isValid) {
        return res.status(400).json({ message: "Invalid or expired OTP" });
      }

      // Create or get user by mobile
      let user = await storage.getUserByMobile(mobile);
      if (!user) {
        // Create new user
        user = await storage.createUserWithMobile({
          id: `mobile_${mobile.replace(/[^0-9]/g, '')}`,
          mobile,
          firstName: "User",
          lastName: "",
          email: null,
          profileImageUrl: null,
        });
      }

      // For mobile OTP authentication, we return user data
      // Frontend will handle storing authentication state temporarily

      res.json({ 
        message: "Login successful",
        user: {
          id: user.id,
          mobile: user.mobile,
          firstName: user.firstName,
        }
      });
    } catch (error) {
      console.error("Error verifying OTP:", error);
      res.status(500).json({ message: "Failed to verify OTP" });
    }
  });

  // Bank account routes
  app.post('/api/bank-accounts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { accountType, bankName, accountNumber, accountHolderName, currentBalance, creditLimit, interestRate, connectToBank } = req.body;
      
      const bankAccount = await storage.createBankAccount({
        userId,
        accountType,
        bankName,
        accountNumber,
        accountHolderName,
        currentBalance: currentBalance.toString(),
        creditLimit: creditLimit ? creditLimit.toString() : null,
        interestRate: interestRate ? interestRate.toString() : null,
        lastSyncedAt: connectToBank ? new Date() : null,
      });
      
      res.json(bankAccount);
    } catch (error) {
      console.error("Error creating bank account:", error);
      res.status(500).json({ message: "Failed to create bank account" });
    }
  });

  app.get('/api/bank-accounts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const bankAccounts = await storage.getUserBankAccounts(userId);
      res.json(bankAccounts);
    } catch (error) {
      console.error("Error fetching bank accounts:", error);
      res.status(500).json({ message: "Failed to fetch bank accounts" });
    }
  });

  app.get('/api/bank-accounts/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const accountId = parseInt(req.params.id);
      const bankAccount = await storage.getBankAccount(accountId, userId);
      
      if (!bankAccount) {
        return res.status(404).json({ message: "Bank account not found" });
      }
      
      res.json(bankAccount);
    } catch (error) {
      console.error("Error fetching bank account:", error);
      res.status(500).json({ message: "Failed to fetch bank account" });
    }
  });

  app.get('/api/bank-transactions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const transactions = await storage.getUserBankTransactions(userId);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching bank transactions:", error);
      res.status(500).json({ message: "Failed to fetch bank transactions" });
    }
  });

  app.get('/api/bank-transactions/:accountId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const accountId = parseInt(req.params.accountId);
      
      // Verify the account belongs to the user
      const bankAccount = await storage.getBankAccount(accountId, userId);
      if (!bankAccount) {
        return res.status(404).json({ message: "Bank account not found" });
      }
      
      const transactions = await storage.getBankAccountTransactions(accountId);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching bank account transactions:", error);
      res.status(500).json({ message: "Failed to fetch bank account transactions" });
    }
  });

  // Mobile bank account routes
  app.post('/api/mobile/bank-accounts/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const { accountType, bankName, accountNumber, accountHolderName, currentBalance, creditLimit, interestRate, connectToBank } = req.body;
      
      const bankAccount = await storage.createBankAccount({
        userId,
        accountType,
        bankName,
        accountNumber,
        accountHolderName,
        currentBalance: currentBalance.toString(),
        creditLimit: creditLimit ? creditLimit.toString() : null,
        interestRate: interestRate ? interestRate.toString() : null,
        lastSyncedAt: connectToBank ? new Date() : null,
      });
      
      res.json(bankAccount);
    } catch (error) {
      console.error("Error creating mobile bank account:", error);
      res.status(500).json({ message: "Failed to create bank account" });
    }
  });

  app.get('/api/mobile/bank-accounts/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const bankAccounts = await storage.getUserBankAccounts(userId);
      res.json(bankAccounts);
    } catch (error) {
      console.error("Error fetching mobile bank accounts:", error);
      res.status(500).json({ message: "Failed to fetch bank accounts" });
    }
  });

  app.get('/api/mobile/bank-transactions/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const transactions = await storage.getUserBankTransactions(userId);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching mobile bank transactions:", error);
      res.status(500).json({ message: "Failed to fetch bank transactions" });
    }
  });

  app.get('/api/mobile/bank-transactions/:userId/:accountId', async (req, res) => {
    try {
      const { userId, accountId } = req.params;
      const accountIdNum = parseInt(accountId);
      
      // Verify the account belongs to the user
      const bankAccount = await storage.getBankAccount(accountIdNum, userId);
      if (!bankAccount) {
        return res.status(404).json({ message: "Bank account not found" });
      }
      
      const transactions = await storage.getBankAccountTransactions(accountIdNum);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching mobile bank account transactions:", error);
      res.status(500).json({ message: "Failed to fetch bank account transactions" });
    }
  });

  // Profile routes
  app.get('/api/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const profile = await storage.getUserProfile(userId);
      res.json(profile);
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  // Mobile auth profile route
  app.get('/api/mobile/profile/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const profile = await storage.getUserProfile(userId);
      res.json(profile);
    } catch (error) {
      console.error("Error fetching mobile profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.post('/api/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const profileData = insertUserProfileSchema.parse({
        ...req.body,
        userId
      });

      // Check if profile exists
      const existingProfile = await storage.getUserProfile(userId);
      
      let profile;
      if (existingProfile) {
        profile = await storage.updateUserProfile(userId, profileData);
      } else {
        profile = await storage.createUserProfile(profileData);
      }

      res.json(profile);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid profile data", errors: error.errors });
      } else {
        console.error("Error saving profile:", error);
        res.status(500).json({ message: "Failed to save profile" });
      }
    }
  });

  // Expense routes
  app.get('/api/expenses', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const expenses = await storage.getUserExpenses(userId, limit);
      res.json(expenses);
    } catch (error) {
      console.error("Error fetching expenses:", error);
      res.status(500).json({ message: "Failed to fetch expenses" });
    }
  });

  // Mobile auth expense route
  app.get('/api/mobile/expenses/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const expenses = await storage.getUserExpenses(userId, limit);
      res.json(expenses);
    } catch (error) {
      console.error("Error fetching mobile expenses:", error);
      res.status(500).json({ message: "Failed to fetch expenses" });
    }
  });

  app.get('/api/expenses/range', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "Start date and end date are required" });
      }

      const expenses = await storage.getUserExpensesByDateRange(
        userId,
        new Date(startDate as string),
        new Date(endDate as string)
      );
      res.json(expenses);
    } catch (error) {
      console.error("Error fetching expenses by date range:", error);
      res.status(500).json({ message: "Failed to fetch expenses" });
    }
  });

  app.get('/api/expenses/category/:category', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { category } = req.params;
      const expenses = await storage.getUserExpensesByCategory(userId, category);
      res.json(expenses);
    } catch (error) {
      console.error("Error fetching expenses by category:", error);
      res.status(500).json({ message: "Failed to fetch expenses" });
    }
  });

  app.post('/api/expenses', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const expenseData = insertExpenseSchema.parse({
        ...req.body,
        userId
      });

      const expense = await storage.createExpense(expenseData);
      res.json(expense);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid expense data", errors: error.errors });
      } else {
        console.error("Error creating expense:", error);
        res.status(500).json({ message: "Failed to create expense" });
      }
    }
  });

  // Mobile auth create expense route
  app.post('/api/mobile/expenses/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const expenseData = insertExpenseSchema.parse({
        ...req.body,
        userId
      });

      const expense = await storage.createExpense(expenseData);
      res.json(expense);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid expense data", errors: error.errors });
      } else {
        console.error("Error creating mobile expense:", error);
        res.status(500).json({ message: "Failed to create expense" });
      }
    }
  });

  app.delete('/api/expenses/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const expenseId = parseInt(req.params.id);
      
      if (isNaN(expenseId)) {
        return res.status(400).json({ message: "Invalid expense ID" });
      }

      const success = await storage.deleteExpense(expenseId, userId);
      
      if (success) {
        res.json({ message: "Expense deleted successfully" });
      } else {
        res.status(404).json({ message: "Expense not found" });
      }
    } catch (error) {
      console.error("Error deleting expense:", error);
      res.status(500).json({ message: "Failed to delete expense" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
