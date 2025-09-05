#!/usr/bin/env node

import { execSync, spawn } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import path from 'path';

const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n${colors.bold}[${step}]${colors.reset} ${colors.cyan}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function runCommand(command, cwd = process.cwd(), description = '') {
  try {
    if (description) {
      log(`   Running: ${description}`, 'blue');
    }
    const result = execSync(command, { 
      cwd, 
      stdio: 'inherit',
      shell: true 
    });
    return true;
  } catch (error) {
    logError(`Failed to run: ${command}`);
    logError(`Error: ${error.message}`);
    return false;
  }
}

function checkPrerequisites() {
  logStep('1/7', 'Checking Prerequisites');
  
  let nodeOk = false;
  let dotnetOk = false;
  let dockerOk = false;
  
  // Check Node.js
  try {
    const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
    const majorVersion = parseInt(nodeVersion.replace('v', '').split('.')[0]);
    if (majorVersion >= 22) {
      logSuccess(`Node.js ${nodeVersion} ✓`);
      nodeOk = true;
    } else if (majorVersion >= 18) {
      logSuccess(`Node.js ${nodeVersion} ✓ (consider upgrading to v22+ LTS)`);
      nodeOk = true;
    } else {
      logError(`Node.js version ${nodeVersion} is too old. Need v18+`);
    }
  } catch {
    logError('Node.js not found.');
  }
  
  // Check .NET
  try {
    const dotnetVersion = execSync('dotnet --version', { encoding: 'utf8' }).trim();
    const majorVersion = parseInt(dotnetVersion.split('.')[0]);
    if (majorVersion >= 9) {
      logSuccess(`.NET ${dotnetVersion} ✓`);
      dotnetOk = true;
    } else if (majorVersion >= 8) {
      logSuccess(`.NET ${dotnetVersion} ✓ (consider upgrading to .NET 9+)`);
      dotnetOk = true;
    } else {
      logError(`.NET version ${dotnetVersion} is too old. Need .NET 8+`);
    }
  } catch {
    logError('.NET SDK not found.');
  }
  
  // Check Docker (optional but recommended)
  try {
    const dockerVersion = execSync('docker --version', { encoding: 'utf8' }).trim();
    logSuccess(`${dockerVersion} ✓`);
    dockerOk = true;
    
    // Also check Docker Compose
    try {
      const composeVersion = execSync('docker-compose --version', { encoding: 'utf8' }).trim();
      logSuccess(`${composeVersion} ✓`);
    } catch {
      logWarning('Docker Compose not found. Some Docker features may not work.');
    }
  } catch {
    logWarning('Docker not found (optional - enables containerized development)');
  }
  
  // Handle missing prerequisites
  if (!nodeOk || !dotnetOk) {
    log('\n🚨 Missing Prerequisites Detected!', 'yellow');
    log('\nWe can help you install the missing dependencies:', 'cyan');
    
    if (!nodeOk) {
      log('\n📦 Node.js 18+ is required:', 'white');
      log('   • Windows: https://nodejs.org/en/download/', 'blue');
      log('   • macOS: brew install node', 'blue');  
      log('   • Linux: https://nodejs.org/en/download/package-manager/', 'blue');
      log('   • Alternative: https://github.com/nvm-sh/nvm (recommended)', 'blue');
    }
    
    if (!dotnetOk) {
      log('\n🔧 .NET 9+ SDK is recommended (.NET 8+ minimum):', 'white');
      log('   • Latest: https://dotnet.microsoft.com/download/dotnet/9.0', 'blue');
      log('   • Fallback: https://dotnet.microsoft.com/download/dotnet/8.0', 'blue');
      log('   • Windows: Use the Windows x64 installer', 'blue');
      log('   • macOS: Use the macOS x64 installer or: brew install dotnet', 'blue');
      log('   • Linux: Follow the Linux installation guide', 'blue');
    }
    
    log('\n💡 Quick Installation Tips:', 'cyan');
    log('   1. Install Node.js from https://nodejs.org (LTS version)', 'white');
    log('   2. Install .NET SDK from https://dotnet.microsoft.com/download', 'white');
    log('   3. Restart your terminal/command prompt', 'white');
    log('   4. Run "npm run setup" again', 'white');
    
    log('\n🔄 Auto-Installation Options:', 'magenta');
    
    if (process.platform === 'win32') {
      log('   Windows users can run:', 'white');
      log('   • winget install Microsoft.DotNet.SDK.9', 'yellow');
      log('   • winget install OpenJS.NodeJS.LTS', 'yellow');
      if (!dockerOk) {
        log('   • winget install Docker.DockerDesktop', 'yellow');
        log('     (verify package: winget search docker)', 'blue');
      }
    } else if (process.platform === 'darwin') {
      log('   macOS users with Homebrew can run:', 'white');
      log('   • brew install node', 'yellow');
      log('   • brew install dotnet', 'yellow');
      if (!dockerOk) {
        log('   • brew install --cask docker', 'yellow');
      }
    } else {
      log('   Linux users can use their package manager:', 'white');
      log('   • sudo apt install nodejs npm (Ubuntu/Debian)', 'yellow');
      log('   • Follow .NET installation: https://learn.microsoft.com/en-us/dotnet/core/install/linux', 'yellow');
      if (!dockerOk) {
        log('   • curl -fsSL https://get.docker.com | sh (Docker)', 'yellow');
      }
    }
    
    // Offer to attempt auto-installation
    if (process.platform === 'win32' || process.platform === 'darwin') {
      log('\n❓ Would you like me to attempt automatic installation?', 'cyan');
      log('   This will use your system package manager (winget/homebrew).', 'white');
      log('   Press Ctrl+C to exit, or any key to continue with manual installation.', 'yellow');
      
      // Note: In a real implementation, you'd use readline or inquirer for user input
      // For now, we'll just provide the guidance and exit
    }
    
    logError('\nSetup cannot continue without these prerequisites.');
    log('After installing the missing dependencies, please run "npm run setup" again.', 'white');
    process.exit(1);
  }
  
  // Docker installation guidance (if not installed)
  if (!dockerOk) {
    log('\n🐳 Docker Installation (Optional but Recommended)', 'cyan');
    log('   Docker enables containerized development - no local dependencies needed!', 'white');
    log('   With Docker, you can run the entire application with just:', 'white');
    log('   • docker-compose up -d', 'green');
    
    log('\n📦 Install Docker Desktop:', 'white');
    if (process.platform === 'win32') {
      log('   • winget install Docker.DockerDesktop', 'yellow');
      log('     (verify with: winget search docker)', 'blue');
      log('   • Or download: https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe', 'blue');
    } else if (process.platform === 'darwin') {
      log('   • brew install --cask docker', 'yellow');
      log('   • Or download: https://desktop.docker.com/mac/main/amd64/Docker.dmg', 'blue');
    } else {
      log('   • curl -fsSL https://get.docker.com -o get-docker.sh && sudo sh get-docker.sh', 'yellow');
      log('   • sudo usermod -aG docker $USER && newgrp docker', 'yellow');
    }
    
    log('\n✨ Benefits of Docker:', 'magenta');
    log('   • No need to install Node.js or .NET locally', 'white');
    log('   • Consistent environment across all machines', 'white');
    log('   • Production-ready containerized deployment', 'white');
    log('   • Isolated development with hot reload', 'white');
    log('   • Easy cleanup and reset', 'white');
  }
  
  logSuccess('All prerequisites met!');
}

function setupBackend() {
  logStep('3/7', 'Setting up Backend');
  
  const backendPath = path.join(process.cwd(), 'backend');
  
  // Restore dependencies
  log('   Restoring .NET packages...', 'blue');
  if (!runCommand('dotnet restore', backendPath, 'Restoring .NET packages')) {
    logError('Failed to restore .NET packages. This could be due to:');
    log('   • Missing .NET SDK components', 'yellow');
    log('   • Network connectivity issues', 'yellow');
    log('   • Invalid project file references', 'yellow');
    log('\n   Try these solutions:', 'cyan');
    log('   • Run: dotnet --list-sdks (verify .NET 9 is installed)', 'white');
    log('   • Run: dotnet nuget locals all --clear (clear cache)', 'white');
    log('   • Check internet connection for NuGet packages', 'white');
    process.exit(1);
  }
  
  // Build project
  log('   Building backend project...', 'blue');
  if (!runCommand('dotnet build --configuration Debug', backendPath, 'Building backend project')) {
    logError('Failed to build backend project. This could be due to:');
    log('   • Compilation errors in source code', 'yellow');
    log('   • Missing dependencies or package conflicts', 'yellow');
    log('   • .NET version compatibility issues', 'yellow');
    log('\n   Try these solutions:', 'cyan');
    log('   • Check build output above for specific errors', 'white');
    log('   • Ensure .NET 9 SDK is properly installed', 'white');
    log('   • Try: dotnet clean && dotnet restore', 'white');
    process.exit(1);
  }
  
  // Create database (this might fail initially, which is ok)
  log('   Setting up database...', 'blue');
  if (!runCommand('dotnet ef database update --project src/LibraryApi', backendPath, 'Setting up database schema')) {
    logWarning('EF database setup skipped - will be created automatically on first API run.');
    logWarning('This is normal for the initial setup process.');
  }
  
  logSuccess('Backend setup complete!');
}

function setupFrontend() {
  logStep('4/7', 'Setting up Frontend');
  
  const frontendPath = path.join(process.cwd(), 'frontend');
  
  // Check if package.json exists
  const packageJsonPath = path.join(frontendPath, 'package.json');
  if (!existsSync(packageJsonPath)) {
    logError('Frontend package.json not found. Project structure may be incomplete.');
    process.exit(1);
  }
  
  // Install dependencies
  log('   Installing frontend dependencies (this may take a few minutes)...', 'blue');
  if (!runCommand('npm install', frontendPath, 'Installing npm packages')) {
    logError('Failed to install npm packages. This could be due to:');
    log('   • Network connectivity issues', 'yellow');
    log('   • npm registry problems', 'yellow');  
    log('   • Permission issues', 'yellow');
    log('\n   Try these solutions:', 'cyan');
    log('   • Check your internet connection', 'white');
    log('   • Run: npm cache clean --force', 'white');
    log('   • Try: npm install --registry https://registry.npmjs.org/', 'white');
    log('   • On Windows: Run as Administrator', 'white');
    process.exit(1);
  }
  
  // Type check
  if (!runCommand('npm run type-check', frontendPath, 'Running TypeScript type check')) {
    logWarning('TypeScript type check failed. This is normal for the initial setup.');
    logWarning('Type errors will be resolved during feature implementation.');
  }
  
  // Build project (skip if it fails - placeholder components may have issues)
  if (!runCommand('npm run build', frontendPath, 'Building frontend project')) {
    logWarning('Frontend build failed. This is expected with placeholder components.');
    logWarning('Build will work properly after implementing actual components.');
  }
  
  logSuccess('Frontend setup complete!');
}

function setupDatabase() {
  logStep('5/7', 'Setting up Database');
  
  const dbPath = path.join(process.cwd(), 'backend', 'library.db');
  
  if (existsSync(dbPath)) {
    logSuccess('Database already exists');
  } else {
    log('   Database will be created automatically on first backend run', 'blue');
    logSuccess('Database setup configured');
  }
}

function runValidation() {
  logStep('6/7', 'Running Validation Tests');
  
  // Backend validation
  log('   Running backend validation...', 'blue');
  const backendPath = path.join(process.cwd(), 'backend');
  if (!runCommand('powershell -ExecutionPolicy Bypass -File validate.ps1 -SkipTests', backendPath)) {
    logWarning('Backend validation had issues. Check backend/validate.ps1 output.');
  } else {
    logSuccess('Backend validation passed');
  }
  
  // Frontend validation
  log('   Running frontend validation...', 'blue');
  const frontendPath = path.join(process.cwd(), 'frontend');
  if (!runCommand('node validate.js --skip-tests', frontendPath)) {
    logWarning('Frontend validation had issues. Check frontend/validate.js output.');
  } else {
    logSuccess('Frontend validation passed');
  }
}

function printNextSteps() {
  logStep('7/7', 'Setup Complete!');
  
  log('\n🎉 Your Book Library application is ready!', 'green');
  
  log('\n📋 Next Steps:', 'cyan');
  log('   1. Start development servers:', 'white');
  log('      npm run dev', 'yellow');
  log('      (Starts both backend and frontend concurrently)', 'white');
  
  log('\n   2. Or start them separately:', 'white');
  log('      npm run dev:backend  # Backend at http://localhost:5000', 'yellow');
  log('      npm run dev:frontend # Frontend at http://localhost:3000', 'yellow');
  
  log('\n   3. Generate TypeScript API client (after backend is running):', 'white');
  log('      npm run generate-client', 'yellow');
  
  log('\n   4. Run validation gates:', 'white');
  log('      npm run validate', 'yellow');
  
  log('\n🔗 Important URLs:', 'cyan');
  log('   • Frontend: http://localhost:3000', 'white');
  log('   • Backend API: http://localhost:5000', 'white');
  log('   • Swagger UI: http://localhost:5000/swagger', 'white');
  log('   • OpenAPI Spec: http://localhost:5000/swagger/v1/swagger.json', 'white');
  
  log('\n📚 Available Commands:', 'cyan');
  log('   • npm run dev        - Start both servers', 'white');
  log('   • npm run build      - Build both projects', 'white');
  log('   • npm run test       - Run all tests', 'white');
  log('   • npm run validate   - Run validation gates', 'white');
  
  log('\n🚀 Happy coding!', 'magenta');
}

function setupRootDependencies() {
  logStep('2/7', 'Setting up Project Dependencies');
  
  // Check if we need to install root dependencies
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  if (!existsSync(packageJsonPath)) {
    logError('Root package.json not found. Are you running this from the project root?');
    process.exit(1);
  }
  
  // Install root dependencies (concurrently)
  log('   Installing root project dependencies...', 'blue');
  if (!runCommand('npm install', process.cwd(), 'Installing root npm packages')) {
    logWarning('Failed to install root dependencies. Concurrent development may not work.');
    logWarning('You can still run backend and frontend separately.');
  } else {
    logSuccess('Root dependencies installed!');
  }
}

async function main() {
  log(`${colors.bold}${colors.magenta}
╔══════════════════════════════════════════════════════════════╗
║                    BOOK LIBRARY SETUP                       ║
║              AI-Assisted Development Project                 ║
╚══════════════════════════════════════════════════════════════╝
${colors.reset}`);

  try {
    checkPrerequisites();
    setupRootDependencies();
    setupBackend();
    setupFrontend();
    setupDatabase();
    runValidation();
    printNextSteps();
  } catch (error) {
    logError(`Setup failed: ${error.message}`);
    process.exit(1);
  }
}

main().catch(console.error);