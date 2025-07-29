"""
Bank account and banking integration models
"""
from sqlalchemy import Column, String, DateTime, Text, Numeric, Integer, Boolean, ForeignKey, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from enum import Enum
import uuid

from app.core.database import Base


class AccountType(str, Enum):
    """Bank account types"""
    SAVINGS = "savings"
    CHECKING = "checking"
    CREDIT_CARD = "credit_card"
    LOAN = "loan"
    FIXED_DEPOSIT = "fixed_deposit"
    RECURRING_DEPOSIT = "recurring_deposit"
    INVESTMENT = "investment"
    WALLET = "wallet"


class BankProvider(str, Enum):
    """Banking API providers"""
    SETU = "setu"
    YODLEE = "yodlee"
    ANUMATI = "anumati"
    MANUAL = "manual"


class ConnectionStatus(str, Enum):
    """Bank connection status"""
    CONNECTED = "connected"
    DISCONNECTED = "disconnected"
    PENDING = "pending"
    ERROR = "error"
    EXPIRED = "expired"


class BankAccount(Base):
    """Bank account information"""
    __tablename__ = "bank_accounts"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    
    # Bank details
    bank_name = Column(String(200), nullable=False)
    bank_code = Column(String(50))  # IFSC or bank identifier
    institution_id = Column(String(100))  # From banking API
    
    # Account details
    account_number = Column(String(100))  # Encrypted/masked
    account_holder_name = Column(String(200))
    account_type = Column(String(50), nullable=False, default=AccountType.SAVINGS)
    
    # Balance information
    current_balance = Column(Numeric(15, 2), default=0)
    available_balance = Column(Numeric(15, 2), default=0)
    credit_limit = Column(Numeric(15, 2))
    currency = Column(String(10), default="INR")
    
    # API Integration
    provider = Column(String(50), default=BankProvider.MANUAL)
    external_account_id = Column(String(200))  # ID from banking API
    connection_status = Column(String(50), default=ConnectionStatus.DISCONNECTED)
    consent_id = Column(String(200))  # Account Aggregator consent ID
    
    # Sync information
    last_synced = Column(DateTime(timezone=True))
    sync_frequency = Column(Integer, default=24)  # Hours
    auto_sync_enabled = Column(Boolean, default=True)
    
    # Additional details
    branch_name = Column(String(200))
    interest_rate = Column(Numeric(5, 2))
    opening_date = Column(DateTime(timezone=True))
    
    # Metadata
    is_primary = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    notes = Column(Text)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="bank_accounts")
    transactions = relationship("Transaction", back_populates="bank_account", cascade="all, delete-orphan")
    
    @property
    def masked_account_number(self) -> str:
        """Get masked account number for display"""
        if self.account_number and len(self.account_number) > 4:
            return f"****{self.account_number[-4:]}"
        return "****"
    
    def __repr__(self):
        return f"<BankAccount(id={self.id}, bank={self.bank_name}, type={self.account_type})>"


class Transaction(Base):
    """Bank transaction records"""
    __tablename__ = "transactions"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    bank_account_id = Column(Integer, ForeignKey("bank_accounts.id"), nullable=False, index=True)
    
    # Transaction details
    external_transaction_id = Column(String(200))  # ID from bank
    amount = Column(Numeric(15, 2), nullable=False)
    transaction_type = Column(String(50), nullable=False)  # debit, credit
    balance_after = Column(Numeric(15, 2))
    
    # Description and categorization
    description = Column(Text)
    reference_number = Column(String(100))
    merchant_name = Column(String(200))
    category = Column(String(100))
    
    # Dates
    transaction_date = Column(DateTime(timezone=True), nullable=False)
    value_date = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Additional metadata
    currency = Column(String(10), default="INR")
    location = Column(String(200))
    payment_mode = Column(String(50))  # UPI, Card, etc.
    
    # Processing status
    is_processed = Column(Boolean, default=False)
    is_duplicate = Column(Boolean, default=False)
    
    # Expense linking
    expense_id = Column(Integer)  # Link to expense record
    is_expense_created = Column(Boolean, default=False)
    
    # Raw data from API
    raw_data = Column(JSON)  # Store original API response
    
    # Relationships
    bank_account = relationship("BankAccount", back_populates="transactions")
    
    def __repr__(self):
        return f"<Transaction(id={self.id}, amount={self.amount}, type={self.transaction_type})>"


class BankConnection(Base):
    """Bank connection and consent management"""
    __tablename__ = "bank_connections"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    
    # Connection details
    provider = Column(String(50), nullable=False)
    institution_id = Column(String(100), nullable=False)
    consent_id = Column(String(200))
    
    # Status and metadata
    status = Column(String(50), default=ConnectionStatus.PENDING)
    error_message = Column(Text)
    
    # Consent details
    consent_start = Column(DateTime(timezone=True))
    consent_expiry = Column(DateTime(timezone=True))
    data_range_from = Column(DateTime(timezone=True))
    data_range_to = Column(DateTime(timezone=True))
    
    # Access tokens (encrypted)
    access_token = Column(Text)
    refresh_token = Column(Text)
    token_expires_at = Column(DateTime(timezone=True))
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    last_accessed = Column(DateTime(timezone=True))
    
    def is_expired(self) -> bool:
        """Check if consent is expired"""
        if self.consent_expiry:
            from datetime import datetime
            return datetime.utcnow() > self.consent_expiry
        return False
    
    def __repr__(self):
        return f"<BankConnection(id={self.id}, provider={self.provider}, status={self.status})>"