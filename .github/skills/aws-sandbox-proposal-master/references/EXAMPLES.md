# Proposal Examples

Complete examples of AWS Sandbox proposals with context JSON, diagram code, and tool invocations.

## Example 1: AI Document Assistant (Concise)

### Context JSON

```json
{
  "sandbox": {
    "basics": {
      "title": "AI Sandbox Proposal",
      "partner": "eCloudvalley",
      "contact": {
        "name": "Stanley Hsu",
        "title": "Solution Architect",
        "email": "stanley.hsu@ecloudvalley.com"
      },
      "pdm": "Stanley Hsu",
      "sa": "Stanley Hsu"
    },
    "details": {
      "update": {
        "feature": "",
        "customer": "",
        "pain_point": "",
        "opportunity": "",
        "publish_date": ""
      },
      "summary": "## Overview\nProposed sandbox for an AI-powered document assistant on AWS.",
      "features": "- Secure document intake\n- Retrieval-augmented responses\n- Admin observability dashboard",
      "solution_type": "Horizontal",
      "customer_type": "Enterprise with knowledge-intensive workflows",
      "pain_point": "Manual document search is slow and inconsistent."
    },
    "business": {
      "justification": "AWS funding accelerates a reusable sandbox offer with clear customer value.",
      "aws_funding": "USD 50,000",
      "labor_cost": "USD 30,000",
      "total_cost": "USD 80,000",
      "start_date": "2026-04-01",
      "end_date": "2026-06-30",
      "release_date": "2026-07-15",
      "public_or_not": "No",
      "case_study": "Yes",
      "calculator_link": "https://calculator.aws/#/estimate?id=abc123example",
      "additional_info": "Initial MVP for partner-led co-sell motions."
    },
    "plan": {
      "total_mandays": "60",
      "total_phases": [
        {
          "activity": "Planning",
          "description": "Finalize scope, security baseline, and target architecture.",
          "mandays": "10",
          "delivery_date": "2026-04-15"
        },
        {
          "activity": "Build",
          "description": "Implement ingestion, retrieval, and application services.",
          "mandays": "35",
          "delivery_date": "2026-05-31"
        },
        {
          "activity": "Validation",
          "description": "Run UAT, hardening, and release readiness checks.",
          "mandays": "15",
          "delivery_date": "2026-06-30"
        }
      ]
    },
    "architecture": {
      "diagram": "sandbox_architecture.png",
      "description": "Users access the solution through CloudFront and ALB. Application workloads run on ECS and use Bedrock, RDS, and S3."
    }
  }
}
```

### Diagram Code

```python
from diagrams import Diagram, Cluster
from diagrams.aws.compute import ECS
from diagrams.aws.database import RDS
from diagrams.aws.ml import Sagemaker
from diagrams.aws.network import CloudFront, ELB
from diagrams.aws.storage import S3

with Diagram("AI Document Assistant", filename="sandbox_architecture",
             show=False, direction="LR"):
    cdn = CloudFront("CDN")
    lb = ELB("ALB")

    with Cluster("Application"):
        app = ECS("App Service")

    with Cluster("AI & Data"):
        llm = Sagemaker("LLM")
        db = RDS("PostgreSQL")
        docs = S3("Documents")

    cdn >> lb >> app
    app >> llm
    app >> db
    app >> docs
```

### AWS Calculator Services

```
Service 1: Amazon ECS
  - Region: Asia Pacific (Taipei)
  - Launch type: Fargate
  - 2 tasks, 1 vCPU, 2 GB memory each

Service 2: Amazon RDS
  - Region: Asia Pacific (Taipei)
  - Engine: PostgreSQL
  - Instance: db.t3.medium, Single-AZ
  - Storage: 50 GB gp3

Service 3: Amazon S3
  - Region: Asia Pacific (Taipei)
  - S3 Standard: 100 GB
  - PUT requests: 10,000 / month
  - GET requests: 50,000 / month
```

### Workflow Steps

1. Save the JSON above to `ai_sandbox_context.json`
2. Run the diagram code to generate `sandbox_architecture.png`
3. Automate AWS Calculator to get share link → update `calculator_link` in JSON
4. Generate DOCX:
   ```bash
   python generate_proposal.py ai_sandbox_context.json -o AI_Sandbox_Proposal.docx
   ```

---

## Example 2: Cloud Development Environment (Detailed, Traditional Chinese)

### Context JSON

```json
{
  "sandbox": {
    "basics": {
      "title": "AWS AppStream 2.0 Cloud Development Environment",
      "partner": "eCloudvalley",
      "contact": {
        "name": "brAIn",
        "title": "Solution Architect",
        "email": "brain@ecloudvalley.com"
      },
      "pdm": "Partner Development Manager",
      "sa": "brAIn"
    },
    "details": {
      "update": {
        "feature": "",
        "customer": "",
        "pain_point": "",
        "opportunity": "",
        "publish_date": ""
      },
      "summary": "本提案設計一個完整的雲端開發環境解決方案，以 Amazon AppStream 2.0 為核心，提供安全、可擴展的遠端開發工作站。透過整合 AWS 安全、稽核與監控服務，建立企業級的合規架構。",
      "features": "- **Amazon AppStream 2.0**：即時串流開發工作站\n- **Security & IAM**：角色型存取控制、KMS 加密\n- **Monitoring**：CloudTrail 稽核、CloudWatch 監控\n- **Data Protection**：S3 加密儲存\n- **HA/DR**：多可用區配置、自動擴展",
      "solution_type": "雲端開發環境、遠端工作站即服務",
      "customer_type": "軟體開發公司、企業 IT 部門、金融科技公司",
      "pain_point": "- 本地開發環境維護成本高、版本管理困難\n- 遠端開發缺乏統一安全控制\n- 合規稽核需求難以滿足\n- 開發工具授權成本持續上升"
    },
    "business": {
      "justification": "隨著遠端工作普及，企業對雲端開發環境需求急速增長。本方案降低 IT 維護成本 40-60%，提升團隊生產力 25-35%。",
      "aws_funding": "USD 50,000",
      "labor_cost": "USD 40,000",
      "total_cost": "USD 90,000",
      "start_date": "2026-04-01",
      "end_date": "2026-09-30",
      "release_date": "2026-08-15",
      "public_or_not": "No",
      "case_study": "Yes",
      "calculator_link": "https://calculator.aws/#/estimate?id=def456example",
      "additional_info": "預計 Q2 開始試點，Q3 完成全面部署。"
    },
    "plan": {
      "total_mandays": "65",
      "total_phases": [
        {
          "activity": "Requirements & Architecture",
          "description": "- Requirements interviews\n- Architecture design review\n- Security and DR planning",
          "mandays": "10",
          "delivery_date": "2026-04-15"
        },
        {
          "activity": "Infrastructure Setup",
          "description": "- VPC, subnets, security groups\n- IAM roles with least privilege\n- KMS and Secrets Manager",
          "mandays": "12",
          "delivery_date": "2026-05-01"
        },
        {
          "activity": "AppStream Deployment",
          "description": "- Fleet and Stack configuration\n- Application imaging\n- Performance tuning",
          "mandays": "15",
          "delivery_date": "2026-05-20"
        },
        {
          "activity": "Security & Compliance",
          "description": "- Security Hub (CIS/PCI-DSS)\n- Session Manager auditing\n- Penetration testing",
          "mandays": "12",
          "delivery_date": "2026-06-10"
        },
        {
          "activity": "Monitoring & DR",
          "description": "- CloudWatch dashboards\n- Backup strategies\n- DR procedure testing",
          "mandays": "10",
          "delivery_date": "2026-07-01"
        },
        {
          "activity": "Pilot & Training",
          "description": "- Developer training\n- Pilot (50-100 users)\n- Feedback & adjustment",
          "mandays": "10",
          "delivery_date": "2026-07-30"
        },
        {
          "activity": "GA & Knowledge Transfer",
          "description": "- Full migration\n- IT team certification\n- Final audit",
          "mandays": "6",
          "delivery_date": "2026-08-15"
        }
      ]
    },
    "architecture": {
      "diagram": "appstream_architecture.png",
      "description": "## Architecture Overview\n\n### Network & Access Layer\n- Route 53 DNS with global load balancing\n- ALB for HTTPS termination\n- VPC with multi-AZ subnets\n\n### Security & Identity Layer\n- IAM with least-privilege policies\n- Secrets Manager for credentials\n- KMS for encryption\n\n### AppStream 2.0 Core\n- Fleet by workload type\n- Encrypted persistent storage\n\n### Monitoring & Audit\n- CloudTrail API audit\n- CloudWatch centralized logging\n- Security Hub compliance"
    }
  }
}
```

### Key Observations

1. **Content language** matches target audience (Traditional Chinese) while **diagram labels stay English**
2. **7 delivery phases** with concrete milestones
3. **Architecture description** uses Markdown headers and lists for rich DOCX rendering
4. **Business justification** includes concrete metrics (40-60% cost reduction)
5. **calculator_link** provides the official AWS cost reference

## Pre-Generation Checklist

- [ ] All `sandbox.basics` fields populated
- [ ] `sandbox.details.summary` includes clear executive overview
- [ ] `sandbox.details.features` uses bullet/markdown list format
- [ ] `sandbox.business` costs are consistent (total = funding + labor)
- [ ] `sandbox.business` dates are logical (start < end <= release)
- [ ] `sandbox.business.calculator_link` obtained from AWS Calculator
- [ ] `sandbox.plan.total_mandays` ≈ sum of individual phase mandays
- [ ] Each phase has activity, description, mandays, delivery_date
- [ ] Architecture diagram PNG exists at the path specified in `sandbox.architecture.diagram`
- [ ] `sandbox.architecture.description` explains design rationale in Markdown
