# Store the current location
$projectRoot = $PWD

# Commands to run
$commands = @(
    @{
        Name = "Node Backend"
        Dir = "NodeBackend"
        Cmd = "npx nodemon server.js"
    },
    @{
        Name = "Flask Backend"
        Dir = "FlaskBackend/FlaskBackend"
        Cmd = ".\\venv\\Scripts\\Activate; python run.py"
    },
    @{
        Name = "Admin Panel"
        Dir = "AdminPanel/adminpanel"
        Cmd = "npm run dev"
    },
    @{
        Name = "Frontend"
        Dir = "Frontend/frontedn"
        Cmd = "npx expo start"
    },
    @{
        Name = "Node Tunnel"
        Dir = "."
        Cmd = "lt --port 5500 --subdomain nodeapp"
        
    },
    @{
        Name = "Flask Tunnel"
        Dir = "."
        Cmd = "lt --port 8082 --subdomain flaskapp"
    }
) 

Write-Host "Starting all services..."

# Start each service in a new terminal
foreach ($service in $commands) {
    $startCommand = "cd '$projectRoot\$($service.Dir)'; Write-Host 'Starting $($service.Name)...'; $($service.Cmd)"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", $startCommand
    Start-Sleep -Seconds 2  # Give each process time to start
}

Write-Host "All services have been started!" 
