| Config Key | Label on Page | Type | Default Value | Valid Options | Pricing Impact | Justification |
|---|---|---|---|---|---|---|
| descriptionOptional | Description - optional | text | SMB estimate |  | false | Required metadata/selector with indirect or no direct cost impact. |
| chooseALocationTypeinfo | Choose a location typeInfo: | select/dropdown | Region | Region | false | Required metadata/selector with indirect or no direct cost impact. |
| selectBuildInstanceSize | Select build instance size | select/dropdown | Standard (8 GB Memory, 4 vCPUs) | Standard (8 GB Memory, 4 vCPUs)<br>Large (16 GB Memory, 8 vCPUs)<br>X-Large (72 GB Memory, 36 vCPUs) | true | Impacts estimated usage/cost dimensions. |
| numberOfBuildMinutesValue | Number of build minutes Value | number | 1 |  | true | Impacts estimated usage/cost dimensions. |
| unit | Unit | select/dropdown | per month | per minute<br>per hour<br>per day<br>per month | false | Required metadata/selector with indirect or no direct cost impact. |
| dataStoredPerMonthValue | Data stored per month Value | number | 100 |  | true | Impacts estimated usage/cost dimensions. |
| dataServedPerMonthValue | Data served per month Value | number | 100 |  | true | Impacts estimated usage/cost dimensions. |
| numberOfSsrRequestsValue | Number of SSR requests Value | number | 100000 |  | true | Impacts estimated usage/cost dimensions. |
| durationOfEachRequestInMs | Duration of each request (in ms) Enter duration in ms | text | 500 |  | true | Impacts estimated usage/cost dimensions. |
| doYouWantToEnableWeb | Do you want to enable Web Application Firewall? | select/dropdown | No | No | false | Required metadata/selector with indirect or no direct cost impact. |
