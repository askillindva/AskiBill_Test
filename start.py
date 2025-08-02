#!/usr/bin/env python3
"""
Simple starter for AskiBill Streamlit Application
"""

import subprocess
import sys
import os

def main():
    """Start the Streamlit application"""
    print("🚀 Starting AskiBill - Python Full Stack Application")
    print("📊 Streamlit Frontend: http://localhost:8501")
    print("─" * 50)
    
    # Set environment variables
    os.environ["STREAMLIT_SERVER_PORT"] = "8501"
    os.environ["STREAMLIT_SERVER_ADDRESS"] = "0.0.0.0"
    
    # Run Streamlit
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
    except KeyboardInterrupt:
        print("\n👋 AskiBill stopped")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    main()