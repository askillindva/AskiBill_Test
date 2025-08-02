"""
AskiBill FastAPI Backend - Main Application Entry Point
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import uvicorn
import logging

from app.api import auth
# Temporarily comment out missing imports to get basic app running
# from app.core.config import settings
# from app.core.database import create_db_and_tables
# from app.api import expenses, banking, dashboard, users
# from app.core.security import get_current_user


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    logging.info("Starting AskiBill Backend...")
    # await create_db_and_tables()  # Temporarily disabled
    yield
    # Shutdown
    logging.info("Shutting down AskiBill Backend...")


# Create FastAPI application
app = FastAPI(
    title="AskiBill API",
    description="Secure Expense Tracking and Banking Integration API",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Simplified for development
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
    allow_headers=["*"],
)

# Add trusted host middleware for security
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["*"]  # Simplified for development
)


@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """Global HTTP exception handler"""
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail, "status_code": exc.status_code}
    )


@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """Global exception handler"""
    logging.error(f"Unexpected error: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "status_code": 500}
    )


# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "version": "2.0.0"}


# API Routes
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
# Temporarily comment out missing routers
# app.include_router(users.router, prefix="/api/users", tags=["Users"])
# app.include_router(expenses.router, prefix="/api/expenses", tags=["Expenses"])
# app.include_router(banking.router, prefix="/api/banking", tags=["Banking"])
# app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "AskiBill API v2.0.0",
        "description": "Secure Expense Tracking and Banking Integration",
        "docs": "/docs"
    }


if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.ENVIRONMENT == "development",
        log_level="info"
    )