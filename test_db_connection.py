#!/usr/bin/env python3
"""
PostgreSQL Database Connection Test for AskiBill
Test your database configuration before running the application
"""

import asyncio
import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

async def test_connection():
    """Test PostgreSQL connection using different methods"""
    database_url = os.getenv('DATABASE_URL')
    
    if not database_url:
        print("❌ DATABASE_URL environment variable not found")
        print("Please check your .env file configuration")
        return False
    
    print(f"🔍 Testing connection to: {database_url.split('@')[1] if '@' in database_url else 'database'}")
    
    # Test 1: Using asyncpg (preferred for async applications)
    try:
        import asyncpg
        conn = await asyncpg.connect(database_url)
        version = await conn.fetchval('SELECT version()')
        print(f"✅ AsyncPG Connection successful!")
        print(f"   PostgreSQL Version: {version.split(',')[0]}")
        await conn.close()
    except ImportError:
        print("⚠️  asyncpg not installed, skipping async test")
    except Exception as e:
        print(f"❌ AsyncPG Connection failed: {e}")
        return False
    
    # Test 2: Using psycopg2 (synchronous, for Streamlit)
    try:
        import psycopg2
        from urllib.parse import urlparse
        
        # Parse DATABASE_URL for psycopg2
        url = urlparse(database_url)
        conn = psycopg2.connect(
            host=url.hostname,
            port=url.port,
            database=url.path[1:],  # Remove leading slash
            user=url.username,
            password=url.password
        )
        
        with conn.cursor() as cursor:
            cursor.execute('SELECT version()')
            version = cursor.fetchone()[0]
            print(f"✅ Psycopg2 Connection successful!")
            
            # Test table creation permissions
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS connection_test (
                    id SERIAL PRIMARY KEY,
                    test_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
            cursor.execute("INSERT INTO connection_test DEFAULT VALUES;")
            cursor.execute("SELECT COUNT(*) FROM connection_test;")
            count = cursor.fetchone()[0]
            print(f"   Table operations successful! Test records: {count}")
            
            # Clean up test table
            cursor.execute("DROP TABLE connection_test;")
            conn.commit()
            
        conn.close()
        
    except ImportError:
        print("⚠️  psycopg2 not installed, skipping sync test")
    except Exception as e:
        print(f"❌ Psycopg2 Connection failed: {e}")
        return False
    
    # Test 3: SQLAlchemy connection (for FastAPI backend)
    try:
        from sqlalchemy import create_engine, text
        from sqlalchemy.pool import NullPool
        
        # Convert postgres:// to postgresql:// if needed
        if database_url.startswith('postgres://'):
            database_url = database_url.replace('postgres://', 'postgresql://', 1)
        
        engine = create_engine(database_url, poolclass=NullPool)
        
        with engine.connect() as conn:
            result = conn.execute(text('SELECT current_database(), current_user'))
            db_name, user = result.fetchone()
            print(f"✅ SQLAlchemy Connection successful!")
            print(f"   Database: {db_name}, User: {user}")
            
    except ImportError:
        print("⚠️  SQLAlchemy not installed, skipping ORM test")
    except Exception as e:
        print(f"❌ SQLAlchemy Connection failed: {e}")
        return False
    
    print("\n🎉 All database connections successful!")
    print("Your PostgreSQL configuration is ready for AskiBill!")
    return True

def check_environment():
    """Check environment variables and dependencies"""
    print("🔧 Checking environment configuration...")
    
    required_vars = ['DATABASE_URL']
    optional_vars = ['SECRET_KEY', 'JWT_SECRET_KEY', 'ENCRYPTION_KEY']
    
    missing_required = []
    missing_optional = []
    
    for var in required_vars:
        if not os.getenv(var):
            missing_required.append(var)
        else:
            print(f"✅ {var}: configured")
    
    for var in optional_vars:
        if not os.getenv(var):
            missing_optional.append(var)
        else:
            print(f"✅ {var}: configured")
    
    if missing_required:
        print(f"\n❌ Missing required environment variables: {', '.join(missing_required)}")
        print("Please add these to your .env file")
        return False
    
    if missing_optional:
        print(f"\n⚠️  Missing optional environment variables: {', '.join(missing_optional)}")
        print("These are recommended for production use")
    
    return True

def check_dependencies():
    """Check if required packages are installed"""
    print("\n📦 Checking Python dependencies...")
    
    required_packages = {
        'streamlit': 'Streamlit frontend framework',
        'fastapi': 'FastAPI backend framework',
        'sqlalchemy': 'Database ORM',
        'pandas': 'Data processing',
        'plotly': 'Charts and visualization'
    }
    
    database_packages = {
        'psycopg2': 'PostgreSQL adapter (synchronous)',
        'asyncpg': 'PostgreSQL adapter (asynchronous)'
    }
    
    missing_packages = []
    
    for package, description in required_packages.items():
        try:
            __import__(package)
            print(f"✅ {package}: {description}")
        except ImportError:
            missing_packages.append(package)
            print(f"❌ {package}: {description} - NOT INSTALLED")
    
    db_packages_available = []
    for package, description in database_packages.items():
        try:
            __import__(package)
            print(f"✅ {package}: {description}")
            db_packages_available.append(package)
        except ImportError:
            print(f"⚠️  {package}: {description} - NOT INSTALLED")
    
    if not db_packages_available:
        missing_packages.extend(['psycopg2-binary'])
        print("❌ No PostgreSQL adapters found!")
    
    if missing_packages:
        print(f"\n📥 To install missing packages:")
        print(f"pip install {' '.join(missing_packages)}")
        return False
    
    return True

async def main():
    """Main test function"""
    print("=" * 60)
    print("🏦 AskiBill PostgreSQL Database Connection Test")
    print("=" * 60)
    
    # Check dependencies
    deps_ok = check_dependencies()
    
    # Check environment
    env_ok = check_environment()
    
    if not (deps_ok and env_ok):
        print("\n❌ Pre-flight checks failed. Please resolve the issues above.")
        sys.exit(1)
    
    # Test database connection
    print("\n" + "=" * 60)
    print("🔗 Testing Database Connections")
    print("=" * 60)
    
    connection_ok = await test_connection()
    
    if connection_ok:
        print("\n" + "=" * 60)
        print("🚀 Ready to start AskiBill!")
        print("Run: streamlit run streamlit_app.py")
        print("=" * 60)
        sys.exit(0)
    else:
        print("\n❌ Database connection tests failed.")
        print("Please check your DATABASE_URL and PostgreSQL configuration.")
        sys.exit(1)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n⏹️  Test interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n💥 Unexpected error: {e}")
        sys.exit(1)