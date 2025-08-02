# AskiBill - Python Full Stack Expense Tracker

A modern, secure expense tracking application built with **Python, FastAPI, and Streamlit**.

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- PostgreSQL database
- Environment variables configured

### Installation & Setup

1. **Clone and setup environment**:
```bash
# Copy environment template
cp .env.example .env

# Configure your database URL and secrets in .env
nano .env
```

2. **Install dependencies** (already installed in Replit):
```bash
# Dependencies are managed automatically
pip install -r backend/requirements.txt
```

3. **Run the application**:
```bash
# Single command to start both FastAPI and Streamlit
python main.py
```

### Access Points
- **Streamlit Frontend**: http://localhost:8501
- **FastAPI Backend**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

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