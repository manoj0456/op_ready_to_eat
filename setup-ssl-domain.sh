#!/usr/bin/env bash
# One-time setup: requests/validates an ACM certificate covering
# readytoeat.oppertunitypool.com and www.readytoeat.oppertunitypool.com,
# attaches it to the CloudFront distribution as alternate domain names,
# and points Route 53 at the distribution.
#
# Requires: aws cli (configured with your own credentials) and
# python3 (used only to safely edit the CloudFront JSON config in place;
# nothing is sent anywhere except to AWS).
#
# Safe to re-run: it reuses an existing certificate/records instead of
# duplicating them if you run it again (e.g. after a validation timeout).
#
# Usage:
#   ./setup-ssl-domain.sh

set -euo pipefail

BUCKET_NAME="${S3_BUCKET_NAME:-op-readytoeat-frontend}"
BUCKET_REGION="${AWS_REGION:-us-east-1}"
APEX_DOMAIN="oppertunitypool.com"
PRIMARY_DOMAIN="readytoeat.oppertunitypool.com"
WWW_DOMAIN="www.readytoeat.oppertunitypool.com"
CF_HOSTED_ZONE_ID="Z2FDTNDATAQYW2" # fixed AWS constant for aliasing to any CloudFront distribution

command -v aws >/dev/null 2>&1 || { echo "ERROR: aws CLI not found." >&2; exit 1; }
PY=python3
command -v "$PY" >/dev/null 2>&1 || PY=python
command -v "$PY" >/dev/null 2>&1 || { echo "ERROR: python3 (or python) is required to safely edit the CloudFront config." >&2; exit 1; }

echo "Verifying AWS credentials..."
aws sts get-caller-identity >/dev/null || {
  echo "ERROR: no valid AWS credentials found. Run 'aws configure' first." >&2
  exit 1
}

WORKDIR="$(mktemp -d)"
trap 'rm -rf "$WORKDIR"' EXIT

# ---------- 1. Find the CloudFront distribution ----------
DIST_ID="${CLOUDFRONT_DISTRIBUTION_ID:-}"
if [ -z "$DIST_ID" ]; then
  ORIGIN_DOMAIN="${BUCKET_NAME}.s3.${BUCKET_REGION}.amazonaws.com"
  echo "No CLOUDFRONT_DISTRIBUTION_ID set, looking up distribution for origin $ORIGIN_DOMAIN..."
  DIST_ID=$(aws cloudfront list-distributions \
    --query "DistributionList.Items[?Origins.Items[?DomainName=='${ORIGIN_DOMAIN}']].Id | [0]" \
    --output text)
fi
if [ -z "$DIST_ID" ] || [ "$DIST_ID" = "None" ]; then
  echo "ERROR: could not find a CloudFront distribution. Set CLOUDFRONT_DISTRIBUTION_ID env var explicitly." >&2
  exit 1
fi
echo "Using distribution: $DIST_ID"

# ---------- 2. Request (or reuse) the ACM certificate ----------
# ACM certs used by CloudFront must live in us-east-1, regardless of where everything else runs.
echo "Checking for an existing ACM certificate for $PRIMARY_DOMAIN..."
CERT_ARN=$(aws acm list-certificates --region us-east-1 \
  --query "CertificateSummaryList[?DomainName=='${PRIMARY_DOMAIN}'].CertificateArn | [0]" \
  --output text)

if [ -z "$CERT_ARN" ] || [ "$CERT_ARN" = "None" ]; then
  echo "Requesting a new ACM certificate for $PRIMARY_DOMAIN (+ $WWW_DOMAIN)..."
  CERT_ARN=$(aws acm request-certificate \
    --region us-east-1 \
    --domain-name "$PRIMARY_DOMAIN" \
    --subject-alternative-names "$WWW_DOMAIN" \
    --validation-method DNS \
    --query CertificateArn --output text)
  echo "Certificate requested: $CERT_ARN"
  sleep 10
else
  echo "Found existing certificate: $CERT_ARN"
fi

# ---------- 3. Validate the certificate via DNS ----------
STATUS=$(aws acm describe-certificate --region us-east-1 --certificate-arn "$CERT_ARN" \
  --query 'Certificate.Status' --output text)

if [ "$STATUS" != "ISSUED" ]; then
  echo "Certificate status: $STATUS. Fetching DNS validation records..."
  aws acm describe-certificate --region us-east-1 --certificate-arn "$CERT_ARN" \
    --query 'Certificate.DomainValidationOptions' --output json > "$WORKDIR/validation.json"

  echo "Looking up Route 53 hosted zone for $APEX_DOMAIN..."
  ZONE_ID=$(aws route53 list-hosted-zones-by-name --dns-name "$APEX_DOMAIN" \
    --query "HostedZones[?Name=='${APEX_DOMAIN}.'].Id | [0]" --output text | sed 's#/hostedzone/##')

  if [ -z "$ZONE_ID" ] || [ "$ZONE_ID" = "None" ]; then
    echo "No Route 53 hosted zone found for $APEX_DOMAIN. Create these CNAME records manually, then re-run this script:"
    cat "$WORKDIR/validation.json"
    exit 1
  fi

  echo "Found hosted zone $ZONE_ID. Creating validation CNAME record(s)..."
  "$PY" - "$WORKDIR/validation.json" "$WORKDIR/validation-batch.json" <<'PYEOF'
import json, sys
validation_file, out_file = sys.argv[1], sys.argv[2]
with open(validation_file) as f:
    options = json.load(f)
changes = []
seen = set()
for opt in options:
    r = opt.get("ResourceRecord")
    if not r:
        continue
    key = (r["Name"], r["Type"])
    if key in seen:
        continue
    seen.add(key)
    changes.append({
        "Action": "UPSERT",
        "ResourceRecordSet": {
            "Name": r["Name"],
            "Type": r["Type"],
            "TTL": 300,
            "ResourceRecords": [{"Value": r["Value"]}],
        },
    })
with open(out_file, "w") as f:
    json.dump({"Changes": changes}, f)
PYEOF

  aws route53 change-resource-record-sets --hosted-zone-id "$ZONE_ID" \
    --change-batch "file://$WORKDIR/validation-batch.json" >/dev/null

  echo "Validation record(s) created. Waiting for ACM to issue the certificate (can take several minutes)..."
  if ! aws acm wait certificate-validated --region us-east-1 --certificate-arn "$CERT_ARN"; then
    echo "Still waiting on ACM after the default timeout. This is normal for slow DNS propagation." >&2
    echo "Re-run this script in a few minutes to pick up where it left off." >&2
    exit 1
  fi
  echo "Certificate validated and issued."
else
  echo "Certificate already issued."
fi

# ---------- 4. Attach certificate + aliases to the CloudFront distribution ----------
echo "Updating CloudFront distribution $DIST_ID with the domain aliases and certificate..."
aws cloudfront get-distribution-config --id "$DIST_ID" --output json > "$WORKDIR/current.json"

"$PY" - "$WORKDIR/current.json" "$CERT_ARN" "$PRIMARY_DOMAIN" "$WWW_DOMAIN" "$WORKDIR/updated-config.json" "$WORKDIR/etag.txt" <<'PYEOF'
import json, sys
current_file, cert_arn, primary, www, out_config, out_etag = sys.argv[1:7]
with open(current_file) as f:
    data = json.load(f)
etag = data["ETag"]
config = data["DistributionConfig"]
config["Aliases"] = {"Quantity": 2, "Items": [primary, www]}
config["ViewerCertificate"] = {
    "ACMCertificateArn": cert_arn,
    "SSLSupportMethod": "sni-only",
    "MinimumProtocolVersion": "TLSv1.2_2021",
    "Certificate": cert_arn,
    "CertificateSource": "acm",
}
with open(out_config, "w") as f:
    json.dump(config, f)
with open(out_etag, "w") as f:
    f.write(etag)
PYEOF

ETAG=$(cat "$WORKDIR/etag.txt")
aws cloudfront update-distribution --id "$DIST_ID" \
  --distribution-config "file://$WORKDIR/updated-config.json" \
  --if-match "$ETAG" >/dev/null
echo "Distribution updated with aliases and certificate."

# ---------- 5. Point Route 53 at the distribution ----------
DIST_DOMAIN=$(aws cloudfront get-distribution --id "$DIST_ID" --query 'Distribution.DomainName' --output text)

ZONE_ID=$(aws route53 list-hosted-zones-by-name --dns-name "$APEX_DOMAIN" \
  --query "HostedZones[?Name=='${APEX_DOMAIN}.'].Id | [0]" --output text | sed 's#/hostedzone/##')

if [ -n "$ZONE_ID" ] && [ "$ZONE_ID" != "None" ]; then
  echo "Creating/updating Route 53 alias records in zone $ZONE_ID..."
  cat > "$WORKDIR/dns-batch.json" <<EOF
{
  "Changes": [
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "$PRIMARY_DOMAIN",
        "Type": "A",
        "AliasTarget": { "HostedZoneId": "$CF_HOSTED_ZONE_ID", "DNSName": "$DIST_DOMAIN", "EvaluateTargetHealth": false }
      }
    },
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "$WWW_DOMAIN",
        "Type": "A",
        "AliasTarget": { "HostedZoneId": "$CF_HOSTED_ZONE_ID", "DNSName": "$DIST_DOMAIN", "EvaluateTargetHealth": false }
      }
    }
  ]
}
EOF
  aws route53 change-resource-record-sets --hosted-zone-id "$ZONE_ID" \
    --change-batch "file://$WORKDIR/dns-batch.json" >/dev/null
  echo "Route 53 alias records created for $PRIMARY_DOMAIN and $WWW_DOMAIN."
else
  echo "No Route 53 hosted zone found for $APEX_DOMAIN. Point these manually at:"
  echo "  $DIST_DOMAIN (CloudFront hosted zone ID: $CF_HOSTED_ZONE_ID)"
fi

echo ""
echo "=========================================="
echo "Done."
echo "  https://$PRIMARY_DOMAIN"
echo "  https://$WWW_DOMAIN"
echo "The distribution can take 10-20 minutes to fully propagate this change."
echo "=========================================="
