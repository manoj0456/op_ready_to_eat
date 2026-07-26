"""Shared helper to ensure the Cognito user pool has the custom:role attribute."""
from botocore.exceptions import ClientError


def ensure_custom_role_attribute(cognito, user_pool_id, log=print):
    pool = cognito.describe_user_pool(UserPoolId=user_pool_id)["UserPool"]
    has_role_attr = any(
        attr.get("Name") == "custom:role" for attr in pool.get("SchemaAttributes", [])
    )
    if has_role_attr:
        log("custom:role attribute already exists on the user pool")
        return

    log("custom:role attribute missing on the user pool - adding it now")
    try:
        cognito.add_custom_attributes(
            UserPoolId=user_pool_id,
            CustomAttributes=[
                {
                    "Name": "role",
                    "AttributeDataType": "String",
                    "Mutable": True,
                    "StringAttributeConstraints": {"MinLength": "1", "MaxLength": "20"},
                }
            ],
        )
        log("custom:role attribute added")
    except ClientError as e:
        if "already exists" in str(e):
            log("custom:role attribute already exists (race with another run)")
            return
        raise
