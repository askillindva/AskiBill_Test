"""
Database configuration and connection management
"""
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import event
import logging
import os

from app.core.config import settings


# SQLAlchemy Base
class Base(DeclarativeBase):
    """Base class for all database models"""
    pass


# Async engine with environment-based database URL
database_url = settings.PYTHON_DATABASE_URL or settings.DATABASE_URL

if not database_url:
    raise ValueError("Database URL not configured. Please set DATABASE_URL or PYTHON_DATABASE_URL in your .env file")

engine = create_async_engine(
    database_url,
    echo=settings.DATABASE_ECHO,
    pool_pre_ping=True,
    pool_recycle=300,
    pool_size=int(os.getenv("DB_POOL_SIZE", "10")),
    max_overflow=int(os.getenv("DB_MAX_OVERFLOW", "20")),
)

# Session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_session() -> AsyncSession:
    """Get database session"""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def create_db_and_tables():
    """Create database tables"""
    async with engine.begin() as conn:
        # Import all models to ensure they are registered
        from app.models import user, expense, bank_account, transaction  # noqa
        
        # Create all tables
        await conn.run_sync(Base.metadata.create_all)
        logging.info("Database tables created successfully")


# Database events
@event.listens_for(engine.sync_engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    """Set SQLite pragmas for better performance (if using SQLite)"""
    if "sqlite" in settings.DATABASE_URL:
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA synchronous=NORMAL")
        cursor.execute("PRAGMA cache_size=1000")
        cursor.execute("PRAGMA temp_store=MEMORY")
        cursor.close()


# Connection dependency
async def get_db():
    """Database dependency for FastAPI"""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()