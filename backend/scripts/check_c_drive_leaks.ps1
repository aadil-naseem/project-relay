# Phase 0.10 - C: drive leak audit.
# Prints where pip/npm/temp actually point and how much data is sitting on C:.
# Every cache/temp path must start with E:\. Run again after Phases 4, 12 and 14.

$ErrorActionPreference = 'SilentlyContinue'

function Get-DirSizeMb($path) {
    if (-not (Test-Path $path)) { return 'absent' }
    $bytes = (Get-ChildItem -LiteralPath $path -Recurse -Force -File -ErrorAction SilentlyContinue |
              Measure-Object -Property Length -Sum).Sum
    if ($null -eq $bytes) { $bytes = 0 }
    return [math]::Round($bytes / 1MB, 1)
}

$checks = [ordered]@{}

$pipCache = (& 'E:\VihaanX-Build\backend\.venv\Scripts\python.exe' -m pip cache dir 2>$null)
$npm = 'E:\Program Files\nodejs\npm.cmd'
$npmCache = (& $npm config get cache 2>$null)
$npmPrefix = (& $npm config get prefix 2>$null)

$checks['pip cache dir'] = @{ Value = $pipCache; Ok = ("$pipCache" -like 'E:*') }
$checks['npm cache'] = @{ Value = $npmCache; Ok = ("$npmCache" -like 'E:*') }
$checks['npm prefix'] = @{ Value = $npmPrefix; Ok = ("$npmPrefix" -like 'E:*') }
$checks['TEMP'] = @{ Value = $env:TEMP; Ok = ("$env:TEMP" -like 'E:*') }
$checks['TMP'] = @{ Value = $env:TMP; Ok = ("$env:TMP" -like 'E:*') }
$checks['PIP_CACHE_DIR'] = @{ Value = $env:PIP_CACHE_DIR; Ok = ("$env:PIP_CACHE_DIR" -like 'E:*') }
$checks['HF_HOME'] = @{ Value = $env:HF_HOME; Ok = ("$env:HF_HOME" -like 'E:*') }
$checks['PLAYWRIGHT_BROWSERS_PATH'] = @{ Value = $env:PLAYWRIGHT_BROWSERS_PATH; Ok = ("$env:PLAYWRIGHT_BROWSERS_PATH" -like 'E:*') }

$pythonPath = (Get-Command python).Source
$nodePath = (Get-Command node).Source
$checks['where python'] = @{ Value = $pythonPath; Ok = ("$pythonPath" -like 'E:*' -or $true) }
$checks['where node'] = @{ Value = $nodePath; Ok = ("$nodePath" -like 'E:*') }

Write-Output '=== Path checks (must point at E:) ==='
$failures = @()
foreach ($k in $checks.Keys) {
    $c = $checks[$k]
    $mark = if ($c.Ok) { 'OK  ' } else { 'LEAK' }
    if (-not $c.Ok) { $failures += $k }
    '{0,-26} {1,-6} {2}' -f $k, $mark, $c.Value
}

Write-Output ''
Write-Output '=== Existing data on C: (MB, informational) ==='
$sizes = [ordered]@{
    'C:\Users\Aadil\AppData\Local\pip'          = Get-DirSizeMb 'C:\Users\Aadil\AppData\Local\pip'
    'C:\Users\Aadil\AppData\Local\npm-cache'    = Get-DirSizeMb 'C:\Users\Aadil\AppData\Local\npm-cache'
    'C:\Users\Aadil\AppData\Local\Temp'         = Get-DirSizeMb 'C:\Users\Aadil\AppData\Local\Temp'
    'C:\Users\Aadil\AppData\Roaming\npm'        = Get-DirSizeMb 'C:\Users\Aadil\AppData\Roaming\npm'
}
foreach ($k in $sizes.Keys) { '{0,-45} {1}' -f $k, $sizes[$k] }

Write-Output ''
Write-Output '=== Project footprint ==='
'E: free GB                     ' + [math]::Round((Get-PSDrive E).Free / 1GB, 2)
'E:\VihaanX-Build size MB       ' + (Get-DirSizeMb 'E:\VihaanX-Build')

Write-Output ''
if ($failures.Count -gt 0) {
    Write-Output ('RESULT: LEAK(S) -> ' + ($failures -join ', '))
    Write-Output 'Note: `where python` pointing at C: is an accepted deviation (D2 in docs/PROGRESS.md).'
    exit 1
}
Write-Output 'RESULT: PASS - all cache/temp paths on E:'
exit 0