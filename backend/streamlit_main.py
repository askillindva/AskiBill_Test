"""
AskiBill FastAPI + Streamlit Integration
Main application that runs both FastAPI backend and Streamlit frontend
"""

import subprocess
import threading
import time
import sys
import os
from pathlib import Path

# Add backend to Python path
backend_path = Path(__file__).parent
sys.path.insert(0, str(backend_path))

from app.main import app as fastapi_app
import uvicorn

def run_fastapi():
    """Run FastAPI backend server"""
    print("🚀 Starting FastAPI Backend...")
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )

def run_streamlit():
    """Run Streamlit frontend"""
    print("🚀 Starting Streamlit Frontend...")
    
    # Wait for FastAPI to start
    time.sleep(3)
    
    streamlit_file = Path(__file__).parent.parent / "streamlit_app.py"
    
    cmd = [
        sys.executable, "-m", "streamlit", "run", str(streamlit_file),
        "--server.port", "8501",
        "--server.address", "0.0.0.0",
        "--browser.gatherUsageStats", "false",
        "--server.headless", "true"
    ]
    
    subprocess.run(cmd)

def main():
    """Start both FastAPI and Streamlit"""
    print("🌟 AskiBill Full Python Stack")
    print("=" * 40)
    print("FastAPI Backend: http://localhost:8000")
    print("Streamlit Frontend: http://localhost:8501")
    print("API Documentation: http://localhost:8000/docs")
    print("=" * 40)
    
    # Start FastAPI in a separate thread
    fastapi_thread = threading.Thread(target=run_fastapi, daemon=True)
    fastapi_thread.start()
    
    # Start Streamlit in main thread
    try:
        run_streamlit()
    except KeyboardInterrupt:
        print("\n👋 Shutting down AskiBill...")

if __name__ == "__main__":
    main()