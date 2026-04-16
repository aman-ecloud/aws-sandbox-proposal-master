# Calculator Sizing & Configuration Reference

Read this before writing `calculator_config` values for any service.

---

## Important: calculator values vs CFN demo stack values

These are separate and must not be confused:
- **AWS Calculator (Step 3B):** Use the real numbers from the proposal — actual request volumes, storage sizes, and throughput the customer described. The estimate shows the customer what their solution costs at the volumes they asked for.
- **CloudFormation demo stack (Step 3C):** Use the smallest size that actually deploys. See `references/CFN_GUIDE.md`.

---

## Cost target

Every sandbox estimate should land in this range:
- Per service: $20–$400/month (most services $30–$150/month)
- Total: $500–$3,500/month

If any service exceeds $500/month, the quantities are probably too high. If a billable service shows $0–$5/month, the quantities are too low.

---

## Units — check before writing any number into calculator_config

The AWS Pricing Calculator uses different units for different fields. If you type a raw number into a "millions" field, the calculator multiplies it by 1,000,000 and the cost becomes enormous.

| Service | Field | Unit the calculator expects | Example: "4M requests" → enter |
|---|---|---|---|
| API Gateway | HTTP API requests | **millions** | `4` (not 4,000,000) |
| Lambda | Number of requests | **raw count** | `4000000` |
| DynamoDB | Read/Write request units | **millions** | `120` for 120M reads |
| SNS | Requests | **millions** | `1` for 1M notifications |
| SQS | Standard requests | **millions** | `2` for 2M requests |
| CloudWatch | API requests | **thousands** | `100` for 100K API calls |
| KMS | API requests | **thousands** | `100` for 100K calls |
| Secrets Manager | API calls | **thousands** | `50` for 50K calls |
| S3 | PUT requests | **thousands** | `100` for 100K PUTs |
| S3 | GET requests | **thousands** | `500` for 500K GETs |
| CloudFront | HTTP/HTTPS requests | **millions** | `1` for 1M requests |
| Route 53 | DNS queries | **millions** | `1` for 1M queries |
| EventBridge | Events published | **millions** | `2` for 2M events |
| Kinesis Data Streams | Shards | **raw count** | `5` for 5 shards |
| ElastiCache | Nodes | **raw count** | `1` — never 0 |
| IoT Core | Messages | **raw count (per device per day)** | `300` |

The key name tells you the unit. `readRequestUnitsMillions` expects millions — write `120` for 120M reads, not `120000000`. `numberOfRequests` expects the raw number.

---

## Sizing defaults (use if proposal does not mention the quantity)

| Service | Sizing logic | Default if not mentioned |
|---|---|---|
| S3 | storage = data described; requests = storage_gb × 1000 | 100 GB, 100K PUT, 500K GET |
| Lambda | requests = API calls or events; duration = simple 200ms, ML 1000ms | 1M req/month, 300ms, 512MB |
| API Gateway | requests = Lambda requests (usually 1:1) | 1M req/month |
| DynamoDB | on-demand unless provisioned stated; storage = data described | On-demand, 20 GB, 1M reads, 0.5M writes |
| Kinesis Data Streams | shards = events/sec ÷ 1000, min 1; retention = 24h | 2 shards |
| RDS / Aurora | db.t3.medium, Single-AZ for sandbox | db.t3.medium, 100GB, Single-AZ |
| ElastiCache | cache.t3.medium, 1 node; 2 nodes only if HA stated | cache.t3.medium, 1 node |
| SageMaker | see SageMaker section below | Training only: ml.m5.xlarge, 10 jobs/month |
| CloudWatch | metrics = services × 10; logs = 5 GB/month | 50 metrics, 5 GB logs |
| CloudFront | transfer = data served; requests = API volume | 100 GB/month, 1M HTTP + 1M HTTPS |
| SNS | notifications = ~10% of Lambda calls | 1M notifications/month |
| SQS | requests = messages in queue (same order as Lambda calls) | 2M requests/month |
| EKS | 1 cluster, 2 worker nodes t3.medium | 2 nodes, 730 hours |
| Fargate | tasks = described; vCPU=0.5, memory=1GB | 2 tasks, 730 hours |
| OpenSearch | 1x t3.medium.search, 100GB EBS | 1 node, 100 GB |
| Redshift | 1x dc2.large, not multi-node | 1 node, 160 GB |
| Bedrock | tokens = 1K input + 500 output per request | 10K req/month, Claude Haiku |
| KMS | keys = number of services needing encryption | 5 keys, 100K API calls |
| Secrets Manager | secrets = microservices × 2 | 10 secrets, 50K API calls |
| VPC | 1 NAT Gateway | 1 NAT GW, 100 GB processed |
| Route 53 | 1 hosted zone | 1 zone, 1M queries |
| ELB | 1 ALB, 730 hours/month | 1 ALB, 1 GB/hour |
| EventBridge | events = event-driven calls in architecture | 2M events/month |

---

## SageMaker — decide which sub-features apply

SageMaker has multiple sub-feature checkboxes (Studio Notebooks, On-Demand Notebooks, Training, Real-Time Inference, Batch Transform). Each enabled feature adds significant cost. Before configuring SageMaker:

1. Re-read the proposal's ML requirements
2. Enable only what the proposal actually uses
3. Disable Studio Notebooks and On-Demand Notebooks unless the proposal explicitly needs interactive ML development — these are the most expensive toggles
4. Typical sandbox: Training (10 jobs/month, ml.m5.xlarge, 2 hrs/job) + Real-Time Inference (1 endpoint, ml.m5.large, 730 hrs/month) ≈ $150–250/month

---

## calculator_config format (GROUP A services)

The `calculator_config` keys must match the `config` object inside the pre-built `.js` script. Read the script first to confirm the key names.

```json
{
  "service_name": "AWS Lambda",
  "calculator_config": {
    "numberOfRequests": 4000000,
    "requestDurationMs": 300,
    "memoryMainValue": 1024,
    "memoryMainUnit": "MB"
  }
},
{
  "service_name": "Amazon DynamoDB",
  "calculator_config": {
    "capacityMode": "On-demand capacity",
    "dataStorageGb": 150,
    "readRequestUnitsMillions": 120,
    "writeRequestUnitsMillions": 60
  }
}
```

Do not leave `calculator_config` empty or as `{}` — an empty config makes the script use its hard-coded defaults.

---

## Cost sanity check — do this before clicking Share

After all services are added and the summary table shows 50 rows, check three things:

**1. Region** — every row must show the same region as the proposal. If any row shows a different region, delete that service, re-add it, and set the region correctly. Do not Share until all rows match.

**2. Per-service cost** — if a service is way over its ceiling, a number was entered in the wrong unit. This can happen to any service.

| Service | Expected max cost | Most likely reason it went over |
|---|---|---|
| AWS Lambda | $50/month | Request count entered as millions instead of raw number |
| API Gateway | $30/month | Request count entered as raw number instead of millions |
| Amazon DynamoDB | $80/month | Read/write units entered as raw number instead of millions |
| Amazon S3 | $60/month | Requests entered as raw number instead of thousands |
| Amazon Kinesis Data Streams | $50/month | Shard or retention hours set too high |
| Amazon ElastiCache | $80/month | Node count set to 0 — set at least 1 |
| AWS IoT Core | $100/month | Messages/day entered as monthly total instead of per-device per day |
| Amazon CloudWatch | $50/month | Wrong field filled (OTEL spans instead of standard metrics) |
| Amazon SNS | $20/month | Requests entered as raw number instead of millions |
| Amazon SQS | $20/month | Requests entered as raw number instead of millions |
| Amazon CloudFront | $80/month | Requests entered as raw number instead of millions |
| Amazon RDS / Aurora | $60/month | Multi-AZ turned on, or wrong instance size |
| Amazon EKS | $150/month | Too many node groups or large instance type |
| AWS Fargate | $50/month | vCPU/memory set to production scale |
| Amazon SageMaker | $250/month | Studio Notebooks turned on — disable unless proposal needs it |
| Amazon Redshift | $200/month | Multi-node cluster — use single dc2.large |
| Amazon OpenSearch | $80/month | Wrong instance type — use t3.small.search |
| AWS KMS | $10/month | API call count entered as raw number instead of thousands |
| AWS Secrets Manager | $10/month | API calls entered as raw number instead of thousands |
| Amazon EventBridge | $10/month | Events entered as raw number instead of millions |
| Elastic Load Balancing | $30/month | Processed bytes in wrong unit |

If a service shows $0.00 and it should cost something, the form was not filled — go back and fill it.

**3. Total** — over $4,000/month means fix the biggest unit error. Under $100/month for 6+ services means quantities are too low. $500–$3,500/month with all services within ceiling means proceed to Share.

**How to fix a wrong cost:**
- GROUP A service: fix the value in `calculator_config`, delete the service from the estimate table, re-inject the script
- GROUP B service: click Edit, fix the specific field, click Save
