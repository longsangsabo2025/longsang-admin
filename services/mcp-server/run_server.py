"""
MCP Server Wrapper with Auto-Restart
Handles the MCP SDK bug where server crashes after client disconnection
"""

import subprocess
import sys
import time
import os
from pathlib import Path

# Get paths
SCRIPT_DIR = Path(__file__).parent
SERVER_SCRIPT = SCRIPT_DIR / "server.py"
VENV_PYTHON = SCRIPT_DIR / ".venv" / "Scripts" / "python.exe"

# Use venv Python if available, otherwise system Python
PYTHON_EXE = str(VENV_PYTHON) if VENV_PYTHON.exists() else sys.executable

def run_server():
    """Run the MCP server with auto-restart on crash"""
    restart_count = 0
    max_restarts = 100  # Prevent infinite restart loop
    min_uptime = 5  # Minimum seconds before considering it a real crash
    
    print(f"""
╔═══════════════════════════════════════════════════════════════╗
║        MCP SERVER SUPERVISOR - AUTO RESTART ENABLED           ║
╚═══════════════════════════════════════════════════════════════╝
Python: {PYTHON_EXE}
Script: {SERVER_SCRIPT}
    """)
    
    while restart_count < max_restarts:
        start_time = time.time()
        
        try:
            print(f"\n[{time.strftime('%H:%M:%S')}] Starting MCP Server (restart #{restart_count})...")
            
            # Set environment for UTF-8
            env = os.environ.copy()
            env['PYTHONIOENCODING'] = 'utf-8'
            env['PYTHONUNBUFFERED'] = '1'
            
            # Run server
            process = subprocess.Popen(
                [PYTHON_EXE, str(SERVER_SCRIPT)],
                cwd=str(SCRIPT_DIR),
                env=env,
                stdout=sys.stdout,
                stderr=sys.stderr
            )
            
            # Wait for process to finish
            process.wait()
            
            uptime = time.time() - start_time
            
            # If server ran for less than min_uptime, it's probably a real error
            if uptime < min_uptime:
                print(f"\n[ERROR] Server crashed after {uptime:.1f}s. Possible configuration error.")
                restart_count += 1
                time.sleep(2)
            else:
                # Server ran normally but was interrupted (client disconnect bug)
                print(f"\n[INFO] Server stopped after {uptime:.1f}s. Restarting...")
                time.sleep(1)  # Brief pause before restart
                
        except KeyboardInterrupt:
            print("\n[INFO] Supervisor stopped by user")
            break
        except Exception as e:
            print(f"\n[ERROR] {e}")
            restart_count += 1
            time.sleep(2)
    
    if restart_count >= max_restarts:
        print(f"\n[FATAL] Max restarts ({max_restarts}) reached. Stopping supervisor.")
        sys.exit(1)

if __name__ == "__main__":
    run_server()
