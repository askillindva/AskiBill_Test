import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { UserProfile, Expense } from "@shared/schema";

interface MonthlySummaryProps {
  expenses: Expense[];
  profile: UserProfile | undefined;
}

const categoryIcons: Record<string, string> = {
  food: "🍽️",
  transport: "🚗",
  shopping: "🛒",
  entertainment: "🎬",
  health: "❤️",
  other: "📝",
};

const categoryColors: Record<string, { bg: string; text: string; bar: string }> = {
  food: { bg: "bg-red-50", text: "text-red-600", bar: "bg-red-500" },
  transport: { bg: "bg-blue-50", text: "text-blue-600", bar: "bg-blue-500" },
  shopping: { bg: "bg-purple-50", text: "text-purple-600", bar: "bg-purple-500" },
  entertainment: { bg: "bg-green-50", text: "text-green-600", bar: "bg-green-500" },
  health: { bg: "bg-orange-50", text: "text-orange-600", bar: "bg-orange-500" },
  other: { bg: "bg-gray-50", text: "text-gray-600", bar: "bg-gray-500" },
};

export default function MonthlySummary({ expenses, profile }: MonthlySummaryProps) {
  const monthlyData = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const currentDay = new Date().getDate();
    
    // Filter expenses for current month
    const currentMonthExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
    });
    
    // Calculate monthly metrics
    const totalExpenses = currentMonthExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
    const monthlyIncome = profile ? parseFloat(profile.monthlyNetSalary || "0") : 0;
    const plannedSavings = monthlyIncome * 0.2; // 20% savings goal
    const budgetForExpenses = monthlyIncome - plannedSavings;
    const actualSavings = monthlyIncome - totalExpenses;
    const overspending = totalExpenses > budgetForExpenses ? totalExpenses - budgetForExpenses : 0;
    
    // Daily projections
    const avgDailyExpense = totalExpenses / currentDay;
    const projectedMonthlyExpense = avgDailyExpense * daysInMonth;
    const projectedSavings = monthlyIncome - projectedMonthlyExpense;
    
    // Category breakdown
    const categoryTotals: Record<string, number> = {};
    currentMonthExpenses.forEach(expense => {
      categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + parseFloat(expense.amount);
    });
    
    const categoryBreakdown = Object.entries(categoryTotals)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
    
    // Weekly breakdown
    const weeklyData = Array.from({ length: 4 }, (_, weekIndex) => {
      const weekStart = new Date(currentYear, currentMonth, weekIndex * 7 + 1);
      const weekEnd = new Date(currentYear, currentMonth, Math.min((weekIndex + 1) * 7, daysInMonth));
      
      const weekExpenses = currentMonthExpenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= weekStart && expenseDate <= weekEnd;
      });
      
      return {
        week: weekIndex + 1,
        amount: weekExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0),
        expenses: weekExpenses.length,
      };
    });
    
    return {
      totalExpenses,
      monthlyIncome,
      plannedSavings,
      budgetForExpenses,
      actualSavings,
      overspending,
      avgDailyExpense,
      projectedMonthlyExpense,
      projectedSavings,
      categoryBreakdown,
      weeklyData,
      expenseCount: currentMonthExpenses.length,
      currentDay,
      daysInMonth,
    };
  }, [expenses, profile]);

  const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
  
  const getSavingsStatus = () => {
    if (monthlyData.actualSavings >= monthlyData.plannedSavings) {
      return { status: "excellent", color: "text-green-600", bg: "bg-green-50", message: "Great job! You're on track with savings." };
    } else if (monthlyData.actualSavings > 0) {
      return { status: "good", color: "text-yellow-600", bg: "bg-yellow-50", message: "Good progress, but could save more." };
    } else {
      return { status: "poor", color: "text-red-600", bg: "bg-red-50", message: "No savings this month. Consider reducing expenses." };
    }
  };

  const savingsStatus = getSavingsStatus();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-text-primary mb-2">Monthly Summary</h2>
        <p className="text-text-secondary">{currentMonth} • Financial Overview</p>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Expenses */}
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600 mb-1">Total Expenses</p>
                <p className="text-2xl font-bold text-text-primary">₹{monthlyData.totalExpenses.toLocaleString()}</p>
                <p className="text-xs text-text-secondary mt-1">{monthlyData.expenseCount} transactions</p>
              </div>
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Income */}
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 mb-1">Monthly Income</p>
                <p className="text-2xl font-bold text-text-primary">₹{monthlyData.monthlyIncome.toLocaleString()}</p>
                <p className="text-xs text-text-secondary mt-1">Net salary</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"/>
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current Savings */}
        <Card className={`border-l-4 ${monthlyData.actualSavings >= 0 ? 'border-l-green-500' : 'border-l-red-500'}`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium mb-1 ${monthlyData.actualSavings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {monthlyData.actualSavings >= 0 ? 'Current Savings' : 'Overspending'}
                </p>
                <p className="text-2xl font-bold text-text-primary">₹{Math.abs(monthlyData.actualSavings).toLocaleString()}</p>
                <p className="text-xs text-text-secondary mt-1">
                  Target: ₹{monthlyData.plannedSavings.toLocaleString()}
                </p>
              </div>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${monthlyData.actualSavings >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                <svg className={`w-6 h-6 ${monthlyData.actualSavings >= 0 ? 'text-green-500' : 'text-red-500'}`} fill="currentColor" viewBox="0 0 20 20">
                  {monthlyData.actualSavings >= 0 ? (
                    <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd"/>
                  ) : (
                    <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  )}
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Daily Average */}
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600 mb-1">Daily Average</p>
                <p className="text-2xl font-bold text-text-primary">₹{monthlyData.avgDailyExpense.toFixed(0)}</p>
                <p className="text-xs text-text-secondary mt-1">
                  Day {monthlyData.currentDay} of {monthlyData.daysInMonth}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Savings Analysis */}
      <Card className={savingsStatus.bg}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center mb-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 ${savingsStatus.bg}`}>
                  {monthlyData.actualSavings >= monthlyData.plannedSavings ? (
                    <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                    </svg>
                  ) : monthlyData.actualSavings > 0 ? (
                    <svg className="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                    </svg>
                  )}
                </div>
                <div>
                  <h3 className={`text-lg font-semibold ${savingsStatus.color}`}>Savings Analysis</h3>
                  <p className="text-text-secondary">{savingsStatus.message}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-text-secondary">Savings Progress</p>
                  <div className="mt-2">
                    <Progress 
                      value={Math.min(100, Math.max(0, (monthlyData.actualSavings / monthlyData.plannedSavings) * 100))} 
                      className="h-2"
                    />
                    <p className="text-xs text-text-secondary mt-1">
                      {((monthlyData.actualSavings / monthlyData.plannedSavings) * 100).toFixed(1)}% of target
                    </p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-text-secondary">Budget Utilization</p>
                  <div className="mt-2">
                    <Progress 
                      value={Math.min(100, (monthlyData.totalExpenses / monthlyData.budgetForExpenses) * 100)} 
                      className="h-2"
                    />
                    <p className="text-xs text-text-secondary mt-1">
                      {((monthlyData.totalExpenses / monthlyData.budgetForExpenses) * 100).toFixed(1)}% of budget used
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Projection */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Expense Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {monthlyData.categoryBreakdown.length === 0 ? (
                <p className="text-center text-text-secondary py-8">No expenses recorded yet.</p>
              ) : (
                monthlyData.categoryBreakdown.map((category) => {
                  const colors = categoryColors[category.category] || categoryColors.other;
                  return (
                    <div key={category.category} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors.bg}`}>
                          <span className="text-lg">{categoryIcons[category.category] || categoryIcons.other}</span>
                        </div>
                        <div>
                          <p className="font-medium text-text-primary capitalize">
                            {category.category.replace('-', ' ')}
                          </p>
                          <p className="text-sm text-text-secondary">
                            {category.percentage.toFixed(1)}% of total
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-text-primary">₹{category.amount.toLocaleString()}</p>
                        <div className="w-20 mt-1">
                          <div className={`h-2 rounded-full ${colors.bar}`} style={{ width: `${category.percentage}%` }}></div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Weekly Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {monthlyData.weeklyData.map((week) => (
                <div key={week.week} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <span className="text-sm font-semibold text-primary">W{week.week}</span>
                    </div>
                    <div>
                      <p className="font-medium text-text-primary">Week {week.week}</p>
                      <p className="text-sm text-text-secondary">{week.expenses} transactions</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-text-primary">₹{week.amount.toLocaleString()}</p>
                    <div className="w-20 mt-1">
                      <div 
                        className="h-2 rounded-full bg-primary" 
                        style={{ 
                          width: `${monthlyData.totalExpenses > 0 ? (week.amount / Math.max(...monthlyData.weeklyData.map(w => w.amount))) * 100 : 0}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Month-End Projection */}
      {monthlyData.currentDay < monthlyData.daysInMonth && (
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
          <CardContent className="p-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Month-End Projection</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-text-secondary">Projected Expenses</p>
                  <p className="text-xl font-bold text-blue-600">₹{monthlyData.projectedMonthlyExpense.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-text-secondary">Projected Savings</p>
                  <p className={`text-xl font-bold ${monthlyData.projectedSavings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ₹{Math.abs(monthlyData.projectedSavings).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-text-secondary">Days Remaining</p>
                  <p className="text-xl font-bold text-purple-600">{monthlyData.daysInMonth - monthlyData.currentDay}</p>
                </div>
              </div>
              <div className="mt-4 p-4 bg-white/50 rounded-lg">
                <p className="text-sm text-text-secondary">
                  Based on your current spending pattern of ₹{monthlyData.avgDailyExpense.toFixed(0)} per day
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}