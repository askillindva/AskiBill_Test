import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

const bankAccountSchema = z.object({
  accountType: z.string().min(1, "Account type is required"),
  bankName: z.string().min(1, "Bank name is required"),
  accountNumber: z.string().min(1, "Account number is required"),
  accountHolderName: z.string().min(1, "Account holder name is required"),
  currentBalance: z.string().min(1, "Current balance is required"),
  creditLimit: z.string().optional(),
  interestRate: z.string().optional(),
});

type BankAccountForm = z.infer<typeof bankAccountSchema>;

interface AddBankAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const accountTypes = [
  { value: "savings", label: "Savings Account" },
  { value: "checking", label: "Checking Account" },
  { value: "credit_card", label: "Credit Card" },
  { value: "loan", label: "Loan Account" },
];

interface FinancialInstitution {
  id: string;
  name: string;
  type: string;
  primaryColor: string;
  supportedAccounts: string[];
  apiProvider?: string;
  requiresOAuth: boolean;
}

const popularBanks = [
  "State Bank of India", "HDFC Bank", "ICICI Bank", "Axis Bank", "Kotak Mahindra Bank",
  "Punjab National Bank", "Bank of Baroda", "Canara Bank", "Union Bank of India",
  "IDFC First Bank", "Yes Bank", "IndusInd Bank", "Federal Bank", "RBL Bank"
];

export default function AddBankAccountModal({ isOpen, onClose, onSuccess }: AddBankAccountModalProps) {
  const { toast } = useToast();
  const [connectToBank, setConnectToBank] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [selectedBank, setSelectedBank] = useState<FinancialInstitution | null>(null);
  const [searchBank, setSearchBank] = useState("");
  const [showBankList, setShowBankList] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<BankAccountForm>({
    resolver: zodResolver(bankAccountSchema),
  });

  const accountType = watch("accountType");
  const bankName = watch("bankName");

  // Get mobile auth info
  const mobileUser = localStorage.getItem("mobileAuthUser");
  const isMobileAuth = !!mobileUser;
  const mobileAuthData = mobileUser ? JSON.parse(mobileUser) : null;

  const bankAccountMutation = useMutation({
    mutationFn: async (data: BankAccountForm) => {
      const endpoint = isMobileAuth 
        ? `/api/mobile/bank-accounts/${mobileAuthData?.id}` 
        : "/api/bank-accounts";
      
      return apiRequest("POST", endpoint, {
        accountType: data.accountType,
        bankName: data.bankName,
        accountNumber: data.accountNumber,
        accountHolderName: data.accountHolderName,
        currentBalance: parseFloat(data.currentBalance),
        creditLimit: data.creditLimit ? parseFloat(data.creditLimit) : null,
        interestRate: data.interestRate ? parseFloat(data.interestRate) : null,
        connectToBank,
      });
    },
    onSuccess: () => {
      const cacheKey = isMobileAuth 
        ? [`/api/mobile/bank-accounts/${mobileAuthData?.id}`]
        : ["/api/bank-accounts"];
      queryClient.invalidateQueries({ queryKey: cacheKey });
      
      toast({
        title: "Bank Account Added!",
        description: connectToBank 
          ? "Your bank account has been connected successfully." 
          : "Your bank account has been added to your profile.",
      });
      
      reset();
      onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add bank account",
        variant: "destructive",
      });
    },
  });

  // Fetch financial institutions
  const { data: financialInstitutions = [], isLoading: institutionsLoading } = useQuery({
    queryKey: ['/api/financial-institutions', searchBank],
    queryFn: () => {
      const params = new URLSearchParams({ country: 'IN' });
      if (searchBank) params.append('search', searchBank);
      return fetch(`/api/financial-institutions?${params}`).then(r => r.json());
    },
    enabled: showBankList,
  });

  // Filter institutions by search and account type
  const filteredInstitutions = financialInstitutions.filter((inst: FinancialInstitution) => {
    const matchesSearch = !searchBank || inst.name.toLowerCase().includes(searchBank.toLowerCase());
    const matchesAccountType = !accountType || inst.supportedAccounts.includes(accountType);
    return matchesSearch && matchesAccountType;
  });

  // Bank connection mutation
  const bankConnectionMutation = useMutation({
    mutationFn: async (institutionId: string) => {
      return await apiRequest("POST", '/api/bank-connection/initiate', {
        institutionId,
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Bank Connection Initiated",
        description: "Opening bank authentication window...",
      });
      
      // Open bank authentication in new window
      const authWindow = window.open(data.redirectUrl, '_blank', 'width=600,height=700,scrollbars=yes,resizable=yes');
      
      // Listen for authentication completion
      const handleMessage = (event: MessageEvent) => {
        if (event.data.type === 'BANK_AUTH_SUCCESS') {
          toast({
            title: "Bank Connected Successfully!",
            description: `Your ${selectedBank?.name} account has been connected.`,
          });
          
          // Refresh bank accounts
          queryClient.invalidateQueries({ queryKey: ["/api/bank-accounts"] });
          window.removeEventListener('message', handleMessage);
          setIsConnecting(false);
          onClose();
        }
      };
      
      window.addEventListener('message', handleMessage);
      
      // Clean up if window is closed manually
      const checkClosed = setInterval(() => {
        if (authWindow?.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', handleMessage);
          setIsConnecting(false);
        }
      }, 1000);
    },
    onError: (error) => {
      toast({
        title: "Connection Failed",
        description: "Failed to connect to your bank. Please try again.",
        variant: "destructive",
      });
      setIsConnecting(false);
    },
  });

  const handleConnectToBank = async () => {
    if (!selectedBank) {
      toast({
        title: "No Bank Selected",
        description: "Please select a bank to connect to",
        variant: "destructive",
      });
      return;
    }

    setIsConnecting(true);
    await bankConnectionMutation.mutateAsync(selectedBank.id);
  };

  const handleBankSelect = (institution: FinancialInstitution) => {
    setSelectedBank(institution);
    setValue("bankName", institution.name);
    setShowBankList(false);
    setSearchBank("");
  };

  const onSubmit = (data: BankAccountForm) => {
    bankAccountMutation.mutate(data);
  };

  const handleClose = () => {
    reset();
    setConnectToBank(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Bank Account</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Account Type */}
          <div className="space-y-2">
            <Label htmlFor="accountType">Account Type</Label>
            <Select onValueChange={(value) => setValue("accountType", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select account type" />
              </SelectTrigger>
              <SelectContent>
                {accountTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.accountType && (
              <p className="text-sm text-red-600">{errors.accountType.message}</p>
            )}
          </div>

          {/* Bank Name */}
          <div className="space-y-2">
            <Label htmlFor="bankName">Bank Name</Label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Search or select your bank"
                  value={selectedBank?.name || searchBank}
                  onChange={(e) => {
                    setSearchBank(e.target.value);
                    setShowBankList(true);
                  }}
                  onFocus={() => setShowBankList(true)}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowBankList(!showBankList)}
                  className="px-3"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </Button>
              </div>
              
              {showBankList && (
                <div className="border rounded-md max-h-60 overflow-y-auto bg-background">
                  {institutionsLoading ? (
                    <div className="p-4 text-center text-muted-foreground">Loading banks...</div>
                  ) : filteredInstitutions.length > 0 ? (
                    filteredInstitutions.map((institution) => (
                      <div
                        key={institution.id}
                        className="p-3 hover:bg-accent cursor-pointer border-b last:border-b-0 flex items-center justify-between"
                        onClick={() => handleBankSelect(institution)}
                      >
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                            style={{ backgroundColor: institution.primaryColor }}
                          >
                            {institution.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium">{institution.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {institution.supportedAccounts.join(", ")}
                            </div>
                          </div>
                        </div>
                        {institution.apiProvider && (
                          <Badge variant="secondary" className="text-xs">
                            {institution.apiProvider}
                          </Badge>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-muted-foreground">
                      {searchBank ? "No banks found" : "Start typing to search banks"}
                    </div>
                  )}
                </div>
              )}
            </div>
            {errors.bankName && (
              <p className="text-sm text-red-600">{errors.bankName.message}</p>
            )}
          </div>

          {/* Custom Bank Name if Other is selected */}
          {bankName === "other" && (
            <div className="space-y-2">
              <Label htmlFor="customBankName">Custom Bank Name</Label>
              <Input
                {...register("bankName")}
                placeholder="Enter bank name"
              />
            </div>
          )}

          {/* Connect to Bank Option */}
          <div className="flex items-center space-x-2 p-4 bg-blue-50 rounded-lg">
            <Checkbox
              id="connectToBank"
              checked={connectToBank}
              onCheckedChange={(checked) => setConnectToBank(checked as boolean)}
            />
            <div className="space-y-1">
              <Label htmlFor="connectToBank" className="text-sm font-medium text-blue-700">
                Connect to Bank Directly
              </Label>
              <p className="text-xs text-blue-600">
                Automatically sync balances and transactions (Coming Soon)
              </p>
            </div>
          </div>

          {connectToBank ? (
            /* Bank Connection Section */
            <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM8 13a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"/>
                  </svg>
                </div>
                <h3 className="font-medium text-text-primary mb-2">Secure Bank Connection</h3>
                <p className="text-sm text-text-secondary mb-4">
                  We'll securely connect to your {bankName} account to automatically sync your data.
                </p>
                <Button 
                  type="button"
                  onClick={handleConnectToBank}
                  disabled={isConnecting}
                  className="w-full"
                >
                  {isConnecting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Connecting...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944zM11.207 8.5a1 1 0 00-1.414-1.414L6 10.879 5.207 10.086a1 1 0 00-1.414 1.414l1.5 1.5a1 1 0 001.414 0l4.5-4.5z" clipRule="evenodd"/>
                      </svg>
                      Connect Securely
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            /* Manual Entry Section */
            <div className="space-y-4">
              {/* Account Number */}
              <div className="space-y-2">
                <Label htmlFor="accountNumber">Account Number</Label>
                <Input
                  {...register("accountNumber")}
                  placeholder="Enter account number"
                  type="text"
                />
                {errors.accountNumber && (
                  <p className="text-sm text-red-600">{errors.accountNumber.message}</p>
                )}
              </div>

              {/* Account Holder Name */}
              <div className="space-y-2">
                <Label htmlFor="accountHolderName">Account Holder Name</Label>
                <Input
                  {...register("accountHolderName")}
                  placeholder="Enter account holder name"
                />
                {errors.accountHolderName && (
                  <p className="text-sm text-red-600">{errors.accountHolderName.message}</p>
                )}
              </div>

              {/* Current Balance */}
              <div className="space-y-2">
                <Label htmlFor="currentBalance">
                  {accountType === 'credit_card' || accountType === 'loan' 
                    ? 'Outstanding Amount' 
                    : 'Current Balance'}
                </Label>
                <Input
                  {...register("currentBalance")}
                  placeholder="Enter amount"
                  type="number"
                  step="0.01"
                />
                {errors.currentBalance && (
                  <p className="text-sm text-red-600">{errors.currentBalance.message}</p>
                )}
              </div>

              {/* Credit Limit (for credit cards) */}
              {accountType === 'credit_card' && (
                <div className="space-y-2">
                  <Label htmlFor="creditLimit">Credit Limit</Label>
                  <Input
                    {...register("creditLimit")}
                    placeholder="Enter credit limit"
                    type="number"
                    step="0.01"
                  />
                </div>
              )}

              {/* Interest Rate */}
              {(accountType === 'savings' || accountType === 'loan') && (
                <div className="space-y-2">
                  <Label htmlFor="interestRate">
                    Interest Rate (%)
                  </Label>
                  <Input
                    {...register("interestRate")}
                    placeholder="Enter interest rate"
                    type="number"
                    step="0.01"
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex space-x-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={bankAccountMutation.isPending || connectToBank}
            >
              {bankAccountMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Adding...
                </>
              ) : (
                "Add Account"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}