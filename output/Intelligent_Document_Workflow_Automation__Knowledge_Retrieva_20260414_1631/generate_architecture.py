from diagrams import Diagram, Cluster
from diagrams.aws.analytics import AmazonOpensearchService
from diagrams.aws.compute import Lambda
from diagrams.aws.database import Dynamodb
from diagrams.aws.management import Cloudwatch
from diagrams.aws.ml import Comprehend, Textract
from diagrams.aws.network import APIGateway
from diagrams.aws.storage import S3

output_path = "output/Intelligent_Document_Workflow_Automation__Knowledge_Retrieva_20260414_1631/architecture"

with Diagram(
    "Intelligent Document Workflow Automation & Knowledge Retrieval Platform",
    filename=output_path,
    show=False,
    direction="LR",
):
    s3 = S3("Document Lake")
    api = APIGateway("Workflow APIs")
    lambda_fn = Lambda("Event Pipeline")

    with Cluster("AI Extraction"):
        textract = Textract("OCR Parsing")
        comprehend = Comprehend("NLP Classification")

    with Cluster("Knowledge Layer"):
        ddb = Dynamodb("Metadata Index")
        os = AmazonOpensearchService("Search Retrieval")

    cw = Cloudwatch("Monitoring & Alerts")

    s3 >> lambda_fn
    api >> lambda_fn
    lambda_fn >> textract >> comprehend
    comprehend >> ddb
    comprehend >> os
    lambda_fn >> cw
    textract >> cw
    comprehend >> cw
    api >> cw
    ddb >> cw
    os >> cw
