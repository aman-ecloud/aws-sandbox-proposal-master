# sdx-review-skill

An SDX skill that audits and validates a completed AWS Sandbox proposal.

## What it does

- Verifies that services declared at planning time exactly match the AWS Calculator estimate and architecture diagram
- Checks the generated Word document for blank fields, rendering failures, duplicates, or missing mandatory content
- Reports mismatches and provides actionable correction guidance

## Installation

```bash
npm install @sdx/sdx-aws-review-skill \
  --registry https://nexus.dev.ecvhrm.com/repository/npm-dx-group/
npx skills experimental_sync -y
```

## Usage

Run after `aws-sandbox-proposal-master` generates a proposal. Ask the agent to review, validate, or QA the proposal and this skill activates automatically.

## Author

eCloudvalley
