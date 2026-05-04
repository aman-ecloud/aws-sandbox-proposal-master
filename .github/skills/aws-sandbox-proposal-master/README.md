# sdx-aws-sandbox-proposal-master

An SDX skill that generates complete AWS Sandbox funding proposals for eCloudvalley projects.

## What it does

- Parses a plain-language project description and extracts required AWS services
- Builds an AWS Calculator estimate with accurate monthly pricing
- Generates a Mermaid architecture diagram
- Produces a fully populated Word document (`.docx`) using the Sandbox Innovation Plan Template

## Installation

```bash
npm install @sdx/sdx-aws-sandbox-proposal-master \
  --registry https://nexus.dev.ecvhrm.com/repository/npm-dx-group/
npx skills experimental_sync -y
```

## Usage

Invoke the skill by describing your project to the AI agent. The skill handles service selection, pricing, diagramming, and document generation automatically.

## Author

eCloudvalley
