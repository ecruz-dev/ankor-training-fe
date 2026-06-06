# Deploying to S3

This is a Vite React app. AWS S3 should serve the generated `dist/` directory, not the source files.

## Prerequisites

- AWS CLI v2 installed and authenticated.
- An S3 bucket for the site, for example `ankor-training-frontend-prod`.
- Production Vite environment variables available before building. Copy `.env.example` to `.env.production` and fill in the real values:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_BACKEND_URL=
VITE_ORG_SIGNUP_URL=
ANKOR_VOICE_AGENT_URL=
```

Only variables prefixed with `VITE_` or `ANKOR_` are available to the browser build.

## First-time bucket setup

Replace the bucket name, region, and profile values with your AWS account details.

```bash
aws s3api create-bucket \
  --bucket ankor-training-frontend-prod \
  --region us-east-1

aws s3 website s3://ankor-training-frontend-prod \
  --index-document index.html \
  --error-document index.html
```

For public S3 website hosting, disable Block Public Access for this bucket and attach this bucket policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::ankor-training-frontend-prod/*"
    }
  ]
}
```

The `error-document index.html` setting is required because the app uses React Router with browser history. It lets direct URL refreshes resolve through the React app instead of returning an S3 404 page.

For production with HTTPS and a custom domain, put CloudFront in front of the bucket. Configure the CloudFront distribution to return `/index.html` for 403 and 404 errors.

## Deploy

From the repo root:

```powershell
.\scripts\deploy-s3.ps1 -Bucket ankor-training-frontend-prod -Region us-east-1
```

With a named AWS profile:

```powershell
.\scripts\deploy-s3.ps1 -Bucket ankor-training-frontend-prod -Region us-east-1 -Profile my-profile
```

Manual equivalent:

```bash
npm run build
aws s3 sync dist/ s3://ankor-training-frontend-prod --delete --region us-east-1
aws s3 website s3://ankor-training-frontend-prod --index-document index.html --error-document index.html
```
