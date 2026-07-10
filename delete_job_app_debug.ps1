$ErrorActionPreference='Stop'
$base='http://localhost:5000/api/v1'

function Login($email,$password){
  $r=Invoke-RestMethod -Uri "$base/auth/login" -Method POST -ContentType 'application/json' -Body (@{email=$email;password=$password}|ConvertTo-Json)
  return $r.data.accessToken
}

$empToken=Login 'jobs@kampalatech.ug' 'Employer@123'
$empHeaders=@{Authorization="Bearer $empToken"}

# Let's delete one of the existing applications from a youth so we can re-apply and get a fresh application created!
# Let's check how applications are structured or get the application list for a youth to find an application ID to delete, or delete via backend direct access.
# Alternatively, since we can access the backend code, let's look at how applications are structured in elevate-backend.
