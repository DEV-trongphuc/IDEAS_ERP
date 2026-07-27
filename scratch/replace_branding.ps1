# D:\GITHUB_SPACE\IDEAS_ERP\scratch\replace_branding.ps1

$paths = @("backend", "src")
$files = Get-ChildItem -Path $paths -Recurse -File -Include *.php, *.ts, *.tsx, *.css, *.html, *.json, *.sql, *.md
$files += Get-ChildItem -Path . -File -Include index.html, vercel.json, deploy-backend.ps1

foreach ($file in $files) {
    if ($file.FullName -like "*node_modules*" -or $file.FullName -like "*.git*") {
        continue
    }
    
    $content = Get-Content -Path $file.FullName -Raw -Encoding utf8
    $changed = $false
    
    if ($content -match 'RICH LAND') {
        $content = $content -replace 'RICH LAND', 'IDEAS'
        $changed = $true
    }
    if ($content -match 'Rich Land') {
        $content = $content -replace 'Rich Land', 'IDEAS'
        $changed = $true
    }
    if ($content -match 'RichLand') {
        $content = $content -replace 'RichLand', 'Ideas'
        $changed = $true
    }
    if ($content -match 'richland_') {
        $content = $content -replace 'richland_', 'ideas_'
        $changed = $true
    }
    
    if ($changed) {
        # Force UTF-8 encoding
        [System.IO.File]::WriteAllText($file.FullName, $content, [System.Text.Encoding]::UTF8)
        Write-Host "Updated branding in: $($file.FullName)"
    }
}
