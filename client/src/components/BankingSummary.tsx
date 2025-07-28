import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import AddBankAccountModal from "./AddBankAccountModal";
import BankAccountDetailsModal from "./BankAccountDetailsModal";
import type { BankAccount, BankTransaction } from "@shared/schema";

const accountTypeIcons: Record<string, string> = {
  savings: "🏦",
  checking: "💳",
  credit_card: "💳",
  loan: "🏠",
};

const accountTypeColors: Record<string, { bg: string; text: string; border: string }> = {
  savings: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
  checking: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  credit_card: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  loan: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
};

interface BankingSummaryProps {
  userId: string;
}

export default function BankingSummary({ userId }: BankingSummaryProps) {
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);
  const [showAccountDetails, setShowAccountDetails] = useState(false);

  // Get mobile auth info for API endpoints
  const mobileUser = localStorage.getItem("mobileAuthUser");
  const isMobileAuth = !!mobileUser;
  const mobileAuthData = mobileUser ? JSON.parse(mobileUser) : null;

  const { data: bankAccounts = [], refetch: refetchBankAccounts, isLoading: isLoadingAccounts } = useQuery<BankAccount[]>({
    queryKey: isMobileAuth ? [`/api/mobile/bank-accounts/${mobileAuthData?.id}`] : ["/api/bank-accounts"],
    enabled: !!userId,
  });

  const { data: bankTransactions = [], isLoading: isLoadingTransactions } = useQuery<BankTransaction[]>({
    queryKey: isMobileAuth ? [`/api/mobile/bank-transactions/${mobileAuthData?.id}`] : ["/api/bank-transactions"],
    enabled: !!userId,
  });

  // Calculate summary statistics
  const totalBalance = bankAccounts.reduce((sum, account) => {
    const balance = parseFloat(account.currentBalance);
    if (account.accountType === 'credit_card' || account.accountType === 'loan') {
      return sum - balance; // Subtract debt from total
    }
    return sum + balance;
  }, 0);

  const savingsAccounts = bankAccounts.filter(acc => acc.accountType === 'savings');
  const checkingAccounts = bankAccounts.filter(acc => acc.accountType === 'checking');
  const creditCards = bankAccounts.filter(acc => acc.accountType === 'credit_card');
  const loans = bankAccounts.filter(acc => acc.accountType === 'loan');

  const totalSavings = savingsAccounts.reduce((sum, acc) => sum + parseFloat(acc.currentBalance), 0);
  const totalChecking = checkingAccounts.reduce((sum, acc) => sum + parseFloat(acc.currentBalance), 0);
  const totalCreditDebt = creditCards.reduce((sum, acc) => sum + parseFloat(acc.currentBalance), 0);
  const totalLoanDebt = loans.reduce((sum, acc) => sum + parseFloat(acc.currentBalance), 0);
  const totalDebt = totalCreditDebt + totalLoanDebt;

  const totalCreditLimit = creditCards.reduce((sum, acc) => sum + parseFloat(acc.creditLimit || "0"), 0);
  const creditUtilization = totalCreditLimit > 0 ? (totalCreditDebt / totalCreditLimit) * 100 : 0;

  const handleAccountClick = (account: BankAccount) => {
    setSelectedAccount(account);
    setShowAccountDetails(true);
  };

  const handleRefreshBalances = async () => {
    // Trigger refetch of all bank account data
    await refetchBankAccounts();
  };

  if (isLoadingAccounts) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading banking information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-text-primary">Banking Summary</h2>
          <p className="text-text-secondary">Manage your bank accounts and view balances</p>
        </div>
        <div className="flex space-x-3">
          <Button 
            variant="outline" 
            onClick={handleRefreshBalances}
            className="flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd"/>
            </svg>
            Refresh Balances
          </Button>
          <Button onClick={() => setShowAddAccountModal(true)}>
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/>
            </svg>
            Add Account
          </Button>
        </div>
      </div>

      {/* Overall Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600 mb-1">Net Worth</p>
                <p className="text-2xl font-bold text-text-primary">₹{totalBalance.toLocaleString()}</p>
                <p className="text-xs text-text-secondary mt-1">Assets - Liabilities</p>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 7a3 3 0 013-3h6a3 3 0 013 3v6a3 3 0 01-3 3H7a3 3 0 01-3-3V7zM7 6a1 1 0 000 2h6a1 1 0 100-2H7zm0 4a1 1 0 100 2h6a1 1 0 100-2H7z"/>
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 mb-1">Total Assets</p>
                <p className="text-2xl font-bold text-text-primary">₹{(totalSavings + totalChecking).toLocaleString()}</p>
                <p className="text-xs text-text-secondary mt-1">Savings + Checking</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd"/>
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600 mb-1">Total Debt</p>
                <p className="text-2xl font-bold text-text-primary">₹{totalDebt.toLocaleString()}</p>
                <p className="text-xs text-text-secondary mt-1">Credit Cards + Loans</p>
              </div>
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600 mb-1">Credit Utilization</p>
                <p className="text-2xl font-bold text-text-primary">{creditUtilization.toFixed(1)}%</p>
                <p className="text-xs text-text-secondary mt-1">
                  ₹{totalCreditDebt.toLocaleString()} / ₹{totalCreditLimit.toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z"/>
                  <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z"/>
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">Account Overview</TabsTrigger>
          <TabsTrigger value="details">Detailed Balances</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Account Type Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Savings Accounts */}
            <Card className={`${accountTypeColors.savings.bg} ${accountTypeColors.savings.border} border`}>
              <CardHeader className="pb-3">
                <CardTitle className={`text-lg ${accountTypeColors.savings.text} flex items-center`}>
                  <span className="mr-2 text-xl">{accountTypeIcons.savings}</span>
                  Savings Accounts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-text-primary mb-2">₹{totalSavings.toLocaleString()}</p>
                <p className="text-sm text-text-secondary">{savingsAccounts.length} accounts</p>
              </CardContent>
            </Card>

            {/* Checking Accounts */}
            <Card className={`${accountTypeColors.checking.bg} ${accountTypeColors.checking.border} border`}>
              <CardHeader className="pb-3">
                <CardTitle className={`text-lg ${accountTypeColors.checking.text} flex items-center`}>
                  <span className="mr-2 text-xl">{accountTypeIcons.checking}</span>
                  Checking Accounts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-text-primary mb-2">₹{totalChecking.toLocaleString()}</p>
                <p className="text-sm text-text-secondary">{checkingAccounts.length} accounts</p>
              </CardContent>
            </Card>

            {/* Credit Cards */}
            <Card className={`${accountTypeColors.credit_card.bg} ${accountTypeColors.credit_card.border} border`}>
              <CardHeader className="pb-3">
                <CardTitle className={`text-lg ${accountTypeColors.credit_card.text} flex items-center`}>
                  <span className="mr-2 text-xl">{accountTypeIcons.credit_card}</span>
                  Credit Cards
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-text-primary mb-2">₹{totalCreditDebt.toLocaleString()}</p>
                <p className="text-sm text-text-secondary">{creditCards.length} cards</p>
              </CardContent>
            </Card>

            {/* Loans */}
            <Card className={`${accountTypeColors.loan.bg} ${accountTypeColors.loan.border} border`}>
              <CardHeader className="pb-3">
                <CardTitle className={`text-lg ${accountTypeColors.loan.text} flex items-center`}>
                  <span className="mr-2 text-xl">{accountTypeIcons.loan}</span>
                  Loans
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-text-primary mb-2">₹{totalLoanDebt.toLocaleString()}</p>
                <p className="text-sm text-text-secondary">{loans.length} loans</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Accounts */}
          {bankAccounts.length === 0 ? (
            <Card>
              <CardContent className="p-12">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM8 13a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"/>
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-text-primary mb-2">No Bank Accounts</h3>
                  <p className="text-text-secondary mb-6">Connect your bank accounts to start tracking your financial data</p>
                  <Button onClick={() => setShowAddAccountModal(true)}>
                    Add Your First Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Your Accounts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {bankAccounts.map((account) => {
                    const colors = accountTypeColors[account.accountType] || accountTypeColors.checking;
                    const isDebt = account.accountType === 'credit_card' || account.accountType === 'loan';
                    return (
                      <div 
                        key={account.id} 
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleAccountClick(account)}
                      >
                        <div className="flex items-center space-x-4">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colors.bg}`}>
                            <span className="text-xl">{accountTypeIcons[account.accountType]}</span>
                          </div>
                          <div>
                            <p className="font-medium text-text-primary">{account.bankName}</p>
                            <p className="text-sm text-text-secondary">
                              {account.accountHolderName} • ****{account.accountNumber.slice(-4)}
                            </p>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant="secondary" className={`${colors.text} text-xs`}>
                                {account.accountType.replace('_', ' ').toUpperCase()}
                              </Badge>
                              {account.lastSyncedAt && (
                                <span className="text-xs text-text-secondary">
                                  Updated {new Date(account.lastSyncedAt).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-lg font-bold ${isDebt ? 'text-red-600' : 'text-green-600'}`}>
                            {isDebt ? '-' : ''}₹{parseFloat(account.currentBalance).toLocaleString()}
                          </p>
                          {account.accountType === 'credit_card' && account.creditLimit && (
                            <p className="text-sm text-text-secondary">
                              Limit: ₹{parseFloat(account.creditLimit).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="details" className="space-y-6">
          {/* Detailed Account Breakdown by Type */}
          {bankAccounts.length > 0 ? (
            <div className="space-y-6">
              {Object.entries({
                'Savings Accounts': savingsAccounts,
                'Checking Accounts': checkingAccounts,
                'Credit Cards': creditCards,
                'Loans': loans
              }).map(([title, accounts]) => (
                accounts.length > 0 && (
                  <Card key={title}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        {title}
                        <Badge variant="outline">{accounts.length} accounts</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {accounts.map((account) => {
                          const isDebt = account.accountType === 'credit_card' || account.accountType === 'loan';
                          return (
                            <div 
                              key={account.id}
                              className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                              onClick={() => handleAccountClick(account)}
                            >
                              <div className="flex items-center space-x-3">
                                <div className="text-lg">{accountTypeIcons[account.accountType]}</div>
                                <div>
                                  <p className="font-medium text-text-primary">{account.bankName}</p>
                                  <p className="text-sm text-text-secondary">****{account.accountNumber.slice(-4)}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className={`font-bold ${isDebt ? 'text-red-600' : 'text-green-600'}`}>
                                  {isDebt ? '-' : ''}₹{parseFloat(account.currentBalance).toLocaleString()}
                                </p>
                                {account.interestRate && (
                                  <p className="text-xs text-text-secondary">
                                    {parseFloat(account.interestRate).toFixed(2)}% APR
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-text-primary mb-2">No Detailed Data Available</h3>
                  <p className="text-text-secondary">Add bank accounts to view detailed balance information</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <AddBankAccountModal 
        isOpen={showAddAccountModal}
        onClose={() => setShowAddAccountModal(false)}
        onSuccess={() => {
          refetchBankAccounts();
          setShowAddAccountModal(false);
        }}
      />
      
      {selectedAccount && (
        <BankAccountDetailsModal
          isOpen={showAccountDetails}
          onClose={() => setShowAccountDetails(false)}
          account={selectedAccount}
        />
      )}
    </div>
  );
}