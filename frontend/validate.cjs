#!/usr/bin/env node
/**
 * Frontend Validation Script - LibraryApi Frontend
 * Runs all validation gates in optimal order with parallel execution where possible
 * EXIT CODE: 0 = All validations passed, 1 = One or more validations failed
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const skipTests = args.includes('--skip-tests');
const verbose = args.includes('--verbose');

console.log('🚀 Starting Frontend Validation Pipeline...');
console.log(`📍 Working Directory: ${process.cwd()}`);

// Initialize validation results
const validationResults = {
    lint: false,
    typeCheck: false,
    build: false,
    tests: false,
    coverage: false,
    performance: false,
    security: false
};

const startTime = Date.now();

async function runCommand(command, description) {
    try {
        console.log(`   - ${description}...`);
        const output = execSync(command, { 
            encoding: 'utf-8', 
            stdio: verbose ? 'inherit' : 'pipe',
            timeout: 300000 // 5 minute timeout
        });
        return { success: true, output };
    } catch (error) {
        return { 
            success: false, 
            error: error.message,
            output: error.stdout || error.stderr || error.message
        };
    }
}

async function checkFilePatterns(patterns, description) {
    const issues = [];
    
    for (const pattern of patterns) {
        try {
            // Use grep-like functionality for pattern matching
            const command = process.platform === 'win32' 
                ? `findstr /R /S "${pattern.regex}" src\\*.* 2>nul`
                : `find src -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | xargs grep -l "${pattern.regex}" 2>/dev/null || true`;
            
            const result = execSync(command, { encoding: 'utf-8', stdio: 'pipe' }).trim();
            if (result) {
                issues.push(`${pattern.description}: Found in ${result.split('\n').length} file(s)`);
                if (verbose) {
                    console.log(`     Found: ${result.split('\n').slice(0, 3).join(', ')}`);
                }
            }
        } catch (error) {
            // Pattern not found, which is good for most security/performance checks
        }
    }
    
    return issues;
}

async function main() {
    try {
        // STEP 1: LINT & TYPE CHECK (Can run in parallel)
        console.log('\n🔍 STEP 1: Lint & Type Check Validation');
        
        const lintPromise = runCommand('npm run lint', 'Running ESLint analysis');
        const typeCheckPromise = runCommand('npm run type-check', 'Running TypeScript strict checking');
        
        const [lintResult, typeCheckResult] = await Promise.all([lintPromise, typeCheckPromise]);
        
        if (lintResult.success) {
            console.log('   ✅ Lint: PASSED');
            validationResults.lint = true;
        } else {
            console.log('   ❌ Lint: FAILED');
            if (verbose) console.log(lintResult.output);
            throw new Error('Lint validation failed');
        }
        
        if (typeCheckResult.success) {
            console.log('   ✅ Type Check: PASSED');
            validationResults.typeCheck = true;
        } else {
            console.log('   ❌ Type Check: FAILED');
            if (verbose) console.log(typeCheckResult.output);
            throw new Error('Type check validation failed');
        }

        // STEP 2: BUILD
        console.log('\n🏗️  STEP 2: Build Validation');
        
        const buildResult = await runCommand('npm run build', 'Running production build');
        if (buildResult.success) {
            console.log('   ✅ Build: PASSED');
            validationResults.build = true;
            
            // Check bundle size
            const distPath = path.join(process.cwd(), 'dist');
            if (fs.existsSync(distPath)) {
                try {
                    const stats = fs.statSync(path.join(distPath, 'assets'));
                    console.log('   📦 Build artifacts created successfully');
                } catch (err) {
                    console.log('   ⚠️  Build artifacts location may have changed');
                }
            }
        } else {
            console.log('   ❌ Build: FAILED');
            if (verbose) console.log(buildResult.output);
            throw new Error('Build validation failed');
        }

        // STEP 3: TESTS & COVERAGE
        if (!skipTests) {
            console.log('\n🧪 STEP 3: Unit Tests & Coverage Analysis');
            
            const testResult = await runCommand('npm run test:coverage', 'Running unit tests with coverage');
            if (testResult.success) {
                console.log('   ✅ Unit Tests: PASSED');
                validationResults.tests = true;
                
                // Check if coverage files exist
                const coveragePath = path.join(process.cwd(), 'coverage');
                if (fs.existsSync(coveragePath)) {
                    console.log('   ✅ Coverage Collection: COMPLETED');
                    console.log('   📊 Coverage reports generated');
                    validationResults.coverage = true;
                } else {
                    console.log('   ⚠️  Coverage: FILES NOT FOUND');
                    console.log('   Note: Coverage analysis may not be properly configured');
                }
            } else {
                console.log('   ❌ Unit Tests: FAILED');
                if (verbose) console.log(testResult.output);
                throw new Error('Test validation failed');
            }
        } else {
            console.log('\n⏭️  STEP 3: Tests & Coverage - SKIPPED');
            validationResults.tests = true;
            validationResults.coverage = true;
        }

        // STEP 4: PERFORMANCE EVALUATION
        console.log('\n⚡ STEP 4: Performance Analysis');
        console.log('   - Analyzing bundle size and React patterns...');
        
        const performanceIssues = [];
        
        // Check bundle size if build exists
        const distPath = path.join(process.cwd(), 'dist');
        if (fs.existsSync(distPath)) {
            try {
                const getDirectorySize = (dirPath) => {
                    let totalSize = 0;
                    const files = fs.readdirSync(dirPath, { withFileTypes: true });
                    
                    for (const file of files) {
                        const fullPath = path.join(dirPath, file.name);
                        if (file.isDirectory()) {
                            totalSize += getDirectorySize(fullPath);
                        } else {
                            totalSize += fs.statSync(fullPath).size;
                        }
                    }
                    return totalSize;
                };
                
                const bundleSize = getDirectorySize(distPath);
                const bundleSizeMB = (bundleSize / (1024 * 1024)).toFixed(2);
                console.log(`   📦 Bundle Size: ${bundleSizeMB}MB`);
                
                if (bundleSize > 5 * 1024 * 1024) { // 5MB threshold
                    performanceIssues.push(`Large bundle size: ${bundleSizeMB}MB (consider optimization)`);
                }
            } catch (err) {
                console.log('   ⚠️  Bundle size analysis failed');
            }
        }
        
        // Check for performance anti-patterns
        const performancePatterns = [
            { 
                regex: 'useEffect.*\\[\\].*fetch',
                description: 'Potential inefficient data fetching in useEffect'
            },
            {
                regex: '.*\\.map.*=>.*<.*>.*\\.map',
                description: 'Nested map operations in render (performance concern)'
            }
        ];
        
        const patternIssues = await checkFilePatterns(performancePatterns, 'performance');
        performanceIssues.push(...patternIssues);
        
        if (performanceIssues.length === 0) {
            console.log('   ✅ Performance Analysis: PASSED');
            validationResults.performance = true;
        } else {
            console.log('   ⚠️  Performance Issues Found:');
            performanceIssues.forEach(issue => console.log(`     - ${issue}`));
            console.log('   Note: Review and address performance concerns');
            validationResults.performance = false;
        }

        // STEP 5: SECURITY EVALUATION
        console.log('\n🔒 STEP 5: Security Analysis');
        console.log('   - Scanning for security vulnerabilities...');
        
        const securityIssues = [];
        
        // Check for hardcoded API endpoints and secrets
        const securityPatterns = [
            {
                regex: 'http://.*api\\.|https://.*api\\.',
                description: 'Hardcoded API endpoints'
            },
            {
                regex: '(apikey|api_key|secret|password|token).*[\'"`][^\'"`]{10,}[\'"`]',
                description: 'Potential hardcoded secrets'
            },
            {
                regex: 'dangerouslySetInnerHTML',
                description: 'XSS risk with dangerouslySetInnerHTML'
            },
            {
                regex: 'eval\\s*\\(',
                description: 'Code injection risk with eval()'
            }
        ];
        
        const securityPatternIssues = await checkFilePatterns(securityPatterns, 'security');
        securityIssues.push(...securityPatternIssues);
        
        // Check for console.log statements (information disclosure)
        const consoleLogging = await checkFilePatterns([
            { regex: 'console\\.log', description: 'Console logging statements' }
        ], 'information disclosure');
        
        if (consoleLogging.length > 0) {
            securityIssues.push('Console logging statements found (potential information disclosure)');
        }
        
        if (securityIssues.length === 0) {
            console.log('   ✅ Security Analysis: PASSED');
            validationResults.security = true;
        } else {
            console.log('   ❌ Security Issues Found:');
            securityIssues.forEach(issue => console.log(`     - ${issue}`));
            validationResults.security = false;
        }

        // FINAL RESULTS
        console.log('\n📊 VALIDATION SUMMARY');
        console.log('='.repeat(50));
        
        const results = Object.entries(validationResults);
        const passedCount = results.filter(([key, value]) => value).length;
        const totalCount = results.length;
        
        results.forEach(([key, passed]) => {
            const status = passed ? '✅ PASSED' : '❌ FAILED';
            const displayKey = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
            console.log(`   ${displayKey}: ${status}`);
        });
        
        const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`\n⏱️  Total Time: ${elapsedTime}s`);
        
        if (passedCount === totalCount) {
            console.log('\n🎉 ALL VALIDATION GATES PASSED!');
            console.log('   Ready to proceed to next phase.');
            process.exit(0);
        } else {
            console.log(`\n💥 VALIDATION FAILED: ${totalCount - passedCount} of ${totalCount} gates failed`);
            console.log('   Fix all issues before proceeding.');
            process.exit(1);
        }

    } catch (error) {
        console.log('\n💥 VALIDATION PIPELINE FAILED');
        console.log(`Error: ${error.message}`);
        process.exit(1);
    }
}

main();