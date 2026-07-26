#!/usr/bin/env bash
# Creates a CloudFront distribution for the op-readytoeat-frontend S3 bucket
# and (if the bucket does not have static website hosting enabled) sets up
# an Origin Access Control so CloudFront can read the private bucket.
#
# Run this once, locally, with your own AWS credentials configured
# (e.g. via `aws configure` or AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY env vars).
# It does not read or write any credentials to disk.
#
# Usage:
#   ./create-cloudfront.sh
#
# After it finishes, copy the printed Distribution ID and add it as the
# GitHub secret CLOUDFRONT_DISTRIBUTION_ID on manoj0456/op_ready_to_eat.

set -euo pipefail

BUCKET_NAME="${S3_BUCKET_NAME:-op-readytoeat-frontend}"
AWS_REGION="${AWS_REGION:-us-east-1}"
DOMAIN_NAME="readytoeat.oppertunitypool.com"

command -v aws >/dev/null 2>&1 || {
  echo "ERROR: AWS CLI not found. Install it first: https://aws.amazon.com/cli/" >&2
  exit 1
}

echo "Verifying AWS credentials..."
aws sts get-caller-identity >/dev/null || {
  echo "ERROR: No valid AWS credentials found. Run 'aws configure' or export AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY first." >&2
  exit 1
}

echo "Checking whether S3 static website hosting is enabled on '$BUCKET_NAME'..."
if aws s3api get-bucket-website --bucket "$BUCKET_NAME" >/dev/null 2>&1; then
  USE_WEBSITE_ENDPOINT=true
  ORIGIN_DOMAIN="${BUCKET_NAME}.s3-website-${AWS_REGION}.amazonaws.com"
  echo "Static website hosting is enabled. Using website endpoint as origin: $ORIGIN_DOMAIN"
else
  USE_WEBSITE_ENDPOINT=false
  ORIGIN_DOMAIN="${BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com"
  echo "Static website hosting not enabled. Using REST endpoint with Origin Access Control: $ORIGIN_DOMAIN"
fi

ORIGIN_ID="S3-${BUCKET_NAME}"
CALLER_REFERENCE="readytoeat-$(date +%s)"
WORKDIR="$(mktemp -d)"
trap 'rm -rf "$WORKDIR"' EXIT

if [ "$USE_WEBSITE_ENDPOINT" = "true" ]; then
  ORIGIN_CONFIG=$(cat <<EOF
    {
      "Id": "$ORIGIN_ID",
      "DomainName": "$ORIGIN_DOMAIN",
      "CustomOriginConfig": {
        "HTTPPort": 80,
        "HTTPSPort": 443,
        "OriginProtocolPolicy": "http-only",
        "OriginSslProtocols": { "Quantity": 1, "Items": ["TLSv1.2"] }
      }
    }
EOF
)
else
  echo "Creating CloudFront Origin Access Control..."
  OAC_ID=$(aws cloudfront create-origin-access-control \
    --origin-access-control-config "{\"Name\":\"${BUCKET_NAME}-oac\",\"OriginAccessControlOriginType\":\"s3\",\"SigningBehavior\":\"always\",\"SigningProtocol\":\"sigv4\"}" \
    --query 'OriginAccessControl.Id' --output text)
  echo "OAC created: $OAC_ID"

  ORIGIN_CONFIG=$(cat <<EOF
    {
      "Id": "$ORIGIN_ID",
      "DomainName": "$ORIGIN_DOMAIN",
      "OriginAccessControlId": "$OAC_ID",
      "S3OriginConfig": { "OriginAccessIdentity": "" }
    }
EOF
)
fi

cat > "$WORKDIR/dist-config.json" <<EOF
{
  "CallerReference": "$CALLER_REFERENCE",
  "Comment": "$DOMAIN_NAME frontend",
  "DefaultRootObject": "index.html",
  "Enabled": true,
  "PriceClass": "PriceClass_100",
  "Origins": {
    "Quantity": 1,
    "Items": [ $ORIGIN_CONFIG ]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "$ORIGIN_ID",
    "ViewerProtocolPolicy": "redirect-to-https",
    "AllowedMethods": {
      "Quantity": 2,
      "Items": ["GET", "HEAD"],
      "CachedMethods": { "Quantity": 2, "Items": ["GET", "HEAD"] }
    },
    "CachePolicyId": "658327ea-f89d-4fab-a63d-7e88639e58f6",
    "Compress": true
  },
  "CustomErrorResponses": {
    "Quantity": 2,
    "Items": [
      { "ErrorCode": 404, "ResponsePagePath": "/index.html", "ResponseCode": "200", "ErrorCachingMinTTL": 10 },
      { "ErrorCode": 403, "ResponsePagePath": "/index.html", "ResponseCode": "200", "ErrorCachingMinTTL": 10 }
    ]
  }
}
EOF

echo "Creating CloudFront distribution..."
aws cloudfront create-distribution \
  --distribution-config "file://$WORKDIR/dist-config.json" \
  --output json > "$WORKDIR/result.json"

DIST_ID=$(grep -m1 '"Id"' "$WORKDIR/result.json" | sed -E 's/.*"Id": *"([^"]+)".*/\1/')
DIST_DOMAIN=$(grep -m1 '"DomainName"' "$WORKDIR/result.json" | sed -E 's/.*"DomainName": *"([^"]+)".*/\1/')
DIST_ARN=$(grep -m1 '"ARN"' "$WORKDIR/result.json" | sed -E 's/.*"ARN": *"([^"]+)".*/\1/')

if [ -z "${DIST_ID:-}" ] || [ -z "${DIST_DOMAIN:-}" ]; then
  echo "Could not auto-parse the response. Raw output:"
  cat "$WORKDIR/result.json"
  exit 1
fi

echo ""
echo "=========================================="
echo "CloudFront distribution created"
echo "Distribution ID:     $DIST_ID"
echo "Distribution Domain: $DIST_DOMAIN"
echo "=========================================="
echo ""

if [ "$USE_WEBSITE_ENDPOINT" = "false" ]; then
  echo "Updating S3 bucket policy to allow this distribution to read via OAC..."
  cat > "$WORKDIR/bucket-policy.json" <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowCloudFrontServicePrincipalReadOnly",
      "Effect": "Allow",
      "Principal": { "Service": "cloudfront.amazonaws.com" },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::${BUCKET_NAME}/*",
      "Condition": { "StringEquals": { "AWS:SourceArn": "$DIST_ARN" } }
    }
  ]
}
EOF
  aws s3api put-bucket-policy --bucket "$BUCKET_NAME" --policy "file://$WORKDIR/bucket-policy.json"
  echo "Bucket policy updated."
fi

echo ""
echo "NEXT STEPS:"
echo "1. Add '$DIST_ID' as the GitHub secret CLOUDFRONT_DISTRIBUTION_ID on manoj0456/op_ready_to_eat"
echo "   (Settings -> Secrets and variables -> Actions -> New repository secret)"
echo "2. If oppertunitypool.com is hosted in Route 53, create an A/AAAA alias record:"
echo "     $DOMAIN_NAME -> $DIST_DOMAIN"
echo "   (CloudFront's fixed hosted zone ID for alias records is Z2FDTNDATAQYW2)"
echo "3. The distribution can take 10-20 minutes to fully deploy before the domain resolves."
