#!/usr/bin/env python3
"""
Provisions the ReadyToEat backend: DynamoDB tables, an IAM execution role,
the API Lambda function, and an API Gateway HTTP API in front of it.

Idempotent - safe to re-run (e.g. to deploy new Lambda code): existing
resources are detected and updated in place rather than recreated.

Requires: boto3, and backend/lambda/node_modules already installed
(`npm install --omit=dev` inside backend/lambda before running this).

Env vars:
  AWS_REGION                 (default: us-east-1)
  COGNITO_USER_POOL_ID       (required)
  COGNITO_CLIENT_ID          (required)
  CORS_ORIGINS                comma-separated list of allowed origins
"""
import io
import json
import os
import time
import zipfile
from pathlib import Path

import boto3
from botocore.exceptions import ClientError

REGION = os.environ.get("AWS_REGION", "us-east-1")
COGNITO_USER_POOL_ID = os.environ["COGNITO_USER_POOL_ID"]
COGNITO_CLIENT_ID = os.environ["COGNITO_CLIENT_ID"]
CORS_ORIGINS = os.environ.get(
    "CORS_ORIGINS",
    "https://readytoeat.oppertunitypool.com,https://www.readytoeat.oppertunitypool.com",
)

PREFIX = "ReadyToEat"
FUNCTION_NAME = "readytoeat-api"
ROLE_NAME = "ReadyToEatLambdaRole"
API_NAME = "readytoeat-api"

LAMBDA_DIR = Path(__file__).parent / "lambda"

sts = boto3.client("sts", region_name=REGION)
ACCOUNT_ID = sts.get_caller_identity()["Account"]

ddb = boto3.client("dynamodb", region_name=REGION)
iam = boto3.client("iam", region_name=REGION)
lam = boto3.client("lambda", region_name=REGION)
apigw = boto3.client("apigatewayv2", region_name=REGION)

TABLE_DEFS = {
    "USERS": {
        "name": f"{PREFIX}-Users",
        "gsis": [{"name": "EmailIndex", "pk": "GSI1PK", "sk": "GSI1SK"}],
    },
    "RESTAURANTS": {"name": f"{PREFIX}-Restaurants", "gsis": []},
    "MENUS": {
        "name": f"{PREFIX}-Menus",
        "gsis": [{"name": "ItemIndex", "pk": "GSI1PK", "sk": "GSI1SK"}],
    },
    "ORDERS": {
        "name": f"{PREFIX}-Orders",
        "gsis": [
            {"name": "CustomerIndex", "pk": "GSI1PK", "sk": "GSI1SK"},
            {"name": "RestaurantIndex", "pk": "GSI2PK", "sk": "GSI2SK"},
            {"name": "StatusIndex", "pk": "GSI3PK", "sk": "GSI3SK"},
        ],
    },
    "REVIEWS": {
        "name": f"{PREFIX}-Reviews",
        "gsis": [{"name": "CustomerReviewIndex", "pk": "GSI1PK", "sk": "GSI1SK"}],
    },
    "FAVORITES": {
        "name": f"{PREFIX}-Favorites",
        "gsis": [{"name": "RestaurantFavoriteIndex", "pk": "GSI1PK", "sk": "GSI1SK"}],
    },
    "COUPONS": {
        "name": f"{PREFIX}-Coupons",
        "gsis": [{"name": "RestaurantCouponIndex", "pk": "GSI1PK", "sk": "GSI1SK"}],
    },
    "NOTIFICATIONS": {"name": f"{PREFIX}-Notifications", "gsis": []},
}


def log(msg):
    print(f"[provision] {msg}", flush=True)


def ensure_table(table_key, table_def):
    name = table_def["name"]
    try:
        ddb.describe_table(TableName=name)
        log(f"Table {name} already exists")
        return name
    except ClientError as e:
        if e.response["Error"]["Code"] != "ResourceNotFoundException":
            raise

    attrs = {"PK": "S", "SK": "S"}
    for gsi in table_def["gsis"]:
        attrs[gsi["pk"]] = "S"
        attrs[gsi["sk"]] = "S"

    gsi_specs = [
        {
            "IndexName": gsi["name"],
            "KeySchema": [
                {"AttributeName": gsi["pk"], "KeyType": "HASH"},
                {"AttributeName": gsi["sk"], "KeyType": "RANGE"},
            ],
            "Projection": {"ProjectionType": "ALL"},
        }
        for gsi in table_def["gsis"]
    ]

    kwargs = dict(
        TableName=name,
        AttributeDefinitions=[{"AttributeName": k, "AttributeType": v} for k, v in attrs.items()],
        KeySchema=[
            {"AttributeName": "PK", "KeyType": "HASH"},
            {"AttributeName": "SK", "KeyType": "RANGE"},
        ],
        BillingMode="PAY_PER_REQUEST",
    )
    if gsi_specs:
        kwargs["GlobalSecondaryIndexes"] = gsi_specs

    log(f"Creating table {name}...")
    ddb.create_table(**kwargs)
    ddb.get_waiter("table_exists").wait(TableName=name)
    log(f"Table {name} created")
    return name


def ensure_role():
    trust_policy = {
        "Version": "2012-10-17",
        "Statement": [{"Effect": "Allow", "Principal": {"Service": "lambda.amazonaws.com"}, "Action": "sts:AssumeRole"}],
    }
    try:
        role = iam.get_role(RoleName=ROLE_NAME)
        log(f"IAM role {ROLE_NAME} already exists")
    except ClientError as e:
        if e.response["Error"]["Code"] != "NoSuchEntity":
            raise
        log(f"Creating IAM role {ROLE_NAME}...")
        role = iam.create_role(RoleName=ROLE_NAME, AssumeRolePolicyDocument=json.dumps(trust_policy))
        time.sleep(10)

    iam.attach_role_policy(
        RoleName=ROLE_NAME,
        PolicyArn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
    )

    table_arns = []
    for t in TABLE_DEFS.values():
        arn = f"arn:aws:dynamodb:{REGION}:{ACCOUNT_ID}:table/{t['name']}"
        table_arns.append(arn)
        table_arns.append(f"{arn}/index/*")

    inline_policy = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": [
                    "dynamodb:GetItem",
                    "dynamodb:PutItem",
                    "dynamodb:UpdateItem",
                    "dynamodb:DeleteItem",
                    "dynamodb:Query",
                    "dynamodb:Scan",
                    "dynamodb:BatchGetItem",
                    "dynamodb:BatchWriteItem",
                ],
                "Resource": table_arns,
            },
            {
                "Effect": "Allow",
                "Action": ["cognito-idp:AdminGetUser", "cognito-idp:InitiateAuth"],
                "Resource": f"arn:aws:cognito-idp:{REGION}:{ACCOUNT_ID}:userpool/{COGNITO_USER_POOL_ID}",
            },
        ],
    }
    iam.put_role_policy(
        RoleName=ROLE_NAME, PolicyName="ReadyToEatBackendAccess", PolicyDocument=json.dumps(inline_policy)
    )
    return role["Role"]["Arn"]


def zip_lambda():
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        for path in LAMBDA_DIR.rglob("*"):
            if path.is_file():
                zf.write(path, path.relative_to(LAMBDA_DIR))
    buf.seek(0)
    return buf.read()


def ensure_function(role_arn, env_vars):
    code_bytes = zip_lambda()
    try:
        lam.get_function(FunctionName=FUNCTION_NAME)
        log(f"Updating existing function {FUNCTION_NAME}...")
        lam.update_function_code(FunctionName=FUNCTION_NAME, ZipFile=code_bytes)
        lam.get_waiter("function_updated").wait(FunctionName=FUNCTION_NAME)
        lam.update_function_configuration(
            FunctionName=FUNCTION_NAME,
            Runtime="nodejs24.x",
            Handler="index.handler",
            Role=role_arn,
            Timeout=15,
            MemorySize=256,
            Environment={"Variables": env_vars},
        )
        lam.get_waiter("function_updated").wait(FunctionName=FUNCTION_NAME)
    except ClientError as e:
        if e.response["Error"]["Code"] != "ResourceNotFoundException":
            raise
        log(f"Creating function {FUNCTION_NAME}...")
        for attempt in range(5):
            try:
                lam.create_function(
                    FunctionName=FUNCTION_NAME,
                    Runtime="nodejs24.x",
                    Role=role_arn,
                    Handler="index.handler",
                    Code={"ZipFile": code_bytes},
                    Timeout=15,
                    MemorySize=256,
                    Environment={"Variables": env_vars},
                )
                break
            except ClientError as ce:
                if ce.response["Error"]["Code"] == "InvalidParameterValueException" and attempt < 4:
                    log("Role not yet propagated, retrying...")
                    time.sleep(5)
                    continue
                raise
        lam.get_waiter("function_active").wait(FunctionName=FUNCTION_NAME)

    return lam.get_function(FunctionName=FUNCTION_NAME)["Configuration"]["FunctionArn"]


def ensure_api(function_arn):
    apis = apigw.get_apis()["Items"]
    existing = next((a for a in apis if a["Name"] == API_NAME), None)

    cors_config = {
        "AllowOrigins": CORS_ORIGINS.split(","),
        "AllowMethods": ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
        "AllowHeaders": ["Content-Type", "Authorization"],
    }

    if existing:
        api_id = existing["ApiId"]
        log(f"API {API_NAME} already exists ({api_id})")
        apigw.update_api(ApiId=api_id, CorsConfiguration=cors_config)
    else:
        log(f"Creating HTTP API {API_NAME}...")
        created = apigw.create_api(
            Name=API_NAME,
            ProtocolType="HTTP",
            CorsConfiguration=cors_config,
        )
        api_id = created["ApiId"]

    integrations = apigw.get_integrations(ApiId=api_id)["Items"]
    lambda_uri = f"arn:aws:apigateway:{REGION}:lambda:path/2015-03-31/functions/{function_arn}/invocations"
    existing_integration = next((i for i in integrations if i.get("IntegrationUri") == function_arn), None)

    if existing_integration:
        integration_id = existing_integration["IntegrationId"]
    else:
        integration = apigw.create_integration(
            ApiId=api_id,
            IntegrationType="AWS_PROXY",
            IntegrationUri=function_arn,
            PayloadFormatVersion="2.0",
            IntegrationMethod="POST",
        )
        integration_id = integration["IntegrationId"]

    routes = apigw.get_routes(ApiId=api_id)["Items"]
    route_key = "ANY /{proxy+}"
    if not any(r["RouteKey"] == route_key for r in routes):
        apigw.create_route(ApiId=api_id, RouteKey=route_key, Target=f"integrations/{integration_id}")

    stages = apigw.get_stages(ApiId=api_id)["Items"]
    if not any(s["StageName"] == "$default" for s in stages):
        apigw.create_stage(ApiId=api_id, StageName="$default", AutoDeploy=True)

    try:
        lam.add_permission(
            FunctionName=FUNCTION_NAME,
            StatementId="apigateway-invoke",
            Action="lambda:InvokeFunction",
            Principal="apigateway.amazonaws.com",
            SourceArn=f"arn:aws:execute-api:{REGION}:{ACCOUNT_ID}:{api_id}/*/*/*",
        )
    except ClientError as e:
        if e.response["Error"]["Code"] != "ResourceConflictException":
            raise

    return f"https://{api_id}.execute-api.{REGION}.amazonaws.com"


def main():
    log(f"Region: {REGION}, Account: {ACCOUNT_ID}")

    table_names = {}
    for key, table_def in TABLE_DEFS.items():
        table_names[key] = ensure_table(key, table_def)

    role_arn = ensure_role()
    log(f"Role ARN: {role_arn}")
    log("Waiting for IAM role/policy propagation...")
    time.sleep(10)

    env_vars = {
        "TABLE_USERS": table_names["USERS"],
        "TABLE_RESTAURANTS": table_names["RESTAURANTS"],
        "TABLE_MENUS": table_names["MENUS"],
        "TABLE_ORDERS": table_names["ORDERS"],
        "TABLE_REVIEWS": table_names["REVIEWS"],
        "TABLE_FAVORITES": table_names["FAVORITES"],
        "TABLE_COUPONS": table_names["COUPONS"],
        "TABLE_NOTIFICATIONS": table_names["NOTIFICATIONS"],
        "COGNITO_USER_POOL_ID": COGNITO_USER_POOL_ID,
        "COGNITO_CLIENT_ID": COGNITO_CLIENT_ID,
        "CORS_ORIGINS": CORS_ORIGINS,
    }

    function_arn = ensure_function(role_arn, env_vars)
    log(f"Function ARN: {function_arn}")

    api_url = ensure_api(function_arn)
    log(f"API URL: {api_url}")

    print(f"::notice::ReadyToEat API URL: {api_url}")
    with open(os.environ.get("GITHUB_OUTPUT", os.devnull), "a") as f:
        f.write(f"api_url={api_url}\n")


if __name__ == "__main__":
    main()
