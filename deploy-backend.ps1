# deploy-backend.ps1
# Deploy ONLY backend files and run database migrations (No Frontend build, No Git Push)

Write-Host "=== STARTING BACKEND-ONLY DEPLOYMENT & MIGRATION ===" -ForegroundColor Cyan

$tempBackend = "richland_backend.tar.gz"

Write-Host "1. Compressing backend files to system temp directory..." -ForegroundColor Yellow
tar -czf "$tempBackend" -C backend .

Write-Host "2. Uploading backend archive using scp..." -ForegroundColor Yellow
scp -P 2210 -o StrictHostKeyChecking=no "$tempBackend" vhvxoigh@chiefaiofficer.vn:open.domation.net/ideas/

Write-Host "3. Extracting archive and applying migrations on remote server..." -ForegroundColor Yellow
ssh -4 -p 2210 -o StrictHostKeyChecking=no vhvxoigh@chiefaiofficer.vn "tar -xzf open.domation.net/ideas/$tempBackend -C open.domation.net/ideas/ && rm open.domation.net/ideas/$tempBackend && php open.domation.net/ideas/run_migrations.php --apply"

$sshExit = $LASTEXITCODE

# Clean up local temp package
Remove-Item "$tempBackend" -ErrorAction SilentlyContinue

if ($sshExit -ne 0) {
    Write-Host "ERROR: Backend deployment failed." -ForegroundColor Red
    exit $sshExit
}

Write-Host "=== BACKEND DEPLOYMENT & MIGRATIONS COMPLETED SUCCESSFULLY ===" -ForegroundColor Green
