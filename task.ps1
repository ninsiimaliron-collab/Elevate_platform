$ErrorActionPreference='Stop'
$base='http://localhost:5000/api/v1'

function Login($email,$password){
  $r=Invoke-RestMethod -Uri "$base/auth/login" -Method POST -ContentType 'application/json' -Body (@{email=$email;password=$password}|ConvertTo-Json)
  return $r.data.accessToken
}

$empToken=Login 'jobs@kampalatech.ug' 'Employer@123'
$empHeaders=@{Authorization="Bearer $empToken"}
$listings=@((Invoke-RestMethod -Uri "$base/jobs/my/listings" -Headers $empHeaders).data)
if($listings.Count -eq 0){ throw 'No listings' }

$youths=@(
  @{email='sam.youth@elevate.ug';name='Sam K.'},
  @{email='rita.youth@elevate.ug';name='Rita A.'},
  @{email='grace.youth@elevate.ug';name='Grace N.'}
)

$done=$false
foreach($job in $listings){
  $apps=@((Invoke-RestMethod -Uri "$base/applications/jobs/$($job.id)/applicants" -Headers $empHeaders).data)
  foreach($y in $youths){
    if(($apps | Where-Object { $_.full_name -eq $y.name }).Count -gt 0){ continue }
    $yt=Login $y.email 'Youth@1234'
    $yh=@{Authorization="Bearer $yt"}
    try {
      $cover='Fresh apply '+[DateTime]::UtcNow.ToString('yyyyMMddHHmmss')
      $resp=Invoke-RestMethod -Uri "$base/applications/jobs/$($job.id)/apply" -Method POST -Headers $yh -ContentType 'application/json' -Body (@{cover_letter=$cover}|ConvertTo-Json)
      $apps2=@((Invoke-RestMethod -Uri "$base/applications/jobs/$($job.id)/applicants" -Headers $empHeaders).data)
      $found=(($apps2 | Where-Object { $_.full_name -eq $y.name }).Count -gt 0)
      Write-Output ("JOB_ID={0}" -f $job.id)
      Write-Output ("JOB_TITLE={0}" -f $job.title)
      Write-Output ("YOUTH={0}" -f $y.email)
      Write-Output ("APPLY_STATUS=201")
      Write-Output ("APPLY_MESSAGE={0}" -f $resp.message)
      Write-Output ("APPLICANTS_COUNT_AFTER={0}" -f $apps2.Count)
      Write-Output ("YOUTH_FOUND={0}" -f $found)
      $done=$true
      break
    } catch {
      continue
    }
  }
  if($done){ break }
}

if(-not $done){ Write-Output 'NO_FRESH_APPLICATION_CREATED' }
