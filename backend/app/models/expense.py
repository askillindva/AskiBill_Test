"""
Expense model for tracking user expenses and financial data
"""
from sqlalchemy import Column, String, DateTime, Text, Numeric, Integer, Boolean, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from enum import Enum
import uuid

from app.core.database import Base


class ExpenseCategory(str, Enum):
    """Expense categories"""
    FOOD = "food"
    TRANSPORTATION = "transportation"
    ENTERTAINMENT = "entertainment"
    SHOPPING = "shopping"
    UTILITIES = "utilities"
    HEALTHCARE = "healthcare"
    EDUCATION = "education"
    TRAVEL = "travel"
    INVESTMENT = "investment"
    INSURANCE = "insurance"
    RENT = "rent"
    GROCERIES = "groceries"
    DINING = "dining"
    FUEL = "fuel"
    CLOTHING = "clothing"
    ELECTRONICS = "electronics"
    GIFTS = "gifts"
    CHARITY = "charity"
    TAXES = "taxes"
    OTHER = "other"


class PaymentMethod(str, Enum):
    """Payment methods"""
    CASH = "cash"
    CREDIT_CARD = "credit_card"
    DEBIT_CARD = "debit_card"
    UPI = "upi"
    NET_BANKING = "net_banking"
    WALLET = "wallet"
    EMI = "emi"
    CHECK = "check"
    OTHER = "other"


class Expense(Base):
    """Expense tracking model"""
    __tablename__ = "expenses"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    
    # Basic expense information
    amount = Column(Numeric(12, 2), nullable=False)
    category = Column(String(50), nullable=False, default=ExpenseCategory.OTHER)
    subcategory = Column(String(100))
    description = Column(Text)
    
    # Transaction details
    payment_method = Column(String(50), default=PaymentMethod.CASH)
    merchant_name = Column(String(200))
    location = Column(String(200))
    
    # Dates
    expense_date = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Additional metadata
    receipt_url = Column(String(500))  # Path to uploaded receipt
    notes = Column(Text)
    tags = Column(String(500))  # Comma-separated tags
    
    # Banking integration
    bank_transaction_id = Column(String(100))  # ID from bank transaction
    is_recurring = Column(Boolean, default=False)
    parent_expense_id = Column(Integer)  # For recurring expenses
    
    # Budgeting
    budget_category_id = Column(Integer)  # Link to budget category
    is_planned = Column(Boolean, default=False)
    
    # Relationships
    user = relationship("User", back_populates="expenses")
    
    def __repr__(self):
        return f"<Expense(id={self.id}, amount={self.amount}, category={self.category})>"


class Budget(Base):
    """Budget planning and tracking"""
    __tablename__ = "budgets"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    
    # Budget details
    name = Column(String(200), nullable=False)
    category = Column(String(50), nullable=False)
    amount_limit = Column(Numeric(12, 2), nullable=False)
    period = Column(String(20), nullable=False)  # monthly, yearly, weekly
    
    # Tracking
    current_spent = Column(Numeric(12, 2), default=0)
    last_reset_date = Column(DateTime(timezone=True))
    
    # Settings
    alert_threshold = Column(Numeric(5, 2), default=80.0)  # Alert at 80% of budget
    is_active = Column(Boolean, default=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    @property
    def utilization_percentage(self) -> float:
        """Calculate budget utilization percentage"""
        if self.amount_limit > 0:
            return float((self.current_spent / self.amount_limit) * 100)
        return 0.0
    
    @property
    def remaining_amount(self) -> float:
        """Calculate remaining budget amount"""
        return float(self.amount_limit - self.current_spent)
    
    def __repr__(self):
        return f"<Budget(id={self.id}, name={self.name}, limit={self.amount_limit})>"


class SavingsGoal(Base):
    """Savings goals and tracking"""
    __tablename__ = "savings_goals"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    
    # Goal details
    name = Column(String(200), nullable=False)
    description = Column(Text)
    target_amount = Column(Numeric(12, 2), nullable=False)
    current_amount = Column(Numeric(12, 2), default=0)
    
    # Timeline
    target_date = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Settings
    monthly_contribution = Column(Numeric(12, 2))
    is_active = Column(Boolean, default=True)
    is_achieved = Column(Boolean, default=False)
    
    @property
    def progress_percentage(self) -> float:
        """Calculate progress percentage"""
        if self.target_amount > 0:
            return float((self.current_amount / self.target_amount) * 100)
        return 0.0
    
    @property
    def remaining_amount(self) -> float:
        """Calculate remaining amount to save"""
        return float(self.target_amount - self.current_amount)
    
    def __repr__(self):
        return f"<SavingsGoal(id={self.id}, name={self.name}, target={self.target_amount})>"