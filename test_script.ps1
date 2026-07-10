$ErrorActionPreference = 'Stop'
$startedProc = $null
$port = $null

function Test-Health([int]$p){
  try {
    $r = Invoke-RestMethod -Uri ("http://localhost:{0}/health" -f $p) -Method GET -TimeoutSec 2
    return $true
  } catch { return $false }
}

foreach($p in 5000..5003){ if(Test-Health $p){ $port=$p; break } }

if(-not $port){
  $startedProc = Start-Process -FilePath npm -ArgumentList '--prefix','elevate-backend','run','start' -PassThru -WindowStyle Hidden
  for($i=0;$i -lt 30;$i++){
    foreach($p in 5000..5003){ if(Test-Health $p){ $port=$p; break } }
    if($port){ break }
    Start-Sleep -Milliseconds 700
  }
}

if(-not $port){ throw 'Backend did not become healthy on ports 5000-5003.' }

$base = "http://localhost:$port/api/v1"
Write-Output ("PORT={0}" -f $port)

$empLogin = Invoke-RestMethod -Uri "$base/auth/login" -Method POST -ContentType 'application/json' -Body (@{email='jobs@kampalatech.ug';password='Employer@123'} | ConvertTo-Json)
$empToken = $empLogin.data.accessToken
if(-not $empToken){ throw 'Employer token missing' }
$empHeaders = @{ Authorization = "Bearer $empToken" }

$listingsRes = Invoke-RestMethod -Uri "$base/jobs/my/listings" -Method GET -Headers $empHeaders
$listings = @($listingsRes.data)
if($listings.Count -eq 0){ throw 'No employer listings found' }
$job = $listings | Where-Object { $_.status -eq 'active' } | Select-Object -First 1
if(-not $job){ $job = $listings[0] }
$jobId = $job.id
$jobTitle = $job.title
Write-Output ("JOB_ID={0}" -f $jobId)
Write-Output ("JOB_TITLE={0}" -f $jobTitle)

$yLogin = Invoke-RestMethod -Uri "$base/auth/login" -Method POST -ContentType 'application/json' -Body (@{email='grace.youth@elevate.ug';password='Youth@1234'} | ConvertTo-Json)
$yToken = $yLogin.data.accessToken
if(-not $yToken){ throw 'Youth token missing' }
$yHeaders = @{ Authorization = "Bearer $yToken" }

$applyStatus = 'unknown'
$applyMessage = ''
try {
  $cover = "E2E apply test " + [DateTime]::UtcNow.ToString('yyyyMMddHHmmss')
  $a = Invoke-RestMethod -Uri "$base/applications/jobs/$jobId/apply" -Method POST -Headers $yHeaders -ContentType 'application/json' -Body (@{cover_letter=$cover} | ConvertTo-Json)
  $applyStatus = '201'
  $applyMessage = $a.message
} catch {
  try {
    $statusCode = [int]$_.Exception.Response.StatusCode
    $applyStatus = "$statusCode"
  } catch {
    $applyStatus = "error"
  }
  if ($_.ErrorDetails -and $_.ErrorDetails.Message) {
    $applyMessage = $_.ErrorDetails.Message
  } else {
    $applyMessage = $_.Exception.Message
  }
}
Write-Output ("APPLY_STATUS={0}" -f $applyStatus)
Write-Output ("APPLY_MESSAGE={0}" -f $applyMessage)

$applicantsRes = Invoke-RestMethod -Uri "$base/applications/jobs/$jobId/applicants" -Method GET -Headers $empHeaders
$applicants = @($applicantsRes.data)
$graceFound = ($applicants | Where-Object { $_.full_name -like 'Grace*' }).Count -gt 0
Write-Output ("APPLICANTS_COUNT={0}" -f $applicants.Count)
Write-Output ("GRACE_FOUND={0}" -f $graceFound)

if($startedProc){
  try { Stop-Process -Id $startedProc.Id -Force -ErrorAction SilentlyContinue } catch {}
}
