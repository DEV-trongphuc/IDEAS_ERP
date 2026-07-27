# D:\GITHUB_SPACE\IDEAS_ERP\scratch\run_replace_branding.ps1

$paths = @("backend", "src", "markdown")
$files = Get-ChildItem -Path $paths -Recurse -File -Include *.php, *.ts, *.tsx, *.css, *.html, *.json, *.sql, *.md, *.js
$files += Get-ChildItem -Path . -File -Include index.html, vercel.json, deploy-backend.ps1, README.md, workspace_profile.md, generate_presentation.js

foreach ($file in $files) {
    if ($file.FullName -like "*node_modules*" -or $file.FullName -like "*.git*" -or $file.FullName -like "*dist*") {
        continue
    }
    
    $content = Get-Content -Path $file.FullName -Raw -Encoding utf8
    $changed = $false
    
    # Replacement rules
    $replacements = @(
        @("D:\RICH_LAND_DATA_UI", "d:\GITHUB_SPACE\IDEAS_ERP"),
        @("d:/RICH_LAND_DATA_UI", "d:/GITHUB_SPACE/IDEAS_ERP"),
        @("RICH_LAND_DATA_UI", "IDEAS_ERP"),
        @("rich-land.vercel.app", "crm-ideas.vercel.app"),
        @("rich-land.vn", "ideas.edu.vn"),
        @("RICH LAND CRM", "IDEAS ERP"),
        @("RICH LAND", "IDEAS"),
        @("Rich Land", "IDEAS"),
        @("RichLand", "Ideas"),
        @("rich_land_mau_nhap_lieu", "ideas_mau_nhap_lieu"),
        @("cham_cong_rich_land", "cham_cong_ideas")
    )
    
    foreach ($pair in $replacements) {
        $search = $pair[0]
        $replace = $pair[1]
        # Literal case-insensitive search & replace
        if ($content.ToLower().Contains($search.ToLower())) {
            # Use regex replace with case-insensitivity
            $escaped = [regex]::Escape($search)
            $content = $content -replace "(?i)$escaped", $replace
            $changed = $true
        }
    }
    
    if ($changed) {
        [System.IO.File]::WriteAllText($file.FullName, $content, [System.Text.Encoding]::UTF8)
        Write-Host "Updated branding in: $($file.FullName)"
    }
}
Write-Host "All branding replacements finished!"
