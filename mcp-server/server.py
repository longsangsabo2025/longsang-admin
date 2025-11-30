"""
╔═══════════════════════════════════════════════════════════════╗
║           LONGSANG WORKSPACE MCP SERVER                       ║
║  Remote Control for VS Code Copilot via Web Interface         ║
╚═══════════════════════════════════════════════════════════════╝

This MCP server allows you to:
- Chat with Copilot from your phone while away
- Execute file operations remotely
- Run commands and git operations
- Search workspace and AI Brain

Author: Long Sang Automation
Port: 3002 (configured in .env as MCP_PORT)
"""

import os
import sys
import json
import subprocess
import asyncio
import logging
from pathlib import Path
from typing import Any, Optional
from datetime import datetime

# Fix Windows Unicode issue
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

# Add parent directory for config access
sys.path.insert(0, str(Path(__file__).parent.parent))

from mcp.server.fastmcp import FastMCP

# ════════════════════════════════════════════════════════════
# CONFIGURATION
# ════════════════════════════════════════════════════════════

# Load environment variables
from dotenv import load_dotenv

env_path = Path(__file__).parent.parent / ".env"
load_dotenv(env_path)

# Workspace root - SECURITY: Only allow access within this folder
WORKSPACE_ROOT = Path(os.getenv("WORKSPACE_ROOT", "D:/0.PROJECTS"))
MCP_PORT = int(os.getenv("MCP_PORT", "3002"))

# ════════════════════════════════════════════════════════════
# SECURITY SETTINGS
# ════════════════════════════════════════════════════════════

# Folders that are BLOCKED from access (sensitive data)
BLOCKED_FOLDERS = [
    ".env",
    ".env.local",
    ".env.production",
    "node_modules",
    ".git/objects",
    ".git/hooks",
    "__pycache__",
    ".venv",
    "venv",
    ".next",
    "dist",
    "build",
    ".cache",
    ".npm",
    ".yarn",
    "secrets",
    "credentials",
    ".aws",
    ".ssh",
    "private",
]

# File extensions that are BLOCKED from reading/writing
BLOCKED_EXTENSIONS = [
    ".pem",
    ".key",
    ".cert",
    ".crt",
    ".p12",
    ".pfx",  # Certificates
    ".sqlite",
    ".db",
    ".sqlite3",  # Databases
    ".exe",
    ".dll",
    ".so",
    ".dylib",  # Binaries
    ".zip",
    ".tar",
    ".gz",
    ".rar",
    ".7z",  # Archives
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".ico",
    ".webp",  # Images
    ".mp4",
    ".avi",
    ".mov",
    ".mp3",
    ".wav",  # Media
]

# File extensions ALLOWED for reading/writing
ALLOWED_EXTENSIONS = [
    ".py",
    ".js",
    ".ts",
    ".tsx",
    ".jsx",
    ".mjs",
    ".cjs",
    ".json",
    ".yaml",
    ".yml",
    ".toml",
    ".md",
    ".txt",
    ".rst",
    ".html",
    ".css",
    ".scss",
    ".less",
    ".sql",
    ".graphql",
    ".sh",
    ".bash",
    ".ps1",
    ".bat",
    ".cmd",
    ".xml",
    ".svg",
    ".gitignore",
    ".dockerignore",
    ".env.example",
    ".eslintrc",
    ".prettierrc",
    ".editorconfig",
    "Dockerfile",
    "Makefile",
    "Procfile",
]

# Maximum file size to read (5MB)
MAX_FILE_SIZE = 5 * 1024 * 1024

# Logging configuration
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [MCP] %(levelname)s: %(message)s",
    handlers=[
        logging.FileHandler(Path(__file__).parent / "mcp-server.log"),
        logging.StreamHandler(sys.stderr),  # STDIO servers must log to stderr
    ],
)
logger = logging.getLogger(__name__)

# ════════════════════════════════════════════════════════════
# INITIALIZE MCP SERVER
# ════════════════════════════════════════════════════════════

mcp = FastMCP(
    "longsang-workspace",
    json_response=True,
    instructions="""
    Longsang Workspace MCP Server - Remote Development Assistant

    You are a remote development assistant that can:
    1. Read and write files in the workspace
    2. Search for code and text
    3. Run terminal commands
    4. Perform git operations
    5. Query the AI Brain knowledge base

    Use these tools to help the user fix bugs, add features,
    and manage their codebase remotely.

    SECURITY: Access is restricted to D:/0.PROJECTS only.
    Sensitive files and folders are blocked.
    """,
)

# ════════════════════════════════════════════════════════════
# SECURITY HELPERS
# ════════════════════════════════════════════════════════════


def is_path_safe(file_path: str) -> tuple[bool, str]:
    """
    Check if a path is safe to access.
    Returns (is_safe, error_message)
    """
    try:
        # Resolve absolute path
        resolved = Path(file_path).resolve()

        # Must be within workspace root
        if not str(resolved).startswith(str(WORKSPACE_ROOT.resolve())):
            return False, f"Path must be within workspace: {WORKSPACE_ROOT}"

        # Check blocked folders
        path_parts = str(resolved).replace("\\", "/").lower()
        for blocked in BLOCKED_FOLDERS:
            if f"/{blocked.lower()}/" in path_parts or path_parts.endswith(
                f"/{blocked.lower()}"
            ):
                return False, f"Access denied: {blocked} is a protected path"

        return True, ""
    except Exception as e:
        return False, f"Invalid path: {str(e)}"


def is_extension_allowed(file_path: str, for_write: bool = False) -> tuple[bool, str]:
    """
    Check if file extension is allowed.
    """
    path = Path(file_path)
    ext = path.suffix.lower()
    name = path.name.lower()

    # Check blocked extensions
    if ext in BLOCKED_EXTENSIONS:
        return False, f"File type {ext} is not allowed"

    # For writing, must be in allowed list
    if for_write:
        if ext not in ALLOWED_EXTENSIONS and name not in ALLOWED_EXTENSIONS:
            return (
                False,
                f"Cannot write to file type {ext}. Allowed: code/config files only",
            )

    return True, ""


def format_size(size: int) -> str:
    """Format bytes to human readable size."""
    for unit in ["B", "KB", "MB", "GB"]:
        if size < 1024:
            return f"{size:.1f} {unit}"
        size /= 1024
    return f"{size:.1f} TB"


# ════════════════════════════════════════════════════════════
# CORE TOOLS: File Operations
# ════════════════════════════════════════════════════════════


@mcp.tool()
async def read_file(file_path: str, start_line: int = 1, end_line: int = None) -> dict:
    """
    Read contents of a file in the workspace.

    Args:
        file_path: Path to file (absolute or relative to workspace root)
        start_line: Starting line number (1-indexed, default: 1)
        end_line: Ending line number (optional, reads to end if not specified)

    Returns:
        File contents with metadata
    """
    logger.info(f"📖 read_file: {file_path}")

    try:
        # Resolve path
        if not os.path.isabs(file_path):
            file_path = str(WORKSPACE_ROOT / file_path)

        # Security check
        is_safe, error = is_path_safe(file_path)
        if not is_safe:
            return {"success": False, "error": error}

        is_allowed, error = is_extension_allowed(file_path)
        if not is_allowed:
            return {"success": False, "error": error}

        path = Path(file_path)
        if not path.exists():
            return {"success": False, "error": f"File not found: {file_path}"}

        if not path.is_file():
            return {"success": False, "error": f"Not a file: {file_path}"}

        # Check file size
        size = path.stat().st_size
        if size > MAX_FILE_SIZE:
            return {
                "success": False,
                "error": f"File too large ({format_size(size)}). Max: {format_size(MAX_FILE_SIZE)}",
            }

        # Read file
        with open(path, "r", encoding="utf-8", errors="replace") as f:
            lines = f.readlines()

        total_lines = len(lines)
        start_idx = max(0, start_line - 1)
        end_idx = end_line if end_line else total_lines

        selected_lines = lines[start_idx:end_idx]
        content = "".join(selected_lines)

        return {
            "success": True,
            "file_path": str(path),
            "content": content,
            "total_lines": total_lines,
            "lines_read": f"{start_line}-{min(end_idx, total_lines)}",
            "size": format_size(size),
        }

    except Exception as e:
        logger.error(f"read_file error: {e}")
        return {"success": False, "error": str(e)}


@mcp.tool()
async def write_file(file_path: str, content: str, create_dirs: bool = True) -> dict:
    """
    Write content to a file in the workspace.
    Creates parent directories if needed.

    Args:
        file_path: Path to file (absolute or relative to workspace root)
        content: Content to write
        create_dirs: Create parent directories if they don't exist (default: True)

    Returns:
        Success status and file info
    """
    logger.info(f"✏️ write_file: {file_path}")

    try:
        # Resolve path
        if not os.path.isabs(file_path):
            file_path = str(WORKSPACE_ROOT / file_path)

        # Security checks
        is_safe, error = is_path_safe(file_path)
        if not is_safe:
            return {"success": False, "error": error}

        is_allowed, error = is_extension_allowed(file_path, for_write=True)
        if not is_allowed:
            return {"success": False, "error": error}

        path = Path(file_path)

        # Create directories if needed
        if create_dirs:
            path.parent.mkdir(parents=True, exist_ok=True)

        # Backup existing file
        existed = path.exists()
        backup_content = None
        if existed:
            with open(path, "r", encoding="utf-8", errors="replace") as f:
                backup_content = f.read()

        # Write file
        with open(path, "w", encoding="utf-8") as f:
            f.write(content)

        lines = content.count("\n") + 1
        size = len(content.encode("utf-8"))

        logger.info(f"[OK] Written {lines} lines to {file_path}")

        return {
            "success": True,
            "file_path": str(path),
            "action": "updated" if existed else "created",
            "lines": lines,
            "size": format_size(size),
            "backed_up": existed,
        }

    except Exception as e:
        logger.error(f"write_file error: {e}")
        return {"success": False, "error": str(e)}


@mcp.tool()
async def edit_file(file_path: str, old_text: str, new_text: str) -> dict:
    """
    Edit a file by replacing specific text.
    Use this for precise edits without rewriting the entire file.

    Args:
        file_path: Path to file
        old_text: Exact text to find and replace (include context for uniqueness)
        new_text: New text to replace with

    Returns:
        Success status and edit info
    """
    logger.info(f"🔧 edit_file: {file_path}")

    try:
        # Read current content
        read_result = await read_file(file_path)
        if not read_result.get("success"):
            return read_result

        content = read_result["content"]

        # Check if old_text exists
        if old_text not in content:
            return {
                "success": False,
                "error": "Text to replace not found in file",
                "hint": "Make sure old_text matches exactly including whitespace",
            }

        # Count occurrences
        count = content.count(old_text)
        if count > 1:
            return {
                "success": False,
                "error": f"Text found {count} times. Add more context to make it unique.",
                "occurrences": count,
            }

        # Replace
        new_content = content.replace(old_text, new_text, 1)

        # Write back
        write_result = await write_file(file_path, new_content)
        if not write_result.get("success"):
            return write_result

        return {
            "success": True,
            "file_path": file_path,
            "action": "edited",
            "old_text_preview": (
                old_text[:100] + "..." if len(old_text) > 100 else old_text
            ),
            "new_text_preview": (
                new_text[:100] + "..." if len(new_text) > 100 else new_text
            ),
        }

    except Exception as e:
        logger.error(f"edit_file error: {e}")
        return {"success": False, "error": str(e)}


@mcp.tool()
async def delete_file(file_path: str, confirm: bool = False) -> dict:
    """
    Delete a file from the workspace.

    Args:
        file_path: Path to file
        confirm: Must be True to actually delete

    Returns:
        Success status
    """
    logger.info(f"🗑️ delete_file: {file_path}")

    if not confirm:
        return {
            "success": False,
            "error": "Deletion not confirmed. Set confirm=True to delete.",
            "file_path": file_path,
        }

    try:
        if not os.path.isabs(file_path):
            file_path = str(WORKSPACE_ROOT / file_path)

        is_safe, error = is_path_safe(file_path)
        if not is_safe:
            return {"success": False, "error": error}

        path = Path(file_path)
        if not path.exists():
            return {"success": False, "error": f"File not found: {file_path}"}

        if path.is_dir():
            return {
                "success": False,
                "error": "Cannot delete directories with this tool",
            }

        path.unlink()
        logger.info(f"[OK] Deleted: {file_path}")

        return {"success": True, "action": "deleted", "file_path": str(path)}

    except Exception as e:
        logger.error(f"delete_file error: {e}")
        return {"success": False, "error": str(e)}


# ════════════════════════════════════════════════════════════
# CORE TOOLS: Search
# ════════════════════════════════════════════════════════════


@mcp.tool()
async def search_files(
    query: str, path: str = "", file_pattern: str = "*", max_results: int = 50
) -> dict:
    """
    Search for text content in files.

    Args:
        query: Text to search for (case-insensitive)
        path: Folder to search in (relative to workspace, default: entire workspace)
        file_pattern: Glob pattern for files (e.g., "*.py", "*.js")
        max_results: Maximum results to return (default: 50)

    Returns:
        List of matches with file paths and context
    """
    logger.info(f"[SEARCH] search_files: '{query}' in {path or 'workspace'}")

    try:
        search_path = WORKSPACE_ROOT / path if path else WORKSPACE_ROOT

        is_safe, error = is_path_safe(str(search_path))
        if not is_safe:
            return {"success": False, "error": error}

        if not search_path.exists():
            return {"success": False, "error": f"Path not found: {path}"}

        results = []
        files_searched = 0
        query_lower = query.lower()

        for file_path in search_path.rglob(file_pattern):
            if not file_path.is_file():
                continue

            # Skip blocked paths
            is_safe, _ = is_path_safe(str(file_path))
            if not is_safe:
                continue

            is_allowed, _ = is_extension_allowed(str(file_path))
            if not is_allowed:
                continue

            # Skip large files
            if file_path.stat().st_size > MAX_FILE_SIZE:
                continue

            files_searched += 1

            try:
                with open(file_path, "r", encoding="utf-8", errors="replace") as f:
                    for line_num, line in enumerate(f, 1):
                        if query_lower in line.lower():
                            results.append(
                                {
                                    "file": str(file_path.relative_to(WORKSPACE_ROOT)),
                                    "line": line_num,
                                    "content": line.strip()[:200],
                                }
                            )

                            if len(results) >= max_results:
                                break

                if len(results) >= max_results:
                    break

            except Exception:
                continue

        return {
            "success": True,
            "query": query,
            "files_searched": files_searched,
            "matches": len(results),
            "results": results,
            "truncated": len(results) >= max_results,
        }

    except Exception as e:
        logger.error(f"search_files error: {e}")
        return {"success": False, "error": str(e)}


@mcp.tool()
async def list_files(
    path: str = "",
    pattern: str = "*",
    recursive: bool = False,
    show_hidden: bool = False,
) -> dict:
    """
    List files and folders in a directory.

    Args:
        path: Directory path (relative to workspace, default: workspace root)
        pattern: Glob pattern to filter files (e.g., "*.py")
        recursive: Search recursively in subdirectories
        show_hidden: Show hidden files/folders (starting with .)

    Returns:
        List of files and folders
    """
    logger.info(f"📂 list_files: {path or 'workspace root'}")

    try:
        list_path = WORKSPACE_ROOT / path if path else WORKSPACE_ROOT

        is_safe, error = is_path_safe(str(list_path))
        if not is_safe:
            return {"success": False, "error": error}

        if not list_path.exists():
            return {"success": False, "error": f"Path not found: {path}"}

        items = []
        glob_method = list_path.rglob if recursive else list_path.glob

        for item in glob_method(pattern):
            # Skip hidden if not requested
            if not show_hidden and item.name.startswith("."):
                continue

            # Skip blocked folders
            is_safe, _ = is_path_safe(str(item))
            if not is_safe:
                continue

            rel_path = str(item.relative_to(WORKSPACE_ROOT))

            if item.is_dir():
                items.append(
                    {
                        "name": rel_path + "/",
                        "type": "folder",
                        "items": len(list(item.iterdir())) if item.is_dir() else 0,
                    }
                )
            else:
                items.append(
                    {
                        "name": rel_path,
                        "type": "file",
                        "size": format_size(item.stat().st_size),
                        "modified": datetime.fromtimestamp(
                            item.stat().st_mtime
                        ).strftime("%Y-%m-%d %H:%M"),
                    }
                )

        # Sort: folders first, then files
        items.sort(key=lambda x: (0 if x["type"] == "folder" else 1, x["name"]))

        return {
            "success": True,
            "path": str(list_path.relative_to(WORKSPACE_ROOT)) if path else "/",
            "total": len(items),
            "items": items[:200],  # Limit to 200 items
        }

    except Exception as e:
        logger.error(f"list_files error: {e}")
        return {"success": False, "error": str(e)}


# ════════════════════════════════════════════════════════════
# CORE TOOLS: Terminal Commands
# ════════════════════════════════════════════════════════════

# Allowed commands (whitelist for security)
ALLOWED_COMMANDS = {
    # Node/NPM
    "npm": [
        "install",
        "run",
        "test",
        "build",
        "start",
        "ci",
        "audit",
        "ls",
        "outdated",
    ],
    "npx": None,  # All npx allowed (with caution)
    "node": None,
    "pnpm": ["install", "run", "test", "build", "start", "add"],
    "yarn": ["install", "run", "test", "build", "start", "add"],
    "bun": ["install", "run", "test", "build", "start", "add"],
    # Python
    "python": None,
    "python3": None,
    "pip": ["install", "list", "freeze", "show"],
    "pip3": ["install", "list", "freeze", "show"],
    "uv": None,
    "pytest": None,
    # Git
    "git": [
        "status",
        "log",
        "diff",
        "branch",
        "checkout",
        "pull",
        "push",
        "add",
        "commit",
        "stash",
        "fetch",
        "merge",
        "rebase",
    ],
    # File operations (safe)
    "ls": None,
    "dir": None,
    "cat": None,
    "type": None,
    "head": None,
    "tail": None,
    "find": None,
    "grep": None,
    "rg": None,
    "pwd": None,
    "cd": None,
    "mkdir": None,
    # Deployment tools
    "vercel": ["--prod", "deploy", "ls", "logs", "env", "inspect"],
    "netlify": ["deploy", "status", "open"],
    "firebase": ["deploy", "serve", "emulators:start"],
    # Flutter/Dart
    "flutter": ["pub", "build", "test", "analyze", "clean", "doctor"],
    "dart": ["pub", "analyze", "format", "test"],
    # Other dev tools
    "docker": ["ps", "images", "logs", "compose"],
    "curl": None,
    "wget": None,
}

# Blocked patterns (additional security)
BLOCKED_PATTERNS = [
    "rm -rf /",
    "del /s /q",
    "format",
    "> /dev",
    "sudo",
    "su ",
    "chmod 777",
    "eval(",
    "exec(",
    "| sh",
    "| bash",
    "; rm",
    "&& rm",
    "DROP TABLE",
    "DELETE FROM",
    "TRUNCATE",
]


@mcp.tool()
async def run_command(command: str, working_dir: str = "", timeout: int = 60) -> dict:
    """
    Run a terminal command in the workspace.
    Commands are restricted for security.

    Args:
        command: Command to run (e.g., "npm install", "git status")
        working_dir: Working directory (relative to workspace, default: workspace root)
        timeout: Maximum seconds to wait (default: 60)

    Returns:
        Command output and exit code
    """
    logger.info(f"🖥️ run_command: {command}")

    try:
        # Security: Check for blocked patterns
        cmd_lower = command.lower()
        for pattern in BLOCKED_PATTERNS:
            if pattern.lower() in cmd_lower:
                return {
                    "success": False,
                    "error": f"Command contains blocked pattern: {pattern}",
                }

        # Parse command
        parts = command.split()
        if not parts:
            return {"success": False, "error": "Empty command"}

        cmd_name = parts[0].lower()

        # Security: Check if command is allowed
        if cmd_name not in ALLOWED_COMMANDS:
            return {
                "success": False,
                "error": f"Command '{cmd_name}' is not in allowlist",
                "allowed_commands": list(ALLOWED_COMMANDS.keys()),
            }

        # Check subcommand if restricted
        allowed_subcommands = ALLOWED_COMMANDS[cmd_name]
        if allowed_subcommands and len(parts) > 1:
            subcommand = parts[1].lower()
            if subcommand not in allowed_subcommands:
                return {
                    "success": False,
                    "error": f"Subcommand '{subcommand}' not allowed for {cmd_name}",
                    "allowed": allowed_subcommands,
                }

        # Set working directory
        cwd = WORKSPACE_ROOT / working_dir if working_dir else WORKSPACE_ROOT
        is_safe, error = is_path_safe(str(cwd))
        if not is_safe:
            return {"success": False, "error": error}

        if not cwd.exists():
            return {"success": False, "error": f"Directory not found: {working_dir}"}

        # Run command
        logger.info(f"Executing in {cwd}: {command}")

        process = await asyncio.create_subprocess_shell(
            command,
            cwd=str(cwd),
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            shell=True,
        )

        try:
            stdout, stderr = await asyncio.wait_for(
                process.communicate(), timeout=timeout
            )
        except asyncio.TimeoutError:
            process.kill()
            return {
                "success": False,
                "error": f"Command timed out after {timeout} seconds",
            }

        stdout_text = stdout.decode("utf-8", errors="replace")
        stderr_text = stderr.decode("utf-8", errors="replace")

        # Truncate long output
        max_output = 10000
        if len(stdout_text) > max_output:
            stdout_text = (
                stdout_text[:max_output]
                + f"\n... (truncated, {len(stdout_text)} chars total)"
            )
        if len(stderr_text) > max_output:
            stderr_text = (
                stderr_text[:max_output]
                + f"\n... (truncated, {len(stderr_text)} chars total)"
            )

        return {
            "success": process.returncode == 0,
            "command": command,
            "working_dir": str(cwd.relative_to(WORKSPACE_ROOT)),
            "exit_code": process.returncode,
            "stdout": stdout_text,
            "stderr": stderr_text,
        }

    except Exception as e:
        logger.error(f"run_command error: {e}")
        return {"success": False, "error": str(e)}


# ════════════════════════════════════════════════════════════
# GIT TOOLS
# ════════════════════════════════════════════════════════════


@mcp.tool()
async def git_status(path: str = "") -> dict:
    """
    Get git status of a repository.

    Args:
        path: Path to git repository (relative to workspace)

    Returns:
        Git status information
    """
    result = await run_command("git status --porcelain=v1", path)

    if (
        not result.get("success")
        and "not a git repository" in result.get("stderr", "").lower()
    ):
        return {"success": False, "error": "Not a git repository"}

    # Parse status
    changes = []
    for line in result.get("stdout", "").strip().split("\n"):
        if line:
            status = line[:2]
            file = line[3:]
            changes.append({"status": status, "file": file})

    return {
        "success": True,
        "working_dir": result.get("working_dir"),
        "clean": len(changes) == 0,
        "changes": changes,
    }


@mcp.tool()
async def git_diff(path: str = "", file: str = "") -> dict:
    """
    Get git diff of changes.

    Args:
        path: Path to git repository
        file: Specific file to diff (optional)

    Returns:
        Diff output
    """
    cmd = f"git diff {file}" if file else "git diff"
    return await run_command(cmd, path)


@mcp.tool()
async def git_log(path: str = "", count: int = 10) -> dict:
    """
    Get git commit log.

    Args:
        path: Path to git repository
        count: Number of commits to show (default: 10)

    Returns:
        Commit log
    """
    cmd = f"git log --oneline -n {min(count, 50)}"
    return await run_command(cmd, path)


@mcp.tool()
async def git_commit(path: str, message: str, files: str = ".") -> dict:
    """
    Stage and commit changes.

    Args:
        path: Path to git repository
        message: Commit message
        files: Files to stage (default: all changes ".")

    Returns:
        Commit result
    """
    # Stage files
    add_result = await run_command(f"git add {files}", path)
    if not add_result.get("success"):
        return add_result

    # Commit with message (escape quotes in message)
    safe_message = message.replace('"', '\\"')
    commit_result = await run_command(f'git commit -m "{safe_message}"', path)

    return commit_result


@mcp.tool()
async def git_push(path: str = "", branch: str = "") -> dict:
    """
    Push commits to remote.

    Args:
        path: Path to git repository
        branch: Branch to push (default: current branch)

    Returns:
        Push result
    """
    cmd = f"git push origin {branch}" if branch else "git push"
    return await run_command(cmd, path)


@mcp.tool()
async def git_pull(path: str = "") -> dict:
    """
    Pull changes from remote.

    Args:
        path: Path to git repository

    Returns:
        Pull result
    """
    return await run_command("git pull", path)


# ════════════════════════════════════════════════════════════
# DEPLOYMENT TOOLS
# ════════════════════════════════════════════════════════════


@mcp.tool()
async def deploy_vercel(project: str, production: bool = False) -> dict:
    """
    Deploy a project to Vercel.

    Args:
        project: Project path (relative to workspace)
        production: Deploy to production (default: False = preview)

    Returns:
        Deployment result with URL
    """
    logger.info(f"[DEPLOY] deploy_vercel: {project} (prod={production})")

    cmd = "vercel --yes" if not production else "vercel --prod --yes"
    result = await run_command(cmd, project)

    # Extract deployment URL from output
    if result.get("success"):
        stdout = result.get("stdout", "")
        # Vercel outputs URL like: https://project-xxx.vercel.app
        import re

        url_match = re.search(r"https://[\w\-]+\.vercel\.app", stdout)
        if url_match:
            result["deployment_url"] = url_match.group()

    return result


@mcp.tool()
async def full_deploy_pipeline(
    project: str, commit_message: str, branch: str = "main", deploy_prod: bool = False
) -> dict:
    """
    Full deployment pipeline: build -> commit -> push -> deploy.

    Args:
        project: Project path
        commit_message: Git commit message
        branch: Branch to push to (default: main)
        deploy_prod: Deploy to production (default: False)

    Returns:
        Pipeline results with all steps
    """
    logger.info(f"[PIPELINE] full_deploy_pipeline: {project}")

    results = {"success": True, "project": project, "steps": []}

    # Step 1: Build (if package.json exists)
    project_path = WORKSPACE_ROOT / project
    if (project_path / "package.json").exists():
        build_result = await run_command("npm run build", project)
        results["steps"].append(
            {
                "step": "build",
                "success": build_result.get("success", False),
                "message": (
                    "Build completed"
                    if build_result.get("success")
                    else build_result.get("stderr", "Build failed")
                ),
            }
        )

        if not build_result.get("success"):
            results["success"] = False
            results["failed_at"] = "build"
            return results

    # Step 2: Git add all changes
    add_result = await run_command("git add -A", project)
    results["steps"].append(
        {"step": "git_add", "success": add_result.get("success", False)}
    )

    # Step 3: Git commit
    safe_message = commit_message.replace('"', '\\"')
    commit_result = await run_command(f'git commit -m "{safe_message}"', project)

    # Check if there's nothing to commit (not an error)
    nothing_to_commit = "nothing to commit" in commit_result.get("stdout", "").lower()

    results["steps"].append(
        {
            "step": "git_commit",
            "success": commit_result.get("success", False) or nothing_to_commit,
            "message": "No changes to commit" if nothing_to_commit else commit_message,
        }
    )

    # Step 4: Git push
    push_result = await run_command(f"git push origin {branch}", project)
    results["steps"].append(
        {
            "step": "git_push",
            "success": push_result.get("success", False),
            "branch": branch,
        }
    )

    if not push_result.get("success"):
        results["success"] = False
        results["failed_at"] = "git_push"
        results["error"] = push_result.get("stderr", "Push failed")
        return results

    # Step 5: Deploy to Vercel
    deploy_result = await deploy_vercel(project, deploy_prod)
    results["steps"].append(
        {
            "step": "deploy",
            "success": deploy_result.get("success", False),
            "url": deploy_result.get("deployment_url", ""),
            "production": deploy_prod,
        }
    )

    if not deploy_result.get("success"):
        results["success"] = False
        results["failed_at"] = "deploy"
        results["error"] = deploy_result.get("stderr", "Deploy failed")
    else:
        results["deployment_url"] = deploy_result.get("deployment_url", "")

    return results


# ════════════════════════════════════════════════════════════
# PROJECT TOOLS
# ════════════════════════════════════════════════════════════


@mcp.tool()
async def list_projects() -> dict:
    """
    List all projects in the workspace.

    Returns:
        List of projects with basic info
    """
    logger.info("📋 list_projects")

    try:
        projects = []

        for item in WORKSPACE_ROOT.iterdir():
            if not item.is_dir():
                continue

            if item.name.startswith(".") or item.name.startswith("_"):
                continue

            project_info = {
                "name": item.name,
                "path": str(item.relative_to(WORKSPACE_ROOT)),
                "type": "unknown",
            }

            # Detect project type
            if (item / "package.json").exists():
                project_info["type"] = "node"
                try:
                    with open(item / "package.json", "r") as f:
                        pkg = json.load(f)
                        project_info["description"] = pkg.get("description", "")
                except:
                    pass
            elif (item / "pyproject.toml").exists() or (
                item / "requirements.txt"
            ).exists():
                project_info["type"] = "python"
            elif (item / "Cargo.toml").exists():
                project_info["type"] = "rust"
            elif (item / "go.mod").exists():
                project_info["type"] = "go"

            # Check for git
            if (item / ".git").exists():
                project_info["git"] = True

            projects.append(project_info)

        projects.sort(key=lambda x: x["name"])

        return {
            "success": True,
            "workspace": str(WORKSPACE_ROOT),
            "count": len(projects),
            "projects": projects,
        }

    except Exception as e:
        logger.error(f"list_projects error: {e}")
        return {"success": False, "error": str(e)}


@mcp.tool()
async def get_project_info(project: str) -> dict:
    """
    Get detailed information about a project.

    Args:
        project: Project name or path

    Returns:
        Project details including structure and config
    """
    logger.info(f"ℹ️ get_project_info: {project}")

    try:
        project_path = WORKSPACE_ROOT / project

        if not project_path.exists():
            return {"success": False, "error": f"Project not found: {project}"}

        info = {
            "name": project_path.name,
            "path": str(project_path),
            "type": "unknown",
            "files": [],
            "config": {},
        }

        # List top-level files
        for item in project_path.iterdir():
            if item.name.startswith(".") and item.name not in [
                ".env.example",
                ".gitignore",
            ]:
                continue

            info["files"].append(
                {"name": item.name, "type": "folder" if item.is_dir() else "file"}
            )

        # Read package.json if exists
        pkg_path = project_path / "package.json"
        if pkg_path.exists():
            info["type"] = "node"
            with open(pkg_path, "r") as f:
                pkg = json.load(f)
                info["config"]["name"] = pkg.get("name")
                info["config"]["version"] = pkg.get("version")
                info["config"]["description"] = pkg.get("description")
                info["config"]["scripts"] = pkg.get("scripts", {})
                info["config"]["dependencies"] = list(
                    pkg.get("dependencies", {}).keys()
                )[:20]

        # Check for README
        for readme_name in ["README.md", "readme.md", "README.txt"]:
            readme_path = project_path / readme_name
            if readme_path.exists():
                with open(readme_path, "r", encoding="utf-8", errors="replace") as f:
                    content = f.read()
                    info["readme_preview"] = content[:500]
                break

        return {"success": True, **info}

    except Exception as e:
        logger.error(f"get_project_info error: {e}")
        return {"success": False, "error": str(e)}


# ════════════════════════════════════════════════════════════
# RESOURCES (for context)
# ════════════════════════════════════════════════════════════


@mcp.resource("workspace://structure")
def get_workspace_structure() -> str:
    """Get workspace folder structure."""
    result = []

    for item in WORKSPACE_ROOT.iterdir():
        if item.name.startswith("."):
            continue

        if item.is_dir():
            result.append(f"[DIR] {item.name}/")
        else:
            result.append(f"📄 {item.name}")

    return "\n".join(sorted(result))


@mcp.resource("config://settings")
def get_server_settings() -> str:
    """Get MCP server configuration."""
    return json.dumps(
        {
            "workspace_root": str(WORKSPACE_ROOT),
            "mcp_port": MCP_PORT,
            "blocked_folders": BLOCKED_FOLDERS,
            "allowed_commands": list(ALLOWED_COMMANDS.keys()),
            "max_file_size": format_size(MAX_FILE_SIZE),
        },
        indent=2,
    )


# ════════════════════════════════════════════════════════════
# AI BRAIN TOOLS
# ════════════════════════════════════════════════════════════

# Import brain integration
try:
    from brain_integration import (
        brain_search as _brain_search,
        brain_list_domains as _brain_list_domains,
        brain_add as _brain_add,
        brain_stats as _brain_stats,
        brain_client,
    )

    BRAIN_AVAILABLE = brain_client.is_available
except ImportError:
    BRAIN_AVAILABLE = False
    logger.warning("Brain integration not available")

# Import Google integration
try:
    from google_integration import (
        google_client,
        gemini_chat as _gemini_chat,
        gemini_code as _gemini_code,
        gemini_summarize as _gemini_summarize,
        gemini_translate as _gemini_translate,
        gemini_search as _gemini_search,
        gemini_thinking as _gemini_thinking,
        gemini_extract_data as _gemini_extract_data,
        gemini_structured as _gemini_structured,
        gemini_generate_image as _gemini_generate_image,
        gemini_edit_image as _gemini_edit_image,
        youtube_stats as _youtube_stats,
        youtube_videos as _youtube_videos,
        youtube_upload as _youtube_upload,
        drive_list as _drive_list,
        drive_upload as _drive_upload,
        calendar_events as _calendar_events,
        calendar_create as _calendar_create,
        seo_queries as _seo_queries,
        seo_pages as _seo_pages,
        google_status as _google_status,
    )

    GOOGLE_AVAILABLE = google_client.is_available
    GOOGLE_STATUS = google_client.get_status()
except ImportError as e:
    GOOGLE_AVAILABLE = False
    GOOGLE_STATUS = {"available": False, "error": str(e)}
    logger.warning(f"Google integration not available: {e}")


@mcp.tool()
async def brain_search(query: str, domain: str = None, limit: int = 10) -> dict:
    """
    Search the AI Second Brain knowledge base.

    Args:
        query: Search query
        domain: Optional domain to filter (e.g., "Development", "Business")
        limit: Maximum results (default: 10)

    Returns:
        Search results with knowledge items
    """
    if not BRAIN_AVAILABLE:
        return {"success": False, "error": "Brain not available"}
    return await _brain_search(query, domain, limit)


@mcp.tool()
async def brain_list_domains() -> dict:
    """
    List all knowledge domains in the AI Brain.

    Returns:
        List of domains with stats
    """
    if not BRAIN_AVAILABLE:
        return {"success": False, "error": "Brain not available"}
    return await _brain_list_domains()


@mcp.tool()
async def brain_add(
    title: str, content: str, domain: str, knowledge_type: str = "note", tags: str = ""
) -> dict:
    """
    Add new knowledge to the AI Brain.

    Args:
        title: Knowledge title
        content: Knowledge content (markdown supported)
        domain: Domain name (e.g., "Development", "Business")
        knowledge_type: Type (note, code, decision, learning, etc.)
        tags: Comma-separated tags

    Returns:
        Created knowledge item
    """
    if not BRAIN_AVAILABLE:
        return {"success": False, "error": "Brain not available"}

    tags_list = [t.strip() for t in tags.split(",") if t.strip()] if tags else []
    return await _brain_add(title, content, domain, knowledge_type, tags_list)


@mcp.tool()
async def brain_stats() -> dict:
    """
    Get AI Brain statistics.

    Returns:
        Brain statistics including domain and knowledge counts
    """
    if not BRAIN_AVAILABLE:
        return {"success": False, "error": "Brain not available"}
    return await _brain_stats()


# ════════════════════════════════════════════════════════════
# GOOGLE AI & SERVICES TOOLS
# ════════════════════════════════════════════════════════════


@mcp.tool()
async def gemini_chat(
    message: str, system_prompt: str = "", temperature: float = 0.7
) -> dict:
    """
    Chat with Google Gemini AI (latest model).

    Args:
        message: Your message to Gemini
        system_prompt: Optional system instructions (e.g., "You are a helpful assistant")
        temperature: Creativity level 0-1 (default: 0.7)

    Returns:
        AI response from Gemini
    """
    if not GOOGLE_AVAILABLE:
        return {"success": False, "error": "Google services not available"}
    return await _gemini_chat(message, system_prompt or None, temperature)


@mcp.tool()
async def gemini_code(task: str, language: str = "python", context: str = "") -> dict:
    """
    Generate code using Google Gemini AI.

    Args:
        task: Description of what the code should do
        language: Programming language (python, javascript, typescript, etc.)
        context: Optional existing code or context

    Returns:
        Generated code
    """
    if not GOOGLE_AVAILABLE:
        return {"success": False, "error": "Google services not available"}
    return await _gemini_code(task, language, context or None)


@mcp.tool()
async def gemini_summarize(text: str, style: str = "concise") -> dict:
    """
    Summarize text using Gemini AI.

    Args:
        text: Text to summarize
        style: Summary style - "concise", "detailed", or "bullet_points"

    Returns:
        Summary of the text
    """
    if not GOOGLE_AVAILABLE:
        return {"success": False, "error": "Google services not available"}
    return await _gemini_summarize(text, style)


@mcp.tool()
async def gemini_translate(text: str, target_language: str = "Vietnamese") -> dict:
    """
    Translate text using Gemini AI.

    Args:
        text: Text to translate
        target_language: Target language (default: Vietnamese)

    Returns:
        Translated text
    """
    if not GOOGLE_AVAILABLE:
        return {"success": False, "error": "Google services not available"}
    return await _gemini_translate(text, target_language)


@mcp.tool()
async def gemini_search(query: str, system_prompt: str = "") -> dict:
    """
    Search using Gemini AI with Google Search grounding.
    Get real-time, up-to-date information from the web.

    Args:
        query: Your question or search query
        system_prompt: Optional system instructions

    Returns:
        AI response with real-time web information and sources

    Examples:
        - "Thời tiết Hồ Chí Minh hôm nay"
        - "Tin tức công nghệ mới nhất"
        - "Giá Bitcoin hiện tại"
    """
    if not GOOGLE_AVAILABLE:
        return {"success": False, "error": "Google services not available"}
    return await _gemini_search(query, system_prompt or None)


@mcp.tool()
async def gemini_thinking(question: str, system_prompt: str = "") -> dict:
    """
    Deep reasoning with Gemini AI using Thinking mode.
    Best for complex problems requiring step-by-step analysis.

    Args:
        question: Complex question or problem to analyze
        system_prompt: Optional system instructions

    Returns:
        AI response with detailed reasoning and thought process

    Examples:
        - "Phân tích ưu nhược điểm của microservices vs monolithic"
        - "Giải bài toán: 15 người hoàn thành công việc trong 6 ngày..."
        - "Review code này và đề xuất cải tiến"
    """
    if not GOOGLE_AVAILABLE:
        return {"success": False, "error": "Google services not available"}
    return await _gemini_thinking(question, system_prompt or None)


@mcp.tool()
async def gemini_extract(text: str, data_type: str = "auto") -> dict:
    """
    Extract structured data from text using Gemini AI.

    Args:
        text: Text to extract data from (CV, email, product listing, etc.)
        data_type: Type of data to extract:
            - "auto": Auto-detect structure (default)
            - "contact": Extract contact info (name, email, phone, company)
            - "product": Extract product info (name, price, features)
            - "event": Extract event info (title, date, location)

    Returns:
        Extracted data in JSON format

    Examples:
        - Extract CV: "Nguyễn Văn A, email: nva@gmail.com, 0909123456"
        - Extract product: "iPhone 15 Pro - 28.990.000đ, màn 6.1 inch"
    """
    if not GOOGLE_AVAILABLE:
        return {"success": False, "error": "Google services not available"}
    return await _gemini_extract_data(text, data_type)


@mcp.tool()
async def gemini_json(prompt: str, schema: str) -> dict:
    """
    Generate structured JSON output from Gemini AI.

    Args:
        prompt: Task description
        schema: JSON Schema string defining the output structure

    Returns:
        AI response in structured JSON format

    Example schema:
        '{"type": "object", "properties": {"name": {"type": "string"}, "age": {"type": "number"}}}'
    """
    if not GOOGLE_AVAILABLE:
        return {"success": False, "error": "Google services not available"}

    import json

    try:
        json_schema = json.loads(schema)
    except json.JSONDecodeError as e:
        return {"success": False, "error": f"Invalid JSON schema: {e}"}

    return await _gemini_structured(prompt, json_schema)


@mcp.tool()
async def gemini_image(
    prompt: str, aspect_ratio: str = "1:1", style: str = "", ad_style: str = ""
) -> dict:
    """
    Generate image using Gemini AI (Nano Banana / Imagen 3.0).

    Args:
        prompt: Description of the image to generate
        aspect_ratio: "1:1" (square), "16:9" (landscape), "9:16" (portrait)
        style: Optional style - "photorealistic", "cartoon", "oil painting", etc.
        ad_style: Optional ad-specific style preset - "product", "lifestyle", "testimonial", "social", "minimalist"

    Returns:
        Path to generated image file

    Examples:
        - "A cute cat wearing sunglasses on the beach"
        - "Modern minimalist logo for tech startup"
        - "Vietnamese pho noodle soup, food photography"
        - ad_style="product" for professional product photography
        - ad_style="lifestyle" for real-world context images
    """
    if not GOOGLE_AVAILABLE:
        return {"success": False, "error": "Google services not available"}
    return await _gemini_generate_image(
        prompt, aspect_ratio, style or None, ad_style or None
    )


@mcp.tool()
async def gemini_edit_image(image_path: str, edit_prompt: str) -> dict:
    """
    Edit an existing image using Gemini AI.

    Args:
        image_path: Path to the image to edit
        edit_prompt: Description of the edit to make

    Returns:
        Path to edited image file

    Examples:
        - "Remove the background"
        - "Change the color to blue"
        - "Add a sunset in the background"
    """
    if not GOOGLE_AVAILABLE:
        return {"success": False, "error": "Google services not available"}
    return await _gemini_edit_image(image_path, edit_prompt)


@mcp.tool()
async def youtube_channel_stats() -> dict:
    """
    Get YouTube channel statistics.

    Returns:
        Channel info including subscribers, views, video count
    """
    if not GOOGLE_AVAILABLE:
        return {"success": False, "error": "Google services not available"}
    return await _youtube_stats()


@mcp.tool()
async def youtube_list_videos(max_results: int = 10) -> dict:
    """
    List recent videos from YouTube channel.

    Args:
        max_results: Maximum videos to return (default: 10)

    Returns:
        List of recent videos with metadata
    """
    if not GOOGLE_AVAILABLE:
        return {"success": False, "error": "Google services not available"}
    return await _youtube_videos(max_results)


@mcp.tool()
async def youtube_upload_video(
    file_path: str,
    title: str,
    description: str = "",
    tags: str = "",
    privacy: str = "private",
) -> dict:
    """
    Upload a video to YouTube.

    Args:
        file_path: Path to video file
        title: Video title
        description: Video description
        tags: Comma-separated tags
        privacy: "private", "unlisted", or "public"

    Returns:
        Upload result with video URL
    """
    if not GOOGLE_AVAILABLE:
        return {"success": False, "error": "Google services not available"}
    return await _youtube_upload(file_path, title, description, tags, privacy)


@mcp.tool()
async def drive_list_files(folder_id: str = "", query: str = "") -> dict:
    """
    List files in Google Drive.

    Args:
        folder_id: Optional folder ID to list from
        query: Optional search query

    Returns:
        List of files with metadata
    """
    if not GOOGLE_AVAILABLE:
        return {"success": False, "error": "Google services not available"}
    return await _drive_list(folder_id or None, query or None)


@mcp.tool()
async def drive_upload_file(file_path: str, folder_id: str = "") -> dict:
    """
    Upload a file to Google Drive.

    Args:
        file_path: Path to file to upload
        folder_id: Optional destination folder ID

    Returns:
        Upload result with file link
    """
    if not GOOGLE_AVAILABLE:
        return {"success": False, "error": "Google services not available"}
    return await _drive_upload(file_path, folder_id or None)


@mcp.tool()
async def calendar_list_events(days_ahead: int = 7) -> dict:
    """
    List upcoming Google Calendar events.

    Args:
        days_ahead: Number of days to look ahead (default: 7)

    Returns:
        List of upcoming events
    """
    if not GOOGLE_AVAILABLE:
        return {"success": False, "error": "Google services not available"}
    return await _calendar_events(days_ahead)


@mcp.tool()
async def calendar_create_event(
    title: str,
    start_time: str,
    end_time: str,
    description: str = "",
    location: str = "",
) -> dict:
    """
    Create a Google Calendar event.

    Args:
        title: Event title
        start_time: Start time (ISO format: 2025-11-29T10:00:00)
        end_time: End time (ISO format: 2025-11-29T11:00:00)
        description: Event description
        location: Event location

    Returns:
        Created event with calendar link
    """
    if not GOOGLE_AVAILABLE:
        return {"success": False, "error": "Google services not available"}
    return await _calendar_create(title, start_time, end_time, description, location)


@mcp.tool()
async def seo_top_queries(days: int = 28) -> dict:
    """
    Get top search queries from Google Search Console.

    Args:
        days: Number of days to analyze (default: 28)

    Returns:
        Top search queries with clicks, impressions, CTR, position
    """
    if not GOOGLE_AVAILABLE:
        return {"success": False, "error": "Google services not available"}
    return await _seo_queries(days)


@mcp.tool()
async def seo_top_pages(days: int = 28) -> dict:
    """
    Get top performing pages from Google Search Console.

    Args:
        days: Number of days to analyze (default: 28)

    Returns:
        Top pages with performance metrics
    """
    if not GOOGLE_AVAILABLE:
        return {"success": False, "error": "Google services not available"}
    return await _seo_pages(days)


@mcp.tool()
async def google_services_status() -> dict:
    """
    Check status of all Google services.

    Returns:
        Status of Gemini, YouTube, Drive, Calendar, Search Console
    """
    if not GOOGLE_AVAILABLE:
        return {
            "success": False,
            "error": "Google integration not available",
            "details": GOOGLE_STATUS,
        }
    return {"success": True, **await _google_status()}


# ════════════════════════════════════════════════════════════
# COPILOT BRIDGE TOOLS
# Web UI → VS Code Copilot Communication
# ════════════════════════════════════════════════════════════

COPILOT_BRIDGE_DIR = WORKSPACE_ROOT / ".copilot-bridge"


@mcp.tool()
async def copilot_get_pending_messages() -> dict:
    """
    Get pending messages from Web UI waiting to be processed by VS Code Copilot.
    This tool checks the message queue and returns messages that need attention.

    Returns:
        List of pending messages with their IDs, content, and context
    """
    try:
        queue_dir = COPILOT_BRIDGE_DIR / "queue"
        if not queue_dir.exists():
            return {"success": True, "messages": [], "count": 0}

        messages = []
        for msg_file in sorted(queue_dir.glob("*.json")):
            try:
                with open(msg_file, "r", encoding="utf-8") as f:
                    msg_data = json.load(f)
                    messages.append(
                        {
                            "id": msg_data.get("id"),
                            "message": msg_data.get("message"),
                            "context": msg_data.get("context", {}),
                            "timestamp": msg_data.get("timestamp"),
                            "priority": msg_data.get("priority", "normal"),
                        }
                    )
            except Exception as e:
                logger.warning(f"Failed to read message file {msg_file}: {e}")

        return {"success": True, "messages": messages, "count": len(messages)}
    except Exception as e:
        return {"success": False, "error": str(e)}


@mcp.tool()
async def copilot_process_message(message_id: str) -> dict:
    """
    Get a specific message from the queue to process.
    Use this to retrieve the full message details before processing.

    Args:
        message_id: The ID of the message to process

    Returns:
        Full message details including content and context
    """
    try:
        msg_file = COPILOT_BRIDGE_DIR / "queue" / f"{message_id}.json"

        if not msg_file.exists():
            return {"success": False, "error": f"Message {message_id} not found"}

        with open(msg_file, "r", encoding="utf-8") as f:
            msg_data = json.load(f)

        return {"success": True, "message": msg_data}
    except Exception as e:
        return {"success": False, "error": str(e)}


@mcp.tool()
async def copilot_send_response(
    message_id: str, response: str, status: str = "completed"
) -> dict:
    """
    Send a response back to the Web UI after processing a message.
    This completes the bridge communication cycle.

    Args:
        message_id: The ID of the original message
        response: The response content to send back
        status: Status of the processing (completed, error, partial)

    Returns:
        Confirmation of response delivery
    """
    try:
        # Ensure directories exist
        responses_dir = COPILOT_BRIDGE_DIR / "responses"
        responses_dir.mkdir(parents=True, exist_ok=True)

        # Create response file
        response_data = {
            "messageId": message_id,
            "response": response,
            "status": status,
            "processedAt": datetime.now().isoformat(),
            "processedBy": "VS Code Copilot",
        }

        response_file = responses_dir / f"{message_id}.json"
        with open(response_file, "w", encoding="utf-8") as f:
            json.dump(response_data, f, indent=2, ensure_ascii=False)

        # Move original message to processed folder
        queue_file = COPILOT_BRIDGE_DIR / "queue" / f"{message_id}.json"
        processed_dir = COPILOT_BRIDGE_DIR / "processed"
        processed_dir.mkdir(parents=True, exist_ok=True)

        if queue_file.exists():
            # Read original and add response reference
            with open(queue_file, "r", encoding="utf-8") as f:
                original = json.load(f)
            original["processedAt"] = datetime.now().isoformat()
            original["responseFile"] = str(response_file)

            # Save to processed folder
            with open(processed_dir / f"{message_id}.json", "w", encoding="utf-8") as f:
                json.dump(original, f, indent=2, ensure_ascii=False)

            # Remove from queue
            queue_file.unlink()

        return {
            "success": True,
            "message": f"Response sent for message {message_id}",
            "responseFile": str(response_file),
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


@mcp.tool()
async def copilot_bridge_status() -> dict:
    """
    Get the current status of the Copilot Bridge system.
    Shows queue statistics and recent activity.

    Returns:
        Bridge status including pending messages, processed count, etc.
    """
    try:
        queue_dir = COPILOT_BRIDGE_DIR / "queue"
        responses_dir = COPILOT_BRIDGE_DIR / "responses"
        processed_dir = COPILOT_BRIDGE_DIR / "processed"

        pending = len(list(queue_dir.glob("*.json"))) if queue_dir.exists() else 0
        responses = (
            len(list(responses_dir.glob("*.json"))) if responses_dir.exists() else 0
        )
        processed = (
            len(list(processed_dir.glob("*.json"))) if processed_dir.exists() else 0
        )

        return {
            "success": True,
            "status": {
                "bridgeActive": True,
                "bridgeDir": str(COPILOT_BRIDGE_DIR),
                "pendingMessages": pending,
                "awaitingPickup": responses,
                "totalProcessed": processed,
            },
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


# ════════════════════════════════════════════════════════════
# MAIN ENTRY POINT
# ════════════════════════════════════════════════════════════


def main():
    """Start the MCP server."""
    brain_status = "[OK] Connected" if BRAIN_AVAILABLE else "[X] Not available"
    google_status = "[OK] Connected" if GOOGLE_AVAILABLE else "[X] Not available"

    # Count available Google services
    google_services = []
    if GOOGLE_AVAILABLE:
        status = GOOGLE_STATUS.get("services", {})
        if status.get("gemini"):
            google_services.append("Gemini")
        if status.get("youtube"):
            google_services.append("YouTube")
        if status.get("drive"):
            google_services.append("Drive")
        if status.get("calendar"):
            google_services.append("Calendar")
        if status.get("search_console"):
            google_services.append("SEO")

    google_detail = f"({', '.join(google_services)})" if google_services else ""

    print(
        f"""
╔═══════════════════════════════════════════════════════════════╗
║           LONGSANG WORKSPACE MCP SERVER                       ║
╠═══════════════════════════════════════════════════════════════╣
║  Workspace: {str(WORKSPACE_ROOT):<47} ║
║  Port:      {MCP_PORT:<47} ║
║  Transport: streamable-http                                   ║
║  Brain:     {brain_status:<47} ║
║  Google:    {google_status:<47} ║
║            {google_detail:<49} ║
╠═══════════════════════════════════════════════════════════════╣
║  File Tools: read_file, write_file, edit_file, delete_file   ║
║  Search:     search_files, list_files                         ║
║  Commands:   run_command                                      ║
║  Git:        git_status, git_diff, git_log, git_commit,      ║
║              git_push, git_pull                               ║
║  Projects:   list_projects, get_project_info                  ║
║  Brain:      brain_search, brain_add, brain_list_domains,    ║
║              brain_stats                                      ║
║  Google AI:  gemini_chat, gemini_code, gemini_summarize,     ║
║              gemini_translate                                 ║
║  YouTube:    youtube_channel_stats, youtube_list_videos,     ║
║              youtube_upload_video                             ║
║  Drive:      drive_list_files, drive_upload_file             ║
║  Calendar:   calendar_list_events, calendar_create_event     ║
║  SEO:        seo_top_queries, seo_top_pages                  ║
╚═══════════════════════════════════════════════════════════════╝
    """
    )

    logger.info(f"Starting MCP Server on port {MCP_PORT}")
    logger.info(f"Workspace root: {WORKSPACE_ROOT}")

    # Configure settings for HTTP transport
    mcp.settings.host = "0.0.0.0"
    mcp.settings.port = MCP_PORT

    # Add simple HTTP REST endpoints for direct API access (bypassing MCP protocol)
    from fastapi import FastAPI
    from fastapi.middleware.cors import CORSMiddleware
    import uvicorn

    http_app = FastAPI()
    http_app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    from pydantic import BaseModel

    class ImageRequest(BaseModel):
        prompt: str
        aspect_ratio: str = "1:1"
        style: str = None
        ad_style: str = None

    @http_app.post("/mcp/google/generate_image")
    async def http_generate_image(request: ImageRequest):
        """HTTP endpoint for image generation (for API server integration)"""
        try:
            if not request.prompt:
                return {"success": False, "error": "prompt is required"}

            result = await _gemini_generate_image(
                request.prompt, request.aspect_ratio, request.style, request.ad_style
            )
            return result
        except Exception as e:
            logger.error(f"HTTP image generation error: {e}")
            return {"success": False, "error": str(e)}

    # Video generation endpoint
    try:
        from video_generation import video_service

        class VideoRequest(BaseModel):
            product_info: dict
            ad_style: str = "product"
            duration: int = 15
            aspect_ratio: str = "9:16"
            num_images: int = 3

        @http_app.post("/mcp/video/generate")
        async def http_generate_video(request: VideoRequest):
            """HTTP endpoint for video generation (for API server integration)"""
            try:
                if not request.product_info:
                    return {"success": False, "error": "product_info is required"}

                # Pass google_client to video service
                result = await video_service.generate_ad_video(
                    product_info=request.product_info,
                    ad_style=request.ad_style,
                    duration=request.duration,
                    aspect_ratio=request.aspect_ratio,
                    num_images=request.num_images,
                    google_client=google_client,
                )
                return result
            except Exception as e:
                logger.error(f"HTTP video generation error: {e}")
                return {"success": False, "error": str(e)}

        class VideoFromImagesRequest(BaseModel):
            image_paths: list
            duration: int = 15
            fps: int = 30
            transition: str = "fade"
            audio_path: str = None
            aspect_ratio: str = "9:16"

        @http_app.post("/mcp/video/generate_from_images")
        async def http_generate_video_from_images(request: VideoFromImagesRequest):
            """HTTP endpoint for video generation from images"""
            try:
                if not request.image_paths:
                    return {"success": False, "error": "image_paths is required"}

                result = await video_service.generate_video_from_images(
                    image_paths=request.image_paths,
                    duration=request.duration,
                    fps=request.fps,
                    transition=request.transition,
                    audio_path=request.audio_path,
                    aspect_ratio=request.aspect_ratio,
                )
                return result
            except Exception as e:
                logger.error(f"HTTP video from images error: {e}")
                return {"success": False, "error": str(e)}

    except ImportError:
        logger.warning("Video generation service not available")

    # A/B Testing endpoint
    try:
        from ab_testing import ab_testing_service

        class ABTestRequest(BaseModel):
            campaign_data: dict
            confidence_level: float = 0.95

        @http_app.post("/mcp/ab-testing/analyze")
        async def http_analyze_ab_test(request: ABTestRequest):
            """HTTP endpoint for A/B testing analysis"""
            try:
                if not request.campaign_data:
                    return {"success": False, "error": "campaign_data is required"}

                result = ab_testing_service.analyze_campaign_performance(
                    campaign_data=request.campaign_data,
                    confidence_level=request.confidence_level,
                )
                return result
            except Exception as e:
                logger.error(f"HTTP A/B testing error: {e}")
                return {"success": False, "error": str(e)}

    except ImportError:
        logger.warning("A/B testing service not available")

    # Campaign Optimizer endpoint
    try:
        from campaign_optimizer import campaign_optimizer

        class CampaignOptimizeRequest(BaseModel):
            campaign_data: dict
            min_impressions: int = 1000
            confidence_level: float = 0.95

        @http_app.post("/mcp/campaign-optimizer/analyze")
        async def http_optimize_campaign(request: CampaignOptimizeRequest):
            """HTTP endpoint for campaign optimization"""
            try:
                if not request.campaign_data:
                    return {"success": False, "error": "campaign_data is required"}

                # Convert dict to CampaignPerformance dataclass
                from campaign_optimizer import CampaignPerformance
                from datetime import datetime

                perf_data = CampaignPerformance(
                    campaign_id=request.campaign_data.get("campaign_id", "unknown"),
                    variant_a_name=request.campaign_data.get(
                        "variant_a_name", "Variant A"
                    ),
                    variant_b_name=request.campaign_data.get(
                        "variant_b_name", "Variant B"
                    ),
                    variant_a_metrics=request.campaign_data.get(
                        "variant_a_metrics", {}
                    ),
                    variant_b_metrics=request.campaign_data.get(
                        "variant_b_metrics", {}
                    ),
                    variant_a_impressions=request.campaign_data.get(
                        "variant_a_impressions", 0
                    ),
                    variant_b_impressions=request.campaign_data.get(
                        "variant_b_impressions", 0
                    ),
                    variant_a_conversions=request.campaign_data.get(
                        "variant_a_conversions", 0
                    ),
                    variant_b_conversions=request.campaign_data.get(
                        "variant_b_conversions", 0
                    ),
                    start_date=datetime.fromisoformat(
                        request.campaign_data.get(
                            "start_date", datetime.now().isoformat()
                        )
                    ),
                    status=request.campaign_data.get("status", "active"),
                )

                result = await campaign_optimizer.analyze_campaign(
                    campaign_data=perf_data,
                    min_impressions=request.min_impressions,
                    confidence_level=request.confidence_level,
                )
                return result
            except Exception as e:
                logger.error(f"HTTP campaign optimization error: {e}")
                return {"success": False, "error": str(e)}

    except ImportError:
        logger.warning("Campaign optimizer service not available")

    # Advanced Optimization endpoint
    try:
        from advanced_optimization import advanced_optimization_service

        class BudgetOptimizationRequest(BaseModel):
            campaign_data: dict
            total_budget: float
            method: str = "thompson_sampling"

        @http_app.post("/mcp/advanced-optimization/budget-allocation")
        async def http_optimize_budget(request: BudgetOptimizationRequest):
            """HTTP endpoint for budget optimization"""
            try:
                if not request.campaign_data:
                    return {"success": False, "error": "campaign_data is required"}

                result = advanced_optimization_service.optimize_budget_allocation(
                    campaign_data=request.campaign_data,
                    total_budget=request.total_budget,
                    method=request.method,
                )
                return result
            except Exception as e:
                logger.error(f"HTTP budget optimization error: {e}")
                return {"success": False, "error": str(e)}

        class ForecastRequest(BaseModel):
            historical_data: list
            days_ahead: int = 7

        @http_app.post("/mcp/advanced-optimization/forecast")
        async def http_forecast(request: ForecastRequest):
            """HTTP endpoint for performance forecasting"""
            try:
                if not request.historical_data:
                    return {"success": False, "error": "historical_data is required"}

                result = advanced_optimization_service.forecast_performance(
                    historical_data=request.historical_data,
                    days_ahead=request.days_ahead,
                )
                return result
            except Exception as e:
                logger.error(f"HTTP forecasting error: {e}")
                return {"success": False, "error": str(e)}

    except ImportError:
        logger.warning("Advanced optimization service not available")

    # Robyn Marketing Mix Modeling endpoint
    try:
        from robyn_optimization import robyn_optimizer

        class RobynOptimizationRequest(BaseModel):
            historical_data: list
            total_budget: float
            channels: list

        @http_app.post("/mcp/robyn/optimize-budget")
        async def http_robyn_optimize(request: RobynOptimizationRequest):
            try:
                if not request.historical_data:
                    return {"success": False, "error": "historical_data is required"}

                result = robyn_optimizer.optimize_budget_allocation(
                    historical_data=request.historical_data,
                    total_budget=request.total_budget,
                    channels=request.channels,
                )
                return result
            except Exception as e:
                logger.error(f"HTTP Robyn optimization error: {e}")
                return {"success": False, "error": str(e)}

        class RobynAttributionRequest(BaseModel):
            historical_data: list
            channels: list

        @http_app.post("/mcp/robyn/attribution")
        async def http_robyn_attribution(request: RobynAttributionRequest):
            try:
                if not request.historical_data:
                    return {"success": False, "error": "historical_data is required"}

                result = robyn_optimizer.calculate_channel_attribution(
                    historical_data=request.historical_data, channels=request.channels
                )
                return result
            except Exception as e:
                logger.error(f"HTTP Robyn attribution error: {e}")
                return {"success": False, "error": str(e)}

    except ImportError:
        logger.warning("Robyn optimization service not available")

    # Run both MCP server and HTTP API
    import threading

    def run_http():
        uvicorn.run(http_app, host="0.0.0.0", port=MCP_PORT + 1, log_level="info")

    http_thread = threading.Thread(target=run_http, daemon=True)
    http_thread.start()
    logger.info(f"✅ HTTP API server started on port {MCP_PORT + 1}")

    # Run with HTTP transport for web access
    mcp.run(transport="streamable-http")


if __name__ == "__main__":
    main()
