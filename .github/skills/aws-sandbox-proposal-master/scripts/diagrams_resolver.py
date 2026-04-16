#!/usr/bin/env python3
"""
diagrams_resolver.py — Pre-flight check for the Python `diagrams` library.

Resolves the *actual* import names available in the installed version of the
`diagrams` package and provides helper functions for Agents to look up the
correct class name before writing diagram code.

Usage (from within diagram-generating code):
    from diagrams_resolver import resolve, list_module, check_env

    # One-shot: check whole environment
    check_env()                              # exits with guidance if anything is missing

    # Look up a class by keyword
    cls = resolve('opensearch', 'aws.analytics')  # -> 'AmazonOpensearchService'
    cls = resolve('bedrock', 'aws.ml')            # -> 'Bedrock'

    # List all classes in a module
    list_module('aws.compute')               # prints ECS, Lambda, EC2, ...

CLI:
    python diagrams_resolver.py              # run full env check
    python diagrams_resolver.py resolve opensearch aws.analytics
    python diagrams_resolver.py list aws.compute
"""
import importlib
import os
import pkgutil
import subprocess
import sys
from pathlib import Path
from typing import Optional

# ──────────────────────────────────────────────────────────────────────────────
# Module catalogue — extend as needed
# ──────────────────────────────────────────────────────────────────────────────
KNOWN_MODULES = [
    "diagrams.aws.analytics",
    "diagrams.aws.ar",
    "diagrams.aws.blockchain",
    "diagrams.aws.business",
    "diagrams.aws.compute",
    "diagrams.aws.cost",
    "diagrams.aws.database",
    "diagrams.aws.devtools",
    "diagrams.aws.enablement",
    "diagrams.aws.enduser",
    "diagrams.aws.engagement",
    "diagrams.aws.game",
    "diagrams.aws.general",
    "diagrams.aws.integration",
    "diagrams.aws.iot",
    "diagrams.aws.management",
    "diagrams.aws.media",
    "diagrams.aws.migration",
    "diagrams.aws.ml",
    "diagrams.aws.mobile",
    "diagrams.aws.network",
    "diagrams.aws.quantum",
    "diagrams.aws.robotics",
    "diagrams.aws.satellite",
    "diagrams.aws.security",
    "diagrams.aws.storage",
    "diagrams.gcp.analytics",
    "diagrams.gcp.compute",
    "diagrams.gcp.database",
    "diagrams.gcp.devtools",
    "diagrams.gcp.ml",
    "diagrams.gcp.network",
    "diagrams.gcp.security",
    "diagrams.gcp.storage",
    "diagrams.azure.analytics",
    "diagrams.azure.compute",
    "diagrams.azure.database",
    "diagrams.azure.devops",
    "diagrams.azure.general",
    "diagrams.azure.integration",
    "diagrams.azure.ml",
    "diagrams.azure.network",
    "diagrams.azure.security",
    "diagrams.azure.storage",
    "diagrams.onprem.analytics",
    "diagrams.onprem.compute",
    "diagrams.onprem.container",
    "diagrams.onprem.database",
    "diagrams.onprem.logging",
    "diagrams.onprem.monitoring",
    "diagrams.onprem.network",
    "diagrams.onprem.queue",
    "diagrams.onprem.security",
    "diagrams.onprem.vcs",
    "diagrams.onprem.workflow",
]


def _public_classes(module_path: str) -> list[str]:
    """Return all public class names exported by a diagrams sub-module."""
    try:
        mod = importlib.import_module(module_path)
        return [
            name for name in dir(mod)
            if not name.startswith("_") and name[0].isupper()
        ]
    except ImportError:
        return []


def list_module(module_suffix: str) -> list[str]:
    """List all available classes in a diagrams module.

    Args:
        module_suffix: Dot-path suffix, e.g. 'aws.compute', 'gcp.database'

    Returns:
        Sorted list of class names.

    Example:
        list_module('aws.analytics')
        # → ['AmazonOpensearchService', 'Athena', 'Cloudsearch', ...]
    """
    full = f"diagrams.{module_suffix}" if not module_suffix.startswith("diagrams.") else module_suffix
    classes = sorted(_public_classes(full))
    if classes:
        print(f"[{full}]")
        for cls in classes:
            print(f"  {cls}")
    else:
        print(f"[WARNING] No classes found (or module not installed): {full}")
    return classes


def resolve(keyword: str, module_suffix: str) -> Optional[str]:
    """Fuzzy-find the correct class name for a service keyword in a module.

    Performs case-insensitive substring matching.  Returns the *first* match.

    Args:
        keyword:       Service keyword, e.g. 'opensearch', 'bedrock', 'lambda'
        module_suffix: Dot-path suffix, e.g. 'aws.analytics', 'aws.ml'

    Returns:
        The exact class name, or None if no match is found.

    Example:
        resolve('opensearch', 'aws.analytics')  # → 'AmazonOpensearchService'
        resolve('bedrock',    'aws.ml')          # → 'Bedrock'
        resolve('lambda',     'aws.compute')     # → 'Lambda'
    """
    full = f"diagrams.{module_suffix}" if not module_suffix.startswith("diagrams.") else module_suffix
    classes = _public_classes(full)
    kw = keyword.lower().replace("-", "").replace("_", "")
    matches = [c for c in classes if kw in c.lower().replace("_", "")]
    if matches:
        result = matches[0]
        if len(matches) > 1:
            print(f"[resolve] '{keyword}' matched {len(matches)} in {full}: {matches} → using '{result}'")
        else:
            print(f"[resolve] '{keyword}' → '{result}' in {full}")
        return result
    print(f"[resolve] '{keyword}' NOT FOUND in {full}. Available: {classes}")
    return None


def build_import_map(services: dict[str, str]) -> dict[str, str]:
    """Resolve multiple service → module mappings at once.

    Args:
        services: A dict of { service_keyword: module_suffix }.
                  e.g. {'opensearch': 'aws.analytics', 'rds': 'aws.database'}

    Returns:
        Dict of { resolved_class_name: module_path } ready for import statements.

    Example:
        imports = build_import_map({
            'opensearch': 'aws.analytics',
            'ecs':        'aws.compute',
            'bedrock':    'aws.ml',
        })
        # → {'AmazonOpensearchService': 'diagrams.aws.analytics',
        #    'ECS':                     'diagrams.aws.compute',
        #    'Bedrock':                 'diagrams.aws.ml'}
    """
    result = {}
    for keyword, module_suffix in services.items():
        cls = resolve(keyword, module_suffix)
        if cls:
            full = f"diagrams.{module_suffix}" if not module_suffix.startswith("diagrams.") else module_suffix
            result[cls] = full
    return result


def generate_import_statements(import_map: dict[str, str]) -> str:
    """Convert an import_map to Python import statement lines.

    Args:
        import_map: Output of build_import_map().

    Returns:
        String of import lines ready to paste into diagram code.
    """
    grouped: dict[str, list[str]] = {}
    for cls, module in import_map.items():
        grouped.setdefault(module, []).append(cls)
    lines = []
    for module, classes in sorted(grouped.items()):
        lines.append(f"from {module} import {', '.join(sorted(classes))}")
    return "\n".join(lines)


# ──────────────────────────────────────────────────────────────────────────────
# Virtual-environment detection
# ──────────────────────────────────────────────────────────────────────────────

def _venv_python(venv_root: Path) -> Optional[str]:
    """Return the Python executable inside a venv directory, or None if invalid."""
    if not venv_root.is_dir():
        return None
    # Windows: Scripts/python.exe  |  Unix/macOS: bin/python or bin/python3
    for rel in ("Scripts/python.exe", "bin/python", "bin/python3"):
        exe = venv_root / rel
        if exe.exists():
            return str(exe)
    return None


def detect_venv(search_dir: Optional[str] = None) -> dict:
    """Detect a virtual environment and return the recommended Python executable.

    Priority order:
        1. Already running inside a venv (``VIRTUAL_ENV`` env var or
           ``sys.prefix != sys.base_prefix``).
        2. A venv found under *search_dir* (defaults to CWD) with one of the
           common names: ``.venv``, ``venv``, ``env``, ``.env``.
        3. The current ``sys.executable`` (system / main Python).

    Returns:
        dict with keys:
            ``in_venv``          bool   — a venv is active or was found
            ``venv_path``        str    — path to the venv root ('' if none)
            ``python_executable``str    — recommended Python executable to use
            ``source``           str    — how the decision was made
    """
    # ── 1. VIRTUAL_ENV environment variable (shell-activated venv) ────────────
    virtual_env = os.environ.get("VIRTUAL_ENV", "").strip()
    if virtual_env:
        exe = _venv_python(Path(virtual_env)) or sys.executable
        return {
            "in_venv": True,
            "venv_path": virtual_env,
            "python_executable": exe,
            "source": "VIRTUAL_ENV environment variable",
        }

    # ── 2. sys.prefix diverged from base_prefix (venv already active) ─────────
    base_prefix = getattr(sys, "base_prefix", sys.prefix)
    if sys.prefix != base_prefix:
        return {
            "in_venv": True,
            "venv_path": sys.prefix,
            "python_executable": sys.executable,
            "source": "sys.prefix != sys.base_prefix (venv is active)",
        }

    # ── 3. Scan common venv directory names relative to search_dir / CWD ──────
    base = Path(search_dir).resolve() if search_dir else Path.cwd()
    for name in (".venv", "venv", "env", ".env"):
        candidate = base / name
        exe = _venv_python(candidate)
        if exe:
            return {
                "in_venv": True,
                "venv_path": str(candidate),
                "python_executable": exe,
                "source": f"found '{name}/' directory in {base}",
            }

    # ── 4. No venv found — fall back to current interpreter ───────────────────
    return {
        "in_venv": False,
        "venv_path": "",
        "python_executable": sys.executable,
        "source": "no virtual environment found — using system Python",
    }


# ──────────────────────────────────────────────────────────────────────────────
# Environment check
# ──────────────────────────────────────────────────────────────────────────────
def check_env(auto_install: bool = False) -> bool:
    """Check that all required tools are installed and available.

    Verifies:
    - Python version >= 3.10
    - `diagrams` library importable
    - `graphviz` executable on PATH
    - `docxtpl` library importable
    - `docx` (python-docx) library importable

    Args:
        auto_install: If True, attempt to pip-install missing Python packages
                      automatically.

    Returns:
        True if all checks pass, False otherwise.
    """
    ok = True
    issues = []
    installs_needed = []

    # ── Virtual environment detection ────────────────────────────────────────
    venv_info = detect_venv()
    if venv_info["in_venv"]:
        print(f"✅ Virtual environment detected ({venv_info['source']})")
        print(f"   Python executable: {venv_info['python_executable']}")
        # Warn if the script is running under a *different* interpreter than
        # the one inside the venv (common on Windows with multiple Pythons).
        if venv_info["python_executable"] != sys.executable:
            print(
                f"⚠️  Current interpreter ({sys.executable}) differs from the "
                f"venv interpreter ({venv_info['python_executable']}).\n"
                f"   Re-run using the venv Python to ensure packages installed "
                f"inside the venv are importable:\n"
                f"   {venv_info['python_executable']} {__file__} check"
            )
    else:
        print(f"ℹ️  No virtual environment found — using system Python ({sys.executable})")
        print(
            "   If you see import errors below, consider creating a venv:\n"
            "     python -m venv .venv\n"
            "     .venv\\Scripts\\activate  (Windows)\n"
            "     source .venv/bin/activate  (Unix/macOS)\n"
            "   Then re-run:  pip install diagrams docxtpl python-docx"
        )

    # ── Python version ──────────────────────────────────────────────────────
    major, minor = sys.version_info[:2]
    if (major, minor) < (3, 10):
        issues.append(f"Python >= 3.10 required (found {major}.{minor})")
        ok = False
    else:
        print(f"✅ Python {major}.{minor}.{sys.version_info[2]}")

    # ── diagrams ─────────────────────────────────────────────────────────────
    try:
        import diagrams
        ver = getattr(diagrams, "__version__", "unknown")
        print(f"✅ diagrams {ver}")
    except ImportError:
        issues.append("diagrams not installed")
        installs_needed.append("diagrams")
        ok = False

    # ── graphviz binary ───────────────────────────────────────────────────────
    try:
        result = subprocess.run(
            ["dot", "-V"], capture_output=True, text=True, timeout=5
        )
        ver_line = (result.stdout or result.stderr).strip().split("\n")[0]
        print(f"✅ Graphviz: {ver_line}")
    except (FileNotFoundError, subprocess.TimeoutExpired):
        issues.append(
            "Graphviz 'dot' binary not found on PATH.\n"
            "  Install: https://graphviz.org/download/\n"
            "  Windows: winget install graphviz  |  choco install graphviz\n"
            "  macOS:   brew install graphviz\n"
            "  Ubuntu:  sudo apt install graphviz"
        )
        ok = False

    # ── docxtpl ───────────────────────────────────────────────────────────────
    try:
        import docxtpl
        print(f"✅ docxtpl {docxtpl.__version__}")
    except ImportError:
        issues.append("docxtpl not installed")
        installs_needed.append("docxtpl")
        ok = False

    # ── python-docx ───────────────────────────────────────────────────────────
    try:
        import docx
        version = getattr(docx, "__version__", "unknown")
        print(f"✅ python-docx {version}")
    except ImportError:
        issues.append("python-docx not installed")
        installs_needed.append("python-docx")
        ok = False

    # ── Auto-install missing pip packages ────────────────────────────────────
    if installs_needed and auto_install:
        print(f"\n🔧 Auto-installing: {', '.join(installs_needed)}")
        subprocess.check_call([sys.executable, "-m", "pip", "install"] + installs_needed)
        print("✅ Installation complete — please re-run the check.")
        return False  # Force re-check after install

    # ── Report ────────────────────────────────────────────────────────────────
    if issues:
        print("\n❌ Environment issues found:")
        for issue in issues:
            print(f"  • {issue}")
        if installs_needed:
            print(f"\nTo fix Python packages, run:")
            print(f"  pip install {' '.join(installs_needed)}")
        return False

    print("\n✅ All environment checks passed.")
    return True


# ──────────────────────────────────────────────────────────────────────────────
# CLI entry point
# ──────────────────────────────────────────────────────────────────────────────
def main():
    import argparse

    parser = argparse.ArgumentParser(
        description="diagrams_resolver — AWS Sandbox Proposal Skill helper"
    )
    sub = parser.add_subparsers(dest="cmd")

    # check
    p_check = sub.add_parser("check", help="Run full environment check")
    p_check.add_argument("--auto-install", action="store_true",
                         help="Auto-install missing pip packages")

    # resolve
    p_resolve = sub.add_parser("resolve", help="Resolve a service class name")
    p_resolve.add_argument("keyword", help="Service keyword, e.g. 'opensearch'")
    p_resolve.add_argument("module", help="Module suffix, e.g. 'aws.analytics'")

    # list
    p_list = sub.add_parser("list", help="List all classes in a module")
    p_list.add_argument("module", help="Module suffix, e.g. 'aws.compute'")

    # imports (generate import statements from service map)
    p_imp = sub.add_parser("imports", help="Generate import statements for services")
    p_imp.add_argument(
        "services", nargs="+",
        help="service:module pairs, e.g. opensearch:aws.analytics ecs:aws.compute"
    )

    # venv — standalone virtual-environment detection
    p_venv = sub.add_parser("venv", help="Detect virtual environment and print recommended Python path")
    p_venv.add_argument(
        "--dir", default="",
        help="Directory to search for a venv (default: current working directory)"
    )

    args = parser.parse_args()

    if args.cmd == "venv":
        info = detect_venv(search_dir=args.dir or None)
        status = "✅ venv active/found" if info["in_venv"] else "ℹ️  no venv found"
        print(f"{status}")
        print(f"  source:     {info['source']}")
        print(f"  venv_path:  {info['venv_path'] or '(none)'}")
        print(f"  python_exe: {info['python_executable']}")
        sys.exit(0)

    if args.cmd == "check" or args.cmd is None:
        auto = getattr(args, "auto_install", False)
        success = check_env(auto_install=auto)
        sys.exit(0 if success else 1)

    elif args.cmd == "resolve":
        result = resolve(args.keyword, args.module)
        if result:
            print(f"\nUse in import:\n  from diagrams.{args.module} import {result}")
        else:
            sys.exit(1)

    elif args.cmd == "list":
        classes = list_module(args.module)
        sys.exit(0 if classes else 1)

    elif args.cmd == "imports":
        services = {}
        for pair in args.services:
            if ":" not in pair:
                print(f"[ERROR] Expected keyword:module, got '{pair}'")
                sys.exit(1)
            kw, mod = pair.split(":", 1)
            services[kw] = mod
        import_map = build_import_map(services)
        stmts = generate_import_statements(import_map)
        print(stmts)


if __name__ == "__main__":
    main()
