# Add CNAME records so pellicura.com points to Railway.
# Run: $env:CLOUDFLARE_API_TOKEN = "your-token"; $env:CLOUDFLARE_ZONE_ID = "your-zone-id"; .\scripts\set-cloudflare-dns.ps1
# Zone ID: Cloudflare Dashboard > pellicura.com > Overview (right sidebar)

$token = $env:CLOUDFLARE_API_TOKEN
$zoneId = $env:CLOUDFLARE_ZONE_ID

if (-not $token -or -not $zoneId) {
  Write-Host "Set CLOUDFLARE_API_TOKEN and CLOUDFLARE_ZONE_ID"
  Write-Host "Zone ID: Dashboard > pellicura.com > Overview > API (right)"
  exit 1
}

$headers = @{
  "Authorization" = "Bearer $token"
  "Content-Type"  = "application/json"
}

# Delete existing @ and www
foreach ($name in @("pellicura.com", "www.pellicura.com")) {
  $r = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones/$zoneId/dns_records?name=$name" -Headers $headers -Method Get
  foreach ($rec in $r.result) {
    Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones/$zoneId/dns_records/$($rec.id)" -Headers $headers -Method Delete | Out-Null
    Write-Host "Deleted $($rec.type) $name"
  }
}

# Add CNAME @
$body = @{ type = "CNAME"; name = "@"; content = "j62m06la.up.railway.app"; ttl = 1; proxied = $true } | ConvertTo-Json
$r = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones/$zoneId/dns_records" -Headers $headers -Method Post -Body $body
Write-Host "Added CNAME @ -> j62m06la.up.railway.app: $($r.success)"

# Add CNAME www
$body = @{ type = "CNAME"; name = "www"; content = "fcqgs166.up.railway.app"; ttl = 1; proxied = $true } | ConvertTo-Json
$r = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones/$zoneId/dns_records" -Headers $headers -Method Post -Body $body
Write-Host "Added CNAME www -> fcqgs166.up.railway.app: $($r.success)"

Write-Host "Done. pellicura.com and www.pellicura.com now point to Railway."
