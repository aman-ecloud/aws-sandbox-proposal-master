#!/usr/bin/env python3
"""
CDK Demo Deploy Runner
A dialog box pops up for credentials - held in memory only, never written to disk.
"""
import json, os, shutil, subprocess, sys
from pathlib import Path

REGION = "us-east-1"
STACK = "sqs-lambda-ddb-demo"
QUALIFIER = "sqslmd01"
TOOLKIT_STACK = "CDKToolkitDemo"   # isolated - does not touch the default CDKToolkit
LOCK_FILE = Path(__file__).parent / ".deploy.lock"

if sys.platform == "win32":
    if shutil.which("cdk.cmd"):
        CDK_CMD = "cdk.cmd"
    elif shutil.which("cdk"):
        CDK_CMD = "cdk"
    elif shutil.which("npx.cmd"):
        CDK_CMD = "npx.cmd cdk"
    else:
        CDK_CMD = "npx cdk"
else:
    CDK_CMD = "cdk" if shutil.which("cdk") else "npx cdk"


# helpers

def run(cmd, env=None, cwd=None):
    return subprocess.run(cmd, shell=True, env=env or os.environ.copy(), cwd=cwd)


def run_capture(cmd, env=None):
    return subprocess.run(
        cmd,
        shell=True,
        env=env or os.environ.copy(),
        capture_output=True,
        text=True,
    )


def _acquire_lock():
    """Block a second deploy.py from starting while one is already running.
    Prevents multiple credential dialogs from opening concurrently."""
    if LOCK_FILE.exists():
        try:
            pid = int(LOCK_FILE.read_text().strip())
            r = run_capture(f'tasklist /FI "PID eq {pid}" /NH /FO CSV')
            if str(pid) in r.stdout:
                print(f"\n  ERROR: deploy.py is already running (PID {pid}).")
                print("  Wait for it to finish, or delete .deploy.lock if it is stuck.")
                sys.exit(1)
        except Exception:
            pass
        LOCK_FILE.unlink(missing_ok=True)
    LOCK_FILE.write_text(str(os.getpid()))


def _release_lock():
    try:
        LOCK_FILE.unlink()
    except Exception:
        pass


# credential prompt (GUI dialog)

def prompt_credentials():
    """Show a GUI dialog for AWS credentials. Falls back to terminal if GUI unavailable."""
    try:
        import tkinter as tk
        from tkinter import messagebox, ttk

        result = {}

        def on_submit():
            ak = entry_ak.get().strip()
            sk = entry_sk.get().strip()
            st = entry_st.get().strip()
            if not ak or not sk:
                messagebox.showerror(
                    "Missing fields",
                    "AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are required.",
                )
                return
            result["access_key"] = ak
            result["secret_key"] = sk
            result["session_token"] = st
            root.destroy()

        def on_cancel():
            root.destroy()
            print("Cancelled by user.")
            sys.exit(0)

        root = tk.Tk()
        root.title("CDK Demo Deploy - AWS Credentials")
        root.resizable(False, False)
        root.lift()
        root.attributes("-topmost", True)
        root.focus_force()

        frame = ttk.Frame(root, padding=24)
        frame.pack(fill="both", expand=True)

        ttk.Label(
            frame,
            text="CDK Demo Deploy - AWS Credentials",
            font=("", 13, "bold"),
        ).grid(row=0, column=0, columnspan=2, pady=(0, 6))
        ttk.Label(
            frame,
            text="Credentials are held in memory only. Nothing is written to disk.",
            foreground="gray",
        ).grid(row=1, column=0, columnspan=2, pady=(0, 18))

        ttk.Label(frame, text="AWS_ACCESS_KEY_ID:").grid(
            row=2,
            column=0,
            sticky="e",
            padx=(0, 10),
            pady=6,
        )
        entry_ak = ttk.Entry(frame, width=48)
        entry_ak.grid(row=2, column=1, pady=6)

        ttk.Label(frame, text="AWS_SECRET_ACCESS_KEY:").grid(
            row=3,
            column=0,
            sticky="e",
            padx=(0, 10),
            pady=6,
        )
        entry_sk = ttk.Entry(frame, width=48, show="*")
        entry_sk.grid(row=3, column=1, pady=6)

        ttk.Label(frame, text="AWS_SESSION_TOKEN (optional):").grid(
            row=4,
            column=0,
            sticky="e",
            padx=(0, 10),
            pady=6,
        )
        entry_st = ttk.Entry(frame, width=48, show="*")
        entry_st.grid(row=4, column=1, pady=6)

        btn_frame = ttk.Frame(frame)
        btn_frame.grid(row=5, column=0, columnspan=2, pady=(20, 0))
        ttk.Button(btn_frame, text="  Deploy  ", command=on_submit).pack(side="left", padx=6)
        ttk.Button(btn_frame, text="  Cancel  ", command=on_cancel).pack(side="left", padx=6)

        root.bind("<Return>", lambda e: on_submit())
        entry_ak.focus()
        root.mainloop()

        if not result:
            print("Cancelled.")
            sys.exit(0)

        env = os.environ.copy()
        env["AWS_ACCESS_KEY_ID"] = result["access_key"]
        env["AWS_SECRET_ACCESS_KEY"] = result["secret_key"]
        if result.get("session_token"):
            env["AWS_SESSION_TOKEN"] = result["session_token"]
        else:
            env.pop("AWS_SESSION_TOKEN", None)
        return env

    except Exception as gui_err:
        # GUI unavailable - fall back to terminal prompts
        print(f"  (GUI unavailable: {gui_err} - using terminal prompts)")
        return _prompt_credentials_terminal()


def _ask(prompt, hidden=False):
    """Terminal credential prompt. Uses msvcrt on Windows for hidden input."""
    sys.stdout.write(prompt)
    sys.stdout.flush()
    if not hidden:
        return sys.stdin.readline().rstrip("\n").strip()
    if sys.platform == "win32":
        try:
            import msvcrt

            chars = []
            while True:
                ch = msvcrt.getwch()
                if ch in ("\r", "\n"):
                    break
                if ch == "\x03":
                    raise KeyboardInterrupt
                if ch == "\x08":
                    if chars:
                        chars.pop()
                else:
                    chars.append(ch)
            sys.stdout.write("\n")
            sys.stdout.flush()
            return "".join(chars).strip()
        except Exception:
            pass
    try:
        import getpass as _gp

        return _gp.getpass("").strip()
    except Exception:
        sys.stdout.write("[input will be visible] ")
        sys.stdout.flush()
        return sys.stdin.readline().rstrip("\n").strip()


def _prompt_credentials_terminal():
    print()
    print("=" * 60)
    print("  CDK Demo Deploy - AWS Credential Setup")
    print("=" * 60)
    print("  Secret key and session token are hidden as you type.")
    print("  Nothing is written to any file.")
    print()
    access_key = _ask("  AWS_ACCESS_KEY_ID     : ", hidden=False)
    secret_key = _ask("  AWS_SECRET_ACCESS_KEY : ", hidden=True)
    session_token = _ask("  AWS_SESSION_TOKEN     : ", hidden=True)
    if not access_key or not secret_key:
        print("\n  ERROR: Access key and secret key are required.")
        sys.exit(1)
    env = os.environ.copy()
    env["AWS_ACCESS_KEY_ID"] = access_key
    env["AWS_SECRET_ACCESS_KEY"] = secret_key
    if session_token:
        env["AWS_SESSION_TOKEN"] = session_token
    else:
        env.pop("AWS_SESSION_TOKEN", None)
    return env


# steps

def verify_access(env):
    print()
    print("  Verifying AWS access...")
    r = run_capture("aws sts get-caller-identity --output json", env=env)
    if r.returncode != 0:
        r = run_capture('powershell -Command "aws sts get-caller-identity --output json"', env=env)
    if r.returncode != 0:
        print("\n  ERROR: AWS access check failed.")
        print(" ", (r.stderr or r.stdout).strip())
        sys.exit(1)
    identity = json.loads(r.stdout)
    print(f"  Account : {identity['Account']}")
    print(f"  ARN     : {identity['Arn']}")
    print(f"  Region  : {REGION}")
    return identity


def _cleanup_stale_toolkit(env):
    """Remove stale SSM parameter and any stuck CDKToolkitDemo stack before bootstrapping."""
    run_capture(
        f"aws ssm delete-parameter --name /cdk-bootstrap/{QUALIFIER}/version --region {REGION}",
        env=env,
    )
    r = run_capture(
        f"aws cloudformation describe-stacks --stack-name {TOOLKIT_STACK} --region {REGION}"
        f" --query Stacks[0].StackStatus --output text",
        env=env,
    )
    status = r.stdout.strip()
    stuck = {
        "ROLLBACK_COMPLETE",
        "ROLLBACK_FAILED",
        "UPDATE_ROLLBACK_FAILED",
        "DELETE_FAILED",
        "UPDATE_ROLLBACK_COMPLETE",
    }
    if status in stuck:
        print(f"  Removing stuck CDK toolkit stack (status: {status})...")
        run(
            f"aws cloudformation delete-stack --stack-name {TOOLKIT_STACK} --region {REGION}",
            env=env,
        )
        run(
            f"aws cloudformation wait stack-delete-complete --stack-name {TOOLKIT_STACK} --region {REGION}",
            env=env,
        )


def ensure_bootstrap(env, account_id):
    print("\n  Checking CDK bootstrap...")
    assets_bucket = f"cdk-{QUALIFIER}-assets-{account_id}-{REGION}"
    r = run_capture(f"aws s3api head-bucket --bucket {assets_bucket}", env=env)
    if r.returncode == 0:
        print(f"  Bootstrap OK - bucket present: {assets_bucket}")
        return
    print(
        f"  Bootstrapping CDK in {REGION} using isolated toolkit stack '{TOOLKIT_STACK}'..."
    )
    print("  (One-time setup, takes ~2 minutes)")
    _cleanup_stale_toolkit(env)
    r = run(
        f"{CDK_CMD} bootstrap aws://{account_id}/{REGION}"
        f" --qualifier {QUALIFIER}"
        f" --toolkit-stack-name {TOOLKIT_STACK}"
        f" --cloudformation-execution-policies arn:aws:iam::aws:policy/AdministratorAccess"
        f" --force --ci",
        env=env,
        cwd=Path(__file__).parent,
    )
    if r.returncode != 0:
        print("\n  ERROR: CDK bootstrap failed. Check CloudFormation in the AWS console.")
        sys.exit(1)


def deploy(env):
    print(f"\n  Deploying '{STACK}' to {REGION}...\n")
    r = run(
        f"{CDK_CMD} deploy"
        f" --toolkit-stack-name {TOOLKIT_STACK}"
        f" --require-approval never --ci",
        env=env,
        cwd=Path(__file__).parent,
    )
    if r.returncode != 0:
        print("\n  Deploy failed - check errors above, fix stack.py, then re-run: python deploy.py")
        sys.exit(1)


def destroy(env):
    print(f"\n  Destroying '{STACK}' in {REGION}...")
    r = run(
        f"{CDK_CMD} destroy"
        f" --toolkit-stack-name {TOOLKIT_STACK}"
        f" --force --ci",
        env=env,
        cwd=Path(__file__).parent,
    )
    if r.returncode != 0:
        print("\n  Destroy failed. Check errors above.")
        sys.exit(1)


# main

def main():
    _acquire_lock()
    try:
        print()
        print("  A dialog box will open - enter your AWS credentials there.")
        print()

        env = prompt_credentials()
        identity = verify_access(env)

        if "--destroy" in sys.argv:
            destroy(env)
            print("\n  Stack destroyed successfully.")
            return

        ensure_bootstrap(env, identity["Account"])
        deploy(env)

        print()
        print("=" * 60)
        print(f"  Stack '{STACK}' deployed successfully.")
        print(f"  Region  : {REGION}")
        print()
        print("  Console:")
        print(
            f"  https://console.aws.amazon.com/cloudformation/home"
            f"?region={REGION}#/stacks"
        )
        print()
        print("  To tear down:")
        print("    python deploy.py --destroy")
        print("=" * 60)
    finally:
        _release_lock()


if __name__ == "__main__":
    main()
