# AskiBill - Expense Tracking Application

## Overview

AskiBill is a lightweight, secure expense tracking web application built with a full-stack architecture using Express.js backend, React frontend, and PostgreSQL database. It targets users managing personal, professional, and academic expenses with features like secure authentication, financial profile setup, and encrypted personal data storage.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit Auth with OpenID Connect
- **Session Management**: PostgreSQL-based session storage using connect-pg-simple
- **Database Provider**: Neon serverless PostgreSQL

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack Query for server state
- **UI Components**: Radix UI with shadcn/ui design system
- **Styling**: Tailwind CSS with custom CSS variables
- **Form Handling**: React Hook Form with Zod validation

## Key Components

### Database Schema
- **Sessions Table**: Required for Replit Auth session management
- **Users Table**: Core user data (ID, email, name, profile image)
- **User Profiles Table**: Financial and personal information with encrypted data field
- **Expenses Table**: User expense records with encrypted payload support

### Authentication System
- Uses Replit's OpenID Connect authentication
- Session-based authentication with PostgreSQL storage
- Mandatory user operations (getUser, upsertUser) for Replit Auth compatibility
- Protected routes with isAuthenticated middleware

### Frontend Pages
- **Landing**: Authentication entry point
- **Setup**: First-time user financial profile configuration
- **Dashboard**: Main application interface with expense management
- **Profile Management**: Modal-based user profile editing

### Data Encryption
- Client-side encryption support for personal data
- Encrypted data stored as text blobs in database
- Profile data includes encrypted fields for sensitive information

## Data Flow

1. **Authentication Flow**:
   - User authenticates via Replit Auth
   - Session stored in PostgreSQL sessions table
   - User data retrieved/created in users table

2. **Setup Flow**:
   - First-time users complete financial profile setup
   - Data stored in user_profiles table with setup completion flag
   - Redirect to dashboard upon completion

3. **Expense Management**:
   - Users create expenses through modal interface
   - Data stored in expenses table with category and date information
   - Dashboard displays categorized expense summaries

4. **Profile Management**:
   - Users can update personal and financial information
   - Support for encrypted personal data storage
   - Profile photos and sensitive data handled securely

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Neon PostgreSQL connection
- **drizzle-orm**: Type-safe database ORM
- **@tanstack/react-query**: Server state management
- **@radix-ui/react-**: UI component primitives
- **react-hook-form**: Form handling and validation
- **zod**: Schema validation
- **tailwindcss**: Utility-first CSS framework

### Authentication
- **openid-client**: OpenID Connect client for Replit Auth
- **passport**: Authentication middleware
- **express-session**: Session management

### Development Tools
- **vite**: Frontend build tool and dev server
- **tsx**: TypeScript execution for Node.js
- **esbuild**: JavaScript bundler for production

## Deployment Strategy

### Development Environment
- **Dev Server**: Vite development server with HMR
- **Backend**: tsx for TypeScript execution
- **Database**: Neon PostgreSQL (development/production)

### Production Build
- **Frontend**: Vite build outputting to `dist/public`
- **Backend**: esbuild bundling server code to `dist/index.js`
- **Database**: Drizzle migrations in `migrations/` directory
- **Environment**: Uses `DATABASE_URL` for PostgreSQL connection

### Configuration
- **TypeScript**: Shared configuration for client, server, and shared code
- **Path Aliases**: Configured for clean imports (@/, @shared/)
- **Build Scripts**: Separate dev, build, and production start commands
- **Database Management**: `db:push` script for schema deployment

The application follows a monorepo structure with clearly separated client, server, and shared code, making it suitable for deployment on various platforms while maintaining development simplicity.