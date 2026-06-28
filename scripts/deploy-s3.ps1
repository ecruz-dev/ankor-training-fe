param(
  [Parameter(Mandatory = $true)]
  [string]$Bucket,

  [string]$Region = "us-east-1",

  [string]$Profile = "",

  [string]$BuildDir = "dist"
)

$ErrorActionPreference = "Stop"

if (-not (Get-Command aws -ErrorAction SilentlyContinue)) {
  throw "AWS CLI is not installed or is not on PATH."
}

$profileArgs = @()
if ($Profile -ne "") {
  $profileArgs = @("--profile", $Profile)
}

npm run build

aws s3 sync "$BuildDir/assets" "s3://$Bucket/assets" `
  --delete `
  --region $Region `
  --cache-control "public,max-age=31536000,immutable" `
  @profileArgs

aws s3 sync $BuildDir "s3://$Bucket" `
  --delete `
  --exclude "assets/*" `
  --region $Region `
  --cache-control "no-cache,no-store,must-revalidate" `
  @profileArgs

aws s3 website "s3://$Bucket" `
  --index-document index.html `
  --error-document index.html `
  --region $Region `
  @profileArgs

Write-Host "Deployed $BuildDir to s3://$Bucket"
Write-Host "S3 website endpoint: http://$Bucket.s3-website-$Region.amazonaws.com"
