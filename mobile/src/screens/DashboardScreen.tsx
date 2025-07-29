import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Alert,
  Dimensions,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Card,
  FAB,
  List,
  Chip,
  Avatar,
  Button,
  Surface,
  useTheme,
} from 'react-native-paper';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { MaterialIcons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth } from 'date-fns';

import { apiClient } from '../services/api';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ExpenseModal } from '../components/ExpenseModal';
import { BankAccountCard } from '../components/BankAccountCard';

const { width: screenWidth } = Dimensions.get('window');

interface Expense {
  id: number;
  amount: number;
  category: string;
  description: string;
  expense_date: string;
  payment_method: string;
}

interface BankAccount {
  id: number;
  bank_name: string;
  account_type: string;
  current_balance: number;
  masked_account_number: string;
  connection_status: string;
}

interface DashboardStats {
  total_expenses: number;
  monthly_spent: number;
  category_breakdown: Array<{ category: string; amount: number; percentage: number }>;
  recent_transactions: Expense[];
  monthly_trend: Array<{ month: string; amount: number }>;
}

export function DashboardScreen() {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [expenseModalVisible, setExpenseModalVisible] = useState(false);

  // Fetch dashboard data
  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => apiClient.get('/dashboard/stats').then(res => res.data),
  });

  const { data: bankAccounts, isLoading: accountsLoading } = useQuery({
    queryKey: ['bank-accounts'],
    queryFn: () => apiClient.get('/banking/accounts').then(res => res.data),
  });

  const { data: recentExpenses, isLoading: expensesLoading } = useQuery({
    queryKey: ['recent-expenses'],
    queryFn: () => apiClient.get('/expenses/recent?limit=5').then(res => res.data),
  });

  // Add expense mutation
  const addExpenseMutation = useMutation({
    mutationFn: (expenseData: any) =>
      apiClient.post('/expenses', expenseData).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['recent-expenses'] });
      setExpenseModalVisible(false);
      Alert.alert('Success', 'Expense added successfully!');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to add expense');
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] }),
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] }),
      queryClient.invalidateQueries({ queryKey: ['recent-expenses'] }),
    ]);
    setRefreshing(false);
  };

  if (statsLoading || accountsLoading || expensesLoading) {
    return <LoadingSpinner />;
  }

  if (statsError) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={64} color={theme.colors.error} />
          <Text style={styles.errorText}>Failed to load dashboard data</Text>
          <Button mode="contained" onPress={onRefresh}>
            Retry
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  const chartConfig = {
    backgroundGradientFrom: theme.colors.surface,
    backgroundGradientTo: theme.colors.surface,
    color: (opacity = 1) => `rgba(${theme.colors.primary}, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
  };

  const pieData = stats?.category_breakdown?.map((item: any, index: number) => ({
    name: item.category,
    population: item.amount,
    color: generateColor(index),
    legendFontColor: theme.colors.onSurface,
    legendFontSize: 12,
  })) || [];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header Stats */}
        <View style={styles.header}>
          <Text style={[styles.greeting, { color: theme.colors.onSurface }]}>
            Good {getTimeOfDay()},
          </Text>
          <Text style={[styles.userName, { color: theme.colors.primary }]}>
            Welcome back!
          </Text>
        </View>

        {/* Balance Cards */}
        <View style={styles.balanceContainer}>
          <Card style={styles.balanceCard}>
            <Card.Content>
              <Text style={styles.balanceLabel}>This Month Spent</Text>
              <Text style={[styles.balanceAmount, { color: theme.colors.error }]}>
                ₹{stats?.monthly_spent?.toLocaleString() || '0'}
              </Text>
            </Card.Content>
          </Card>

          <Card style={styles.balanceCard}>
            <Card.Content>
              <Text style={styles.balanceLabel}>Total Expenses</Text>
              <Text style={[styles.balanceAmount, { color: theme.colors.primary }]}>
                {stats?.total_expenses || 0}
              </Text>
            </Card.Content>
          </Card>
        </View>

        {/* Bank Accounts */}
        {bankAccounts && bankAccounts.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              Bank Accounts
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {bankAccounts.map((account: BankAccount) => (
                <BankAccountCard key={account.id} account={account} />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Category Breakdown Chart */}
        {pieData.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              Expense Categories
            </Text>
            <Card style={styles.chartCard}>
              <Card.Content>
                <PieChart
                  data={pieData}
                  width={screenWidth - 60}
                  height={220}
                  chartConfig={chartConfig}
                  accessor="population"
                  backgroundColor="transparent"
                  paddingLeft="15"
                  center={[10, 50]}
                  absolute
                />
              </Card.Content>
            </Card>
          </View>
        )}

        {/* Monthly Trend */}
        {stats?.monthly_trend && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              Monthly Trend
            </Text>
            <Card style={styles.chartCard}>
              <Card.Content>
                <LineChart
                  data={{
                    labels: stats.monthly_trend.map((item: any) => item.month),
                    datasets: [
                      {
                        data: stats.monthly_trend.map((item: any) => item.amount),
                      },
                    ],
                  }}
                  width={screenWidth - 60}
                  height={220}
                  chartConfig={chartConfig}
                  bezier
                  style={styles.chart}
                />
              </Card.Content>
            </Card>
          </View>
        )}

        {/* Recent Expenses */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              Recent Expenses
            </Text>
            <Button mode="text" onPress={() => {/* Navigate to all expenses */}}>
              View All
            </Button>
          </View>

          {recentExpenses?.map((expense: Expense) => (
            <List.Item
              key={expense.id}
              title={expense.description || 'Expense'}
              description={`${expense.category} • ${format(new Date(expense.expense_date), 'MMM dd')}`}
              left={(props) => (
                <Avatar.Icon
                  {...props}
                  icon={getCategoryIcon(expense.category)}
                  style={{ backgroundColor: getCategoryColor(expense.category) }}
                />
              )}
              right={() => (
                <Text style={[styles.expenseAmount, { color: theme.colors.error }]}>
                  -₹{expense.amount.toLocaleString()}
                </Text>
              )}
              style={styles.expenseItem}
            />
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Action Button */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => setExpenseModalVisible(true)}
        label="Add Expense"
      />

      {/* Add Expense Modal */}
      <ExpenseModal
        visible={expenseModalVisible}
        onDismiss={() => setExpenseModalVisible(false)}
        onSubmit={(data) => addExpenseMutation.mutate(data)}
        loading={addExpenseMutation.isPending}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  greeting: {
    fontSize: 16,
    opacity: 0.7,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  balanceContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
  },
  balanceCard: {
    flex: 1,
  },
  balanceLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  section: {
    padding: 20,
    paddingBottom: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  chartCard: {
    marginTop: 10,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  expenseItem: {
    backgroundColor: 'white',
    marginVertical: 2,
    borderRadius: 8,
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: '600',
    alignSelf: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    marginVertical: 20,
    textAlign: 'center',
  },
});

function getTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

function generateColor(index: number): string {
  const colors = [
    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
    '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
  ];
  return colors[index % colors.length];
}

function getCategoryIcon(category: string): string {
  const icons: { [key: string]: string } = {
    food: 'food',
    transportation: 'directions-car',
    entertainment: 'movie',
    shopping: 'shopping-bag',
    utilities: 'lightbulb',
    healthcare: 'local-hospital',
    education: 'school',
    travel: 'flight',
  };
  return icons[category] || 'receipt';
}

function getCategoryColor(category: string): string {
  const colors: { [key: string]: string } = {
    food: '#FF6384',
    transportation: '#36A2EB',
    entertainment: '#FFCE56',
    shopping: '#4BC0C0',
    utilities: '#9966FF',
    healthcare: '#FF9F40',
    education: '#FF6384',
    travel: '#C9CBCF',
  };
  return colors[category] || '#666';
}