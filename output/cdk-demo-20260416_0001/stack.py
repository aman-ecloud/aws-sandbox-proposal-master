import aws_cdk as cdk
from aws_cdk import (
    CfnOutput,
    Duration,
    RemovalPolicy,
    Stack,
    aws_dynamodb as dynamodb,
    aws_lambda as lambda_,
    aws_lambda_event_sources as event_sources,
    aws_sqs as sqs,
)
from constructs import Construct


class DemoStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        queue = sqs.Queue(
            self,
            "ProcessingQueue",
            visibility_timeout=Duration.seconds(60),
            removal_policy=RemovalPolicy.DESTROY,
        )

        table = dynamodb.Table(
            self,
            "ResultsTable",
            partition_key=dynamodb.Attribute(
                name="message_id",
                type=dynamodb.AttributeType.STRING,
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            removal_policy=RemovalPolicy.DESTROY,
        )

        lambda_fn = lambda_.Function(
            self,
            "ProcessorFunction",
            runtime=lambda_.Runtime.PYTHON_3_12,
            handler="index.handler",
            timeout=Duration.seconds(30),
            memory_size=128,
            environment={"TABLE_NAME": table.table_name},
            code=lambda_.Code.from_inline(
                """
import os
import boto3
from datetime import datetime, timezone


ddb = boto3.resource("dynamodb")
table = ddb.Table(os.environ["TABLE_NAME"])


def handler(event, context):
    records = event.get("Records", [])
    written = 0

    for record in records:
        message_id = record.get("messageId")
        body = record.get("body", "")
        table.put_item(
            Item={
                "message_id": message_id,
                "processed_at": datetime.now(timezone.utc).isoformat(),
                "payload": body,
                "source": "sqs",
            }
        )
        written += 1

    return {"statusCode": 200, "processed": written}
"""
            ),
        )

        table.grant_read_write_data(lambda_fn)
        lambda_fn.add_event_source(event_sources.SqsEventSource(queue, batch_size=10))

        CfnOutput(self, "QueueUrl", value=queue.queue_url)
        CfnOutput(self, "TableName", value=table.table_name)
        CfnOutput(self, "LambdaArn", value=lambda_fn.function_arn)
