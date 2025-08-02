#!/usr/bin/env python3
"""
AskiBill - Python-Only Application Entry Point
Launches both FastAPI backend and Streamlit frontend
"""

import subprocess
import threading
import time
import sys
import os
from pathlib import Path
import signal

def run_fastapi():
    """Run FastAPI backend server"""
    print("🚀 Starting FastAPI Backend on http://localhost:8000")
    
    # Change to backend directory
    backend_dir = Path("backend")
    original_dir = Path.cwd()
    
    try:
        os.chdir(backend_dir)
        cmd = [
            sys.executable, "-m", "uvicorn", 
            "app.main:app",
            "--host", "0.0.0.0",
            "--port", "8000",
            "--reload"
        ]
        subprocess.run(cmd, check=True)
    except subprocess.CalledProcessError as e:
        print(f"❌ FastAPI failed: {e}")
    except KeyboardInterrupt:
        print("🛑 FastAPI shutting down...")
    finally:
        os.chdir(original_dir)

def run_streamlit():
    """Run Streamlit frontend"""
    print("🚀 Starting Streamlit Frontend on http://localhost:8501")
    
    # Wait for FastAPI to start
    time.sleep(2)
    
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
        print("🛑 Streamlit shutting down...")

def main():
    """Main application entry point"""
    print("🌟 AskiBill - Python Full Stack Application")
    print("=" * 50)
    print("📊 Streamlit Frontend: http://localhost:8501")
    print("🚀 FastAPI Backend: http://localhost:8000")
    print("📖 API Documentation: http://localhost:8000/docs")
    print("=" * 50)
    
    # Handle shutdown gracefully
    def signal_handler(sig, frame):
        print("\n👋 Shutting down AskiBill...")
        sys.exit(0)
    
    signal.signal(signal.SIGINT, signal_handler)
    
    # Start FastAPI in background thread
    fastapi_thread = threading.Thread(target=run_fastapi, daemon=True)
    fastapi_thread.start()
    
    # Start Streamlit in main thread
    try:
        run_streamlit()
    except KeyboardInterrupt:
        print("\n👋 Application stopped by user")

if __name__ == "__main__":
    main()