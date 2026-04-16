| Config Key | Label on Page | Type | Default Value | Valid Options | Pricing Impact | Justification |
|---|---|---|---|---|---|---|
| descriptionOptional | Description - optional | text | SMB estimate |  | false | Required metadata/selector with indirect or no direct cost impact. |
| chooseALocationTypeinfo | Choose a location typeInfo: | select/dropdown | Region | Region | false | Required metadata/selector with indirect or no direct cost impact. |
| numberOfAccounts | Number of accounts | text | 5 |  | false | Required metadata/selector with indirect or no direct cost impact. |
| resourceType | Resource type | select/dropdown | EC2 instances | EC2 instances<br>RDS instances<br>S3 buckets<br>VPC subnets<br>Other resource types | false | Required metadata/selector with indirect or no direct cost impact. |
| numberOfResourcesPerAccount | Number of resources per account | text | 100 |  | false | Required metadata/selector with indirect or no direct cost impact. |
| numberOfConfigurationSnapshotsApiCalls | Number of configuration snapshots (API calls) Value | number | 1 |  | true | Impacts estimated usage/cost dimensions. |
| unit | Unit | select/dropdown | per month | per day<br>per week<br>per month | false | Required metadata/selector with indirect or no direct cost impact. |
| numberOfConfigurationChangesUserActivity | Number of configuration changes/user activity logs (Cloudtrail) Value | number | 1 |  | true | Impacts estimated usage/cost dimensions. |
| numberOfComplianceChecksSecurityHub | Number of compliance checks (Security Hub, Config) Value | number | 1 |  | true | Impacts estimated usage/cost dimensions. |
