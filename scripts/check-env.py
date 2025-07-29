#!/usr/bin/env python3
"""
Environment Variables Checker for AskiBill
Validates that all required environment variables are properly configured
"""

import os
import sys
from pathlib import Path
from typing import Dict, List, Tuple
import re

# Colors for terminal output
class Colors:
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BLUE = '\033[94m'
    BOLD = '\033[1m'
    END = '\033[0m'

def print_status(message: str):
    print(f"{Colors.GREEN}✓{Colors.END} {message}")

def print_warning(message: str):
    print(f"{Colors.YELLOW}⚠{Colors.END} {message}")

def print_error(message: str):
    print(f"{Colors.RED}✗{Colors.END} {message}")

def print_info(message: str):
    print(f"{Colors.BLUE}ℹ{Colors.END} {message}")

# Required environment variables for different components
REQUIRED_VARS = {
    "database": [
        "DATABASE_URL",
    ],
    "authentication": [
        "SECRET_KEY",
        "SESSION_SECRET",
    ],
    "application": [
        "NODE_ENV",
        "ENVIRONMENT",
    ]
}

# Optional but recommended variables
RECOMMENDED_VARS = {
    "database": [
        "PGHOST", "PGPORT", "PGUSER", "PGPASSWORD", "PGDATABASE",
        "PYTHON_DATABASE_URL",
    ],
    "security": [
        "ENCRYPTION_KEY",
        "ALLOWED_ORIGINS",
        "ALLOWED_HOSTS",
    ],
    "banking": [
        "SETU_API_KEY", "SETU_CLIENT_ID", "SETU_CLIENT_SECRET",
        "YODLEE_API_KEY", "YODLEE_CLIENT_ID", "YODLEE_CLIENT_SECRET",
        "ANUMATI_API_KEY",
    ],
    "external_services": [
        "REDIS_URL", "SMTP_SERVER", "SMTP_USERNAME", "SMTP_PASSWORD",
        "TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN",
    ],
    "monitoring": [
        "SENTRY_DSN", "LOG_LEVEL",
    ]
}

def load_env_file(env_path: Path) -> Dict[str, str]:
    """Load environment variables from .env file"""
    env_vars = {}
    if env_path.exists():
        with open(env_path, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    env_vars[key] = value
    return env_vars

def validate_database_url(url: str) -> Tuple[bool, str]:
    """Validate database URL format"""
    if not url:
        return False, "Database URL is empty"
    
    patterns = [
        r'^postgresql://[^:]+:[^@]+@[^:/]+:\d+/\w+',
        r'^postgresql\+asyncpg://[^:]+:[^@]+@[^:/]+:\d+/\w+',
        r'^postgres://[^:]+:[^@]+@[^:/]+:\d+/\w+',
    ]
    
    for pattern in patterns:
        if re.match(pattern, url):
            return True, "Valid database URL format"
    
    return False, "Invalid database URL format"

def validate_secret_key(key: str) -> Tuple[bool, str]:
    """Validate secret key strength"""
    if not key:
        return False, "Secret key is empty"
    
    if len(key) < 32:
        return False, "Secret key should be at least 32 characters long"
    
    if key.startswith("your-") or "change" in key.lower():
        return False, "Secret key appears to be a placeholder"
    
    return True, "Secret key appears valid"

def check_required_variables(env_vars: Dict[str, str]) -> List[str]:
    """Check for required environment variables"""
    missing = []
    
    for category, vars_list in REQUIRED_VARS.items():
        for var in vars_list:
            if var not in env_vars or not env_vars[var]:
                missing.append(f"{var} ({category})")
    
    return missing

def check_recommended_variables(env_vars: Dict[str, str]) -> Dict[str, List[str]]:
    """Check for recommended environment variables"""
    missing_by_category = {}
    
    for category, vars_list in RECOMMENDED_VARS.items():
        missing = []
        for var in vars_list:
            if var not in env_vars or not env_vars[var]:
                missing.append(var)
        if missing:
            missing_by_category[category] = missing
    
    return missing_by_category

def validate_specific_variables(env_vars: Dict[str, str]) -> List[Tuple[str, bool, str]]:
    """Validate specific environment variables"""
    validations = []
    
    # Database URL validation
    if "DATABASE_URL" in env_vars:
        is_valid, message = validate_database_url(env_vars["DATABASE_URL"])
        validations.append(("DATABASE_URL", is_valid, message))
    
    # Secret key validation
    if "SECRET_KEY" in env_vars:
        is_valid, message = validate_secret_key(env_vars["SECRET_KEY"])
        validations.append(("SECRET_KEY", is_valid, message))
    
    if "SESSION_SECRET" in env_vars:
        is_valid, message = validate_secret_key(env_vars["SESSION_SECRET"])
        validations.append(("SESSION_SECRET", is_valid, message))
    
    return validations

def main():
    print(f"{Colors.BOLD}AskiBill Environment Variables Checker{Colors.END}")
    print("=" * 40)
    
    # Check for .env file
    env_path = Path(".env")
    if not env_path.exists():
        print_error(".env file not found!")
        print_info("Run: cp .env.example .env")
        sys.exit(1)
    
    print_status(".env file found")
    
    # Load environment variables
    env_vars = load_env_file(env_path)
    os_env_vars = dict(os.environ)
    
    # Merge with OS environment variables (OS takes precedence)
    all_env_vars = {**env_vars, **os_env_vars}
    
    print_info(f"Loaded {len(env_vars)} variables from .env file")
    print_info(f"Found {len(os_env_vars)} OS environment variables")
    
    # Check required variables
    print(f"\n{Colors.BOLD}Required Variables:{Colors.END}")
    missing_required = check_required_variables(all_env_vars)
    
    if missing_required:
        print_error("Missing required variables:")
        for var in missing_required:
            print(f"  • {var}")
        has_errors = True
    else:
        print_status("All required variables are present")
        has_errors = False
    
    # Validate specific variables
    print(f"\n{Colors.BOLD}Variable Validation:{Colors.END}")
    validations = validate_specific_variables(all_env_vars)
    
    for var_name, is_valid, message in validations:
        if is_valid:
            print_status(f"{var_name}: {message}")
        else:
            print_error(f"{var_name}: {message}")
            has_errors = True
    
    # Check recommended variables
    print(f"\n{Colors.BOLD}Recommended Variables:{Colors.END}")
    missing_recommended = check_recommended_variables(all_env_vars)
    
    if missing_recommended:
        for category, missing_vars in missing_recommended.items():
            print_warning(f"Missing {category} variables:")
            for var in missing_vars:
                print(f"  • {var}")
    else:
        print_status("All recommended variables are present")
    
    # Environment-specific checks
    environment = all_env_vars.get("ENVIRONMENT", "development")
    print(f"\n{Colors.BOLD}Environment: {environment}{Colors.END}")
    
    if environment in ["production", "staging"]:
        print_warning("Production/Staging environment detected")
        prod_checks = [
            ("DEBUG", "false"),
            ("LOG_LEVEL", "info"),
            ("ENABLE_DOCS", "false"),
        ]
        
        for var, expected_value in prod_checks:
            actual_value = all_env_vars.get(var, "").lower()
            if actual_value != expected_value:
                print_warning(f"{var} should be '{expected_value}' in production (current: '{actual_value}')")
    
    # Summary
    print(f"\n{Colors.BOLD}Summary:{Colors.END}")
    if has_errors:
        print_error("Configuration has errors that need to be fixed")
        print_info("Fix the errors above and run this script again")
        sys.exit(1)
    elif missing_recommended:
        print_warning("Configuration is functional but could be improved")
        print_info("Consider adding the recommended variables for full functionality")
        sys.exit(0)
    else:
        print_status("Environment configuration looks good!")
        print_info("Ready to start the application")
        sys.exit(0)

if __name__ == "__main__":
    main()