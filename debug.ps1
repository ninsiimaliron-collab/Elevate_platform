$ErrorActionPreference='Stop'
$base='http://localhost:5000/api/v1'

function Login($email,$password){
  $r=Invoke-RestMethod -Uri "$base/auth/login" -Method POST -ContentType 'application/json' -Body (@{email=$email;password=$password}|ConvertTo-Json)
  return $r.data.accessToken
}

$empToken=Login 'jobs@kampalatech.ug' 'Employer@123'
$empHeaders=@{Authorization="Bearer $empToken"}
$listings=@((Invoke-RestMethod -Uri "$base/jobs/my/listings" -Headers $empHeaders).data)
Write-Output "Listings count: $($listings.Count)"
foreach($job in $listings){
  Write-Output "Job ID: $($job.id) - Title: $($job.title)"
  $apps=@((Invoke-RestMethod -Uri "$base/applications/jobs/$($job.id)/applicants" -Headers $empHeaders).data)
  Write-Output "  Applicants count: $($apps.Count)"
  foreach($app in $apps) {
    Write-Output "    Applicant: $($app.full_name)"
  }
}
