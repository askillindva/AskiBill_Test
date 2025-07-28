import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import ExpenseModal from "@/components/ExpenseModal";
import ProfileModal from "@/components/ProfileModal";
import MonthlySummary from "@/components/MonthlySummary";
import type { UserProfile, Expense, User } from "@shared/schema";

const categoryIcons: Record<string, string> = {
  food: "🍽️",
  transport: "🚗",
  shopping: "🛒",
  entertainment: "🎬",
  health: "❤️",
  other: "📝",
};

const categoryColors: Record<string, string> = {
  food: "bg-primary/10 text-primary",
  transport: "bg-secondary/10 text-secondary",
  shopping: "bg-accent/10 text-accent",
  entertainment: "bg-error/10 text-error",
  health: "bg-success/10 text-success",
  other: "bg-text-secondary/10 text-text-secondary",
};

export default function Dashboard() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
      return;
    }
  }, [user, isLoading, toast]);

  // Get mobile auth info
  const mobileUser = localStorage.getItem("mobileAuthUser");
  const isMobileAuth = !!mobileUser;
  const mobileAuthData = mobileUser ? JSON.parse(mobileUser) : null;

  const { data: profile } = useQuery<UserProfile>({
    queryKey: isMobileAuth ? [`/api/mobile/profile/${mobileAuthData?.id}`] : ["/api/profile"],
    enabled: !!user,
  });

  const { data: expenses = [], refetch: refetchExpenses } = useQuery<Expense[]>({
    queryKey: isMobileAuth ? [`/api/mobile/expenses/${mobileAuthData?.id}`] : ["/api/expenses"],
    enabled: !!user,
  });

  // Calculate current month expenses
  const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
  const currentMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const currentMonthExpenses = expenses.filter(expense => 
    new Date(expense.date) >= currentMonthStart
  );
  
  const currentMonthTotal = currentMonthExpenses.reduce((sum, expense) => 
    sum + parseFloat(expense.amount), 0
  );

  // Calculate annual expenses (April to March)
  const currentYear = new Date().getFullYear();
  const fiscalYearStart = new Date().getMonth() >= 3 ? 
    new Date(currentYear, 3, 1) : 
    new Date(currentYear - 1, 3, 1);
  const fiscalYearEnd = new Date().getMonth() >= 3 ? 
    new Date(currentYear + 1, 2, 31) : 
    new Date(currentYear, 2, 31);
    
  const annualExpenses = expenses.filter(expense => {
    const expenseDate = new Date(expense.date);
    return expenseDate >= fiscalYearStart && expenseDate <= fiscalYearEnd;
  });
  
  const annualTotal = annualExpenses.reduce((sum, expense) => 
    sum + parseFloat(expense.amount), 0
  );

  // Calculate category breakdown
  const categoryTotals: Record<string, number> = {};
  currentMonthExpenses.forEach(expense => {
    categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + parseFloat(expense.amount);
  });

  const categoryBreakdown = Object.entries(categoryTotals)
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: currentMonthTotal > 0 ? Math.round((amount / currentMonthTotal) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  // Calculate budget metrics (assuming profile has monthly salary)
  const monthlyBudget = profile ? parseFloat(profile.monthlyNetSalary || "0") * 0.6 : 0; // 60% of salary for expenses
  const budgetLeft = monthlyBudget - currentMonthTotal;
  const avgPerDay = currentMonthTotal / new Date().getDate();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Title */}
            <div className="flex items-center">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center mr-3">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM8 13a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"/>
                </svg>
              </div>
              <h1 className="text-xl font-bold text-text-primary">AskiBill</h1>
            </div>

            {/* User Profile Dropdown */}
            <div className="flex items-center space-x-4">
              <div className="relative" ref={userMenuRef}>
                <div 
                  className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 rounded-lg p-2 transition-colors"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                >
                  <img 
                    src={(user as User)?.profileImageUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100"} 
                    alt="User profile" 
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div className="text-left">
                    <p className="text-sm font-medium text-text-primary">
                      {(user as User)?.firstName || "User"} {(user as User)?.lastName || ""}
                    </p>
                    <p className="text-xs text-text-secondary">
                      {(user as User)?.email || (user as User)?.mobile || "User"}
                    </p>
                  </div>
                  <svg className="w-4 h-4 text-text-secondary" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"/>
                  </svg>
                </div>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setShowProfileModal(true);
                          setShowUserMenu(false);
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <svg className="w-4 h-4 mr-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
                        </svg>
                        Edit Profile
                      </button>
                      <div className="border-t border-gray-100"></div>
                      <button
                        onClick={() => {
                          // Check if mobile auth user
                          const mobileUser = localStorage.getItem("mobileAuthUser");
                          if (mobileUser) {
                            // Mobile auth logout
                            localStorage.removeItem("mobileAuthUser");
                            window.location.href = "/";
                          } else {
                            // Replit auth logout
                            window.location.href = "/api/logout";
                          }
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <svg className="w-4 h-4 mr-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd"/>
                        </svg>
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-text-primary mb-2">
            Welcome back, {(user as User)?.firstName || "User"}!
          </h2>
          <p className="text-text-secondary">Here's your financial overview for {currentMonth}</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text-secondary">This Month</p>
                  <p className="text-2xl font-bold text-text-primary mt-1">₹{currentMonthTotal.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-primary" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/>
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text-secondary">Annual Total</p>
                  <p className="text-2xl font-bold text-text-primary mt-1">₹{annualTotal.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-secondary" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text-secondary">Budget Left</p>
                  <p className="text-2xl font-bold text-text-primary mt-1">₹{Math.max(0, budgetLeft).toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-accent" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M4 7a3 3 0 013-3h6a3 3 0 013 3v6a3 3 0 01-3 3H7a3 3 0 01-3-3V7zM7 6a1 1 0 000 2h6a1 1 0 100-2H7zm0 4a1 1 0 100 2h6a1 1 0 100-2H7z"/>
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text-secondary">Avg/Day</p>
                  <p className="text-2xl font-bold text-text-primary mt-1">₹{avgPerDay.toFixed(0)}</p>
                </div>
                <div className="w-12 h-12 bg-error/10 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-error" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd"/>
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Action Button */}
        <div className="flex justify-center mb-8">
          <Button 
            onClick={() => setShowExpenseModal(true)}
            size="lg"
            className="px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/>
            </svg>
            Add New Expense
          </Button>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="overview" className="text-sm font-medium">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
              </svg>
              Overview
            </TabsTrigger>
            <TabsTrigger value="monthly" className="text-sm font-medium">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/>
              </svg>
              Monthly Summary
            </TabsTrigger>
            <TabsTrigger value="annual" className="text-sm font-medium">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z"/>
                <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z"/>
              </svg>
              Annual View
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Recent Expenses and Category Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Expenses List */}
              <div className="lg:col-span-2">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-text-primary">Recent Expenses</h3>
                      <Button variant="ghost" size="sm" className="text-primary hover:text-primary-dark">
                        View All
                      </Button>
                    </div>
                    
                    <div className="space-y-4">
                      {expenses.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-text-secondary">No expenses recorded yet.</p>
                          <Button 
                            onClick={() => setShowExpenseModal(true)}
                            className="mt-4"
                            size="sm"
                          >
                            Add Your First Expense
                          </Button>
                        </div>
                      ) : (
                        expenses.slice(0, 5).map((expense) => (
                          <div key={expense.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-4">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${categoryColors[expense.category] || categoryColors.other}`}>
                                <span className="text-lg">{categoryIcons[expense.category] || categoryIcons.other}</span>
                              </div>
                              <div>
                                <p className="font-medium text-text-primary">{expense.description || "Expense"}</p>
                                <p className="text-sm text-text-secondary capitalize">{expense.category.replace('-', ' ')}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-text-primary">₹{parseFloat(expense.amount).toLocaleString()}</p>
                              <p className="text-sm text-text-secondary">
                                {new Date(expense.date).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Category Breakdown */}
              <div>
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-text-primary mb-6">Category Breakdown</h3>
                    
                    <div className="space-y-4">
                      {categoryBreakdown.length === 0 ? (
                        <p className="text-text-secondary text-center py-4">No expenses this month</p>
                      ) : (
                        categoryBreakdown.map(({ category, amount, percentage }) => (
                          <div key={category} className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${categoryColors[category] || categoryColors.other}`}>
                                <span>{categoryIcons[category] || categoryIcons.other}</span>
                              </div>
                              <div>
                                <p className="font-medium text-text-primary capitalize">{category.replace('-', ' ')}</p>
                                <p className="text-xs text-text-secondary">{percentage}%</p>
                              </div>
                            </div>
                            <p className="font-medium text-text-primary">₹{amount.toLocaleString()}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="monthly" className="space-y-6">
            <MonthlySummary expenses={expenses} profile={profile} />
          </TabsContent>

          <TabsContent value="annual" className="space-y-6">
            <Card>
              <CardContent className="p-8">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-text-primary mb-4">Annual Overview</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <p className="text-lg text-text-secondary mb-2">Total Annual Expenses</p>
                      <p className="text-4xl font-bold text-primary">₹{annualTotal.toLocaleString()}</p>
                      <p className="text-sm text-text-secondary mt-2">April {fiscalYearStart.getFullYear()} - March {fiscalYearEnd.getFullYear()}</p>
                    </div>
                    <div>
                      <p className="text-lg text-text-secondary mb-2">Monthly Average</p>
                      <p className="text-4xl font-bold text-secondary">₹{(annualTotal / 12).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                      <p className="text-sm text-text-secondary mt-2">Based on fiscal year</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Modals */}
      <ExpenseModal 
        isOpen={showExpenseModal} 
        onClose={() => setShowExpenseModal(false)}
        onSuccess={() => refetchExpenses()}
      />
      <ProfileModal 
        isOpen={showProfileModal} 
        onClose={() => setShowProfileModal(false)}
      />
    </div>
  );
}
