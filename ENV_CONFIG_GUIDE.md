# AskiBill Environment Configuration Guide

## 📋 Overview

All database connections, API keys, and sensitive configuration are now managed through environment variables for easy deployment across different environments without code changes.

## 🔧 Quick Setup

### 1. Copy Environment Template
```bash
cp .env.example .env
```

### 2. Configure Database (Required)
```bash
# PostgreSQL Connection URL
DATABASE_URL=postgresql://username:password@host:port/database

# Or use individual components (auto-builds URL)
PGHOST=localhost
PGPORT=5432
PGUSER=askibill_user
PGPASSWORD=your_password
PGDATABASE=askibill
```

### 3. Set Authentication Secrets (Required)
```bash
# Generate secure random keys
SECRET_KEY=your-32-character-secret-key
SESSION_SECRET=your-session-secret-key
ENCRYPTION_KEY=your-base64-encryption-key
```

### 4. Configure Banking APIs (Optional for development)
```bash
# Setu (Primary provider)
SETU_API_KEY=your-setu-api-key
SETU_CLIENT_ID=your-client-id
SETU_CLIENT_SECRET=your-client-secret

# Alternative providers
YODLEE_API_KEY=your-yodlee-key
ANUMATI_API_KEY=your-anumati-key
```

## 🚀 Automated Setup Scripts

### Environment Setup Script
```bash
# Interactive environment setup
chmod +x scripts/setup-env.sh
./scripts/setup-env.sh

# Or using npm (if package.json scripts are added)
npm run env:setup
```

### Environment Validation
```bash
# Check configuration
python3 scripts/check-env.py

# Or using npm
npm run env:check
```

## 🐍 Python Backend Configuration

The Python FastAPI backend automatically reads from the same `.env` file:

### Database Configuration
```python
# backend/app/core/config.py
class Settings(BaseSettings):
    # Auto-converts DATABASE_URL to Python async format
    DATABASE_URL: str = ""
    PYTHON_DATABASE_URL: str = ""  # postgresql+asyncpg://...
    
    class Config:
        env_file = ".env"
```

### Smart Database URL Handling
- Automatically converts `postgres://` → `postgresql+asyncpg://`
- Builds URL from PGHOST, PGUSER, etc. if DATABASE_URL not provided
- Supports both sync and async database connections

## 🐳 Docker Deployment

### Docker Compose with Environment Files
```yaml
# docker-compose.yml
services:
  backend:
    env_file:
      - .env
    environment:
      # Override for Docker network
      - PGHOST=postgres
      - REDIS_HOST=redis
```

### Start with Docker
```bash
docker-compose up -d
```

## 📁 File Locations

### Environment Files
- `.env` - Your local configuration (never commit)
- `.env.example` - Template with all variables
- `backend/.env.example` - Python-specific template

### Configuration Files
- `server/db.ts` - JavaScript database connection
- `backend/app/core/config.py` - Python configuration
- `backend/app/core/database.py` - Python database setup
- `drizzle.config.ts` - Database migration config

### Scripts
- `scripts/setup-env.sh` - Interactive setup script
- `scripts/check-env.py` - Configuration validator

## 🔐 Security Best Practices

### Secret Generation
```bash
# Generate SECRET_KEY
openssl rand -hex 32

# Generate ENCRYPTION_KEY
openssl rand -base64 32

# Using Python
python3 -c "import secrets; print(secrets.token_hex(32))"
```

### Environment Separation
- **Development**: Use `.env` file
- **Staging**: Set environment variables in hosting platform
- **Production**: Use secure secret management (AWS Secrets Manager, etc.)

### Never Commit Secrets
```bash
# .gitignore already includes:
.env
.env.local
.env.production
backend/.env
```

## 🌍 Environment-Specific Configuration

### Development
```bash
NODE_ENV=development
DEBUG=true
DATABASE_ECHO=true
ENABLE_DOCS=true
```

### Production
```bash
NODE_ENV=production
DEBUG=false
DATABASE_ECHO=false
ENABLE_DOCS=false
```

### Docker
```bash
PGHOST=postgres
REDIS_HOST=redis
UVICORN_HOST=0.0.0.0
```

## 📊 Database Providers

### Neon (Current)
```bash
DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/db?sslmode=require
```

### Local PostgreSQL
```bash
DATABASE_URL=postgresql://user:pass@localhost:5432/askibill
```

### Docker PostgreSQL
```bash
DATABASE_URL=postgresql://askibill_user:password@postgres:5432/askibill
```

## 🏦 Banking API Configuration

### Setu (Primary - Account Aggregator)
```bash
SETU_BASE_URL=https://sandbox.setu.co
SETU_API_KEY=your-api-key
SETU_CLIENT_ID=your-client-id
SETU_CLIENT_SECRET=your-client-secret
```

### Yodlee (Alternative Provider)
```bash
YODLEE_BASE_URL=https://sandbox.api.yodlee.com/ysl
YODLEE_CLIENT_ID=your-client-id
YODLEE_CLIENT_SECRET=your-client-secret
```

### Development Mode
- Without API keys: Uses realistic mock data
- With API keys: Connects to sandbox/production APIs

## 🔄 Migration Benefits

### Before (Hardcoded)
- Database URL in code
- API keys in source files
- Different configurations for each environment
- Manual changes needed for deployment

### After (Environment-Based)
- All secrets in `.env` file
- Same codebase for all environments
- Easy deployment with environment variables
- Secure secret management

## 📱 Mobile App Configuration

React Native app reads from the same backend API:

```javascript
// mobile/src/config/environment.js
export const config = {
  apiUrl: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000',
  environment: process.env.EXPO_PUBLIC_ENVIRONMENT || 'development',
};
```

## 🛠 Troubleshooting

### Common Issues

#### Database Connection Error
```bash
# Check DATABASE_URL format
python3 scripts/check-env.py

# Test connection
node -e "import('./server/db.js').then(() => console.log('Connected!'))"
```

#### Missing Environment Variables
```bash
# Run validator
python3 scripts/check-env.py

# Check specific variable
echo $DATABASE_URL
```

#### Docker Issues
```bash
# Check environment in container
docker-compose exec backend env | grep DATABASE

# View logs
docker-compose logs backend
```

### Environment Loading Order
1. OS environment variables (highest priority)
2. `.env` file variables
3. Default values in code (lowest priority)

## 📝 Next Steps

1. **Copy `.env.example` to `.env`**
2. **Configure database connection**
3. **Generate secure secrets**
4. **Run validation script**
5. **Test application startup**
6. **Deploy with environment variables**

This configuration ensures AskiBill can run in any environment with just environment variable changes, no code modifications required.