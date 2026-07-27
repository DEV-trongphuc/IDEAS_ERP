# D:\GITHUB_SPACE\IDEAS_ERP\scratch\strip_bom.ps1

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$files = Get-ChildItem -Path backend -Recurse -Filter *.php

foreach ($file in $files) {
    $bytes = [System.IO.File]::ReadAllBytes($file.FullName)
    if ($bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF) {
        # File has BOM, read text and write without BOM
        $content = [System.IO.File]::ReadAllText($file.FullName)
        [System.IO.File]::WriteAllText($file.FullName, $content, $utf8NoBom)
        Write-Host "Removed BOM from: $($file.FullName)"
    }
}
Write-Host "BOM scan completed!"
