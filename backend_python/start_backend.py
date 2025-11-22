#!/usr/bin/env python3
"""
Backend startup script with auto-restart and error handling
Ensures the backend server always stays running
"""
import os
import sys
import time
import subprocess
import signal
from pathlib import Path

# Change to backend_python directory
backend_dir = Path(__file__).parent
os.chdir(backend_dir)

def check_backend_running(port=5000):
    """Check if backend is already running on the port"""
    try:
        import socket
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        result = sock.connect_ex(('localhost', port))
        sock.close()
        return result == 0
    except:
        return False

def start_backend():
    """Start the backend server with auto-restart"""
    max_restarts = 10
    restart_delay = 5
    restart_count = 0
    
    print("=" * 60)
    print("🚀 ResumeScore Backend Server")
    print("=" * 60)
    print(f"📁 Working directory: {os.getcwd()}")
    print(f"🐍 Python: {sys.executable}")
    print(f"🔄 Auto-restart: Enabled (max {max_restarts} restarts)")
    print("=" * 60)
    print()
    
    while restart_count < max_restarts:
        try:
            # Check if backend is already running
            if check_backend_running():
                print("⚠️  Backend already running on port 5000")
                print("   If you want to restart, stop the existing process first")
                return
            
            print(f"🔄 Starting backend server (attempt {restart_count + 1}/{max_restarts})...")
            
            # Start the backend
            process = subprocess.Popen(
                [sys.executable, "main.py"],
                stdout=sys.stdout,
                stderr=sys.stderr,
                cwd=backend_dir
            )
            
            # Wait for process to complete
            return_code = process.wait()
            
            if return_code == 0:
                print("✅ Backend server stopped normally")
                break
            else:
                restart_count += 1
                if restart_count < max_restarts:
                    print(f"⚠️  Backend crashed (exit code: {return_code})")
                    print(f"🔄 Restarting in {restart_delay} seconds...")
                    time.sleep(restart_delay)
                else:
                    print(f"❌ Max restarts reached ({max_restarts}). Stopping.")
                    sys.exit(1)
                    
        except KeyboardInterrupt:
            print("\n🛑 Shutting down backend server...")
            if 'process' in locals():
                process.terminate()
                process.wait()
            sys.exit(0)
        except Exception as e:
            restart_count += 1
            print(f"❌ Error starting backend: {e}")
            if restart_count < max_restarts:
                print(f"🔄 Retrying in {restart_delay} seconds...")
                time.sleep(restart_delay)
            else:
                print(f"❌ Max restarts reached. Exiting.")
                sys.exit(1)

if __name__ == "__main__":
    start_backend()

