| Config Key | Label on Page | Type | Default Value | Valid Options | Pricing Impact | Justification |
|---|---|---|---|---|---|---|
| descriptionOptional | Description - optional | text | SMB estimate |  | false | Required metadata/selector with indirect or no direct cost impact. |
| chooseALocationTypeinfo | Choose a location typeInfo: | select/dropdown | Region | Region | false | Required metadata/selector with indirect or no direct cost impact. |
| containerComputeSize | Container compute size | select/dropdown | 1 vCPU | 0.25 vCPU<br>0.5 vCPU<br>1 vCPU<br>2 vCPU<br>4 vCPU | true | Impacts estimated usage/cost dimensions. |
| containerMemorySize | Container memory size | select/dropdown | 2 GB | 2 GB<br>3 GB<br>4 GB | true | Impacts estimated usage/cost dimensions. |
| concurrencyEnterTheNumberOfRequests | Concurrency Enter the number of requests per second | text | 50 |  | true | Impacts estimated usage/cost dimensions. |
| minimumProvisionedContainerInstances | Minimum provisioned container instances | text | 1 |  | true | Impacts estimated usage/cost dimensions. |
| peakTrafficHoursEnterNumberOf | Peak traffic hours Enter number of hours per day | text | 10 |  | true | Impacts estimated usage/cost dimensions. |
| numberOfRequestsDuringPeakTraffic | Number of requests during peak traffic (requests/second) Enter number of requests received per second | text | 10 |  | true | Impacts estimated usage/cost dimensions. |
| numberOfRequestsDuringOffPeak | Number of requests during off-peak traffic (requests/second) Enter number of requests received per second | text | 10 |  | true | Impacts estimated usage/cost dimensions. |
| autoDeployment | Auto deployment | select/dropdown | No | Yes<br>No | false | Required metadata/selector with indirect or no direct cost impact. |
| buildOnAppRunner | Build on App Runner | select/dropdown | No | Yes<br>No | false | Required metadata/selector with indirect or no direct cost impact. |
| codeDeploymentsPerMonthEnterNumber | Code deployments per month Enter number of code deployments per month | text | 10 |  | false | Required metadata/selector with indirect or no direct cost impact. |
| averageBuildTimeMinutesEnterAverage | Average build time (minutes) Enter average build time for your application | text | 10 |  | false | Required metadata/selector with indirect or no direct cost impact. |
| dataTransferFrom | Data transfer from | select/dropdown | Data transfer from | Data transfer from | true | Impacts estimated usage/cost dimensions. |
| enterAmountEnterAmount | Enter Amount Enter amount | number | 100 |  | true | Impacts estimated usage/cost dimensions. |
| dataAmount | Data amount | select/dropdown | TB per month | GB per month<br>TB per month | true | Impacts estimated usage/cost dimensions. |
| dataTransferTo | Data transfer to | select/dropdown | Data transfer to | Data transfer to | true | Impacts estimated usage/cost dimensions. |
