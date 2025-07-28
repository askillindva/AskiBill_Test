import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { BankAccount, BankTransaction } from "@shared/schema";

interface BankAccountDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: BankAccount;
}

const transactionTypeColors = {
  credit: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
  debit: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
};

export default function BankAccountDetailsModal({ isOpen, onClose, account }: BankAccountDetailsModalProps) {
  const [refreshing, setRefreshing] = useState(false);

  // Get mobile auth info for API endpoints
  const mobileUser = localStorage.getItem("mobileAuthUser");
  const isMobileAuth = !!mobileUser;
  const mobileAuthData = mobileUser ? JSON.parse(mobileUser) : null;

  const { data: transactions = [], refetch: refetchTransactions } = useQuery<BankTransaction[]>({
    queryKey: isMobileAuth 
      ? [`/api/mobile/bank-transactions/${mobileAuthData?.id}/${account.id}`]
      : [`/api/bank-transactions/${account.id}`],
    enabled: isOpen && !!account.id,
  });

  const handleRefreshAccount = async () => {
    setRefreshing(true);
    
    // Simulate account refresh
    setTimeout(async () => {
      await refetchTransactions();
      setRefreshing(false);
    }, 1500);
  };

  const isDebtAccount = account.accountType === 'credit_card' || account.accountType === 'loan';
  const accountTypeDisplay = account.accountType.replace('_', ' ').toUpperCase();

  const recentTransactions = transactions
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  const totalCredits = transactions
    .filter(t => t.transactionType === 'credit')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const totalDebits = transactions
    .filter(t => t.transactionType === 'debit')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl">{account.bankName}</DialogTitle>
              <p className="text-sm text-text-secondary mt-1">
                {account.accountHolderName} • ****{account.accountNumber.slice(-4)}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary">{accountTypeDisplay}</Badge>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleRefreshAccount}
                disabled={refreshing}
              >
                {refreshing ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
                ) : (
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd"/>
                  </svg>
                )}
                Refresh
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Account Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Current Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-2xl font-bold ${isDebtAccount ? 'text-red-600' : 'text-green-600'}`}>
                  {isDebtAccount ? '-' : ''}₹{parseFloat(account.currentBalance).toLocaleString()}
                </p>
                {account.lastSyncedAt && (
                  <p className="text-xs text-text-secondary mt-1">
                    Last updated: {new Date(account.lastSyncedAt).toLocaleString()}
                  </p>
                )}
              </CardContent>
            </Card>

            {account.accountType === 'credit_card' && account.creditLimit && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Credit Limit</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-text-primary">
                    ₹{parseFloat(account.creditLimit).toLocaleString()}
                  </p>
                  <p className="text-xs text-text-secondary mt-1">
                    Available: ₹{(parseFloat(account.creditLimit) - parseFloat(account.currentBalance)).toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            )}

            {account.interestRate && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Interest Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-text-primary">
                    {parseFloat(account.interestRate).toFixed(2)}%
                  </p>
                  <p className="text-xs text-text-secondary mt-1">
                    {account.accountType === 'loan' ? 'APR' : 'Annual Rate'}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Transaction Overview */}
          {transactions.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-green-600">Total Credits</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xl font-bold text-green-600">₹{totalCredits.toLocaleString()}</p>
                  <p className="text-xs text-text-secondary mt-1">
                    {transactions.filter(t => t.transactionType === 'credit').length} transactions
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-red-600">Total Debits</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xl font-bold text-red-600">₹{totalDebits.toLocaleString()}</p>
                  <p className="text-xs text-text-secondary mt-1">
                    {transactions.filter(t => t.transactionType === 'debit').length} transactions
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Transactions */}
          <Tabs defaultValue="recent" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="recent">Recent Transactions</TabsTrigger>
              <TabsTrigger value="all">All Transactions</TabsTrigger>
            </TabsList>

            <TabsContent value="recent" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                  {recentTransactions.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-text-primary mb-2">No Transactions</h3>
                      <p className="text-text-secondary">No transaction history available for this account</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recentTransactions.map((transaction) => {
                        const colors = transactionTypeColors[transaction.transactionType as keyof typeof transactionTypeColors];
                        return (
                          <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors.bg} ${colors.border} border`}>
                                {transaction.transactionType === 'credit' ? (
                                  <svg className={`w-5 h-5 ${colors.text}`} fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd"/>
                                  </svg>
                                ) : (
                                  <svg className={`w-5 h-5 ${colors.text}`} fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                                  </svg>
                                )}
                              </div>
                              <div>
                                <p className="font-medium text-text-primary">
                                  {transaction.description || 'Transaction'}
                                </p>
                                <p className="text-sm text-text-secondary">
                                  {new Date(transaction.date).toLocaleDateString()}
                                  {transaction.category && ` • ${transaction.category}`}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={`font-bold ${transaction.transactionType === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                                {transaction.transactionType === 'credit' ? '+' : '-'}₹{parseFloat(transaction.amount).toLocaleString()}
                              </p>
                              {transaction.balance && (
                                <p className="text-xs text-text-secondary">
                                  Balance: ₹{parseFloat(transaction.balance).toLocaleString()}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="all" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>All Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                  {transactions.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-text-secondary">No transactions available</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {transactions
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map((transaction) => {
                          const colors = transactionTypeColors[transaction.transactionType as keyof typeof transactionTypeColors];
                          return (
                            <div key={transaction.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                              <div className="flex items-center space-x-2">
                                <div className={`w-6 h-6 rounded flex items-center justify-center ${colors.bg}`}>
                                  <span className={`text-xs ${colors.text}`}>
                                    {transaction.transactionType === 'credit' ? '+' : '-'}
                                  </span>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-text-primary">
                                    {transaction.description || 'Transaction'}
                                  </p>
                                  <p className="text-xs text-text-secondary">
                                    {new Date(transaction.date).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <p className={`text-sm font-bold ${transaction.transactionType === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                                {transaction.transactionType === 'credit' ? '+' : '-'}₹{parseFloat(transaction.amount).toLocaleString()}
                              </p>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Account Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Account Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-3">
                <Button variant="outline" size="sm">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z"/>
                    <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd"/>
                  </svg>
                  Edit Account
                </Button>
                <Button variant="outline" size="sm">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"/>
                  </svg>
                  Export Data
                </Button>
                <Button variant="destructive" size="sm">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"/>
                  </svg>
                  Remove Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}