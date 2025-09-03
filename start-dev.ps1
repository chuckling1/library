$env:ASPNETCORE_ENVIRONMENT = "Development"
Set-Location "backend"
dotnet run --project src/LibraryApi --urls http://localhost:5000