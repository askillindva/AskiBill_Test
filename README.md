# AskiBill - Secure Expense Tracking Application

A comprehensive financial management web application built with modern full-stack technologies, featuring advanced banking integration, secure user authentication, and intelligent expense tracking with real-time insights.

## 🌟 Features

### Core Features
- **Secure Authentication**: Replit-based OpenID Connect authentication with session management
- **Financial Profile Setup**: Comprehensive user onboarding with encrypted personal data storage
- **Advanced Expense Tracking**: Category-based expense management with intelligent categorization
- **Banking Integration**: Real-time bank account connectivity using India's RBI-approved Account Aggregator framework
- **Interactive Dashboard**: Monthly and annual expense analysis with visual charts and insights
- **Mobile-Optimized**: Responsive design with mobile OTP authentication support

### Banking & Financial Features
- **Multi-Bank Support**: 25+ major Indian banks (SBI, HDFC, ICICI, Axis, Kotak, etc.)
- **Live Balance Sync**: Real-time account balance and transaction synchronization
- **Account Aggregator Integration**: Secure data sharing via Setu, Yodlee, and Anumati APIs
- **Transaction Categorization**: Automatic expense categorization and analysis
- **Savings Visualization**: Monthly savings tracking and goal management
- **Credit Management**: Credit card and loan account monitoring

## 🏗️ Application Architecture

### Project Structure
```
askibill/
├── client/                     # React Frontend Application
│   ├── src/
│   │   ├── components/         # Reusable UI Components
│   │   │   ├── ui/            # shadcn/ui Design System Components
│   │   │   ├── AddBankAccountModal.tsx
│   │   │   ├── BankingSummary.tsx
│   │   │   └── ExpenseModal.tsx
│   │   ├── hooks/             # Custom React Hooks
│   │   │   ├── useAuth.ts     # Authentication Hook
│   │   │   ├── use-toast.ts   # Toast Notification Hook
│   │   │   └── use-mobile.tsx # Mobile Responsiveness Hook
│   │   ├── lib/               # Utility Libraries
│   │   │   ├── queryClient.ts # TanStack Query Configuration
│   │   │   ├── authUtils.ts   # Authentication Utilities
│   │   │   └── utils.ts       # General Utilities
│   │   ├── pages/             # Application Pages
│   │   │   ├── landing.tsx    # Landing Page for Unauthenticated Users
│   │   │   ├── dashboard.tsx  # Main Dashboard for Authenticated Users
│   │   │   ├── setup.tsx      # Financial Profile Setup
│   │   │   ├── auth.tsx       # Authentication Handler
│   │   │   └── not-found.tsx  # 404 Error Page
│   │   ├── App.tsx            # Main Application Component
│   │   ├── main.tsx           # Application Entry Point
│   │   └── index.css          # Global Styles with Tailwind CSS
│   └── index.html             # HTML Template
├── server/                     # Express Backend Application
│   ├── index.ts               # Server Entry Point
│   ├── routes.ts              # API Route Definitions
│   ├── storage.ts             # Data Storage Interface (PostgreSQL)
│   ├── db.ts                  # Database Connection (Neon PostgreSQL)
│   ├── replitAuth.ts          # Replit Authentication Integration
│   ├── bankApiService.ts      # Banking API Service Layer
│   ├── bankProviders.ts       # Financial Institution Providers
│   └── vite.ts                # Vite Development Server Integration
├── shared/                     # Shared Type Definitions
│   └── schema.ts              # Database Schema & Types (Drizzle ORM)
├── components.json            # shadcn/ui Configuration
├── drizzle.config.ts          # Database Migration Configuration
├── package.json               # Dependencies & Scripts
├── tailwind.config.ts         # Tailwind CSS Configuration
├── tsconfig.json              # TypeScript Configuration
├── vite.config.ts             # Vite Build Configuration
└── replit.md                  # Project Documentation & Architecture
```

### Technology Stack

#### Frontend Technologies
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite (Fast build tool with HMR)
- **Routing**: Wouter (Lightweight React router)
- **State Management**: TanStack Query v5 for server state
- **UI Framework**: Radix UI primitives with shadcn/ui design system
- **Styling**: Tailwind CSS with custom CSS variables
- **Form Handling**: React Hook Form with Zod validation
- **Icons**: Lucide React icons
- **Theme**: Next Themes for dark/light mode support

#### Backend Technologies
- **Framework**: Express.js with TypeScript
- **Runtime**: Node.js with tsx for TypeScript execution
- **Database**: PostgreSQL (Neon serverless) with Drizzle ORM
- **Authentication**: Replit Auth with OpenID Connect
- **Session Management**: express-session with PostgreSQL storage
- **Banking APIs**: Account Aggregator framework integration
- **API Providers**: Setu, Yodlee, Anumati for bank connectivity

#### Development & Build Tools
- **Package Manager**: npm
- **TypeScript**: Full-stack type safety
- **Database Migrations**: Drizzle Kit
- **Development Server**: Concurrent frontend (Vite) and backend (tsx)
- **Build Process**: Vite for frontend, esbuild for backend
- **Path Aliases**: Configured for clean imports (@/, @shared/)

## 🚀 Quick Start

### Prerequisites
- **Node.js**: Version 18 or higher
- **npm**: Version 8 or higher
- **PostgreSQL Database**: Neon or local PostgreSQL instance

### Environment Setup

1. **Clone the Repository**
```bash
git clone <repository-url>
cd askibill
```

2. **Install Dependencies**
```bash
npm install
```

3. **Environment Variables**
Create a `.env` file in the root directory with the following variables:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@host:port/database
PGHOST=your-postgres-host
PGPORT=5432
PGUSER=your-postgres-user
PGPASSWORD=your-postgres-password
PGDATABASE=your-database-name

# Authentication (Provided by Replit)
SESSION_SECRET=your-session-secret
REPL_ID=your-repl-id
ISSUER_URL=https://replit.com/oidc
REPLIT_DOMAINS=your-domain.replit.dev

# Banking API Configuration (Optional for development)
BANK_API_KEY=your-bank-api-key
BANK_CLIENT_ID=your-client-id
BANK_CLIENT_SECRET=your-client-secret
```

### Database Setup

4. **Initialize Database Schema**
```bash
# Push database schema to PostgreSQL
npm run db:push

# Alternative: Generate and run migrations
npm run db:generate
npm run db:migrate
```

### Development

5. **Start Development Server**
```bash
# Starts both frontend (Vite) and backend (Express) servers
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:5173 (Vite dev server)
- **Backend API**: http://localhost:5000 (Express server)
- **Combined**: http://localhost:5000 (Production-like setup)

### Production Build

6. **Build for Production**
```bash
# Build frontend and backend
npm run build

# Start production server
npm start
```

## 📊 Database Schema

### Core Tables
- **users**: User authentication and profile data
- **user_profiles**: Financial profiles with encrypted personal data
- **expenses**: User expense records with category classification
- **bank_accounts**: Connected bank account information
- **bank_transactions**: Synchronized transaction history
- **sessions**: Session storage for authentication

### Key Features
- **Data Encryption**: Sensitive personal data encrypted at rest
- **Relational Integrity**: Proper foreign key relationships
- **Type Safety**: Full TypeScript integration with Drizzle ORM
- **Migration Support**: Version-controlled schema changes

## 🏦 Banking Integration

### Account Aggregator Framework
The application integrates with India's Reserve Bank of India (RBI) approved Account Aggregator ecosystem for secure financial data sharing.

#### Supported Providers
- **Setu**: Primary API provider for major banks
- **Yodlee**: International banking data aggregation
- **Anumati**: RBI-licensed Account Aggregator

#### Supported Banks (25+)
- State Bank of India (SBI)
- HDFC Bank
- ICICI Bank
- Axis Bank
- Kotak Mahindra Bank
- Punjab National Bank
- Bank of Baroda
- Canara Bank
- Union Bank of India
- IDFC First Bank
- Yes Bank
- IndusInd Bank
- Federal Bank
- RBL Bank
- And many more...

#### Banking Features
- **OAuth Authentication**: Secure bank login flow
- **Real-time Sync**: Live balance and transaction updates
- **Multi-account Support**: Multiple accounts per bank
- **Transaction Categorization**: AI-powered expense classification
- **Consent Management**: User-controlled data sharing permissions

## 🔧 Development Scripts

```bash
# Start development servers (recommended)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Database operations
npm run db:push      # Push schema changes to database
npm run db:generate  # Generate migration files
npm run db:migrate   # Run pending migrations
npm run db:studio    # Open Drizzle Studio (database GUI)

# Type checking
npm run type-check   # Check TypeScript types

# Linting and formatting
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
```

## 🔒 Security Features

### Authentication & Authorization
- **OpenID Connect**: Industry-standard authentication protocol
- **Session Security**: Secure session management with PostgreSQL storage
- **CSRF Protection**: Cross-site request forgery prevention
- **Data Encryption**: Client-side encryption for sensitive data

### Banking Security
- **Account Aggregator Compliance**: RBI-approved data sharing framework
- **OAuth 2.0**: Secure bank authentication
- **Consent Management**: Granular user consent for data access
- **Token Management**: Secure handling of banking API tokens

## 🌐 Deployment

### Replit Deployment
The application is optimized for deployment on Replit:

1. **Automatic Setup**: Dependencies and database configured automatically
2. **Environment Variables**: Managed through Replit's secrets system
3. **Domain Configuration**: Custom domain support with SSL
4. **Scaling**: Automatic scaling based on usage

### Production Considerations
- **Database**: Use production PostgreSQL (Neon recommended)
- **Environment Variables**: Secure management of API keys and secrets
- **SSL/TLS**: HTTPS enforcement for secure data transmission
- **Monitoring**: Application and API monitoring setup

## 🤝 Contributing

### Development Guidelines
1. **Code Style**: Follow TypeScript and React best practices
2. **Database Changes**: Use Drizzle migrations for schema changes
3. **API Design**: RESTful API design with proper error handling
4. **Testing**: Write tests for critical functionality
5. **Documentation**: Update README and code comments

### Project Structure Guidelines
- **Separation of Concerns**: Clear separation between client, server, and shared code
- **Type Safety**: Use TypeScript throughout the application
- **Error Handling**: Comprehensive error handling and user feedback
- **Performance**: Optimize database queries and API calls

## 📝 License

This project is licensed under the MIT License. See the LICENSE file for details.

## 🔗 Additional Resources

- **Replit Documentation**: https://docs.replit.com/
- **Account Aggregator Framework**: https://www.rbi.org.in/Scripts/PublicationReportDetails.aspx?UrlPage=&ID=918
- **Neon PostgreSQL**: https://neon.tech/docs
- **Drizzle ORM**: https://orm.drizzle.team/
- **shadcn/ui**: https://ui.shadcn.com/
- **TanStack Query**: https://tanstack.com/query/latest

---

**AskiBill** - Empowering financial management through secure technology and intelligent insights.