#!/usr/bin/env python3
"""
Startup script for AskiBill Streamlit application
"""

import subprocess
import sys
import os

def start_streamlit():
    """Start the Streamlit application"""
    try:
        # Change to the project directory
        os.chdir('/home/runner/workspace')
        
        # Start Streamlit with proper configuration
        cmd = [
            sys.executable, '-m', 'streamlit', 'run', 
            'streamlit_app.py',
            '--server.port', '8501',
            '--server.address', '0.0.0.0',
            '--server.headless', 'true',
            '--browser.gatherUsageStats', 'false'
        ]
        
        print(f"Starting AskiBill with command: {' '.join(cmd)}")
        subprocess.run(cmd, check=True)
        
    except Exception as e:
        print(f"Error starting AskiBill: {e}")
        sys.exit(1)

if __name__ == "__main__":
    start_streamlit()