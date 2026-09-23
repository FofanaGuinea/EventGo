param([string]$Jobs = 'jobs-test.json', [string]$Out = 'out-test', [int]$Port = 8970, [int]$TimeoutSec = 600)
$tool = $PSScriptRoot
$repo = 'C:\Users\Mamoudou Fofana\Desktop\EventGo-site'
$outDir = Join-Path $tool $Out
New-Item -ItemType Directory -Force -Path $outDir | Out-Null
Copy-Item (Join-Path $tool $Jobs) (Join-Path $tool 'jobs.json') -Force
$log = Join-Path $tool 'server.log'
Set-Content $log ''
$node = (Get-Command node).Source
Start-Process $node -ArgumentList ('"' + (Join-Path $tool 'server.js') + '" "' + $repo + '" "' + $outDir + '" ' + $Port) -RedirectStandardOutput $log -WindowStyle Hidden
Start-Sleep -Seconds 2
$edge = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
$prof = Join-Path $tool ('prof_' + [guid]::NewGuid().ToString('N').Substring(0, 8))
Start-Process $edge -ArgumentList ('--headless=new --disable-gpu --window-size=1600,1000 "--user-data-dir=' + $prof + '" http://localhost:' + $Port + '/__tool/driver.html')
$t0 = Get-Date; $state = 'timeout'
while (((Get-Date) - $t0).TotalSeconds -lt $TimeoutSec) {
  Start-Sleep -Seconds 3
  $txt = Get-Content $log -Raw -ErrorAction SilentlyContinue
  if ($txt -match 'LOG ALLDONE') { $state = 'alldone'; break }
  if ($txt -match 'LOG FATAL') { $state = 'fatal'; break }
}
Get-CimInstance Win32_Process -Filter "Name='msedge.exe'" | Where-Object { $_.CommandLine -like ('*' + (Split-Path $prof -Leaf) + '*') } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
"state: $state"
Get-Content $log | Where-Object { $_ -match 'LOG (done|ERROR|FATAL|ALLDONE)' } | Select-Object -Last 80
