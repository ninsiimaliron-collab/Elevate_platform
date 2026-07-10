$ErrorActionPreference='Stop'
$base='http://localhost:5000/api/v1'

function Login($email,$password){
  $r=Invoke-RestMethod -Uri "$base/auth/login" -Method POST -ContentType 'application/json' -Body (@{email=$email;password=$password}|ConvertTo-Json)
  return $r.data.accessToken
}

$empToken=Login 'jobs@kampalatech.ug' 'Employer@123'
$empHeaders=@{Authorization="Bearer $empToken"}
$listings=@((Invoke-RestMethod -Uri "$base/jobs/my/listings" -Headers $empHeaders).data)
if($listings.Count -eq 0){ throw 'No employer listings found' }
$job=$listings | Where-Object { $_.status -eq 'active' } | Select-Object -First 1
if(-not $job){ $job=$listings[0] }

$stamp=[DateTime]::UtcNow.ToString('yyyyMMddHHmmss')
$email="fresh.$stamp@elevate.ug"
$phone='+25679'+($stamp.Substring($stamp.Length-7))
$pwd='Test@1234'
$full='Fresh Candidate '+$stamp.Substring($stamp.Length-4)

$regBody=@{ email=$email; phone=$phone; password=$pwd; role='youth'; full_name=$full; date_of_birth='2001-06-15' } | ConvertTo-Json
$reg=Invoke-RestMethod -Uri "$base/auth/register" -Method POST -ContentType 'application/json' -Body $regBody
$yToken=$reg.data.accessToken
if(-not $yToken){ throw 'New youth token missing from register response' }
$yHeaders=@{Authorization="Bearer $yToken"}

$apply=Invoke-RestMethod -Uri "$base/applications/jobs/$($job.id)/apply" -Method POST -Headers $yHeaders -ContentType 'application/json' -Body (@{cover_letter='Fresh automated apply '+$stamp}|ConvertTo-Json)

$applicants=@((Invoke-RestMethod -Uri "$base/applications/jobs/$($job.id)/applicants" -Method GET -Headers $empHeaders).data)
$found=($applicants | Where-Object { $_.full_name -eq $full }).Count -gt 0

Write-Output ("JOB_ID={0}" -f $job.id)
Write-Output ("JOB_TITLE={0}" -f $job.title)
Write-Output ("NEW_YOUTH_EMAIL={0}" -f $email)
Write-Output ("NEW_YOUTH_NAME={0}" -f $full)
Write-Output ("APPLY_STATUS=201")
Write-Output ("APPLY_MESSAGE={0}" -f $apply.message)
Write-Output ("APPLICANTS_COUNT={0}" -f $applicants.Count)
Write-Output ("NEW_APPLICANT_VISIBLE_TO_EMPLOYER={0}" -f $found)
