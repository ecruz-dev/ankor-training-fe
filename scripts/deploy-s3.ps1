param(
  [Parameter(Mandatory = $true)]
  [string]$Bucket,

  [string]$Region = "us-east-1",

  [string]$Profile = "",

  [string]$BuildDir = "dist",

  [string]$CloudFrontDistributionId = "",

  [string]$CloudFrontDomain = ""
)

$ErrorActionPreference = "Stop"

if (-not (Get-Command aws -ErrorAction SilentlyContinue)) {
  throw "AWS CLI is not installed or is not on PATH."
}

$profileArgs = @()
if ($Profile -ne "") {
  $profileArgs = @("--profile", $Profile)
}

if ($CloudFrontDistributionId -eq "" -and $CloudFrontDomain -ne "") {
  $CloudFrontDistributionId = aws cloudfront list-distributions `
    --query "DistributionList.Items[?DomainName=='$CloudFrontDomain'].Id | [0]" `
    --output text `
    @profileArgs

  if ($LASTEXITCODE -ne 0) {
    throw "CloudFront distribution lookup failed with exit code $LASTEXITCODE."
  }

  if ($CloudFrontDistributionId -eq "" -or $CloudFrontDistributionId -eq "None") {
    throw "No CloudFront distribution found for domain $CloudFrontDomain."
  }
}

function Invoke-CheckedCommand {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Name,

    [Parameter(Mandatory = $true)]
    [scriptblock]$Command
  )

  & $Command
  if ($LASTEXITCODE -ne 0) {
    throw "$Name failed with exit code $LASTEXITCODE."
  }
}

Invoke-CheckedCommand "Build" { npm run build }

Invoke-CheckedCommand "Asset upload" {
  aws s3 sync "$BuildDir/assets" "s3://$Bucket/assets" `
    --delete `
    --region $Region `
    --cache-control "public,max-age=31536000,immutable" `
    @profileArgs
}

Invoke-CheckedCommand "Static file upload" {
  aws s3 sync $BuildDir "s3://$Bucket" `
    --delete `
    --exclude "assets/*" `
    --region $Region `
    --cache-control "no-cache,no-store,must-revalidate" `
    @profileArgs
}

Invoke-CheckedCommand "Website configuration" {
  aws s3 website "s3://$Bucket" `
    --index-document index.html `
    --error-document index.html `
    --region $Region `
    @profileArgs
}

if ($CloudFrontDistributionId -ne "") {
  Invoke-CheckedCommand "CloudFront invalidation" {
    aws cloudfront create-invalidation `
      --distribution-id $CloudFrontDistributionId `
      --paths "/*" `
      @profileArgs
  }
}

Write-Host "Deployed $BuildDir to s3://$Bucket"
Write-Host "S3 website endpoint: http://$Bucket.s3-website-$Region.amazonaws.com"
if ($CloudFrontDistributionId -ne "") {
  Write-Host "Invalidated CloudFront distribution: $CloudFrontDistributionId"
}
