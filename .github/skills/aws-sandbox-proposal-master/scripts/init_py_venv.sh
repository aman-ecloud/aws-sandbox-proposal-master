#!/usr/bin/env bash
set -euo pipefail

VENV_DIR=".venv"
PYTHON_EXE="$VENV_DIR/Scripts/python.exe"
REQUIREMENTS=".github/skills/aws-sandbox-proposal-master/scripts/requirements.txt"

if [ -f "$PYTHON_EXE" ]; then
  echo "Virtual environment already exists at $VENV_DIR — skipping creation."
else
  echo "Creating virtual environment at $VENV_DIR..."
  python -m venv "$VENV_DIR"
fi

source "$VENV_DIR/Scripts/activate"

echo "Upgrading pip..."
python -m pip install --upgrade pip --quiet

echo "Installing dependencies from $REQUIREMENTS..."
python -m pip install -r "$REQUIREMENTS" --quiet

mkdir -p .vscode
if [ ! -f .vscode/settings.json ]; then
  cat > .vscode/settings.json <<'EOF'
{
  "python.defaultInterpreterPath": "${workspaceFolder}/.venv/Scripts/python.exe",
  "python.terminal.activateEnvironment": true
}
EOF
  echo "Created .vscode/settings.json with .venv interpreter."
else
  echo ".vscode/settings.json already exists; keeping it unchanged."
fi

echo "Environment ready."
