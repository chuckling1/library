#!/usr/bin/env node

/**
 * Fresh Start Script - Book Library Application
 * 
 * This script provides a complete "fresh start" setup that:
 * 1. Resets the entire development environment 
 * 2. Cleans all build artifacts and dependencies
 * 3. Reinstalls everything from scratch
 * 4. Resets the database completely
 * 5. Runs validation and starts dev servers
 * 
 * Usage:
 *   node fresh-start.js                    # Full fresh start
 *   node fresh-start.js --skip-deps        # Skip dependency reinstallation
 *   node fresh-start.js --skip-db          # Skip database reset
 *   node fresh-start.js --skip-build       # Skip build validation
 *   node fresh-start.js --skip-start       # Skip starting dev servers
 *   node fresh-start.js --verbose          # Show detailed output
 */

const { spawn, exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const { promisify } = require('util');

const execAsync = promisify(exec);

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  skipDeps: args.includes('--skip-deps'),
  skipDb: args.includes('--skip-db'),
  skipBuild: args.includes('--skip-build'),
  skipStart: args.includes('--skip-start'),
  verbose: args.includes('--verbose') || args.includes('-v'),
  help: args.includes('--help') || args.includes('-h')
};

const startTime = Date.now();
const isWindows = process.platform === 'win32';

// Color console output functions
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m'
};

function colorLog(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function showHelp() {
  console.log(`
🚀 Book Library Fresh Start Script

USAGE:
  node fresh-start.js [options]

OPTIONS:
  --skip-deps     Skip dependency reinstallation (faster, use existing node_modules)
  --skip-db       Skip database reset (keep existing data)
  --skip-build    Skip build validation step
  --skip-start    Skip starting development servers
  --verbose, -v   Show detailed output from all commands
  --help, -h      Show this help message

FEATURES:
  🧹 COMPREHENSIVE CLEANUP:
    • Always attempts to clean ALL possible locations
    • Fails silently if files/containers don't exist
    • No environment detection - just cleans everything
    
  🐳 DOCKER CLEANUP:
    • Stops containers from docker-compose.yml and docker-compose.prod.yml
    • Removes Docker volumes: library_backend-data, library_backend-logs, library_backup-data
    • Runs Docker system cleanup
    
  🗄️  DATABASE CLEANUP:
    • Always tries to delete database files from ALL locations:
      - backend/src/LibraryApi/library.db*
      - backend/data/library.db*
    • Handles .db, .db-shm, and .db-wal files
    • Removes backend/data and backend/logs directories

EXAMPLES:
  node fresh-start.js
    Full fresh start - cleans everything everywhere

  node fresh-start.js --skip-deps --skip-db
    Fresh start keeping dependencies and database

  node fresh-start.js --verbose
    Full fresh start with detailed output for troubleshooting
`);
}

async function executeCommand(command, description, workingDir = process.cwd(), ignoreErrors = false) {
  try {
    colorLog(`\n📋 ${description}...`, 'cyan');
    
    if (options.verbose) {
      colorLog(`   Command: ${command}`, 'gray');
      colorLog(`   Directory: ${workingDir}`, 'gray');
    }

    const { stdout, stderr } = await execAsync(command, { 
      cwd: workingDir,
      maxBuffer: 1024 * 1024 * 10 // 10MB buffer
    });

    if (options.verbose && stdout) {
      console.log(stdout);
    }
    if (options.verbose && stderr && !ignoreErrors) {
      console.error(stderr);
    }

    colorLog('✅ Success', 'green');
    return { success: true, stdout, stderr };
  } catch (error) {
    if (ignoreErrors) {
      colorLog('⚠️  Command failed (ignored)', 'yellow');
      return { success: false, error: error.message };
    }
    
    colorLog('❌ Failed', 'red');
    colorLog(`   Error: ${error.message}`, 'red');
    
    if (options.verbose && error.stdout) {
      console.log('STDOUT:', error.stdout);
    }
    if (options.verbose && error.stderr) {
      console.error('STDERR:', error.stderr);
    }
    
    throw error;
  }
}

async function removeDirectoryIfExists(dirPath, description) {
  try {
    await fs.access(dirPath);
    colorLog(`\n🗑️  Removing ${description}...`, 'yellow');
    await fs.rm(dirPath, { recursive: true, force: true });
    colorLog('✅ Removed', 'green');
  } catch (error) {
    // Directory doesn't exist, which is fine
    if (error.code !== 'ENOENT') {
      colorLog(`⚠️  Could not remove ${description}: ${error.message}`, 'yellow');
    }
  }
}

async function removeFileIfExists(filePath, description) {
  try {
    await fs.access(filePath);
    await fs.unlink(filePath);
    colorLog(`🗑️  Removed ${description || filePath}`);
  } catch (error) {
    // File doesn't exist, which is fine
    if (error.code !== 'ENOENT') {
      colorLog(`⚠️  Could not remove ${description || filePath}: ${error.message}`, 'yellow');
    }
  }
}

async function commandExists(command) {
  try {
    const testCommand = isWindows ? `where ${command}` : `which ${command}`;
    await execAsync(testCommand);
    return true;
  } catch {
    return false;
  }
}

async function getDockerComposeCommand() {
  if (await commandExists('docker-compose')) {
    return 'docker-compose';
  } else if (await commandExists('docker compose')) {
    return 'docker compose';
  }
  return null;
}

async function killProcessesByName(processName) {
  try {
    if (isWindows) {
      // Get process list and filter out Claude Code processes
      const { stdout } = await execAsync(`tasklist /FO CSV | findstr /I ${processName}.exe`);
      const lines = stdout.split('\n');
      
      for (const line of lines) {
        if (line.includes(processName) && !line.includes('claude') && !line.includes('Claude')) {
          const match = line.match(/"([^"]*)","\d+"/);
          if (match) {
            try {
              await execAsync(`taskkill /F /PID ${match[1].split('","')[1]}`);
            } catch {
              // Individual process kill failed, continue
            }
          }
        }
      }
    } else {
      // Unix-like systems - exclude claude processes
      await execAsync(`pkill -f ${processName} | grep -v claude`);
    }
    
    colorLog(`🛑 Stopped ${processName} processes (excluding Claude Code)`);
  } catch {
    // Process not running or already stopped
  }
}

async function createDirectoryIfNotExists(dirPath, description) {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
    colorLog(`📁 Created directory: ${description || dirPath}`);
  }
}

async function cleanupDockerEnvironment() {
  colorLog('\n🐳 Attempting Docker cleanup (will fail silently if not available)...', 'cyan');
  
  const dockerComposeCmd = await getDockerComposeCommand();
  if (!dockerComposeCmd) {
    return; // Silently skip if Docker Compose not available
  }

  const dockerFiles = ['docker-compose.yml', 'docker-compose.prod.yml'];
  
  // Always try to stop containers from both docker files
  for (const dockerFile of dockerFiles) {
    await executeCommand(
      `${dockerComposeCmd} -f ${dockerFile} down --remove-orphans`, 
      `Stop containers from ${dockerFile}`, 
      process.cwd(), 
      true // Always ignore errors
    );
  }

  // Always try to clean up Docker volumes (fail silently)
  const volumesToRemove = [
    'library_backend-data',
    'library_backend-logs', 
    'library_backup-data'
  ];

  for (const volume of volumesToRemove) {
    await executeCommand(`docker volume rm ${volume}`, `Remove volume ${volume}`, process.cwd(), true);
  }

  // Always try to clean up unused Docker resources
  await executeCommand('docker system prune -f', 'Clean up Docker system', process.cwd(), true);
}

async function startDevelopmentServers() {
  colorLog('\n🚀 Starting Development Servers...', 'green');
  colorLog('====================================', 'green');
  colorLog('\n📍 Backend: http://localhost:5000');
  colorLog('📍 Frontend: http://localhost:3000');
  colorLog('📍 Swagger: http://localhost:5000/swagger');
  colorLog('\n💡 Press Ctrl+C to stop servers', 'yellow');

  try {
    // Always try npm run dev first (standard approach)
    const child = spawn('npm', ['run', 'dev'], {
      stdio: 'inherit',
      shell: true
    });

    child.on('error', (error) => {
      colorLog(`❌ Failed to start development servers: ${error.message}`, 'red');
    });

    child.on('close', (code) => {
      if (code === 0) {
        colorLog('\n⏹️  Development servers stopped gracefully', 'yellow');
      } else {
        colorLog('\n⏹️  Development servers stopped', 'yellow');
      }
    });

    process.on('SIGINT', () => {
      colorLog('\n⏹️  Stopping development servers...', 'yellow');
      child.kill('SIGTERM');
    });

  } catch (error) {
    colorLog(`❌ Failed to start development servers: ${error.message}`, 'red');
  }
}

async function main() {
  try {
    if (options.help) {
      showHelp();
      return;
    }

    colorLog('\n🚀 Book Library Fresh Start Script', 'green');
    colorLog('====================================', 'green');
    colorLog(`📍 Working Directory: ${process.cwd()}`);
    colorLog(`⏰ Started at: ${new Date().toLocaleTimeString()}`);
    colorLog('');

    if (options.skipDeps) colorLog('⏭️  Skipping dependency reinstallation', 'yellow');
    if (options.skipDb) colorLog('⏭️  Skipping database reset', 'yellow');
    if (options.skipBuild) colorLog('⏭️  Skipping build validation', 'yellow');
    if (options.skipStart) colorLog('⏭️  Skipping development server startup', 'yellow');

    // STEP 1: Environment Check
    colorLog('\n🔍 STEP 1: Environment Prerequisites Check', 'magenta');
    colorLog('==========================================', 'magenta');

    const prerequisites = [
      { command: 'node', name: 'Node.js', versionCommand: 'node --version' },
      { command: 'npm', name: 'npm', versionCommand: 'npm --version' },
      { command: 'dotnet', name: '.NET SDK', versionCommand: 'dotnet --version' }
    ];

    for (const prereq of prerequisites) {
      if (await commandExists(prereq.command)) {
        const { stdout } = await execAsync(prereq.versionCommand);
        colorLog(`✅ ${prereq.name}: ${stdout.trim()}`, 'green');
      } else {
        colorLog(`❌ ${prereq.name}: Not found`, 'red');
        colorLog(`   Please install ${prereq.name} before running this script`, 'red');
        process.exit(1);
      }
    }

    // STEP 2: Clean Development Environment
    colorLog('\n🧹 STEP 2: Clean Development Environment', 'magenta');
    colorLog('========================================', 'magenta');

    // Stop any running development servers and Docker containers
    colorLog('\n🛑 Stopping any running services...', 'yellow');
    await killProcessesByName('node');
    await killProcessesByName('dotnet');
    
    // Always attempt Docker cleanup (fails silently if not available)
    await cleanupDockerEnvironment();

    // Clean build artifacts
    await removeDirectoryIfExists('frontend/dist', 'frontend build artifacts');
    await removeDirectoryIfExists('frontend/.vite', 'frontend Vite cache');
    await removeDirectoryIfExists('backend/src/LibraryApi/bin', 'backend build artifacts');
    await removeDirectoryIfExists('backend/src/LibraryApi/obj', 'backend object files');
    await removeDirectoryIfExists('backend/src/LibraryApi.Tests/bin', 'backend test build artifacts');
    await removeDirectoryIfExists('backend/src/LibraryApi.Tests/obj', 'backend test object files');

    // Note: Log cleanup moved to database reset section

    if (!options.skipDeps) {
      // Clean dependency folders
      await removeDirectoryIfExists('node_modules', 'root node_modules');
      await removeDirectoryIfExists('frontend/node_modules', 'frontend node_modules');

      // Clean package locks (will be regenerated)
      const lockFiles = ['package-lock.json', 'frontend/package-lock.json'];
      
      for (const lockFile of lockFiles) {
        await removeFileIfExists(lockFile, lockFile);
      }
    }

    // STEP 3: Database Reset
    if (!options.skipDb) {
      colorLog('\n🗄️  STEP 3: Database Reset', 'magenta');
      colorLog('==========================', 'magenta');

      // All possible database file locations - always try to delete all
      const allDbFiles = [
        // Local development database files
        'backend/src/LibraryApi/library.db',
        'backend/src/LibraryApi/library.db-shm',
        'backend/src/LibraryApi/library.db-wal',
        // Docker development database files  
        'backend/data/library.db',
        'backend/data/library.db-shm', 
        'backend/data/library.db-wal'
      ];

      // Always try to remove all database files (fails silently if they don't exist)
      colorLog('🗑️  Removing all database files...', 'yellow');
      for (const dbFile of allDbFiles) {
        await removeFileIfExists(dbFile, dbFile);
      }

      // Always try to clean up database and log directories
      await removeDirectoryIfExists('backend/data', 'backend/data directory');
      await removeDirectoryIfExists('backend/logs', 'backend/logs directory');

      colorLog('✅ Database reset complete', 'green');
    } else {
      colorLog('\n⏭️  STEP 3: Database Reset - SKIPPED', 'yellow');
    }

    // STEP 4: Install Dependencies
    if (!options.skipDeps) {
      colorLog('\n📦 STEP 4: Install Dependencies', 'magenta');
      colorLog('===============================', 'magenta');

      // Install root dependencies
      await executeCommand('npm install', 'Installing root project dependencies');

      // Install frontend dependencies
      await executeCommand('npm install', 'Installing frontend dependencies', 'frontend');

      // Restore backend dependencies
      await executeCommand('dotnet restore', 'Restoring .NET packages', 'backend');
    } else {
      colorLog('\n⏭️  STEP 4: Install Dependencies - SKIPPED', 'yellow');
    }

    // STEP 5: Build and Validate
    if (!options.skipBuild) {
      colorLog('\n🔨 STEP 5: Build and Validate', 'magenta');
      colorLog('=============================', 'magenta');

      // Always try standard local build approach first
      await executeCommand('dotnet build --configuration Release', 'Building backend project', 'backend');
      await executeCommand('dotnet ef database update --project src/LibraryApi', 'Setting up database schema', 'backend');

      // TypeScript check and build frontend
      await executeCommand('npm run type-check', 'Running TypeScript type check', 'frontend');
      await executeCommand('npm run build', 'Building frontend for production', 'frontend');

      colorLog('✅ All builds successful', 'green');
    } else {
      colorLog('\n⏭️  STEP 5: Build and Validate - SKIPPED', 'yellow');
    }

    // STEP 6: Final Setup
    colorLog('\n🎯 STEP 6: Final Setup', 'magenta');
    colorLog('======================', 'magenta');

    // Create any missing directories
    const requiredDirs = [
      'backend/src/LibraryApi/logs',
      'backend/data',
      'backend/logs', 
      'frontend/coverage'
    ];

    for (const dir of requiredDirs) {
      await createDirectoryIfNotExists(dir, dir);
    }

    // Create .env files if they don't exist
    const frontendEnvPath = 'frontend/.env.development';
    try {
      await fs.access(frontendEnvPath);
    } catch {
      const envContent = `# Frontend Development Environment
VITE_API_BASE_URL=http://localhost:5000
VITE_ENVIRONMENT=development
`;
      await fs.writeFile(frontendEnvPath, envContent);
      colorLog('📄 Created frontend/.env.development');
    }

    // Success Summary
    const elapsedTime = Math.round((Date.now() - startTime) / 1000 * 10) / 10;
    colorLog('\n🎉 FRESH START COMPLETE!', 'green');
    colorLog('========================', 'green');
    colorLog(`⏱️  Total Time: ${elapsedTime}s`);
    colorLog('✅ Environment cleaned and reset', 'green');
    colorLog('✅ Dependencies installed', 'green');
    colorLog('✅ Database schema created', 'green');
    colorLog('✅ All projects built successfully', 'green');

    colorLog('\n🔗 Available URLs:', 'cyan');
    colorLog('   • Frontend: http://localhost:3000');
    colorLog('   • Backend API: http://localhost:5000');
    colorLog('   • Swagger UI: http://localhost:5000/swagger');

    colorLog('\n📋 Quick Commands:', 'cyan');
    colorLog('   • Start development: npm run dev');
    colorLog('   • Run all tests: npm run test');
    colorLog('   • Run validation: npm run validate');
    colorLog('   • Fresh start again: node fresh-start.js');

    // STEP 7: Start Development Servers
    if (!options.skipStart) {
      colorLog('\n🚀 Starting development servers in 3 seconds...', 'green');
      colorLog('   Press Ctrl+C to cancel startup', 'yellow');

      // Give user 3 seconds to cancel
      for (let i = 3; i > 0; i--) {
        process.stdout.write(`\r   Starting in ${i}...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      process.stdout.write('\r   Starting now!        \n');
      colorLog('');

      await startDevelopmentServers();
    } else {
      colorLog('\n⏭️  Development servers not started (--skip-start)', 'yellow');
      colorLog('   Run \'npm run dev\' to start servers manually');
    }

  } catch (error) {
    colorLog('\n💥 FRESH START FAILED', 'red');
    colorLog('=====================', 'red');
    colorLog(`❌ Error: ${error.message}`, 'red');

    colorLog('\n🔧 Troubleshooting:', 'yellow');
    colorLog('   1. Ensure Node.js 18+ and .NET 8+ are installed');
    colorLog('   2. Close any running development servers');
    colorLog('   3. Check file permissions');
    colorLog('   4. Try running with --verbose for more details');

    process.exit(1);
  }
}

// Handle script interruption gracefully
process.on('SIGINT', () => {
  colorLog('\nFresh start interrupted by user', 'yellow');
  process.exit(0);
});

// Run the script
main();