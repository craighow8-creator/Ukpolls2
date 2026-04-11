$files = Get-ChildItem -Path .\src -Recurse -Include *.jsx
Write-Host "Found $($files.Count) jsx files"

foreach ($file in $files) {
  $content = Get-Content $file.FullName -Raw

  $hooks = New-Object System.Collections.Generic.List[string]
  if ($content -match '\buseState\s*\(') { $hooks.Add('useState') }
  if ($content -match '\buseEffect\s*\(') { $hooks.Add('useEffect') }
  if ($content -match '\buseMemo\s*\(') { $hooks.Add('useMemo') }
  if ($content -match '\buseRef\s*\(') { $hooks.Add('useRef') }
  if ($content -match '\buseCallback\s*\(') { $hooks.Add('useCallback') }

  if ($content -match "from 'react'" -or $content -match 'from "react"') {
    $hookText = ''
    if ($hooks.Count -gt 0) {
      $hookText = ', { ' + ($hooks -join ', ') + ' }'
    }

    $replacement = "import React$hookText from 'react'"
    $pattern = 'import\s+.*?\s+from\s+[''"]react[''"]'
    $newContent = [System.Text.RegularExpressions.Regex]::Replace($content, $pattern, $replacement, 1)

    if ($newContent -ne $content) {
      Set-Content -Path $file.FullName -Value $newContent
      Write-Host "Updated: $($file.FullName)"
    }
  }
}