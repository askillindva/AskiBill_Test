# AskiBill - Python Full Stack Expense Tracker

A modern, secure expense tracking application built with **Python, FastAPI, and Streamlit**.

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- PostgreSQL database (local or cloud)
- Environment variables configured

### Installation & Setup

1. **Install dependencies**:
```bash
# Install from project requirements
pip install -r project_requirements.txt

# Or install individually using the package manager
pip install fastapi uvicorn streamlit sqlalchemy psycopg2-binary pandas plotly
```

2. **Database Setup**:
```bash
# Copy environment template
cp .env.example .env
```

3. **Configure PostgreSQL** (see Database Configuration section below)

4. **Run the application**:
```bash
# Start Streamlit frontend
streamlit run streamlit_app.py --server.port 8501 --server.address 0.0.0.0

# Or use the startup script
python start_streamlit.py
```

### Access Points
- **Streamlit Frontend**: http://localhost:8501
- **FastAPI Backend**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## 🗄️ Database Configuration

### PostgreSQL Setup Options

#### Option 1: Replit Built-in PostgreSQL (Recommended for Development)
Your Replit environment already includes PostgreSQL. The `DATABASE_URL` environment variable is automatically configured.

```bash
# Check if PostgreSQL is running
echo $DATABASE_URL
```

#### Option 2: Local PostgreSQL Installation

1. **Install PostgreSQL**:
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# macOS with Homebrew
brew install postgresql
brew services start postgresql

# Windows - Download from https://www.postgresql.org/download/
```

2. **Create Database and User**:
```bash
# Access PostgreSQL shell
sudo -u postgres psql

# Create database and user
CREATE DATABASE askibill_db;
CREATE USER askibill_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE askibill_db TO askibill_user;
\q
```

#### Option 3: Cloud PostgreSQL Providers

**Neon (Recommended for Production)**:
1. Sign up at [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string

**Supabase**:
1. Sign up at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings > Database > Connection string

**Railway**:
1. Sign up at [railway.app](https://railway.app)
2. Create PostgreSQL service
3. Copy the connection URL

### Environment Configuration

Create or update your `.env` file:

```bash
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/askibill_db

# For Replit (automatically provided)
# DATABASE_URL=postgresql://replit:password@db.postgresql-16.devbox.host:5432/replit

# For Neon
# DATABASE_URL=postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb

# For Supabase
# DATABASE_URL=postgresql://postgres:password@db.xxx.supabase.co:5432/postgres

# For Railway
# DATABASE_URL=postgresql://postgres:password@containers-us-west-xxx.railway.app:5432/railway

# Application Secrets
SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-key-here
ENCRYPTION_KEY=your-encryption-key-here

# Optional: Banking API Keys
# PLAID_CLIENT_ID=your_plaid_client_id
# PLAID_SECRET=your_plaid_secret
# PLAID_ENV=sandbox  # or development/production
```

### Database Migration and Setup

```bash
# Initialize database tables (when backend is implemented)
python -c "
from backend.app.core.database import engine
from backend.app.models import user, expense, bank_account
import asyncio
async def create_tables():
    async with engine.begin() as conn:
        await conn.run_sync(user.Base.metadata.create_all)
        await conn.run_sync(expense.Base.metadata.create_all)
        await conn.run_sync(bank_account.Base.metadata.create_all)
asyncio.run(create_tables())
"
```

### Connection Testing

Test your database connection:

```python
# test_db_connection.py
import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()

async def test_connection():
    try:
        conn = await asyncpg.connect(os.getenv('DATABASE_URL'))
        version = await conn.fetchval('SELECT version()')
        print(f"✅ Connected to PostgreSQL: {version}")
        await conn.close()
    except Exception as e:
        print(f"❌ Connection failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_connection())
```

Run the test:
```bash
python test_db_connection.py
```

### Troubleshooting Database Issues

**Common Issues and Solutions**:

1. **Connection Refused**:
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql
# Start if not running
sudo systemctl start postgresql
```

2. **Authentication Failed**:
```bash
# Reset password
sudo -u postgres psql
\password askibill_user
```

3. **Database Does Not Exist**:
```bash
# Create database
sudo -u postgres createdb askibill_db
```

4. **Permission Denied**:
```bash
# Grant permissions
sudo -u postgres psql
GRANT ALL PRIVILEGES ON DATABASE askibill_db TO askibill_user;
GRANT ALL ON SCHEMA public TO askibill_user;
```

### Database Schema Overview

The application uses the following main tables:
- `users` - User authentication and profile data
- `user_profiles` - Extended user information and preferences
- `expenses` - Expense records with categories and dates
- `bank_accounts` - Connected bank account information
- `transactions` - Imported banking transactions
- `categories` - Expense categories and budgets
- `sessions` - User session management

## 🏗 Architecture

### Tech Stack
- **Frontend**: Streamlit with Plotly charts
- **Backend**: FastAPI with SQLAlchemy 2.0
- **Database**: PostgreSQL with async support
- **Authentication**: JWT-based secure auth
- **Banking**: India RBI Account Aggregator framework

### Project Structure
```
askibill/
├── main.py                 # Application entry point
├── streamlit_app.py        # Streamlit frontend
├── backend/                # FastAPI backend
│   ├── app/
│   │   ├── main.py        # FastAPI app
│   │   ├── core/          # Configuration & database
│   │   ├── models/        # Database models
│   │   ├── api/           # API routes
│   │   └── services/      # Business logic
├── .env                   # Environment configuration
└── docker-compose.yml    # Container deployment
```

## 📊 Features

### Financial Management
- **Expense Tracking**: Categorized expense entry and management
- **Budget Planning**: Monthly budgets with progress tracking
- **Savings Goals**: Target setting and achievement monitoring
- **Financial Analytics**: Advanced charts and insights

### Banking Integration
- **Account Aggregator**: RBI-compliant bank data access
- **Real-time Balances**: Live bank account synchronization
- **Transaction Import**: Automatic expense categorization
- **Multiple Banks**: Support for all major Indian banks

### Interactive Dashboard
- **Real-time Metrics**: Expenses, savings rate, budget utilization
- **Visual Analytics**: Pie charts, trend lines, category breakdowns
- **Smart Insights**: AI-powered spending recommendations
- **Mobile Responsive**: Works on all devices

## 🔧 Configuration

### Environment Variables
Copy `.env.example` to `.env` and configure:

```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/askibill
PYTHON_DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/askibill

# Authentication
SECRET_KEY=your-secret-key-32-characters-min
ENCRYPTION_KEY=your-encryption-key-base64

# Banking APIs (optional for development)
SETU_API_KEY=your-setu-api-key
YODLEE_API_KEY=your-yodlee-api-key
```

### Automated Setup
```bash
# Interactive environment setup
./scripts/setup-env.sh

# Validate configuration
python scripts/check-env.py
```

## 🐳 Docker Deployment

### Development
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

### Production
```bash
# Build and deploy
docker-compose -f docker-compose.yml up -d

# Scale services
docker-compose up -d --scale backend=3
```

## 🛡 Security Features

### Data Protection
- **Client-side Encryption**: Sensitive data encrypted before storage
- **JWT Authentication**: Secure session management
- **Password Hashing**: Bcrypt with salt rounds
- **Environment Secrets**: External configuration management

### Banking Security
- **Account Aggregator**: RBI-approved secure banking protocol
- **OAuth 2.0**: Industry-standard bank authentication
- **Data Minimization**: Only necessary financial data access
- **Audit Logging**: Comprehensive access tracking

## 📱 User Interface

### Streamlit Frontend
- **Interactive Dashboard**: Real-time financial metrics
- **Form Validation**: Input validation and error handling
- **Responsive Design**: Mobile and desktop optimized
- **Rich Charts**: Plotly integration for data visualization

### Key Pages
1. **Dashboard**: Overview metrics and recent transactions
2. **Add Expense**: Quick expense entry with categories
3. **Analytics**: Advanced spending analysis and trends
4. **Profile**: User settings and financial goals
5. **Bank Accounts**: Connected accounts and balances

## 🔄 Data Flow

```
User Input → Streamlit UI → FastAPI Backend → PostgreSQL Database
                                ↓
Banking APIs ← Account Aggregator ← FastAPI Services
```

## 🧪 Development

### Local Development
```bash
# Start FastAPI backend
cd backend
uvicorn app.main:app --reload --port 8000

# Start Streamlit frontend (separate terminal)
streamlit run streamlit_app.py --server.port 8501
```

### Testing
```bash
# Run backend tests
cd backend
pytest

# Test API endpoints
curl http://localhost:8000/health
```

## 📊 Analytics & Insights

### Built-in Analytics
- **Spending Patterns**: Weekly, monthly, and yearly trends
- **Category Analysis**: Detailed expense breakdowns
- **Budget Tracking**: Progress towards financial goals
- **Savings Rate**: Income vs expense analysis

### AI-Powered Features
- **Smart Categorization**: Automatic expense classification
- **Spending Alerts**: Budget overrun notifications
- **Savings Recommendations**: Personalized financial advice
- **Trend Predictions**: Future spending forecasts

## 🌐 Deployment Options

### Cloud Platforms
- **Replit**: Direct deployment from this environment
- **Streamlit Cloud**: Free frontend hosting
- **Railway/Render**: Full-stack deployment
- **Heroku**: Container-based deployment

### Self-Hosted
- **Docker Compose**: Complete application stack
- **Kubernetes**: Scalable container orchestration
- **Traditional VPS**: Manual setup on Linux servers

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Documentation**: [Full API Documentation](http://localhost:8000/docs)
- **Environment Guide**: [ENV_CONFIG_GUIDE.md](ENV_CONFIG_GUIDE.md)
- **Banking Integration**: [Account Aggregator Framework](https://www.rbi.org.in/commonperson/aa.html)

---

Built with ❤️ using Python, FastAPI, and Streamlit