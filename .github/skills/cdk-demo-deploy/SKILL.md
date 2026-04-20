---
name: cdk-demo-deploy
description: >-
  Fully autonomous CDK Python deploy skill. Writes stack files then immediately
  runs cdk ls and python deploy.py without any user intervention. A GUI dialog
  opens for AWS credentials; after the user submits it, deployment proceeds
  automatically. The skill is complete only when the stack is live in AWS.
  Use when the user asks to deploy a demo stack, spin up AWS services, or
  create a CDK demo environment. The user runs nothing manually.
metadata:
  author: eCloudvalley
  version: "1.1"
---

# CDK Demo Deploy Skill

## Definition of Done

**This skill is NOT complete until `python deploy.py` has been executed and exited successfully.** Writing files is not done. Running `cdk ls` is not done. Listing "next steps" is not done. Done means the stack is deployed in AWS and you have shown the final summary.

Do not stop, do not produce a summary with "next steps", do not hand off to the user mid-run. Execute every step yourself.

---

## When to activate

User says: "deploy a demo stack", "create a CDK stack", "spin up [services]", "deploy Lambda and DynamoDB", "set up a demo AWS environment", "deploy the demo for [proposal name]"

---

## Step 1 — Understand the architecture (gather everything upfront)

**Do this step completely before writing any files or running any commands. Ask at most ONE question, get everything you need, then execute steps 2–9 without interrupting the user again.**

### If the user described services in their request

Parse the request directly. Identify **all** of:
- Every AWS service to create (include all that were named — do not drop any)
- How each service connects to the others (from the description or implied by standard patterns)
- Target region (default to `ap-south-1` / Asia Pacific (Mumbai) if not mentioned)

Example: "deploy API Gateway + Lambda + DynamoDB + S3 in Singapore" →
- Services: **Amazon API Gateway, AWS Lambda, Amazon DynamoDB, Amazon S3** — all four
- Wiring: API GW → Lambda; Lambda → DynamoDB (read/write); Lambda → S3 (read/write)
- Region: ap-southeast-1

**Do not silently drop services.** If the user named four services, all four must appear in `stack.py`.

### If the user referenced an existing proposal

Find the context.json:

```bash
python -c "
from pathlib import Path
import json
folders = sorted(Path('output').glob('*/context.json'), key=lambda p: p.stat().st_mtime, reverse=True)
if not folders:
    print('No context.json found — describe the architecture directly.')
else:
    ctx = json.loads(folders[0].read_text(encoding='utf-8'))
    print('Found:', folders[0].parent.name)
    print('Services:', [s['service_name'] for s in ctx['sandbox']['business']['service_list']])
    print('Region:', ctx['sandbox']['business']['region'])
    print('Architecture:', ctx['sandbox']['architecture'].get('description', ''))
"
```

Read `sandbox.architecture.description` for wiring details. Use `sandbox.architecture.applied_services` (not `service_list`) as the authoritative list. Every service in that list must appear in `stack.py`.

### If neither — ask ONE consolidated question

Ask a single question covering everything at once:

> "What services do you want in the demo stack, how should they connect, and which AWS region? (default: Mumbai)"

Wait for the answer, then proceed through steps 2–9 without asking anything further.

---

## Step 2 — Check environment (single command)

Run this once:

```bash
pip show aws-cdk-lib 2>/dev/null || pip install aws-cdk-lib constructs && cdk.cmd --version 2>/dev/null || cdk --version 2>/dev/null || npm install -g aws-cdk
```

If `aws-cdk-lib` is already installed and CDK CLI is present, the output is instant — move on. Do not run multiple separate env checks.

---

## Step 3 — Choose output location

**Do not read any existing files in the `output/` folder.** All patterns, templates, and conventions are defined in this SKILL.md — use them directly without reading prior runs for reference.

### Derive the stack name, qualifier, and folder from the services

Before writing any files, compute three values from the actual services in the request. These must be consistent across all four files.

#### Step A — Build the abbreviation list

Map each requested service to its abbreviation using this table. Order follows the data flow described in the request (source → processor → sink).

| Service | PascalCase abbrev | Qualifier char(s) |
|---|---|---|
| AWS Lambda | `Lambda` | `l` |
| Amazon DynamoDB | `Dynamo` | `dy` |
| Amazon SQS | `Sqs` | `sq` |
| Amazon SNS | `Sns` | `sn` |
| Amazon S3 | `S3` | `s3` |
| Amazon API Gateway | `ApiGw` | `ag` |
| Amazon Kinesis | `Kinesis` | `ki` |
| Amazon EventBridge | `Events` | `ev` |
| Amazon RDS | `Rds` | `rd` |
| Amazon ElastiCache | `Cache` | `ec` |
| Amazon EKS | `Eks` | `ek` |
| AWS Fargate | `Fargate` | `fg` |
| Amazon CloudFront | `Cdn` | `cf` |
| AWS Step Functions | `Sfn` | `sf` |
| Amazon Cognito | `Cognito` | `co` |
| Amazon OpenSearch | `Search` | `os` |
| AWS Secrets Manager | `Secrets` | `sc` |
| Amazon Redshift | `Redshift` | `rs` |
| Amazon VPC | `Vpc` | `vp` |
| Amazon CloudWatch | `Cw` | `cw` |
| AWS IoT Core | `Iot` | `io` |
| Amazon Bedrock | `Bedrock` | `br` |
| Amazon ECS | `Ecs` | `cs` |
| AWS Glue | `Glue` | `gl` |
| Amazon MSK | `Msk` | `mk` |

**If a service is not in this table:** use the first meaningful word of its name in PascalCase as the abbreviation, and its first two lowercase letters as the qualifier chars.

#### Step B — Derive the three values

**Stack name** = abbreviations joined (PascalCase) + `Demo`. Use at most 4 services in the name; if there are more, use the 3 most architecturally significant ones.

**Qualifier** = qualifier chars joined (lowercase, no separator), truncated so total length is 6–9 chars. Must be alphanumeric only.

**Folder** = stack name in kebab-case (replace PascalCase word boundaries with hyphens, lowercase) + `-` + timestamp `YYYYMMDD_HHMM`.

#### Step B — Examples

| Request | Stack name | Qualifier | Folder prefix |
|---|---|---|---|
| SQS → Lambda → DynamoDB | `SqsLambdaDynamoDemo` | `sqldydemo` | `sqs-lambda-dynamo-demo-` |
| API Gateway → Lambda → DynamoDB | `ApiGwLambdaDynamoDemo` | `agldydemo` | `apigw-lambda-dynamo-demo-` |
| S3 → Lambda → SNS | `S3LambdaSnsDemo` | `s3lsndemo` | `s3-lambda-sns-demo-` |
| Kinesis → Lambda → S3 → CloudWatch | `KinesisLambdaS3Demo` | `kils3demo` | `kinesis-lambda-s3-demo-` |
| EventBridge → Step Functions → Lambda | `EventsSfnLambdaDemo` | `evsfldem` | `events-sfn-lambda-demo-` |
| API Gateway → Cognito → Lambda → RDS | `ApiGwCognitoLambdaDemo` | `agcoldemo` | `apigw-cognito-lambda-demo-` |

Both **stack name** and **qualifier** must be **identical** in `app.py` and `deploy.py`.

#### Step C — Get the timestamp and create the folder

```bash
python -c "from datetime import datetime; print(datetime.now().strftime('%Y%m%d_%H%M'))"
```

Combine: `output/{folder-prefix}{timestamp}/` — e.g. `output/sqs-lambda-dynamo-demo-20260420_1430/`

```bash
mkdir -p output/{folder}/
```

---

## Step 4 — Write `cdk.json`

```json
{
  "app": "python app.py"
}
```

Write to `output/{folder}/cdk.json`.

---

## Step 5 — Write `stack.py`

This is the main reasoning step. Based on the services and wiring from Step 1, write a CDK Python stack.

**Include every service that was named in Step 1 — do not skip any.** Do not ask the user for more information; use the demo sizing table and standard wiring patterns below. Wire every service to its logical neighbour as described in Step 1.

### Demo sizing — use these, not calculator or production values

| Service | CDK construct | Demo config |
|---|---|---|
| AWS Lambda | `aws_lambda.Function` | `memory_size=128`, `runtime=lambda_.Runtime.PYTHON_3_12`, `timeout=Duration.seconds(30)`, `code=lambda_.Code.from_inline("def handler(e,c): return {'statusCode':200,'body':'ok'}")` |
| Amazon DynamoDB | `dynamodb.Table` | `billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST`, `removal_policy=RemovalPolicy.DESTROY` |
| Amazon S3 | `s3.Bucket` | `removal_policy=RemovalPolicy.DESTROY`, `auto_delete_objects=True` |
| Amazon SQS | `sqs.Queue` | defaults, `removal_policy=RemovalPolicy.DESTROY` |
| Amazon SNS | `sns.Topic` | defaults |
| Amazon Kinesis Data Streams | `kinesis.Stream` | `shard_count=1`, `retention_period=Duration.hours(24)`, `removal_policy=RemovalPolicy.DESTROY` |
| Amazon API Gateway (HTTP) | `apigwv2.HttpApi` | defaults |
| Amazon EventBridge | `events.Rule` | per event pattern from architecture |
| AWS Secrets Manager | `secretsmanager.Secret` | `removal_policy=RemovalPolicy.DESTROY` |
| AWS KMS | `kms.Key` | `removal_policy=RemovalPolicy.DESTROY` |
| Amazon CloudWatch | `cloudwatch.Dashboard` + `cloudwatch.Alarm` | 1 dashboard, 1 alarm per compute service |
| Amazon Cognito | `cognito.UserPool` | `removal_policy=RemovalPolicy.DESTROY` |
| Amazon RDS / Aurora | `rds.DatabaseInstance` | `instance_type=ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO)`, `multi_az=False`, `allocated_storage=20`, `removal_policy=RemovalPolicy.DESTROY`, `delete_automated_backups=True` |
| Amazon ElastiCache | `elasticache.CfnCacheCluster` (L1 — no L2 exists) | `cache_node_type="cache.t3.micro"`, `num_cache_nodes=1`, `engine="redis"` |
| Amazon EKS | `eks.Cluster` | `version=eks.KubernetesVersion.V1_29`, `default_capacity=1`, `default_capacity_instance=ec2.InstanceType("t3.medium")` |
| AWS Fargate | `ecs_patterns.ApplicationLoadBalancedFargateService` | `cpu=256`, `memory_limit_mib=512`, `desired_count=1` |
| Amazon OpenSearch | `opensearch.Domain` | `version=opensearch.EngineVersion.OPENSEARCH_2_11`, capacity: 1x `t3.small.search`, EBS 10 GB, `removal_policy=RemovalPolicy.DESTROY` |
| AWS Step Functions | `sfn.StateMachine` | minimal pass state for demo |
| Amazon CloudFront | `cloudfront.Distribution` | with S3 or API origin |
| AWS Glue | `glue.CfnCrawler` (L1) | pointed at S3 bucket |
| Amazon IoT Core | `iot.CfnTopicRule` (L1) | with Kinesis or SQS action |
| Amazon Bedrock | No construct — fully managed API. Add a comment only. |
| Amazon SageMaker | No L2 — add a comment; needs a model artifact to deploy. |
| Amazon Comprehend / Rekognition / Textract / Polly / Transcribe / Translate | No construct — API-only. Add a comment. |

### VPC — auto-add when needed

If any service requires a VPC (RDS, ElastiCache, EKS, Fargate, OpenSearch, MSK), add a VPC first:

```python
vpc = ec2.Vpc(self, "Vpc", max_azs=2, nat_gateways=1)
```

Pass `vpc=vpc` to all services that need it.

### Wiring — use L2 grant methods and event sources

```python
# Lambda ← SQS trigger
lambda_fn.add_event_source(event_sources.SqsEventSource(queue))

# Lambda ← Kinesis trigger
lambda_fn.add_event_source(event_sources.KinesisEventSource(
    stream, starting_position=lambda_.StartingPosition.LATEST))

# Lambda ↔ DynamoDB
table.grant_read_write_data(lambda_fn)

# Lambda ↔ S3
bucket.grant_read_write(lambda_fn)

# API Gateway → Lambda
api.add_routes(
    path="/{proxy+}",
    methods=[apigwv2.HttpMethod.ANY],
    integration=apigwv2_integrations.HttpLambdaIntegration("Integration", lambda_fn)
)
# Allow API GW to invoke Lambda
lambda_fn.add_permission("ApiInvoke",
    principal=iam.ServicePrincipal("apigateway.amazonaws.com"),
    source_arn=api.arn_for_execute_api()
)

# SNS → SQS
topic.add_subscription(sns_subs.SqsSubscription(queue))

# EventBridge → Lambda
rule.add_target(targets.LambdaFunction(lambda_fn))

# Lambda → Secrets Manager
secret.grant_read(lambda_fn)

# Lambda → KMS
key.grant_encrypt_decrypt(lambda_fn)

# Kinesis Firehose → S3
# Use CfnDeliveryStream (L1) with S3 destination config
```

### Tags — apply to every resource via the app

Tags are applied at the stack level in `app.py` (see Step 6) — no need to tag each resource individually.

### Stack template

```python
import aws_cdk as cdk
from aws_cdk import (
    Stack, Duration, RemovalPolicy,
    aws_lambda as lambda_,
    aws_dynamodb as dynamodb,
    aws_s3 as s3,
    aws_sqs as sqs,
    aws_sns as sns,
    aws_sns_subscriptions as sns_subs,
    aws_kinesis as kinesis,
    aws_apigatewayv2 as apigwv2,
    aws_apigatewayv2_integrations as apigwv2_integrations,
    aws_lambda_event_sources as event_sources,
    aws_iam as iam,
    aws_ec2 as ec2,
    aws_events as events,
    aws_events_targets as targets,
    aws_cloudwatch as cloudwatch,
    aws_logs as logs,
    aws_secretsmanager as secretsmanager,
    aws_kms as kms,
    aws_cognito as cognito,
    aws_rds as rds,
    aws_elasticache as elasticache,
    aws_stepfunctions as sfn,
    aws_stepfunctions_tasks as sfn_tasks,
    aws_cloudfront as cloudfront,
    aws_cloudfront_origins as origins,
    aws_eks as eks,
    aws_ecs as ecs,
    aws_ecs_patterns as ecs_patterns,
    aws_opensearchservice as opensearch,
    aws_glue as glue,
    aws_iot as iot,
)
from constructs import Construct


class DemoStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # ── resources go here ──────────────────────────────────────────────
        # Add only the services from the architecture.
        # Wire them with the L2 methods listed in this guide.
        # Use demo sizing from the table above.
```

Write the complete `stack.py` to `output/{folder}/stack.py`.

---

## Step 6 — Write `app.py`

Use the **actual** stack name, qualifier, and region derived in Step 3. Do not copy the values shown in the examples literally — compute them fresh for every run.

```python
import aws_cdk as cdk
from stack import DemoStack

QUALIFIER = "<derived-qualifier>"    # computed in Step 3B — e.g. "agldydemo" for ApiGw+Lambda+Dynamo

app = cdk.App()

stack = DemoStack(app, "<DerivedStackName>",     # computed in Step 3B — e.g. "ApiGwLambdaDynamoDemo"
    env=cdk.Environment(region="<region-code>"), # e.g. "us-east-1"
    synthesizer=cdk.DefaultStackSynthesizer(qualifier=QUALIFIER),
)

cdk.Tags.of(stack).add("Environment", "demo")
cdk.Tags.of(stack).add("ManagedBy", "cdk-demo")
cdk.Tags.of(stack).add("Project", "<DerivedStackName>")  # same as stack name above

app.synth()
```

Write to `output/{folder}/app.py`.

---

## Step 7 — Write `deploy.py`

This runner shows a **GUI dialog box** to collect AWS credentials, then deploys fully automatically. Credentials are held in memory only — never written to any file or shown in chat.

The dialog opens as a pop-up window so the user can enter credentials securely while Copilot runs the script autonomously. If tkinter is unavailable, it falls back to terminal prompts.

Use exactly this implementation:

```python
#!/usr/bin/env python3
"""
CDK Demo Deploy Runner
A dialog box pops up for credentials — held in memory only, never written to disk.
"""
import json, os, shutil, subprocess, sys
from pathlib import Path

REGION         = "<region-code>"          # computed in Step 3 — e.g. "us-east-1", "ap-south-1"
STACK          = "<DerivedStackName>"    # computed in Step 3B — e.g. "ApiGwLambdaDynamoDemo"
QUALIFIER      = "<derived-qualifier>"   # computed in Step 3B — e.g. "agldydemo"
TOOLKIT_STACK  = "CDKToolkitDemo"        # fixed — isolated bootstrap, does not touch default CDKToolkit
LOCK_FILE      = Path(__file__).parent / ".deploy.lock"

if sys.platform == "win32":
    if shutil.which("cdk.cmd"):   CDK_CMD = "cdk.cmd"
    elif shutil.which("cdk"):     CDK_CMD = "cdk"
    elif shutil.which("npx.cmd"): CDK_CMD = "npx.cmd cdk"
    else:                         CDK_CMD = "npx cdk"
else:
    CDK_CMD = "cdk" if shutil.which("cdk") else "npx cdk"


# ── helpers ───────────────────────────────────────────────────────────────────

def run(cmd, env=None, cwd=None):
    return subprocess.run(cmd, shell=True, env=env or os.environ.copy(), cwd=cwd)

def run_capture(cmd, env=None):
    return subprocess.run(cmd, shell=True, env=env or os.environ.copy(),
                          capture_output=True, text=True)

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
    try: LOCK_FILE.unlink()
    except Exception: pass


# ── credential prompt (GUI dialog) ────────────────────────────────────────────

def prompt_credentials():
    """Show a GUI dialog for AWS credentials. Falls back to terminal if GUI unavailable."""
    try:
        import tkinter as tk
        from tkinter import ttk, messagebox

        result = {}

        def on_submit():
            ak = entry_ak.get().strip()
            sk = entry_sk.get().strip()
            st = entry_st.get().strip()
            if not ak or not sk:
                messagebox.showerror("Missing fields",
                    "AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are required.")
                return
            result["access_key"]    = ak
            result["secret_key"]    = sk
            result["session_token"] = st
            root.destroy()

        def on_cancel():
            root.destroy()
            print("Cancelled by user.")
            sys.exit(0)

        root = tk.Tk()
        root.title("CDK Demo Deploy — AWS Credentials")
        root.resizable(False, False)
        root.lift()
        root.attributes("-topmost", True)
        root.focus_force()

        frame = ttk.Frame(root, padding=24)
        frame.pack(fill="both", expand=True)

        ttk.Label(frame, text="CDK Demo Deploy — AWS Credentials",
                  font=("", 13, "bold")).grid(row=0, column=0, columnspan=2, pady=(0, 6))
        ttk.Label(frame, text="Credentials are held in memory only. Nothing is written to disk.",
                  foreground="gray").grid(row=1, column=0, columnspan=2, pady=(0, 18))

        ttk.Label(frame, text="AWS_ACCESS_KEY_ID:").grid(
            row=2, column=0, sticky="e", padx=(0, 10), pady=6)
        entry_ak = ttk.Entry(frame, width=48)
        entry_ak.grid(row=2, column=1, pady=6)

        ttk.Label(frame, text="AWS_SECRET_ACCESS_KEY:").grid(
            row=3, column=0, sticky="e", padx=(0, 10), pady=6)
        entry_sk = ttk.Entry(frame, width=48, show="*")
        entry_sk.grid(row=3, column=1, pady=6)

        ttk.Label(frame, text="AWS_SESSION_TOKEN (optional):").grid(
            row=4, column=0, sticky="e", padx=(0, 10), pady=6)
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
        env["AWS_ACCESS_KEY_ID"]     = result["access_key"]
        env["AWS_SECRET_ACCESS_KEY"] = result["secret_key"]
        if result.get("session_token"):
            env["AWS_SESSION_TOKEN"] = result["session_token"]
        else:
            env.pop("AWS_SESSION_TOKEN", None)
        return env

    except Exception as gui_err:
        # GUI unavailable — fall back to terminal prompts
        print(f"  (GUI unavailable: {gui_err} — using terminal prompts)")
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
                    if chars: chars.pop()
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
    print("  CDK Demo Deploy — AWS Credential Setup")
    print("=" * 60)
    print("  Secret key and session token are hidden as you type.")
    print("  Nothing is written to any file.")
    print()
    access_key    = _ask("  AWS_ACCESS_KEY_ID     : ", hidden=False)
    secret_key    = _ask("  AWS_SECRET_ACCESS_KEY : ", hidden=True)
    session_token = _ask("  AWS_SESSION_TOKEN     : ", hidden=True)
    if not access_key or not secret_key:
        print("\n  ERROR: Access key and secret key are required.")
        sys.exit(1)
    env = os.environ.copy()
    env["AWS_ACCESS_KEY_ID"]     = access_key
    env["AWS_SECRET_ACCESS_KEY"] = secret_key
    if session_token:
        env["AWS_SESSION_TOKEN"] = session_token
    else:
        env.pop("AWS_SESSION_TOKEN", None)
    return env


# ── steps ─────────────────────────────────────────────────────────────────────

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
        f" --query Stacks[0].StackStatus --output text", env=env)
    status = r.stdout.strip()
    stuck = {"ROLLBACK_COMPLETE","ROLLBACK_FAILED","UPDATE_ROLLBACK_FAILED","DELETE_FAILED","UPDATE_ROLLBACK_COMPLETE"}
    if status in stuck:
        print(f"  Removing stuck CDK toolkit stack (status: {status})...")
        run(f"aws cloudformation delete-stack --stack-name {TOOLKIT_STACK} --region {REGION}", env=env)
        run(f"aws cloudformation wait stack-delete-complete --stack-name {TOOLKIT_STACK} --region {REGION}", env=env)

def ensure_bootstrap(env, account_id):
    print("\n  Checking CDK bootstrap...")
    assets_bucket = f"cdk-{QUALIFIER}-assets-{account_id}-{REGION}"
    r = run_capture(f"aws s3api head-bucket --bucket {assets_bucket}", env=env)
    if r.returncode == 0:
        print(f"  Bootstrap OK — bucket present: {assets_bucket}")
        return
    print(f"  Bootstrapping CDK in {REGION} using isolated toolkit stack '{TOOLKIT_STACK}'...")
    print("  (One-time setup, takes ~2 minutes)")
    _cleanup_stale_toolkit(env)
    r = run(
        f"{CDK_CMD} bootstrap aws://{account_id}/{REGION}"
        f" --qualifier {QUALIFIER}"
        f" --toolkit-stack-name {TOOLKIT_STACK}"
        f" --cloudformation-execution-policies arn:aws:iam::aws:policy/AdministratorAccess"
        f" --force --ci",
        env=env, cwd=Path(__file__).parent)
    if r.returncode != 0:
        print("\n  ERROR: CDK bootstrap failed. Check CloudFormation in the AWS console.")
        sys.exit(1)

def deploy(env):
    print(f"\n  Deploying '{STACK}' to {REGION}...\n")
    r = run(
        f"{CDK_CMD} deploy"
        f" --toolkit-stack-name {TOOLKIT_STACK}"
        f" --require-approval never --ci",
        env=env, cwd=Path(__file__).parent)
    if r.returncode != 0:
        print("\n  Deploy failed — check errors above, fix stack.py, then re-run: python deploy.py")
        sys.exit(1)

def destroy(env):
    print(f"\n  Destroying '{STACK}' in {REGION}...")
    r = run(
        f"{CDK_CMD} destroy"
        f" --toolkit-stack-name {TOOLKIT_STACK}"
        f" --force --ci",
        env=env, cwd=Path(__file__).parent)
    if r.returncode != 0:
        print("\n  Destroy failed. Check errors above.")
        sys.exit(1)


# ── main ──────────────────────────────────────────────────────────────────────

def main():
    _acquire_lock()
    try:
        print()
        print("  A dialog box will open — enter your AWS credentials there.")
        print()

        env      = prompt_credentials()
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
        print(f"  https://console.aws.amazon.com/cloudformation/home"
              f"?region={REGION}#/stacks")
        print()
        print("  To tear down:")
        print("    python deploy.py --destroy")
        print("=" * 60)
    finally:
        _release_lock()

if __name__ == "__main__":
    main()
```

Write to `output/{folder}/deploy.py`.

Then immediately — without pausing, without producing a summary, without asking the user anything — run the following two commands in sequence as tool calls.

## Step 8 — Validate (run this command now, yourself)

```bash
cd output/{folder} && cdk.cmd ls 2>&1 || cdk ls 2>&1
```

If CDK is not installed: `npm install -g aws-cdk` then retry. If `cdk ls` fails due to a Python error in `stack.py`, read the error, fix `stack.py`, re-run. Do not move to the next command until this exits 0.

## Step 9 — Deploy (run this command now, yourself, immediately after Step 8)

```bash
cd output/{folder} && python deploy.py
```

A GUI dialog box will appear on the user's screen. The user enters their AWS credentials in the dialog and clicks Deploy. After that `deploy.py` runs fully automatically: credential verification → CDK bootstrap (if needed) → stack deployment.

**Wait for `deploy.py` to exit.** CDK stacks take several minutes. Do not kill the process. Do not interrupt. If the process appears to be waiting, it is waiting for the user to submit the credential dialog — that is normal and expected.

When `deploy.py` exits 0, output:

```
Stack deployed — {stack-name} ({region_code})

  output/{folder}/
    cdk.json   app.py   stack.py   deploy.py

Console:
  https://console.aws.amazon.com/cloudformation/home?region={region_code}#/stacks

To tear down:
  python deploy.py --destroy   (run from output/{folder})
```

---

## Execution pitfalls — read before running Steps 8 and 9

These are classes of mistakes to avoid during execution. They are general principles, not tied to specific services.

**1. Judge success by exit code, not by stderr content.**
A process that exits 0 succeeded — even if it printed warnings, deprecation notices, or compatibility messages to stderr. Only a non-zero exit code means failure. Never re-run or abort a command solely because its stderr output looks noisy. Check the exit code explicitly before deciding what to do next.

**2. A waiting process is not a stuck process.**
If a running process has not exited and has not printed an error, it is working. It may be waiting for user input (the credential dialog), waiting for a remote API, or processing a long operation. Do not interrupt it, do not send keyboard input to it, and do not start a second copy. Wait for it to exit naturally.

**3. Never interact with a terminal that has an active foreground process.**
Sending any input — including diagnostic commands, variable assignments, or key presses — to a terminal where a foreground process is running will corrupt that process or kill it. Use a separate terminal for any monitoring or diagnostics while a deploy is in progress.

**4. Credentials exist only in the process that received them.**
`deploy.py` stores credentials in its own in-memory environment. No other shell, terminal session, or tool call shares that environment. Do not attempt AWS CLI calls from a different shell to verify deployment progress — the call will fail with an auth error because those credentials are not available there. Monitor progress through process state and the deploy terminal's own output only.

**5. Check for reserved names before using shell variables.**
Every shell has built-in read-only variables. Before assigning a variable in any shell script or terminal command, confirm the name is not reserved. If a variable assignment fails with "read-only" or "constant", rename the variable immediately — use a descriptive prefix (e.g. `deployPid`, `lockFileContent`) to avoid collisions with shell builtins.

**6. Distinguish a transient failure from a real failure.**
If a command fails, read the full error message before deciding what to do. A warning printed to stderr that exits 0 is not a failure. A network timeout that can be retried is not a permanent failure. A syntax error in generated code is a real failure that requires a fix before retrying. Match the response to the actual cause.

---

## Rules

- **Execute everything yourself — the user runs nothing.** The user's only action is entering credentials in the GUI dialog. Writing files and then stopping is a failure. Listing "next steps" is a failure. The skill is complete only after `deploy.py` exits 0.
- **Run deploy.py exactly once.** If `deploy.py` appears to be waiting or slow, check for `.deploy.lock` in the output folder — if it exists and the PID inside it is still running, the process is already active. Do NOT start a second `python deploy.py`. Wait for the first one to complete.
- **Gather everything in Step 1, then run silently.** After Step 1, execute all remaining steps without asking the user any more questions.
- **Deploy every service that was requested.** If the user named four services, all four must be in `stack.py`. Never silently drop a service.
- **Do not read existing output folders.** All patterns are in this SKILL.md. Never read prior run files for "conventions" — this wastes actions and is unnecessary.
- **Do not read memory files.** Do not read `aws-calculator-notes.md` or any other workspace memory file. This skill has no dependency on them.
- **Never ask for credentials in the chat.** `deploy.py` shows a GUI dialog box — credentials never appear in the conversation.
- **Never write credentials to any file** — not `cdk.json`, not `app.py`, not `.env`, nowhere.
- **Never kill `deploy.py` while it is running.** The GUI dialog waiting for input is normal — do not interrupt it. Deployment after credential submission takes several minutes.
- **Validate with `cdk ls` first** before running deploy.py — don't waste the user's time on a broken stack.
- **Demo sizes only.** Do not use production or calculator values for CDK resources.
- **Use L2 constructs and `.grant_*()` methods** wherever available. Only fall back to L1 (`Cfn*`) when no L2 exists for that service.
- **`RemovalPolicy.DESTROY`** on all stateful resources so `cdk destroy` cleans up completely.
- **One stack, one file.** Keep everything in a single `stack.py`. No nested stacks.
- **Do not hard-code account IDs** in `app.py` — CDK resolves the account from credentials at deploy time.
- **Do not read or write any memory files about the AWS Pricing Calculator** — this skill is completely separate from the proposal skill.
