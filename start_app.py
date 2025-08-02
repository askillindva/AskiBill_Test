#!/usr/bin/env python3
"""
Simple startup script for AskiBill Streamlit Application
"""

import subprocess
import sys
import os

def main():
    """Start the Streamlit application"""
    print("🌟 Starting AskiBill - Streamlit Application")
    print("=" * 50)
    print("📊 Application will be available at: http://localhost:8501")
    print("=" * 50)
    
    # Start Streamlit
    cmd = [
        sys.executable, "-m", "streamlit", "run", 
        "streamlit_app.py",
        "--server.port", "8501",
        "--server.address", "0.0.0.0",
        "--browser.gatherUsageStats", "false",
        "--server.headless", "true"
    ]
    
    try:
        subprocess.run(cmd, check=True)
    except subprocess.CalledProcessError as e:
        print(f"❌ Streamlit failed: {e}")
    except KeyboardInterrupt:
        print("🛑 Application stopped by user")

if __name__ == "__main__":
    main()