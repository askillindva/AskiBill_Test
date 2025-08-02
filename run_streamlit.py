#!/usr/bin/env python3
"""
AskiBill Streamlit App Runner
Starts the Streamlit frontend with proper configuration
"""

import subprocess
import sys
import os
from pathlib import Path

def main():
    """Run the Streamlit application"""
    
    # Set environment variables
    os.environ.setdefault("STREAMLIT_SERVER_PORT", "8501")
    os.environ.setdefault("STREAMLIT_SERVER_ADDRESS", "0.0.0.0")
    os.environ.setdefault("STREAMLIT_BROWSER_GATHER_USAGE_STATS", "false")
    
    # Streamlit configuration
    config_args = [
        "--server.port", "8501",
        "--server.address", "0.0.0.0",
        "--browser.gatherUsageStats", "false",
        "--server.headless", "true"
    ]
    
    # Run Streamlit
    cmd = [sys.executable, "-m", "streamlit", "run", "streamlit_app.py"] + config_args
    
    print("🚀 Starting AskiBill Streamlit Frontend...")
    print(f"📱 Access the app at: http://localhost:8501")
    print("🔗 FastAPI Backend should be running at: http://localhost:8000")
    print("─" * 50)
    
    try:
        subprocess.run(cmd, check=True)
    except KeyboardInterrupt:
        print("\n👋 Shutting down Streamlit app...")
    except subprocess.CalledProcessError as e:
        print(f"❌ Error running Streamlit: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()