# Intelligent Prompt Parser — Reference Guide

This file explains how to convert a raw, unstructured user description into a complete AWS Sandbox proposal. It contains the parsing rules, capability-to-service mapping tables, phase templates, and a worked example.

---

## When to Use This Guide

Use this when the user provides input that is:
- A single paragraph description of what they want to build
- Vague, poorly worded, or in non-native English
- Missing most or all structured fields (partner, costs, phases, services)
- A stream-of-consciousness dump of requirements

**Run-through rule:** Do **not** ask the user to rewrite, restructure, or confirm their prompt. Parse what is given, fill gaps with informed defaults, use `<TODO>` for anything that requires real human input, and proceed immediately to generating all artifacts.

---

## Parsing Playbook

### Stage 1 — Identify the Solution Domain

Read the description and classify it into one of these solution domains. A description may span multiple domains.

| Domain | Key signals in description |
|--------|---------------------------|
| **Industrial IoT / Digital Twin** | sensors, devices, physical systems, real-time monitoring, simulation, predictive maintenance, digital twin |
| **Supply Chain / Logistics** | warehouse, shipping, routing, inventory, fleet, demand forecasting, ETA, logistics network |
| **Data Platform / Data Lake** | ingest, batch, streaming, analytics, unified data, ETL, cataloguing, enrichment |
| **AI / ML Platform** | forecasting, prediction, model training, inference, scoring, recommendation engine |
| **Financial Services** | fraud detection, transactions, risk scoring, regulatory compliance, audit trail |
| **Healthcare / Life Sciences** | patient data, clinical, imaging, genomics, clinical trials |
| **Retail / E-Commerce** | product catalog, cart, order management, personalisation, promotions |
| **Energy / Utilities** | grid, meter, consumption, renewable, SCADA, energy forecasting |
| **Security / Compliance** | zero-trust, audit, access control, threat detection, SIEM |
| **Developer Platform / SaaS** | multi-tenant, CI/CD, API platform, developer tools |

---

### Stage 2 — Capability → AWS Service Mapping

For each technical capability or requirement mentioned in the description, map it to the best-fit AWS service. Use the exact service name from `assets/aws_services.json`.

#### Data Ingestion & Streaming

| Capability signal | AWS service (exact name) |
|-------------------|--------------------------|
| IoT devices, sensors, MQTT, device telemetry | `AWS IoT Core` |
| Edge computing, on-premise devices | `AWS IoT Greengrass` |
| Real-time streaming ingest at scale | `Amazon Kinesis Data Streams` |
| Stream delivery to S3 / Redshift / OpenSearch | `Amazon Data firehose` |
| Managed Kafka / event streaming | `Amazon Managed Streaming for Apache Kafka (MSK)` |
| Event bus, decoupling services | `Amazon EventBridge` |
| Pub/sub notifications | `Amazon Simple Notification Service (SNS)` |
| Message queue, async processing | `Amazon Simple Queue Service (SQS)` |

#### Storage & Data Lake

| Capability signal | AWS service (exact name) |
|-------------------|--------------------------|
| Raw data lake, object storage, files | `Amazon Simple Storage Service (S3)` |
| Time-series metrics, IoT telemetry | `Amazon Timestream` |
| Relational (MySQL-compatible) | `Amazon Aurora MySQL-Compatible` |
| Relational (PostgreSQL-compatible) | `Amazon Aurora PostgreSQL-Compatible DB` |
| Managed PostgreSQL | `Amazon RDS for PostgreSQL` |
| NoSQL key-value / document | `Amazon DynamoDB` |
| In-memory cache, sessions | `Amazon ElastiCache` |
| Graph database | `Amazon Neptune` |
| Search, full-text, log analytics | `Amazon OpenSearch Service` |
| Ledger / immutable audit log | `Amazon Quantum Ledger Database (QLDB)` |

#### Processing & Analytics

| Capability signal | AWS service (exact name) |
|-------------------|--------------------------|
| ETL, data catalogue, Spark | `AWS Glue` |
| Data warehouse, SQL analytics at scale | `Amazon Redshift` |
| Serverless SQL on S3 | `Amazon Athena` |
| Real-time stream processing, Flink | `Amazon Managed Service for Apache Flink` |
| Big data / EMR / Hadoop | `Amazon EMR` |
| Serverless compute, event-driven | `AWS Lambda` |
| Workflow / state machine orchestration | `AWS Step Functions` |
| Container compute, serverless containers | `AWS Fargate` |
| Container orchestration (Kubernetes) | `Amazon EKS` |

#### Machine Learning & AI

| Capability signal | AWS service (exact name) |
|-------------------|--------------------------|
| Model training, tuning, deployment | `Amazon SageMaker` |
| Generative AI, foundation models, LLMs | `Amazon Bedrock` |
| Demand forecasting | `Amazon Forecast` |
| NLP, text analysis | `Amazon Comprehend` |
| Image / video analysis | `Amazon Rekognition` |
| Conversational AI / chatbot | `Amazon Lex` |
| Document processing, OCR | `Amazon Textract` |
| Personalisation, recommendations | `Amazon Personalize` |

#### APIs & Integration

| Capability signal | AWS service (exact name) |
|-------------------|--------------------------|
| REST API, HTTP integration | `Amazon API Gateway` |
| GraphQL API | `AWS AppSync` |
| Application integration, EAI | `Amazon AppFlow` |
| Managed workflows (Airflow) | `Amazon Managed Workflows for Apache Airflow` |

#### Visualisation & BI

| Capability signal | AWS service (exact name) |
|-------------------|--------------------------|
| BI dashboards, reports, embedded analytics | `Amazon QuickSight` |
| Operational metrics, alarms | `Amazon CloudWatch` |
| Tracing, distributed observability | `AWS X-Ray` |
| Managed Grafana | `Amazon Managed Grafana` |
| Managed Prometheus | `Amazon Managed Service for Prometheus` |

#### Security & Compliance

| Capability signal | AWS service (exact name) |
|-------------------|--------------------------|
| Identity, roles, least-privilege | `AWS IAM Access Analyzer` |
| Secrets management | `AWS Secrets Manager` |
| Encryption keys | `AWS Key Management Service` |
| Audit trail, API logging | `AWS CloudTrail` |
| Threat detection | `Amazon GuardDuty` |
| Security posture management | `AWS Security Hub` |
| Web application firewall | `AWS Web Application Firewall (WAF)` |
| DDoS protection | `AWS Shield` |

#### Networking & Edge

| Capability signal | AWS service (exact name) |
|-------------------|--------------------------|
| CDN, global content delivery | `Amazon CloudFront` |
| DNS, routing | `Amazon Route 53` |
| VPN, private connectivity | `Amazon Virtual Private Cloud (VPC)` |
| Dedicated network connection | `AWS Direct Connect` |
| Load balancing | `Elastic Load Balancing` |

---

### Stage 2b — Expand to Minimum 8 Services Using Domain Defaults

**This stage is mandatory for every prompt, especially short or vague ones.**

A short prompt may only produce 1–3 services from Stage 2. That is not enough. Every proposal needs at least 8 services. Use the tables below to fill the gap.

**Step 1 — Add the Universal Baseline**

These 6 services belong in every proposal regardless of domain:

| Service | Role |
|---|---|
| `AWS Lambda` | Serverless compute, event-driven logic |
| `Amazon Simple Storage Service (S3)` | Object storage, data lake, artifacts |
| `Amazon API Gateway` | REST APIs for any frontend or integration |
| `Amazon Cognito` | User authentication and authorization |
| `Amazon CloudWatch` | Metrics, alarms, logs |
| `AWS CloudTrail` | Audit trail, API logging |

**Step 2 — Add Domain Starter Services**

Find the best-matching domain from Stage 1 and add its starter services:

| Domain | Add these services |
|---|---|
| **Web / Mobile App** (fitness, health, lifestyle, consumer, SaaS) | `Amazon DynamoDB`, `Amazon CloudFront`, `Amazon Simple Notification Service (SNS)` |
| **Industrial IoT / Digital Twin** | `AWS IoT Core`, `Amazon Kinesis Data Streams`, `Amazon Timestream`, `Amazon SageMaker`, `Amazon QuickSight` |
| **Supply Chain / Logistics** | `Amazon DynamoDB`, `Amazon Forecast`, `AWS Glue`, `Amazon QuickSight`, `Amazon EventBridge` |
| **Data Platform / Data Lake** | `Amazon Kinesis Data Streams`, `AWS Glue`, `Amazon Athena`, `Amazon Redshift`, `Amazon QuickSight` |
| **AI / ML Platform** | `Amazon SageMaker`, `Amazon Bedrock`, `Amazon DynamoDB`, `AWS Glue`, `Amazon QuickSight` |
| **Financial Services** | `Amazon DynamoDB`, `Amazon Redshift`, `AWS Glue`, `Amazon QuickSight`, `AWS Key Management Service` |
| **Healthcare / Life Sciences** | `Amazon DynamoDB`, `Amazon SageMaker`, `Amazon Comprehend`, `AWS Glue`, `Amazon QuickSight` |
| **Retail / E-Commerce** | `Amazon DynamoDB`, `Amazon CloudFront`, `Amazon Personalize`, `Amazon Simple Notification Service (SNS)`, `Amazon ElastiCache` |
| **Energy / Utilities** | `AWS IoT Core`, `Amazon Timestream`, `Amazon Kinesis Data Streams`, `Amazon SageMaker`, `Amazon QuickSight` |
| **Smart Agriculture / Environment** | `AWS IoT Core`, `Amazon Timestream`, `Amazon SageMaker`, `Amazon Location Service`, `Amazon QuickSight` |
| **Security / Compliance** | `Amazon GuardDuty`, `AWS Security Hub`, `Amazon OpenSearch Service`, `AWS Key Management Service`, `Amazon EventBridge` |
| **Developer Platform / SaaS** | `Amazon DynamoDB`, `Amazon CloudFront`, `Amazon EKS`, `Amazon RDS for PostgreSQL`, `Amazon ElastiCache` |
| **General / Unclear domain** | `Amazon DynamoDB`, `Amazon CloudFront`, `Amazon Simple Notification Service (SNS)`, `Amazon Simple Queue Service (SQS)`, `Amazon QuickSight` |

**Step 3 — Enforce the minimum**

Count: `universal_baseline + domain_starters + stage2_mapped`. If total < 8, add services from this list until you reach 8: `Amazon Simple Notification Service (SNS)`, `Amazon Simple Queue Service (SQS)`, `Amazon EventBridge`, `AWS Step Functions`, `AWS Key Management Service`, `AWS Glue`.

**Step 4 — Remove exact duplicates** (same service from multiple sources). The final list must have no repeated service names.

---

### Stage 3 — Select the Service Shortlist

Merge the Stage 2 mapped services with the Stage 2b defaults, then:

1. Remove services that are clearly redundant or out of scope for this solution
2. Prefer managed/serverless variants when scale is not explicitly huge
3. **Minimum: 8 services. If below 8, do not trim — add more from the domain table above.**
4. Maximum: 15 services. If above 15, trim the least relevant ones.
5. Verify every selected name is present in `assets/aws_services.json`

---

### Stage 3b — Detect Region

Scan the user's prompt AND any surrounding conversation for geographic signals. Map to the closest AWS region name from the calculator.

| Signal (city / country / keyword) | AWS Region |
|-----------------------------------|------------|
| Taiwan, Taipei | `Asia Pacific (Taipei)` |
| Singapore | `Asia Pacific (Singapore)` |
| Japan, Tokyo | `Asia Pacific (Tokyo)` |
| Korea, Seoul | `Asia Pacific (Seoul)` |
| Australia, Sydney | `Asia Pacific (Sydney)` |
| India, Mumbai | `Asia Pacific (Mumbai)` |
| Hong Kong | `Asia Pacific (Hong Kong)` |
| Jakarta, Indonesia | `Asia Pacific (Jakarta)` |
| Germany, Frankfurt | `Europe (Frankfurt)` |
| Ireland, Dublin | `Europe (Ireland)` |
| UK, London | `Europe (London)` |
| Paris, France | `Europe (Paris)` |
| Stockholm, Sweden | `Europe (Stockholm)` |
| US East, Virginia, New York | `US East (N. Virginia)` |
| US West, Oregon, California | `US West (Oregon)` |
| Canada, Toronto | `Canada (Central)` |
| Brazil, São Paulo | `South America (São Paulo)` |
| Middle East, UAE, Dubai | `Middle East (UAE)` |
| No geographic signal | `Asia Pacific (Taipei)` ← default from `configs/defaults.json` |

### Stage 4 — Default Business Fields

Use these defaults when the user has not provided them. **Do not ask — just use the default or `<TODO>` and proceed.**

All numeric defaults are read from `configs/defaults.json` — do not hard-code them here. Fields that require real human input (names, emails) use the literal string `<TODO>` so they appear as visible placeholders in the final DOCX.

| Field | Default / rule |
|-------|----------------|
| `partner` | value from `configs/defaults.json` → `"eCloudvalley"` |
| `contact.name` | `<TODO>` |
| `contact.title` | `<TODO>` |
| `contact.email` | `<TODO>` |
| `pdm` | `<TODO>` |
| `sa` | `<TODO>` |
| `region` | Detected in Stage 3b; fallback = `configs/defaults.json` → `"Asia Pacific (Taipei)"` |
| `aws_funding` | from `configs/defaults.json` → `"USD 80,000"` |
| `labor_cost` | from `configs/defaults.json` → `"USD 60,000"` |
| `total_cost` | from `configs/defaults.json` → `"USD 140,000"` |
| `start_date` | Computed by `scaffold_context.py` (3 months from today, first of month) |
| `end_date` | Computed by `scaffold_context.py` (6 months after start) |
| `release_date` | Computed by `scaffold_context.py` (1 month after end) |
| `calculator_link` | `""` (filled by Step 3B) |
| `applied_services` | `[]` (filled by Step 3B) |
| `public_or_not` | from `configs/defaults.json` → `"No"` |
| `case_study` | from `configs/defaults.json` → `"Yes"` |

---

### Stage 5 — Generate Phases

Use this 4-phase template scaled to the service count:

| Phase | Name | Mandays (small) | Mandays (medium) | Mandays (large) |
|-------|------|:---:|:---:|:---:|
| 1 | Discovery & Architecture Blueprint | 10 | 15 | 20 |
| 2 | Foundation: Data & Integration Layer | 15 | 25 | 30 |
| 3 | Core Build: Analytics, ML & APIs | 20 | 30 | 40 |
| 4 | Delivery, Testing & Handover | 10 | 20 | 30 |
| **Total** | | **55** | **90** | **120** |

Small = ≤ 8 services · Medium = 9–12 services · Large = ≥ 13 services

Phase dates: space phases evenly across the start→end window.

---

## Worked Example

### Raw Input

> The goal is to build an intelligent platform that can create and maintain adaptive digital twins of real-world systems such as industrial operations, logistics networks, or energy infrastructure, where live data from sensors, devices, and enterprise systems is continuously ingested, processed, and analyzed to simulate current conditions and predict future outcomes. The system should support real-time and batch data flows, enable machine learning-driven forecasting and optimization, and provide interactive visualization and decision-support tools for different stakeholders, while remaining highly scalable, fault-tolerant, secure, and capable of integrating with a wide variety of external data sources and evolving business requirements.

### Stage 1 — Domain Classification

- Primary: **Industrial IoT / Digital Twin**
- Secondary: **Data Platform / Data Lake** + **AI/ML Platform**
- Target users: operational teams, data scientists, executives (multiple stakeholders)
- Output: simulation, predictions, dashboards, decision-support tools

### Stage 2 — Capability Mapping

| Signal in description | Mapped service |
|-----------------------|----------------|
| live data from sensors, devices | `AWS IoT Core` |
| continuously ingested | `Amazon Kinesis Data Streams` |
| real-time and batch data flows | `Amazon Data firehose`, `AWS Glue` |
| processed and analyzed | `AWS Lambda`, `Amazon Managed Service for Apache Flink` |
| data lake | `Amazon Simple Storage Service (S3)` |
| time-series telemetry | `Amazon Timestream` |
| simulate current conditions | `Amazon SageMaker` |
| predict future outcomes, ML forecasting | `Amazon SageMaker`, `Amazon Forecast` |
| interactive visualization | `Amazon QuickSight` |
| decision-support tools | `Amazon API Gateway` |
| workflow / orchestration | `AWS Step Functions` |
| highly scalable, fault-tolerant | `Amazon Aurora PostgreSQL-Compatible DB` (operational state) |
| secure | `AWS IAM Access Analyzer`, `AWS Key Management Service` |
| audit trail | `AWS CloudTrail` |
| operational monitoring | `Amazon CloudWatch` |

### Stage 3 — Service Shortlist (13 services → Large)

```json
[
  { "service_name": "AWS IoT Core" },
  { "service_name": "Amazon Kinesis Data Streams" },
  { "service_name": "Amazon Data firehose" },
  { "service_name": "Amazon Simple Storage Service (S3)" },
  { "service_name": "Amazon Timestream" },
  { "service_name": "AWS Glue" },
  { "service_name": "Amazon Managed Service for Apache Flink" },
  { "service_name": "Amazon SageMaker" },
  { "service_name": "Amazon Forecast" },
  { "service_name": "AWS Step Functions" },
  { "service_name": "Amazon QuickSight" },
  { "service_name": "Amazon API Gateway" },
  { "service_name": "AWS CloudTrail" }
]
```

### Stage 4 — Derived Metadata

```
title         : Intelligent Adaptive Digital Twin Platform
solution_type : Vertical — Industrial IoT, Digital Twin & Predictive Operations
customer_type : Industrial enterprises, logistics operators, and energy infrastructure providers
region        : Asia Pacific (Taipei)   ← detected from conversation context "developing in Taipei"
aws_funding   : USD 80,000
labor_cost    : USD 60,000
total_cost    : USD 140,000
start_date    : [3 months from today]
end_date      : [9 months from today]
partner       : <TODO>
contact.name  : <TODO>
contact.title : <TODO>
contact.email : <TODO>
pdm           : <TODO>
sa            : <TODO>
```

### Stage 5 — Phases (Large = 13 services → 120 mandays)

| # | Activity | Mandays | Delivery |
|---|----------|:-------:|---------|
| 1 | Discovery & Architecture Blueprint | 20 | Month 1 end |
| 2 | Foundation: IoT Ingestion & Data Lake | 30 | Month 3 end |
| 3 | Core Build: Twin Engine, ML & APIs | 40 | Month 6 end |
| 4 | Delivery, Testing & Handover | 30 | Month 9 end |
| **Total** | | **120** | |

→ **Proceed immediately to Step 2. Generate `context.json`, `architecture.png`, and `Proposal.docx` without pausing.**

The `<TODO>` values for partner, contact, PDM, and SA will appear as visible placeholders in the rendered DOCX — the user fills them in after receiving the document.

---

## Tips for Edge Cases

| Situation | Handling |
|-----------|----------|
| Description mentions a service not in `aws_services.json` | Map to the closest equivalent that IS in the list |
| Description is only 1–2 sentences | Apply Stage 2b immediately: use the universal baseline + domain starter stack. The prompt doesn't have enough signals to rely on Stage 2 mapping alone. |
| Description is in non-English | Parse it anyway; translate key concepts to English service names |
| Region mentioned in conversation (not in prompt) | Use it — scan the full conversation context, not just the prompt |
| Region mentioned explicitly in prompt | Use it instead of the default |
| Description mentions a specific partner name | Use it instead of the placeholder |
| Description says "similar to X" (competitor product) | Map X's capabilities to AWS equivalents |
| Description is for an update to an existing proposal | Load the existing context.json, apply only the described changes |
