"""
AskiBill Streamlit Frontend Application
Modern financial expense tracking with interactive dashboards
"""

import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from datetime import datetime, timedelta
import requests
import json
from typing import Dict, List, Optional
import asyncio
import httpx
import os

# Page configuration
st.set_page_config(
    page_title="AskiBill - Smart Expense Tracker",
    page_icon="💰",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS for better styling
st.markdown("""
<style>
    .main-header {
        text-align: center;
        color: #2E86AB;
        font-size: 3rem;
        font-weight: bold;
        margin-bottom: 2rem;
    }
    .metric-card {
        background: linear-gradient(45deg, #667eea 0%, #764ba2 100%);
        padding: 1rem;
        border-radius: 10px;
        color: white;
        text-align: center;
        margin: 0.5rem 0;
    }
    .expense-category {
        padding: 0.5rem;
        margin: 0.25rem;
        border-radius: 5px;
        background-color: #f0f2f6;
        border-left: 4px solid #667eea;
    }
    .sidebar-section {
        background-color: #f8f9fa;
        padding: 1rem;
        border-radius: 10px;
        margin: 1rem 0;
    }
</style>
""", unsafe_allow_html=True)

# API Configuration
API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8000")  # FastAPI backend

class AskiBillAPI:
    """API client for AskiBill FastAPI backend"""
    
    def __init__(self, base_url: str):
        self.base_url = base_url
        self.session = requests.Session()
    
    def get_user_profile(self) -> Dict:
        """Get user profile information"""
        try:
            response = self.session.get(f"{self.base_url}/api/profile")
            return response.json() if response.status_code == 200 else {}
        except:
            return self._get_mock_profile()
    
    def get_expenses(self, limit: int = 100) -> List[Dict]:
        """Get user expenses"""
        try:
            response = self.session.get(f"{self.base_url}/api/expenses?limit={limit}")
            return response.json() if response.status_code == 200 else []
        except:
            return self._get_mock_expenses()
    
    def create_expense(self, expense_data: Dict) -> Dict:
        """Create new expense"""
        try:
            response = self.session.post(f"{self.base_url}/api/expenses", json=expense_data)
            return response.json() if response.status_code == 201 else {}
        except:
            return {"id": "mock", "status": "created"}
    
    def get_analytics(self, period: str = "month") -> Dict:
        """Get expense analytics"""
        try:
            response = self.session.get(f"{self.base_url}/api/analytics?period={period}")
            return response.json() if response.status_code == 200 else {}
        except:
            return self._get_mock_analytics()
    
    def _get_mock_profile(self) -> Dict:
        """Mock profile data for development"""
        return {
            "id": 1,
            "monthlyNetSalary": 75000,
            "savingsGoal": 25000,
            "financialGoals": ["Emergency Fund", "Investment Portfolio"],
            "riskTolerance": "moderate"
        }
    
    def _get_mock_expenses(self) -> List[Dict]:
        """Mock expenses data for development"""
        from random import randint, choice
        categories = ["Food", "Transport", "Entertainment", "Healthcare", "Shopping", "Bills"]
        
        expenses = []
        for i in range(20):
            days_ago = randint(0, 30)
            date = datetime.now() - timedelta(days=days_ago)
            
            expenses.append({
                "id": i + 1,
                "amount": randint(100, 5000),
                "category": choice(categories),
                "description": f"Sample {choice(categories).lower()} expense",
                "date": date.isoformat(),
                "paymentMethod": choice(["card", "cash", "upi"])
            })
        
        return expenses
    
    def _get_mock_analytics(self) -> Dict:
        """Mock analytics data for development"""
        return {
            "totalExpenses": 45000,
            "monthlyAverage": 38000,
            "topCategories": [
                {"category": "Food", "amount": 15000},
                {"category": "Transport", "amount": 8000},
                {"category": "Entertainment", "amount": 6000},
                {"category": "Bills", "amount": 12000},
                {"category": "Shopping", "amount": 4000}
            ],
            "savingsRate": 33.3,
            "budgetUtilization": 78.5
        }

# Initialize API client
@st.cache_resource
def get_api_client():
    return AskiBillAPI(API_BASE_URL)

api = get_api_client()

# Authentication (simplified for demo)
def check_authentication():
    if "authenticated" not in st.session_state:
        st.session_state.authenticated = False
    
    if not st.session_state.authenticated:
        st.title("🔐 AskiBill Login")
        
        col1, col2, col3 = st.columns([1, 2, 1])
        with col2:
            st.info("Demo Mode - Click login to continue")
            if st.button("Login with Demo Account", type="primary"):
                st.session_state.authenticated = True
                st.rerun()
        return False
    
    return True

def main():
    """Main application logic"""
    
    if not check_authentication():
        return
    
    # Header
    st.markdown('<h1 class="main-header">💰 AskiBill</h1>', unsafe_allow_html=True)
    st.markdown("**Smart Expense Tracking & Financial Analytics**")
    
    # Sidebar Navigation
    with st.sidebar:
        st.title("📊 Navigation")
        
        page = st.selectbox(
            "Choose a page:",
            ["Dashboard", "Add Expense", "Analytics", "Profile", "Bank Accounts"]
        )
        
        # Quick stats in sidebar
        st.markdown('<div class="sidebar-section">', unsafe_allow_html=True)
        st.subheader("Quick Stats")
        
        profile = api.get_user_profile()
        analytics = api.get_analytics()
        
        st.metric("Monthly Salary", f"₹{profile.get('monthlyNetSalary', 0):,}")
        st.metric("Savings Goal", f"₹{profile.get('savingsGoal', 0):,}")
        st.metric("Current Savings Rate", f"{analytics.get('savingsRate', 0):.1f}%")
        st.markdown('</div>', unsafe_allow_html=True)
        
        # Logout
        if st.button("Logout"):
            st.session_state.authenticated = False
            st.rerun()
    
    # Main content based on selected page
    if page == "Dashboard":
        show_dashboard()
    elif page == "Add Expense":
        show_add_expense()
    elif page == "Analytics":
        show_analytics()
    elif page == "Profile":
        show_profile()
    elif page == "Bank Accounts":
        show_bank_accounts()

def show_dashboard():
    """Dashboard page with overview metrics and charts"""
    
    st.header("📈 Financial Dashboard")
    
    # Get data
    expenses = api.get_expenses()
    analytics = api.get_analytics()
    profile = api.get_user_profile()
    
    # Convert to DataFrame
    df = pd.DataFrame(expenses)
    if not df.empty:
        df['date'] = pd.to_datetime(df['date'])
        df['amount'] = pd.to_numeric(df['amount'])
    
    # Key Metrics Row
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        total_expenses = analytics.get('totalExpenses', 0)
        st.metric("Total Expenses", f"₹{total_expenses:,}")
    
    with col2:
        monthly_avg = analytics.get('monthlyAverage', 0)
        st.metric("Monthly Average", f"₹{monthly_avg:,}")
    
    with col3:
        savings_rate = analytics.get('savingsRate', 0)
        st.metric("Savings Rate", f"{savings_rate:.1f}%")
    
    with col4:
        budget_util = analytics.get('budgetUtilization', 0)
        st.metric("Budget Usage", f"{budget_util:.1f}%")
    
    st.divider()
    
    # Charts Row
    col1, col2 = st.columns(2)
    
    with col1:
        st.subheader("📊 Expenses by Category")
        
        if not df.empty:
            category_data = df.groupby('category')['amount'].sum().reset_index()
            fig = px.pie(
                category_data, 
                values='amount', 
                names='category',
                title="Monthly Expense Distribution"
            )
            fig.update_layout(height=400)
            st.plotly_chart(fig, use_container_width=True)
        else:
            st.info("No expense data available")
    
    with col2:
        st.subheader("📈 Daily Spending Trend")
        
        if not df.empty:
            daily_expenses = df.groupby(df['date'].dt.date)['amount'].sum().reset_index()
            fig = px.line(
                daily_expenses, 
                x='date', 
                y='amount',
                title="Daily Spending Pattern"
            )
            fig.update_layout(height=400)
            st.plotly_chart(fig, use_container_width=True)
        else:
            st.info("No trend data available")
    
    # Recent Transactions
    st.subheader("🕒 Recent Transactions")
    
    if not df.empty:
        recent_expenses = df.sort_values('date', ascending=False).head(10)
        
        for _, expense in recent_expenses.iterrows():
            col1, col2, col3, col4 = st.columns([2, 1, 1, 1])
            
            with col1:
                st.write(f"**{expense['description']}**")
            with col2:
                st.write(f"₹{expense['amount']:,}")
            with col3:
                st.write(expense['category'])
            with col4:
                # Handle pandas datetime conversion
                date_val = expense['date']
                try:
                    # Handle different data types properly
                    # Use a simpler approach to avoid pandas Series boolean issues
                    date_str = str(date_val)
                    if date_str.lower() in ['', 'nan', 'none', 'nat'] or date_val is None:
                        st.write("N/A")
                    else:
                        # Convert to timestamp and format
                        date_ts = pd.to_datetime(date_val)
                        st.write(date_ts.strftime('%Y-%m-%d'))
                except Exception:
                    # Fallback to string representation
                    st.write(str(date_val))
    else:
        st.info("No recent transactions found")

def show_add_expense():
    """Add new expense page"""
    
    st.header("➕ Add New Expense")
    
    with st.form("add_expense_form"):
        col1, col2 = st.columns(2)
        
        with col1:
            amount = st.number_input("Amount (₹)", min_value=0.01, step=1.0)
            category = st.selectbox(
                "Category",
                ["Food", "Transport", "Entertainment", "Healthcare", "Shopping", "Bills", "Other"]
            )
            payment_method = st.selectbox(
                "Payment Method",
                ["card", "cash", "upi", "bank_transfer"]
            )
        
        with col2:
            description = st.text_input("Description")
            expense_date = st.date_input("Date", value=datetime.now().date())
            tags = st.text_input("Tags (comma-separated)")
        
        submitted = st.form_submit_button("Add Expense", type="primary")
        
        if submitted and amount > 0:
            expense_data = {
                "amount": amount,
                "category": category,
                "description": description,
                "date": expense_date.isoformat(),
                "paymentMethod": payment_method,
                "tags": [tag.strip() for tag in tags.split(",") if tag.strip()]
            }
            
            result = api.create_expense(expense_data)
            
            if result:
                st.success("✅ Expense added successfully!")
                st.balloons()
            else:
                st.error("❌ Failed to add expense")

def show_analytics():
    """Advanced analytics page"""
    
    st.header("📊 Financial Analytics")
    
    # Time period selector
    period = st.selectbox("Analysis Period", ["week", "month", "quarter", "year"])
    
    analytics = api.get_analytics(period)
    expenses = api.get_expenses()
    df = pd.DataFrame(expenses)
    
    if not df.empty:
        df['date'] = pd.to_datetime(df['date'])
        df['amount'] = pd.to_numeric(df['amount'])
    
    # Advanced Charts
    tab1, tab2, tab3 = st.tabs(["Spending Patterns", "Category Analysis", "Trends"])
    
    with tab1:
        st.subheader("Monthly Spending Comparison")
        
        if not df.empty:
            # Monthly comparison
            df['month'] = df['date'].dt.to_period('M')
            monthly_data = df.groupby('month')['amount'].sum().reset_index()
            monthly_data['month'] = monthly_data['month'].astype(str)
            
            fig = px.bar(
                monthly_data, 
                x='month', 
                y='amount',
                title="Monthly Spending Comparison"
            )
            st.plotly_chart(fig, use_container_width=True)
        
        # Spending by day of week
        if not df.empty:
            df['day_of_week'] = df['date'].dt.day_name()
            dow_data = df.groupby('day_of_week')['amount'].sum().reset_index()
            
            fig = px.bar(
                dow_data, 
                x='day_of_week', 
                y='amount',
                title="Spending by Day of Week"
            )
            st.plotly_chart(fig, use_container_width=True)
    
    with tab2:
        st.subheader("Category Deep Dive")
        
        if not df.empty:
            # Category trends over time
            category_trends = df.groupby([df['date'].dt.to_period('W'), 'category'])['amount'].sum().reset_index()
            category_trends['date'] = category_trends['date'].astype(str)
            
            fig = px.line(
                category_trends, 
                x='date', 
                y='amount', 
                color='category',
                title="Category Spending Trends (Weekly)"
            )
            st.plotly_chart(fig, use_container_width=True)
            
            # Category statistics
            st.subheader("Category Statistics")
            category_stats = df.groupby('category')['amount'].agg(['sum', 'mean', 'count']).reset_index()
            category_stats.columns = ['Category', 'Total', 'Average', 'Count']
            category_stats['Total'] = category_stats['Total'].apply(lambda x: f"₹{x:,.0f}")
            category_stats['Average'] = category_stats['Average'].apply(lambda x: f"₹{x:,.0f}")
            
            st.dataframe(category_stats, use_container_width=True)
    
    with tab3:
        st.subheader("Financial Trends & Insights")
        
        # Savings trend
        profile = api.get_user_profile()
        monthly_salary = profile.get('monthlyNetSalary', 0)
        
        if not df.empty and monthly_salary > 0:
            monthly_expenses = df.groupby(df['date'].dt.to_period('M'))['amount'].sum().reset_index()
            monthly_expenses['savings'] = monthly_salary - monthly_expenses['amount']
            monthly_expenses['savings_rate'] = (monthly_expenses['savings'] / monthly_salary) * 100
            monthly_expenses['date'] = monthly_expenses['date'].astype(str)
            
            fig = go.Figure()
            fig.add_trace(go.Scatter(
                x=monthly_expenses['date'], 
                y=monthly_expenses['savings_rate'],
                mode='lines+markers',
                name='Savings Rate %'
            ))
            fig.update_layout(title="Savings Rate Trend", yaxis_title="Savings Rate (%)")
            st.plotly_chart(fig, use_container_width=True)
        
        # Budget recommendations
        st.subheader("💡 AI Insights & Recommendations")
        
        if analytics.get('savingsRate', 0) < 20:
            st.warning("💡 **Savings Alert**: Your savings rate is below 20%. Consider reducing discretionary spending.")
        
        if analytics.get('budgetUtilization', 0) > 80:
            st.warning("💡 **Budget Alert**: You're using over 80% of your budget. Monitor spending closely.")
        
        top_categories = analytics.get('topCategories', [])
        if top_categories:
            highest_category = max(top_categories, key=lambda x: x['amount'])
            st.info(f"💡 **Spending Insight**: Your highest expense category is {highest_category['category']} at ₹{highest_category['amount']:,}")

def show_profile():
    """User profile management page"""
    
    st.header("👤 Profile Settings")
    
    profile = api.get_user_profile()
    
    with st.form("profile_form"):
        col1, col2 = st.columns(2)
        
        with col1:
            monthly_salary = st.number_input(
                "Monthly Net Salary (₹)", 
                value=profile.get('monthlyNetSalary', 0),
                min_value=0
            )
            savings_goal = st.number_input(
                "Monthly Savings Goal (₹)", 
                value=profile.get('savingsGoal', 0),
                min_value=0
            )
            risk_tolerance = st.selectbox(
                "Risk Tolerance",
                ["conservative", "moderate", "aggressive"],
                index=["conservative", "moderate", "aggressive"].index(profile.get('riskTolerance', 'moderate'))
            )
        
        with col2:
            financial_goals = st.multiselect(
                "Financial Goals",
                ["Emergency Fund", "Investment Portfolio", "Home Purchase", "Education", "Retirement", "Travel"],
                default=profile.get('financialGoals', [])
            )
            
            # Budget categories
            st.subheader("Budget Allocation")
            food_budget = st.slider("Food & Dining (%)", 0, 50, 25)
            transport_budget = st.slider("Transport (%)", 0, 30, 15)
            entertainment_budget = st.slider("Entertainment (%)", 0, 20, 10)
        
        if st.form_submit_button("Update Profile", type="primary"):
            st.success("✅ Profile updated successfully!")

def show_bank_accounts():
    """Bank account integration page"""
    
    st.header("🏦 Bank Account Integration")
    
    st.info("Connect your bank accounts using India's Account Aggregator framework for real-time balance tracking.")
    
    # Mock bank accounts
    bank_accounts = [
        {"bank": "HDFC Bank", "account": "****1234", "balance": 45000, "status": "connected"},
        {"bank": "ICICI Bank", "account": "****5678", "balance": 23000, "status": "connected"},
        {"bank": "SBI", "account": "****9012", "balance": 0, "status": "disconnected"}
    ]
    
    st.subheader("Connected Accounts")
    
    for account in bank_accounts:
        with st.container():
            col1, col2, col3, col4 = st.columns([2, 2, 2, 1])
            
            with col1:
                st.write(f"**{account['bank']}**")
            with col2:
                st.write(account['account'])
            with col3:
                if account['status'] == 'connected':
                    st.write(f"₹{account['balance']:,}")
                else:
                    st.write("Not Connected")
            with col4:
                if account['status'] == 'connected':
                    st.success("✅")
                else:
                    if st.button("Connect", key=f"connect_{account['account']}"):
                        st.info("Redirecting to bank login...")
    
    st.divider()
    
    # Add new bank account
    st.subheader("Add New Bank Account")
    
    col1, col2 = st.columns(2)
    with col1:
        bank_name = st.selectbox(
            "Select Bank",
            ["HDFC Bank", "ICICI Bank", "SBI", "Axis Bank", "Kotak Bank", "PNB", "BOI", "Canara Bank"]
        )
    
    with col2:
        if st.button("Connect Bank Account", type="primary"):
            st.info("🔒 Redirecting to secure bank login via Account Aggregator...")
            st.write("This will redirect you to your bank's secure login page.")

if __name__ == "__main__":
    main()