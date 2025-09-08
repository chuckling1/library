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
 *   node fresh-start.js [options]
 * 
 * Options:
 *   --skip-deps     Skip dependency reinstallation (faster, use existing node_modules)
 *   --skip-db       Skip database reset (keep existing data)
 *   --skip-build    Skip build validation step
 *   --skip-start    Skip starting development servers
 *   --verbose       Show detailed output from all commands
 */

import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Parse command line arguments
const args = process.argv.slice(2);
const skipDeps = args.includes('--skip-deps');
const skipDb = args.includes('--skip-db');
const skipBuild = args.includes('--skip-build');
const skipStart = args.includes('--skip-start');
const verbose = args.includes('--verbose');

console.log('\n🚀 Book Library Fresh Start Script');
console.log('=====================================');
console.log(`📍 Working Directory: ${__dirname}`);
console.log(`⏰ Started at: ${new Date().toLocaleTimeString()}\n`);

if (skipDeps) console.log('⏭️  Skipping dependency reinstallation');
if (skipDb) console.log('⏭️  Skipping database reset');
if (skipBuild) console.log('⏭️  Skipping build validation');
if (skipStart) console.log('⏭️  Skipping development server startup');

const startTime = Date.now();

/**
 * Execute a command with proper error handling and logging
 */
function runCommand(command, description, options = {}) {
    const { cwd = __dirname, ignoreErrors = false } = options;
    
    try {
        console.log(`\n📋 ${description}...`);
        if (verbose) console.log(`   Command: ${command}`);
        
        const output = execSync(command, { 
            encoding: 'utf-8', 
            stdio: verbose ? 'inherit' : 'pipe',
            cwd,
            timeout: 600000 // 10 minute timeout
        });
        
        console.log('✅ Success');
        return { success: true, output };
    } catch (error) {
        if (ignoreErrors) {
            console.log('⚠️  Command failed (ignored)');
            return { success: false, error: error.message };
        }
        
        console.log('❌ Failed');
        console.log(`   Error: ${error.message}`);
        if (error.stdout) console.log(`   Output: ${error.stdout}`);
        if (error.stderr) console.log(`   Error Output: ${error.stderr}`);
        throw error;
    }
}

/**
 * Remove directory if it exists
 */
function removeDirectory(dirPath, description) {
    if (fs.existsSync(dirPath)) {
        console.log(`\n🗑️  Removing ${description}...`);
        if (process.platform === 'win32') {
            // Windows: Use rmdir /s /q for better performance
            runCommand(`rmdir /s /q "${dirPath}"`, `Removing ${dirPath}`, { ignoreErrors: true });
        } else {
            // Unix: Use rm -rf
            runCommand(`rm -rf "${dirPath}"`, `Removing ${dirPath}`, { ignoreErrors: true });
        }
        console.log('✅ Removed');
    }
}

/**
 * Check if a command exists
 */
function commandExists(command) {
    try {
        const checkCommand = process.platform === 'win32' ? `where ${command}` : `which ${command}`;
        execSync(checkCommand, { stdio: 'pipe' });
        return true;
    } catch {
        return false;
    }
}

/**
 * Start development servers
 */
function startDevelopmentServers() {
    console.log('\n🚀 Starting Development Servers...');
    console.log('=====================================');
    
    console.log('Starting both backend and frontend servers...');
    console.log('📍 Backend: http://localhost:5000');  
    console.log('📍 Frontend: http://localhost:3000');
    console.log('📍 Swagger: http://localhost:5000/swagger');
    console.log('\n💡 Press Ctrl+C to stop servers');
    
    // Start the dev servers using npm run dev
    const devProcess = spawn('npm', ['run', 'dev'], {
        stdio: 'inherit',
        cwd: __dirname,
        shell: true
    });
    
    // Handle process termination gracefully
    process.on('SIGINT', () => {
        console.log('\n\n⏹️  Stopping development servers...');
        devProcess.kill('SIGINT');
        process.exit(0);
    });
    
    process.on('SIGTERM', () => {
        devProcess.kill('SIGTERM');
        process.exit(0);
    });
    
    devProcess.on('close', (code) => {
        console.log(`\n📊 Development servers exited with code ${code}`);
        process.exit(code);
    });
}

async function main() {
    try {
        // STEP 1: Environment Check
        console.log('\n🔍 STEP 1: Environment Prerequisites Check');
        console.log('==========================================');
        
        const prerequisites = [
            { command: 'node', name: 'Node.js', getVersion: 'node --version' },
            { command: 'npm', name: 'npm', getVersion: 'npm --version' },
            { command: 'dotnet', name: '.NET SDK', getVersion: 'dotnet --version' }
        ];
        
        for (const prereq of prerequisites) {
            if (commandExists(prereq.command)) {
                const version = execSync(prereq.getVersion, { encoding: 'utf-8' }).trim();
                console.log(`✅ ${prereq.name}: ${version}`);
            } else {
                console.log(`❌ ${prereq.name}: Not found`);
                console.log(`   Please install ${prereq.name} before running this script`);
                process.exit(1);
            }
        }
        
        // STEP 2: Clean Development Environment
        console.log('\n🧹 STEP 2: Clean Development Environment');
        console.log('========================================');
        
        // Stop any running development servers
        console.log('\n🛑 Stopping any running development servers...');
        if (process.platform === 'win32') {
            runCommand('taskkill /F /IM node.exe', 'Stopping Node.js processes', { ignoreErrors: true });
            runCommand('taskkill /F /IM dotnet.exe', 'Stopping .NET processes', { ignoreErrors: true });
        } else {
            runCommand('pkill -f "node.*dev" || true', 'Stopping Node.js dev processes', { ignoreErrors: true });
            runCommand('pkill -f "dotnet.*run" || true', 'Stopping .NET dev processes', { ignoreErrors: true });
        }
        
        // Clean build artifacts
        removeDirectory(path.join(__dirname, 'frontend', 'dist'), 'frontend build artifacts');
        removeDirectory(path.join(__dirname, 'frontend', '.vite'), 'frontend Vite cache');
        removeDirectory(path.join(__dirname, 'backend', 'src', 'LibraryApi', 'bin'), 'backend build artifacts');
        removeDirectory(path.join(__dirname, 'backend', 'src', 'LibraryApi', 'obj'), 'backend object files');
        removeDirectory(path.join(__dirname, 'backend', 'src', 'LibraryApi.Tests', 'bin'), 'backend test build artifacts');
        removeDirectory(path.join(__dirname, 'backend', 'src', 'LibraryApi.Tests', 'obj'), 'backend test object files');
        
        // Clean logs
        removeDirectory(path.join(__dirname, 'backend', 'src', 'LibraryApi', 'logs'), 'application logs');
        
        if (!skipDeps) {
            // Clean dependency folders
            removeDirectory(path.join(__dirname, 'node_modules'), 'root node_modules');
            removeDirectory(path.join(__dirname, 'frontend', 'node_modules'), 'frontend node_modules');
            
            // Clean package locks (will be regenerated)
            const lockFiles = [
                path.join(__dirname, 'package-lock.json'),
                path.join(__dirname, 'frontend', 'package-lock.json')
            ];
            
            for (const lockFile of lockFiles) {
                if (fs.existsSync(lockFile)) {
                    fs.unlinkSync(lockFile);
                    console.log(`🗑️  Removed ${path.relative(__dirname, lockFile)}`);
                }
            }
        }
        
        // STEP 3: Database Reset
        if (!skipDb) {
            console.log('\n🗄️  STEP 3: Database Reset');
            console.log('==========================');
            
            const dbPath = path.join(__dirname, 'backend', 'src', 'LibraryApi', 'library.db');
            const dbShmPath = path.join(__dirname, 'backend', 'src', 'LibraryApi', 'library.db-shm');
            const dbWalPath = path.join(__dirname, 'backend', 'src', 'LibraryApi', 'library.db-wal');
            
            // Remove SQLite database files
            [dbPath, dbShmPath, dbWalPath].forEach(file => {
                if (fs.existsSync(file)) {
                    fs.unlinkSync(file);
                    console.log(`🗑️  Removed ${path.relative(__dirname, file)}`);
                }
            });
            
            console.log('✅ Database reset complete');
        } else {
            console.log('\n⏭️  STEP 3: Database Reset - SKIPPED');
        }
        
        // STEP 4: Install Dependencies
        if (!skipDeps) {
            console.log('\n📦 STEP 4: Install Dependencies');
            console.log('===============================');
            
            // Install root dependencies
            runCommand('npm install', 'Installing root project dependencies');
            
            // Install frontend dependencies
            runCommand('npm install', 'Installing frontend dependencies', { 
                cwd: path.join(__dirname, 'frontend') 
            });
            
            // Restore backend dependencies
            runCommand('dotnet restore', 'Restoring .NET packages', { 
                cwd: path.join(__dirname, 'backend') 
            });
        } else {
            console.log('\n⏭️  STEP 4: Install Dependencies - SKIPPED');
        }
        
        // STEP 5: Build and Validate
        if (!skipBuild) {
            console.log('\n🔨 STEP 5: Build and Validate');
            console.log('=============================');
            
            // Build backend
            runCommand('dotnet build --configuration Release', 'Building backend project', { 
                cwd: path.join(__dirname, 'backend') 
            });
            
            // Setup database (migrations)
            runCommand('dotnet ef database update --project src/LibraryApi', 'Setting up database schema', { 
                cwd: path.join(__dirname, 'backend') 
            });
            
            // TypeScript check frontend
            runCommand('npm run type-check', 'Running TypeScript type check', { 
                cwd: path.join(__dirname, 'frontend') 
            });
            
            // Build frontend
            runCommand('npm run build', 'Building frontend for production', { 
                cwd: path.join(__dirname, 'frontend') 
            });
            
            console.log('✅ All builds successful');
        } else {
            console.log('\n⏭️  STEP 5: Build and Validate - SKIPPED');
        }
        
        // STEP 6: Final Setup
        console.log('\n🎯 STEP 6: Final Setup');
        console.log('======================');
        
        // Create any missing directories
        const requiredDirs = [
            path.join(__dirname, 'backend', 'src', 'LibraryApi', 'logs'),
            path.join(__dirname, 'frontend', 'coverage')
        ];
        
        requiredDirs.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
                console.log(`📁 Created directory: ${path.relative(__dirname, dir)}`);
            }
        });
        
        // Create .env files if they don't exist
        const frontendEnvPath = path.join(__dirname, 'frontend', '.env.development');
        if (!fs.existsSync(frontendEnvPath)) {
            const envContent = `# Frontend Development Environment
VITE_API_BASE_URL=http://localhost:5000
VITE_ENVIRONMENT=development
`;
            fs.writeFileSync(frontendEnvPath, envContent);
            console.log('📄 Created frontend/.env.development');
        }
        
        // Success Summary
        const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log('\n🎉 FRESH START COMPLETE!');
        console.log('========================');
        console.log(`⏱️  Total Time: ${elapsedTime}s`);
        console.log('✅ Environment cleaned and reset');
        console.log('✅ Dependencies installed');
        console.log('✅ Database schema created');
        console.log('✅ All projects built successfully');
        
        console.log('\n🔗 Available URLs:');
        console.log('   • Frontend: http://localhost:3000');
        console.log('   • Backend API: http://localhost:5000'); 
        console.log('   • Swagger UI: http://localhost:5000/swagger');
        
        console.log('\n📋 Quick Commands:');
        console.log('   • Start development: npm run dev');
        console.log('   • Run all tests: npm run test');
        console.log('   • Run validation: npm run validate');
        console.log('   • Fresh start again: node fresh-start.js');
        
        // STEP 7: Start Development Servers
        if (!skipStart) {
            console.log('\n🚀 Starting development servers in 3 seconds...');
            console.log('   Press Ctrl+C to cancel startup');
            
            // Give user 3 seconds to cancel
            for (let i = 3; i > 0; i--) {
                process.stdout.write(`\r   Starting in ${i}...`);
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            console.log('\r   Starting now!        \n');
            
            startDevelopmentServers();
        } else {
            console.log('\n⏭️  Development servers not started (--skip-start)');
            console.log('   Run "npm run dev" to start servers manually');
        }
        
    } catch (error) {
        console.log('\n💥 FRESH START FAILED');
        console.log('=====================');
        console.log(`❌ Error: ${error.message}`);
        
        console.log('\n🔧 Troubleshooting:');
        console.log('   1. Ensure Node.js 18+ and .NET 8+ are installed');
        console.log('   2. Close any running development servers');
        console.log('   3. Check file permissions');
        console.log('   4. Try running with --verbose for more details');
        
        process.exit(1);
    }
}

// Handle script interruption gracefully
process.on('SIGINT', () => {
    console.log('\n\n⏹️  Fresh start interrupted by user');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n\n⏹️  Fresh start terminated');
    process.exit(0);
});

main();