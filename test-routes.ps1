# Test All Routes
$routes = @(
  "/",
  "/auth",
  "/dashboard",
  "/scan",
  "/digital-twin",
  "/me",
  "/myshelf",
  "/favorites",
  "/routine-builder",
  "/history",
  "/recommendations",
  "/progress",
  "/profile",
  "/about",
  "/contact",
  "/privacy",
  "/terms",
  "/blog",
  "/ingredients",
  "/tutorials",
  "/onboarding"
)

Write-Host "Testing Routes on http://localhost:3000" -ForegroundColor Cyan
Write-Host "=" * 60
Write-Host ""

$passed = 0
$failed = 0

foreach ($route in $routes) {
  try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000$route" -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
    Write-Host "[OK] $route - $($response.StatusCode)" -ForegroundColor Green
    $passed++
  } catch {
    Write-Host "[FAIL] $route - Error" -ForegroundColor Red
    $failed++
  }
  Start-Sleep -Milliseconds 200
}

Write-Host ""
Write-Host "=" * 60
Write-Host "Results: $passed passed, $failed failed" -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Yellow" })
