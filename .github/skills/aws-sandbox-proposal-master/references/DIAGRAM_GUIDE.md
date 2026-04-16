# Architecture Diagram Guide

Generate infrastructure diagrams using the Python `diagrams` library for Sandbox proposals.

## Prerequisites

```bash
pip install diagrams
# Also requires Graphviz: https://graphviz.org/download/
```

## Step 2 Contract Ingestion (Required)

Before writing diagram code, load Step 2 output from a single context file:

```text
<project_dir>/<Name>_context.json
```

Use these fields as the only service source:

- `sandbox.business.service_list[*].service_name`
- `sandbox.business.service_list[*].diagram_tags` (optional hints)

Do not infer new services from free-text description once the contract exists.

## Pre-Execution Checklist

1. Validate `sandbox.business.service_list` exists and is non-empty.
2. Resolve import names with `diagrams_resolver.py` for every target service.
3. Validate Graphviz `dot` is available.
4. Define a deterministic output path and write it to `sandbox.architecture.diagram`.
5. Record rendered service names to `sandbox.architecture.applied_services`.
6. Compare `applied_services` set with `service_list` set.

Fail-fast if there are missing or extra services.

## Mandatory Rules

### 1. Always Set `show=False`

```python
with Diagram("My Architecture", filename="my_arch", show=False, direction="LR"):
    ...
```

Without `show=False`, the code tries to open a GUI viewer — this fails in headless or remote environments.

### 2. English-Only Node Labels

```python
# CORRECT
ec2 = EC2("Web Server")

# WRONG — causes rendering/encoding errors
ec2 = EC2("網頁伺服器")
```

### 3. Import from `diagrams.*` Hierarchy

```python
from diagrams import Diagram, Cluster, Edge
from diagrams.aws.compute import EC2, Lambda, ECS, EKS
from diagrams.aws.database import RDS, Dynamodb, ElastiCache
from diagrams.aws.network import APIGateway, ELB, Route53, VPC, CloudFront
from diagrams.aws.storage import S3
from diagrams.aws.security import IAM, KMS
from diagrams.aws.management import Cloudwatch
from diagrams.aws.ml import Sagemaker
from diagrams.aws.integration import SQS, SNS
```

### 4. Output Path

Choose a meaningful filename. The `diagrams` library appends `.png` automatically:

```python
# This creates "sandbox_architecture.png" in the current directory
with Diagram("Architecture", filename="sandbox_architecture", show=False):
    ...
```

To output to the project subfolder (use the actual `{ProjectName}` value):
```python
with Diagram("Architecture", filename="output/{ProjectName}/architecture", show=False):
    ...
```

## Recommended Patterns

### Graph Attributes for Clean Layout

```python
graph_attr = {
    "pad": "0.5",
    "fontsize": "12",
    "splines": "ortho",
}
node_attr = {
    "width": "1",
    "height": "1",
    "fontsize": "10",
    "margin": "0.25,0.25",
}
edge_attr = {
    "fontsize": "10",
}

with Diagram("Architecture", filename="sandbox_arch", show=False,
             direction="LR", graph_attr=graph_attr, node_attr=node_attr,
             edge_attr=edge_attr):
    ...
```

### Clusters for Grouping

```python
with Cluster("VPC"):
    with Cluster("Public Subnet"):
        alb = ELB("ALB")
    with Cluster("Private Subnet"):
        app = ECS("App")
        db = RDS("PostgreSQL")
```

### Connections

```python
user >> cloudfront >> alb >> app >> db   # Linear flow
app >> [sqs, sns, s3]                    # Fan-out
app >> Edge(label="SQL") >> db           # Labeled edge
```

## Common Architecture Templates

### Web Application

```python
from diagrams import Diagram, Cluster
from diagrams.aws.compute import ECS
from diagrams.aws.database import RDS
from diagrams.aws.network import CloudFront, ELB, Route53
from diagrams.aws.storage import S3

with Diagram("Web App", filename="web_app", show=False, direction="LR"):
    dns = Route53("DNS")
    cdn = CloudFront("CDN")
    with Cluster("VPC"):
        lb = ELB("ALB")
        with Cluster("App Tier"):
            app = ECS("App")
        with Cluster("Data Tier"):
            db = RDS("PostgreSQL")
            storage = S3("Assets")
    dns >> cdn >> lb >> app
    app >> db
    app >> storage
```

### Serverless API

```python
from diagrams import Diagram, Cluster
from diagrams.aws.compute import Lambda
from diagrams.aws.database import Dynamodb
from diagrams.aws.network import APIGateway, CloudFront
from diagrams.aws.security import Cognito

with Diagram("Serverless", filename="serverless", show=False, direction="LR"):
    cdn = CloudFront("CDN")
    auth = Cognito("Auth")
    api = APIGateway("API GW")
    with Cluster("Functions"):
        fn = Lambda("Handler")
    db = Dynamodb("DynamoDB")
    cdn >> api >> fn >> db
    api >> auth
```

### AI/ML Pipeline

```python
from diagrams import Diagram, Cluster
from diagrams.aws.compute import ECS, Lambda
from diagrams.aws.database import RDS
from diagrams.aws.ml import Sagemaker
from diagrams.aws.network import ELB, CloudFront
from diagrams.aws.storage import S3

with Diagram("AI Pipeline", filename="ai_pipeline", show=False, direction="LR"):
    cdn = CloudFront("CDN")
    lb = ELB("ALB")
    with Cluster("Application"):
        app = ECS("App")
        ingest = Lambda("Ingest")
    with Cluster("AI/ML"):
        ml = Sagemaker("Model")
        vectors = RDS("Vector DB")
    with Cluster("Storage"):
        docs = S3("Documents")
    cdn >> lb >> app
    app >> ml >> vectors
    ingest >> docs
```

## Common Import Mappings

| Component | Import |
|-----------|--------|
| EC2 | `from diagrams.aws.compute import EC2` |
| Lambda | `from diagrams.aws.compute import Lambda` |
| ECS | `from diagrams.aws.compute import ECS` |
| EKS | `from diagrams.aws.compute import EKS` |
| RDS | `from diagrams.aws.database import RDS` |
| DynamoDB | `from diagrams.aws.database import Dynamodb` |
| ElastiCache | `from diagrams.aws.database import ElastiCache` |
| S3 | `from diagrams.aws.storage import S3` |
| CloudFront | `from diagrams.aws.network import CloudFront` |
| ALB/ELB | `from diagrams.aws.network import ELB` |
| API Gateway | `from diagrams.aws.network import APIGateway` |
| Route53 | `from diagrams.aws.network import Route53` |
| VPC | `from diagrams.aws.network import VPC` |
| IAM | `from diagrams.aws.security import IAM` |
| KMS | `from diagrams.aws.security import KMS` |
| Cognito | `from diagrams.aws.security import Cognito` |
| SQS | `from diagrams.aws.integration import SQS` |
| SNS | `from diagrams.aws.integration import SNS` |
| CloudWatch | `from diagrams.aws.management import Cloudwatch` |
| SageMaker | `from diagrams.aws.ml import Sagemaker` |

## Error Recovery

| Error | Fix |
|-------|-----|
| `ModuleNotFoundError: diagrams` | `pip install diagrams` |
| `dot` command not found | Install Graphviz and add to PATH |
| `ImportError` for a node | Check the import mapping table above; class names are case-sensitive |
| No PNG generated | Ensure code has a `Diagram` context manager with a `filename` |
| Encoding error in labels | Use English-only text in node labels |
