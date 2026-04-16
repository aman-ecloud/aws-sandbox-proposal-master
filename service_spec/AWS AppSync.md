| Config Key | Label on Page | Type | Default Value | Valid Options | Pricing Impact | Justification |
|---|---|---|---|---|---|---|
| descriptionOptional | Description - optional | text | SMB estimate |  | false | Required metadata/selector with indirect or no direct cost impact. |
| chooseALocationTypeinfo | Choose a location typeInfo: | select/dropdown | Region | Region | false | Required metadata/selector with indirect or no direct cost impact. |
| unlabeled | (unlabeled) | checkbox | true |  | false | Required metadata/selector with indirect or no direct cost impact. |
| numberOfSubscribedClients | Number Of Subscribed Clients | text | 10 |  | false | Required metadata/selector with indirect or no direct cost impact. |
| averageActiveDurationPerSubscribedClients | Average Active Duration per Subscribed Clients Value | number | 500 |  | true | Impacts estimated usage/cost dimensions. |
| unit | Unit | select/dropdown | per month | per day<br>per week<br>per month | false | Required metadata/selector with indirect or no direct cost impact. |
| numberOfInboundMessagesIE | Number of Inbound Messages (i.e. GraphQL Mutations) Value | number | 1 |  | true | Impacts estimated usage/cost dimensions. |
| numberOfOutboundMessagesValue | Number of Outbound Messages Value | number | 1 |  | true | Impacts estimated usage/cost dimensions. |
| cacheMemorySizeGb | Cache memory size (GB) | select/dropdown | cache.small (vCPU: 1, Memory: 1.55 GB) | cache.small (vCPU: 1, Memory: 1.55 GB) | true | Impacts estimated usage/cost dimensions. |
| numberOfConnectedClientsEnterThe | Number of connected clients Enter the number of connected clients | text | 10 |  | false | Required metadata/selector with indirect or no direct cost impact. |
| inboundMessagesPublishedFromBackendValue | Inbound messages published from backend Value | number | 1 |  | true | Impacts estimated usage/cost dimensions. |
| inboundMessagesPublishedPerClientValue | Inbound messages published per client Value | number | 100 |  | true | Impacts estimated usage/cost dimensions. |
| ouboundMessagesReceivedPerClientValue | Oubound messages received per client Value | number | 100 |  | true | Impacts estimated usage/cost dimensions. |
| connectionRequestsPerClientValue | Connection requests per client Value | number | 100000 |  | true | Impacts estimated usage/cost dimensions. |
| subscriptionRequestsPerClientValue | Subscription requests per client Value | number | 100000 |  | true | Impacts estimated usage/cost dimensions. |
| unsubscribeRequestsPerClientValue | Unsubscribe requests per client Value | number | 100000 |  | true | Impacts estimated usage/cost dimensions. |
| eventHandlerInvocationsValue | Event handler invocations Value | number | 1 |  | true | Impacts estimated usage/cost dimensions. |
| connectionMinutesPerClientValue | Connection minutes per client Value | number | 100 |  | true | Impacts estimated usage/cost dimensions. |
