// Bank API Integration Service
import { allFinancialInstitutions, apiProviders, accountAggregators, type BankProvider } from './bankProviders';

export interface BankConnection {
  provider: string;
  institutionId: string;
  userId: string;
  accessToken?: string;
  refreshToken?: string;
  consentId?: string;
  status: 'pending' | 'connected' | 'expired' | 'error';
  lastSyncedAt?: Date;
  expiresAt?: Date;
}

export interface ConsentRequest {
  userId: string;
  institutionId: string;
  consentTypes: string[];
  consentDuration: number; // days
  dataLifetime: number; // days
}

export interface BankAccountData {
  accountId: string;
  institutionId: string;
  accountType: string;
  accountNumber: string;
  accountHolderName: string;
  currentBalance: number;
  availableBalance?: number;
  currency: string;
  lastUpdated: Date;
}

export interface TransactionData {
  transactionId: string;
  accountId: string;
  amount: number;
  transactionType: 'credit' | 'debit';
  description: string;
  category?: string;
  date: Date;
  balance?: number;
  merchantName?: string;
}

// Account Aggregator Service Implementation
export class AccountAggregatorService {
  private baseUrl: string;
  private apiKey: string;
  private clientId: string;
  private clientSecret: string;

  constructor(provider: 'setu' | 'yodlee' | 'anumati' = 'setu') {
    // Configuration based on provider
    switch (provider) {
      case 'setu':
        this.baseUrl = process.env.NODE_ENV === 'production' 
          ? apiProviders.setu.baseUrl 
          : apiProviders.setu.sandboxUrl;
        break;
      case 'yodlee':
        this.baseUrl = process.env.NODE_ENV === 'production'
          ? apiProviders.yodlee.baseUrl
          : apiProviders.yodlee.sandboxUrl;
        break;
      default:
        this.baseUrl = apiProviders.setu.sandboxUrl;
    }
    
    this.apiKey = process.env.BANK_API_KEY || '';
    this.clientId = process.env.BANK_CLIENT_ID || '';
    this.clientSecret = process.env.BANK_CLIENT_SECRET || '';
  }

  // Step 1: Create consent request
  async createConsentRequest(request: ConsentRequest): Promise<{ consentId: string; redirectUrl: string }> {
    try {
      const consentData = {
        consentStart: new Date().toISOString(),
        consentExpiry: new Date(Date.now() + request.consentDuration * 24 * 60 * 60 * 1000).toISOString(),
        consentMode: "STORE",
        fetchType: "PERIODIC",
        consentTypes: request.consentTypes,
        fiTypes: ["DEPOSIT", "TERM_DEPOSIT", "CREDIT_CARD", "RECURRING_DEPOSIT"],
        DataConsumer: {
          id: this.clientId,
          type: "FIU"
        },
        Customer: {
          id: request.userId
        },
        Purpose: {
          code: "101",
          refUri: "https://api.rebit.org.in/aa/purpose/101.xml",
          text: "Personal finance management and expense tracking",
          Category: {
            type: "string"
          }
        },
        FIDataRange: {
          from: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
          to: new Date().toISOString()
        },
        DataLife: {
          unit: "DAY",
          value: request.dataLifetime
        },
        Frequency: {
          unit: "HOUR",
          value: 24
        }
      };

      const response = await fetch(`${this.baseUrl}/consents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'client_api_key': this.apiKey,
        },
        body: JSON.stringify(consentData)
      });

      if (!response.ok) {
        throw new Error(`Consent creation failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      return {
        consentId: result.consentHandle || result.ConsentId,
        redirectUrl: result.redirectUrl || `${this.baseUrl}/consent/${result.consentHandle}`
      };
    } catch (error) {
      console.error('Error creating consent request:', error);
      throw new Error('Failed to create consent request');
    }
  }

  // Step 2: Check consent status
  async getConsentStatus(consentId: string): Promise<{ status: string; accounts?: BankAccountData[] }> {
    try {
      const response = await fetch(`${this.baseUrl}/consents/${consentId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'client_api_key': this.apiKey,
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get consent status: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.ConsentStatus === 'ACTIVE' && result.accounts) {
        const accounts = result.accounts.map((acc: any) => ({
          accountId: acc.accRefNumber,
          institutionId: acc.FIType,
          accountType: this.mapAccountType(acc.accType),
          accountNumber: acc.maskedAccNumber,
          accountHolderName: acc.accHolderName || 'Account Holder',
          currentBalance: parseFloat(acc.currentBalance || '0'),
          availableBalance: parseFloat(acc.availableBalance || '0'),
          currency: acc.currency || 'INR',
          lastUpdated: new Date()
        }));

        return { status: result.ConsentStatus, accounts };
      }

      return { status: result.ConsentStatus || 'PENDING' };
    } catch (error) {
      console.error('Error checking consent status:', error);
      throw new Error('Failed to check consent status');
    }
  }

  // Step 3: Fetch account data
  async fetchAccountData(consentId: string, accountId: string): Promise<{
    account: BankAccountData;
    transactions: TransactionData[];
  }> {
    try {
      const sessionResponse = await fetch(`${this.baseUrl}/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'client_api_key': this.apiKey,
        },
        body: JSON.stringify({
          consentId,
          DataRange: {
            from: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
            to: new Date().toISOString()
          }
        })
      });

      if (!sessionResponse.ok) {
        throw new Error(`Session creation failed: ${sessionResponse.statusText}`);
      }

      const session = await sessionResponse.json();
      const sessionId = session.sessionId || session.id;

      // Fetch account data
      const dataResponse = await fetch(`${this.baseUrl}/sessions/${sessionId}/data`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'client_api_key': this.apiKey,
        }
      });

      if (!dataResponse.ok) {
        throw new Error(`Data fetch failed: ${dataResponse.statusText}`);
      }

      const data = await dataResponse.json();
      
      // Parse account and transaction data
      const account: BankAccountData = {
        accountId: data.Account?.accRefNumber || accountId,
        institutionId: data.Account?.FIType || 'unknown',
        accountType: this.mapAccountType(data.Account?.accType),
        accountNumber: data.Account?.maskedAccNumber || '',
        accountHolderName: data.Account?.accHolderName || 'Account Holder',
        currentBalance: parseFloat(data.Account?.currentBalance || '0'),
        availableBalance: parseFloat(data.Account?.availableBalance || '0'),
        currency: data.Account?.currency || 'INR',
        lastUpdated: new Date()
      };

      const transactions: TransactionData[] = (data.Transactions || []).map((txn: any) => ({
        transactionId: txn.txnId || `${Date.now()}-${Math.random()}`,
        accountId: accountId,
        amount: Math.abs(parseFloat(txn.amount || '0')),
        transactionType: parseFloat(txn.amount || '0') >= 0 ? 'credit' : 'debit',
        description: txn.narration || txn.description || 'Bank Transaction',
        category: this.categorizeTransaction(txn.narration || txn.description || ''),
        date: new Date(txn.valueDate || txn.transactionTimestamp),
        balance: parseFloat(txn.balance || '0'),
        merchantName: txn.merchantName
      }));

      return { account, transactions };
    } catch (error) {
      console.error('Error fetching account data:', error);
      throw new Error('Failed to fetch account data');
    }
  }

  // Utility: Map API account types to our schema
  private mapAccountType(apiType: string): string {
    const typeMap: Record<string, string> = {
      'SAVINGS': 'savings',
      'CURRENT': 'checking',
      'CREDIT_CARD': 'credit_card',
      'TERM_DEPOSIT': 'savings',
      'RECURRING_DEPOSIT': 'savings',
      'LOAN': 'loan',
      'PPF': 'investment',
      'EPF': 'investment',
      'NPS': 'investment'
    };
    return typeMap[apiType?.toUpperCase()] || 'savings';
  }

  // Utility: Categorize transactions
  private categorizeTransaction(description: string): string {
    const desc = description.toLowerCase();
    
    if (desc.includes('grocery') || desc.includes('food') || desc.includes('restaurant')) {
      return 'Food & Dining';
    }
    if (desc.includes('fuel') || desc.includes('petrol') || desc.includes('gas')) {
      return 'Transportation';
    }
    if (desc.includes('medical') || desc.includes('pharmacy') || desc.includes('hospital')) {
      return 'Healthcare';
    }
    if (desc.includes('salary') || desc.includes('pay')) {
      return 'Income';
    }
    if (desc.includes('rent') || desc.includes('emi') || desc.includes('loan')) {
      return 'Bills & Utilities';
    }
    if (desc.includes('shopping') || desc.includes('amazon') || desc.includes('flipkart')) {
      return 'Shopping';
    }
    if (desc.includes('entertainment') || desc.includes('movie') || desc.includes('netflix')) {
      return 'Entertainment';
    }
    
    return 'Others';
  }
}

// Bank API Service Factory
export class BankApiService {
  private aaService: AccountAggregatorService;
  
  constructor(provider: 'setu' | 'yodlee' | 'anumati' = 'setu') {
    this.aaService = new AccountAggregatorService(provider);
  }

  // Get list of supported institutions
  async getSupportedInstitutions(country: string = 'IN'): Promise<BankProvider[]> {
    // Return our comprehensive list of supported banks
    return allFinancialInstitutions.filter(bank => bank.country === country && bank.isActive);
  }

  // Search institutions
  async searchInstitutions(query: string, country: string = 'IN'): Promise<BankProvider[]> {
    const institutions = await this.getSupportedInstitutions(country);
    const searchTerm = query.toLowerCase();
    
    return institutions.filter(inst => 
      inst.name.toLowerCase().includes(searchTerm) ||
      inst.id.toLowerCase().includes(searchTerm)
    );
  }

  // Initiate bank connection
  async connectBank(userId: string, institutionId: string): Promise<{ consentId: string; redirectUrl: string }> {
    const consentRequest: ConsentRequest = {
      userId,
      institutionId,
      consentTypes: ['PROFILE', 'SUMMARY', 'TRANSACTIONS'],
      consentDuration: 365, // 1 year
      dataLifetime: 365 // 1 year
    };

    return await this.aaService.createConsentRequest(consentRequest);
  }

  // Check connection status
  async getConnectionStatus(consentId: string): Promise<{ status: string; accounts?: BankAccountData[] }> {
    return await this.aaService.getConsentStatus(consentId);
  }

  // Fetch account data
  async getAccountData(consentId: string, accountId: string): Promise<{
    account: BankAccountData;
    transactions: TransactionData[];
  }> {
    return await this.aaService.fetchAccountData(consentId, accountId);
  }
}

// Export singleton instance
export const bankApiService = new BankApiService();