// Bank API providers and financial institutions configuration
export interface BankProvider {
  id: string;
  name: string;
  type: 'bank' | 'credit_union' | 'investment' | 'insurance';
  country: string;
  logo?: string;
  primaryColor: string;
  supportedAccounts: string[];
  apiProvider?: 'setu' | 'yodlee' | 'plaid' | 'finicity' | 'direct';
  isActive: boolean;
  requiresOAuth: boolean;
  sandboxAvailable: boolean;
}

// Major Indian Banks with API Support
export const indianBanks: BankProvider[] = [
  {
    id: 'sbi',
    name: 'State Bank of India',
    type: 'bank',
    country: 'IN',
    primaryColor: '#1f4788',
    supportedAccounts: ['savings', 'checking', 'credit_card', 'loan'],
    apiProvider: 'setu',
    isActive: true,
    requiresOAuth: true,
    sandboxAvailable: true,
  },
  {
    id: 'hdfc',
    name: 'HDFC Bank',
    type: 'bank',
    country: 'IN',
    primaryColor: '#004c8f',
    supportedAccounts: ['savings', 'checking', 'credit_card', 'loan'],
    apiProvider: 'setu',
    isActive: true,
    requiresOAuth: true,
    sandboxAvailable: true,
  },
  {
    id: 'icici',
    name: 'ICICI Bank',
    type: 'bank',
    country: 'IN',
    primaryColor: '#b02a37',
    supportedAccounts: ['savings', 'checking', 'credit_card', 'loan'],
    apiProvider: 'setu',
    isActive: true,
    requiresOAuth: true,
    sandboxAvailable: true,
  },
  {
    id: 'axis',
    name: 'Axis Bank',
    type: 'bank',
    country: 'IN',
    primaryColor: '#97144d',
    supportedAccounts: ['savings', 'checking', 'credit_card', 'loan'],
    apiProvider: 'setu',
    isActive: true,
    requiresOAuth: true,
    sandboxAvailable: true,
  },
  {
    id: 'kotak',
    name: 'Kotak Mahindra Bank',
    type: 'bank',
    country: 'IN',
    primaryColor: '#ed1c24',
    supportedAccounts: ['savings', 'checking', 'credit_card', 'loan'],
    apiProvider: 'direct',
    isActive: true,
    requiresOAuth: true,
    sandboxAvailable: true,
  },
  {
    id: 'yes',
    name: 'YES Bank',
    type: 'bank',
    country: 'IN',
    primaryColor: '#0033a0',
    supportedAccounts: ['savings', 'checking', 'credit_card', 'loan'],
    apiProvider: 'direct',
    isActive: true,
    requiresOAuth: true,
    sandboxAvailable: true,
  },
  {
    id: 'pnb',
    name: 'Punjab National Bank',
    type: 'bank',
    country: 'IN',
    primaryColor: '#c41e3a',
    supportedAccounts: ['savings', 'checking', 'credit_card', 'loan'],
    apiProvider: 'setu',
    isActive: true,
    requiresOAuth: true,
    sandboxAvailable: true,
  },
  {
    id: 'bob',
    name: 'Bank of Baroda',
    type: 'bank',
    country: 'IN',
    primaryColor: '#ff6600',
    supportedAccounts: ['savings', 'checking', 'credit_card', 'loan'],
    apiProvider: 'setu',
    isActive: true,
    requiresOAuth: true,
    sandboxAvailable: true,
  },
  {
    id: 'canara',
    name: 'Canara Bank',
    type: 'bank',
    country: 'IN',
    primaryColor: '#ff6600',
    supportedAccounts: ['savings', 'checking', 'credit_card', 'loan'],
    apiProvider: 'setu',
    isActive: true,
    requiresOAuth: true,
    sandboxAvailable: true,
  },
  {
    id: 'union',
    name: 'Union Bank of India',
    type: 'bank',
    country: 'IN',
    primaryColor: '#0066cc',
    supportedAccounts: ['savings', 'checking', 'credit_card', 'loan'],
    apiProvider: 'setu',
    isActive: true,
    requiresOAuth: true,
    sandboxAvailable: true,
  },
  {
    id: 'idfc',
    name: 'IDFC First Bank',
    type: 'bank',
    country: 'IN',
    primaryColor: '#ff6600',
    supportedAccounts: ['savings', 'checking', 'credit_card', 'loan'],
    apiProvider: 'setu',
    isActive: true,
    requiresOAuth: true,
    sandboxAvailable: true,
  },
  {
    id: 'indusind',
    name: 'IndusInd Bank',
    type: 'bank',
    country: 'IN',
    primaryColor: '#ff6600',
    supportedAccounts: ['savings', 'checking', 'credit_card', 'loan'],
    apiProvider: 'setu',
    isActive: true,
    requiresOAuth: true,
    sandboxAvailable: true,
  },
  {
    id: 'federal',
    name: 'Federal Bank',
    type: 'bank',
    country: 'IN',
    primaryColor: '#ffd700',
    supportedAccounts: ['savings', 'checking', 'credit_card', 'loan'],
    apiProvider: 'setu',
    isActive: true,
    requiresOAuth: true,
    sandboxAvailable: true,
  },
  {
    id: 'rbl',
    name: 'RBL Bank',
    type: 'bank',
    country: 'IN',
    primaryColor: '#0066cc',
    supportedAccounts: ['savings', 'checking', 'credit_card', 'loan'],
    apiProvider: 'direct',
    isActive: true,
    requiresOAuth: true,
    sandboxAvailable: true,
  },
  {
    id: 'dcb',
    name: 'DCB Bank',
    type: 'bank',
    country: 'IN',
    primaryColor: '#ff6600',
    supportedAccounts: ['savings', 'checking', 'credit_card', 'loan'],
    apiProvider: 'direct',
    isActive: true,
    requiresOAuth: true,
    sandboxAvailable: true,
  },
];

// Credit Card Providers
export const creditCardProviders: BankProvider[] = [
  {
    id: 'amex',
    name: 'American Express',
    type: 'bank',
    country: 'IN',
    primaryColor: '#006fcf',
    supportedAccounts: ['credit_card'],
    apiProvider: 'yodlee',
    isActive: true,
    requiresOAuth: true,
    sandboxAvailable: true,
  },
  {
    id: 'citi',
    name: 'Citibank',
    type: 'bank',
    country: 'IN',
    primaryColor: '#1976d2',
    supportedAccounts: ['savings', 'checking', 'credit_card'],
    apiProvider: 'yodlee',
    isActive: true,
    requiresOAuth: true,
    sandboxAvailable: true,
  },
  {
    id: 'hsbc',
    name: 'HSBC',
    type: 'bank',
    country: 'IN',
    primaryColor: '#db0011',
    supportedAccounts: ['savings', 'checking', 'credit_card'],
    apiProvider: 'yodlee',
    isActive: true,
    requiresOAuth: true,
    sandboxAvailable: true,
  },
  {
    id: 'sc',
    name: 'Standard Chartered',
    type: 'bank',
    country: 'IN',
    primaryColor: '#005eb8',
    supportedAccounts: ['savings', 'checking', 'credit_card'],
    apiProvider: 'yodlee',
    isActive: true,
    requiresOAuth: true,
    sandboxAvailable: true,
  },
];

// Account Aggregator Providers (RBI Licensed)
export const accountAggregators = [
  {
    id: 'anumati',
    name: 'Anumati (by Perfios)',
    license: 'N-02.00341',
    apiEndpoint: 'https://api.anumati.co.in',
    isActive: true,
    description: 'RBI licensed Account Aggregator',
  },
  {
    id: 'cams',
    name: 'CAMS Account Aggregation Services',
    license: 'NBFC-AA',
    apiEndpoint: 'https://api.camsaa.com',
    isActive: true,
    description: 'CAMS Group Account Aggregator',
  },
  {
    id: 'finbit',
    name: 'Finbit',
    license: 'NBFC-AA',
    apiEndpoint: 'https://api.finbit.in',
    isActive: true,
    description: 'Digital lending focused AA',
  },
  {
    id: 'yodlee_aa',
    name: 'Yodlee Finsoft',
    license: 'NBFC-AA',
    apiEndpoint: 'https://india.yodlee.com/aa',
    isActive: true,
    description: 'Envestnet Yodlee Account Aggregator',
  },
];

// API Integration Services
export const apiProviders = {
  setu: {
    name: 'Setu',
    baseUrl: 'https://prod.setu.co',
    sandboxUrl: 'https://sandbox.setu.co',
    documentation: 'https://docs.setu.co/data/account-aggregator/api-integration',
    features: ['Account Aggregator', 'Direct Bank APIs', 'UPI', 'BBPS'],
    pricingModel: 'per_request',
    supportedCountries: ['IN'],
  },
  yodlee: {
    name: 'Envestnet Yodlee',
    baseUrl: 'https://production.api.yodlee.com',
    sandboxUrl: 'https://sandbox.api.yodlee.com',
    documentation: 'https://developer.yodlee.com/apidocs/index.php',
    features: ['Global Bank APIs', 'Data Analytics', 'Account Aggregation'],
    pricingModel: 'subscription',
    supportedCountries: ['US', 'CA', 'UK', 'IN', 'AU'],
  },
  plaid: {
    name: 'Plaid',
    baseUrl: 'https://production.plaid.com',
    sandboxUrl: 'https://sandbox.plaid.com',
    documentation: 'https://plaid.com/docs/',
    features: ['Account Access', 'Transactions', 'Identity', 'Auth'],
    pricingModel: 'per_request',
    supportedCountries: ['US', 'CA', 'UK', 'EU'],
  },
  finicity: {
    name: 'Finicity (Mastercard)',
    baseUrl: 'https://api.finicity.com',
    sandboxUrl: 'https://api.finicity.com',
    documentation: 'https://developer.finicity.com/',
    features: ['Open Banking', 'Credit Decisioning', 'Income Verification'],
    pricingModel: 'subscription',
    supportedCountries: ['US', 'CA'],
  },
};

// All supported financial institutions
export const allFinancialInstitutions = [
  ...indianBanks,
  ...creditCardProviders,
];

// Get institutions by country
export function getInstitutionsByCountry(country: string): BankProvider[] {
  return allFinancialInstitutions.filter(inst => inst.country === country);
}

// Get institutions by account type
export function getInstitutionsByAccountType(accountType: string): BankProvider[] {
  return allFinancialInstitutions.filter(inst => 
    inst.supportedAccounts.includes(accountType)
  );
}

// Get institutions by API provider
export function getInstitutionsByProvider(provider: string): BankProvider[] {
  return allFinancialInstitutions.filter(inst => inst.apiProvider === provider);
}

// Search institutions
export function searchInstitutions(query: string): BankProvider[] {
  const searchTerm = query.toLowerCase();
  return allFinancialInstitutions.filter(inst => 
    inst.name.toLowerCase().includes(searchTerm) ||
    inst.id.toLowerCase().includes(searchTerm)
  );
}