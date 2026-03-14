$ErrorActionPreference = "Stop"

$ROOT    = Split-Path $PSScriptRoot -Parent
$SRC     = Join-Path $ROOT "src"
$HELM    = Join-Path $ROOT "helm\todo-chatbot"
$SECRETS = Join-Path $ROOT "values-secrets.yaml"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Phase 5 - Local K8s Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# STEP 0: prerequisites
Write-Host "[0/8] Checking prerequisites..." -ForegroundColor Yellow
foreach ($cmd in @("minikube","docker","helm","kubectl")) {
    if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
        Write-Host "MISSING: $cmd" -ForegroundColor Red
        exit 1
    }
}
if (-not (Get-Command "dapr" -ErrorAction SilentlyContinue)) {
    Write-Host "Dapr CLI not found. Install it:" -ForegroundColor Red
    Write-Host 'powershell -Command "iwr -useb https://raw.githubusercontent.com/dapr/cli/master/install/install.ps1 | iex"' -ForegroundColor White
    Write-Host "Then reopen PowerShell as Administrator and run this script again." -ForegroundColor Red
    exit 1
}
Write-Host "  All prerequisites found." -ForegroundColor Green

# STEP 1: Start Minikube
Write-Host ""
Write-Host "[1/8] Starting Minikube..." -ForegroundColor Yellow
$ErrorActionPreference = "Continue"
$mkStatus = minikube status 2>&1
$ErrorActionPreference = "Stop"
if ($mkStatus -notmatch "Running") {
    minikube start --memory=2500 --cpus=2 --driver=docker
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Minikube failed to start. See error above." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "  Minikube already running." -ForegroundColor Green
}
Write-Host "  Enabling ingress addon..." -ForegroundColor Gray
minikube addons enable ingress | Out-Null
Write-Host "  Minikube IP: $(minikube ip)" -ForegroundColor Green

# STEP 2: Init Dapr
Write-Host ""
Write-Host "[2/8] Initialising Dapr on cluster..." -ForegroundColor Yellow
Write-Host "  Running dapr init -k (safe to re-run)..." -ForegroundColor Gray
dapr init -k
Write-Host "  Waiting for Dapr control plane to be ready (up to 3 min)..." -ForegroundColor Gray
for ($d = 0; $d -lt 18; $d++) {
    Start-Sleep -Seconds 10
    $daprPods = kubectl get pods -n dapr-system --no-headers 2>&1
    $daprRunning = ($daprPods | Where-Object { $_ -match "\s+Running\s+" } | Measure-Object -Line).Lines
    $daprTotal  = ($daprPods | Where-Object { $_ -match "\s+\d+/\d+\s+" } | Measure-Object -Line).Lines
    Write-Host "  Dapr: $daprRunning/$daprTotal running ($($d*10+10)s)..." -ForegroundColor Gray
    if ($daprTotal -gt 0 -and $daprRunning -eq $daprTotal) {
        Write-Host "  Dapr control plane ready!" -ForegroundColor Green
        break
    }
}
Write-Host "  Dapr status:" -ForegroundColor Gray
dapr status -k

# STEP 3: Point Docker to Minikube
Write-Host ""
Write-Host "[3/8] Pointing Docker to Minikube registry..." -ForegroundColor Yellow
& minikube -p minikube docker-env --shell powershell | Invoke-Expression
Write-Host "  Done." -ForegroundColor Green

# STEP 4: Build images
Write-Host ""
Write-Host "[4/8] Building Docker images..." -ForegroundColor Yellow

Write-Host "  Building todo-backend (context=src/ for mcp access)..." -ForegroundColor Gray
docker build -f "$SRC\backend\Dockerfile" -t todo-backend:latest "$SRC"

Write-Host "  Building todo-frontend..." -ForegroundColor Gray
docker build --build-arg NEXT_PUBLIC_API_URL=http://todo.local/api -t todo-frontend:latest "$SRC\frontend"

Write-Host "  Building todo-notification..." -ForegroundColor Gray
docker build -t todo-notification:latest "$SRC\notification_service"

Write-Host "  Building todo-recurring..." -ForegroundColor Gray
docker build -t todo-recurring:latest "$SRC\recurring_task_service"

Write-Host "  Images built:" -ForegroundColor Green
docker images | Select-String "todo-"

# STEP 5: Create values-secrets.yaml
Write-Host ""
Write-Host "[5/8] Creating values-secrets.yaml..." -ForegroundColor Yellow
if (Test-Path $SECRETS) {
    Write-Host "  Already exists - skipping." -ForegroundColor Green
} else {
    $envFile = Join-Path $ROOT ".env"
    $dbUrl = ""; $authSec = ""; $geminiKey = ""
    foreach ($line in (Get-Content $envFile)) {
        if ($line -match "^DATABASE_URL=(.+)$")        { $dbUrl     = $Matches[1].Trim() }
        if ($line -match "^BETTER_AUTH_SECRET=(.+)$")  { $authSec   = $Matches[1].Trim() }
        if ($line -match "^GEMINI_API_KEY=(.+)$")      { $geminiKey = $Matches[1].Trim() }
    }
    $yaml = "secrets:`n  databaseUrl: `"$dbUrl`"`n  betterAuthSecret: `"$authSec`"`n  geminiApiKey: `"$geminiKey`""
    $yaml | Out-File -Encoding utf8 $SECRETS
    Write-Host "  Created from .env" -ForegroundColor Green
}

# STEP 6: Helm deploy
Write-Host ""
Write-Host "[6/8] Deploying with Helm..." -ForegroundColor Yellow
helm upgrade todo-chatbot "$HELM" `
    --install `
    --values "$SECRETS" `
    --set "config.betterAuthUrl=http://todo.local" `
    --set "ingress.host=todo.local"
Write-Host "  Helm deploy complete." -ForegroundColor Green

# STEP 7: Wait for pods
Write-Host ""
Write-Host "[7/8] Waiting for pods (up to 3 minutes)..." -ForegroundColor Yellow
Write-Host "  Dapr sidecars add ~60s to startup time." -ForegroundColor Gray
Start-Sleep -Seconds 15
for ($i = 0; $i -lt 30; $i++) {
    Start-Sleep -Seconds 10
    $elapsed = 15 + ($i + 1) * 10
    try {
        $podLines   = kubectl get pods --no-headers 2>&1
        $running    = $podLines | Where-Object { $_ -match "\s+Running\s+" }
        $notReady   = $podLines | Where-Object { $_ -notmatch "\s+Running\s+" -and $_ -match "\s+\d+/\d+\s+" }
        $total      = ($podLines | Where-Object { $_ -match "\s+\d+/\d+\s+" } | Measure-Object -Line).Lines
        $readyCount = ($running | Measure-Object -Line).Lines
        Write-Host "  $readyCount/$total pods ready (${elapsed}s)..." -ForegroundColor Gray
        if ($total -gt 0 -and $readyCount -eq $total) {
            Write-Host "  All pods Running!" -ForegroundColor Green
            break
        }
    } catch {
        Write-Host "  API server busy, retrying (${elapsed}s)..." -ForegroundColor Gray
    }
}
Write-Host ""
kubectl get pods

# STEP 8: Hosts file
Write-Host ""
Write-Host "[8/8] Updating hosts file..." -ForegroundColor Yellow
$ip = minikube ip
$hostsPath = "C:\Windows\System32\drivers\etc\hosts"
$entry = "$ip todo.local"
$content = Get-Content $hostsPath -Raw
if ($content -match "todo\.local") {
    $updated = [System.Text.RegularExpressions.Regex]::Replace($content, "\d+\.\d+\.\d+\.\d+\s+todo\.local", $entry)
    [System.IO.File]::WriteAllText($hostsPath, $updated)
    Write-Host "  Updated: $entry" -ForegroundColor Green
} else {
    Add-Content $hostsPath "`n$entry"
    Write-Host "  Added: $entry" -ForegroundColor Green
}

# Done
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "  App:  http://todo.local" -ForegroundColor White
Write-Host "  API:  http://todo.local/api/health" -ForegroundColor White
Write-Host ""
Write-Host "Useful commands:" -ForegroundColor Cyan
Write-Host "  kubectl get pods"
Write-Host "  kubectl get components.dapr.io"
Write-Host "  kubectl logs -l app.kubernetes.io/component=backend --tail=40"
Write-Host "  kubectl logs -l app=notification-service --tail=20"
Write-Host "  minikube dashboard"
