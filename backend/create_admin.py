#!/usr/bin/env python3
"""
Creates (or promotes) a Cognito user as ADMIN and ensures the matching
Users DynamoDB record exists with role=ADMIN. Admin accounts aren't
self-serve via the signup form, so this is the bootstrap path.

Env vars:
  AWS_REGION            (default: us-east-1)
  COGNITO_USER_POOL_ID  (required)
  TABLE_USERS           (required - the ReadyToEat-Users table name)
  ADMIN_EMAIL           (required)
  ADMIN_NAME            (required)
  ADMIN_PASSWORD        (required)
"""
import os
from datetime import datetime, timezone

import boto3
from botocore.exceptions import ClientError

from cognito_schema import ensure_custom_role_attribute

REGION = os.environ.get("AWS_REGION", "us-east-1")
USER_POOL_ID = os.environ["COGNITO_USER_POOL_ID"]
# The pool can live in a different region than the rest of the stack - derive
# it from the pool id prefix (e.g. "us-east-2_XXXX") rather than assuming it
# matches AWS_REGION.
COGNITO_REGION = USER_POOL_ID.split("_")[0]
TABLE_USERS = os.environ["TABLE_USERS"]
EMAIL = os.environ["ADMIN_EMAIL"]
NAME = os.environ["ADMIN_NAME"]
PASSWORD = os.environ["ADMIN_PASSWORD"]

cognito = boto3.client("cognito-idp", region_name=COGNITO_REGION)
ddb = boto3.client("dynamodb", region_name=REGION)


def log(msg):
    print(f"[create-admin] {msg}", flush=True)


def ensure_cognito_user():
    ensure_custom_role_attribute(cognito, USER_POOL_ID, log)
    try:
        user = cognito.admin_get_user(UserPoolId=USER_POOL_ID, Username=EMAIL)
        log(f"Cognito user {EMAIL} already exists")
    except ClientError as e:
        if e.response["Error"]["Code"] != "UserNotFoundException":
            raise
        log(f"Creating Cognito user {EMAIL}...")
        cognito.admin_create_user(
            UserPoolId=USER_POOL_ID,
            Username=EMAIL,
            UserAttributes=[
                {"Name": "email", "Value": EMAIL},
                {"Name": "email_verified", "Value": "true"},
                {"Name": "name", "Value": NAME},
                {"Name": "custom:role", "Value": "ADMIN"},
            ],
            MessageAction="SUPPRESS",
        )
        user = cognito.admin_get_user(UserPoolId=USER_POOL_ID, Username=EMAIL)

    cognito.admin_set_user_password(
        UserPoolId=USER_POOL_ID, Username=EMAIL, Password=PASSWORD, Permanent=True
    )
    log("Password set")

    attrs = {a["Name"]: a["Value"] for a in user["UserAttributes"]}
    if attrs.get("custom:role") != "ADMIN":
        cognito.admin_update_user_attributes(
            UserPoolId=USER_POOL_ID,
            Username=EMAIL,
            UserAttributes=[{"Name": "custom:role", "Value": "ADMIN"}],
        )
        log("Promoted existing user to ADMIN")

    return attrs["sub"]


def ensure_users_record(sub):
    key = {"PK": {"S": f"USER#{sub}"}, "SK": {"S": "PROFILE"}}
    existing = ddb.get_item(TableName=TABLE_USERS, Key=key).get("Item")
    now = datetime.now(timezone.utc).isoformat()

    item = {
        "PK": {"S": f"USER#{sub}"},
        "SK": {"S": "PROFILE"},
        "GSI1PK": {"S": EMAIL},
        "GSI1SK": {"S": f"USER#{sub}"},
        "email": {"S": EMAIL},
        "name": {"S": NAME},
        "role": {"S": "ADMIN"},
        "createdAt": {"S": existing["createdAt"]["S"] if existing else now},
    }
    ddb.put_item(TableName=TABLE_USERS, Item=item)
    log(f"Users record ensured for {sub}")


def main():
    log(f"DynamoDB region: {REGION}, Cognito region: {COGNITO_REGION}")
    sub = ensure_cognito_user()
    ensure_users_record(sub)
    log(f"Admin ready: {EMAIL}")


if __name__ == "__main__":
    main()
