import aws_cdk as cdk
from stack import DemoStack

QUALIFIER = "sqslmd01"

app = cdk.App()

stack = DemoStack(
    app,
    "sqs-lambda-ddb-demo",
    env=cdk.Environment(region="us-east-1"),
    synthesizer=cdk.DefaultStackSynthesizer(qualifier=QUALIFIER),
)

cdk.Tags.of(stack).add("Environment", "demo")
cdk.Tags.of(stack).add("ManagedBy", "cdk-demo")
cdk.Tags.of(stack).add("Project", "sqs-lambda-ddb-demo")

app.synth()
