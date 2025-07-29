#!/bin/bash

# AskiBill Environment Setup Script
# This script helps set up environment variables for different deployment environments

set -e

echo "🚀 AskiBill Environment Setup"
echo "=============================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Check if .env file exists
if [ ! -f ".env" ]; then
    print_info "Creating .env file from template..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        print_status ".env file created from .env.example"
    else
        print_error ".env.example file not found!"
        exit 1
    fi
else
    print_warning ".env file already exists"
    read -p "Do you want to update it? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Backing up existing .env to .env.backup"
        cp .env .env.backup
    else
        print_info "Keeping existing .env file"
        exit 0
    fi
fi

# Environment selection
echo
echo "Select deployment environment:"
echo "1) Development (local)"
echo "2) Staging"
echo "3) Production"
echo "4) Docker (local containers)"
read -p "Enter choice (1-4): " env_choice

case $env_choice in
    1)
        ENV_TYPE="development"
        print_info "Setting up for development environment..."
        ;;
    2)
        ENV_TYPE="staging"
        print_info "Setting up for staging environment..."
        ;;
    3)
        ENV_TYPE="production"
        print_info "Setting up for production environment..."
        ;;
    4)
        ENV_TYPE="docker"
        print_info "Setting up for Docker environment..."
        ;;
    *)
        print_error "Invalid choice"
        exit 1
        ;;
esac

# Function to update or add environment variable
update_env_var() {
    local key=$1
    local value=$2
    
    if grep -q "^${key}=" .env; then
        # Update existing variable
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' "s|^${key}=.*|${key}=${value}|" .env
        else
            # Linux
            sed -i "s|^${key}=.*|${key}=${value}|" .env
        fi
    else
        # Add new variable
        echo "${key}=${value}" >> .env
    fi
}

# Common configuration
update_env_var "NODE_ENV" "$ENV_TYPE"
update_env_var "ENVIRONMENT" "$ENV_TYPE"

case $ENV_TYPE in
    "development")
        update_env_var "DEBUG" "true"
        update_env_var "LOG_LEVEL" "debug"
        update_env_var "ENABLE_DOCS" "true"
        update_env_var "UVICORN_RELOAD" "true"
        update_env_var "DATABASE_ECHO" "true"
        
        # Default development database
        if ! grep -q "^DATABASE_URL=" .env || grep -q "^DATABASE_URL=$" .env; then
            print_warning "DATABASE_URL not set. Please configure your database connection."
            read -p "Enter PostgreSQL connection URL: " db_url
            if [ ! -z "$db_url" ]; then
                update_env_var "DATABASE_URL" "$db_url"
                print_status "Database URL configured"
            fi
        fi
        ;;
        
    "staging"|"production")
        update_env_var "DEBUG" "false"
        update_env_var "LOG_LEVEL" "info"
        update_env_var "ENABLE_DOCS" "false"
        update_env_var "UVICORN_RELOAD" "false"
        update_env_var "DATABASE_ECHO" "false"
        
        print_warning "Production/Staging environment detected"
        print_info "Make sure to set secure values for:"
        echo "  - SECRET_KEY"
        echo "  - DATABASE_URL"
        echo "  - All API keys"
        ;;
        
    "docker")
        update_env_var "DEBUG" "false"
        update_env_var "LOG_LEVEL" "info"
        update_env_var "UVICORN_HOST" "0.0.0.0"
        update_env_var "DATABASE_URL" "postgresql://askibill_user:secure_password_123@postgres:5432/askibill"
        update_env_var "PYTHON_DATABASE_URL" "postgresql+asyncpg://askibill_user:secure_password_123@postgres:5432/askibill"
        update_env_var "REDIS_URL" "redis://redis:6379"
        update_env_var "PGHOST" "postgres"
        update_env_var "REDIS_HOST" "redis"
        ;;
esac

# Generate secret key if not present
if ! grep -q "^SECRET_KEY=" .env || grep -q "^SECRET_KEY=$" .env || grep -q "^SECRET_KEY=your-" .env; then
    print_info "Generating new SECRET_KEY..."
    if command -v openssl &> /dev/null; then
        SECRET_KEY=$(openssl rand -hex 32)
        update_env_var "SECRET_KEY" "$SECRET_KEY"
        print_status "SECRET_KEY generated and configured"
    elif command -v python3 &> /dev/null; then
        SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_hex(32))")
        update_env_var "SECRET_KEY" "$SECRET_KEY"
        print_status "SECRET_KEY generated and configured"
    else
        print_warning "Could not generate SECRET_KEY automatically. Please set it manually."
    fi
fi

# Generate encryption key if not present
if ! grep -q "^ENCRYPTION_KEY=" .env || grep -q "^ENCRYPTION_KEY=$" .env || grep -q "^ENCRYPTION_KEY=your-" .env; then
    print_info "Generating ENCRYPTION_KEY..."
    if command -v openssl &> /dev/null; then
        ENCRYPTION_KEY=$(openssl rand -base64 32)
        update_env_var "ENCRYPTION_KEY" "$ENCRYPTION_KEY"
        print_status "ENCRYPTION_KEY generated and configured"
    elif command -v python3 &> /dev/null; then
        ENCRYPTION_KEY=$(python3 -c "import base64, secrets; print(base64.b64encode(secrets.token_bytes(32)).decode())")
        update_env_var "ENCRYPTION_KEY" "$ENCRYPTION_KEY"
        print_status "ENCRYPTION_KEY generated and configured"
    else
        print_warning "Could not generate ENCRYPTION_KEY automatically. Please set it manually."
    fi
fi

print_status "Environment setup completed!"
echo
print_info "Next steps:"
echo "1. Review and update .env file with your specific configuration"
echo "2. Set up your database connection (DATABASE_URL)"
echo "3. Configure banking API keys (SETU_API_KEY, etc.)"
echo "4. For production: Set up external services (Redis, SMTP, etc.)"
echo
print_info "To start the application:"
if [ "$ENV_TYPE" = "docker" ]; then
    echo "  docker-compose up -d"
else
    echo "  npm run dev  (JavaScript version)"
    echo "  or"
    echo "  cd backend && uvicorn app.main:app --reload  (Python version)"
fi

echo
print_warning "Remember to:"
echo "• Never commit .env file to version control"
echo "• Use different secrets for each environment"
echo "• Regularly rotate secrets in production"
echo "• Test the configuration before deploying"