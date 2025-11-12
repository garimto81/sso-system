#!/usr/bin/env node

/**
 * Validate Environment Configuration
 *
 * .env 파일과 환경변수를 검증하는 스크립트
 *
 * 사용법:
 *   node scripts/validate-environment.js
 *   node scripts/validate-environment.js --env=production
 *   node scripts/validate-environment.js --fix
 */

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const args = process.argv.slice(2).reduce((acc, arg) => {
  const [key, value] = arg.split('=');
  acc[key.replace('--', '')] = value || true;
  return acc;
}, {});

const ENV = args.env || process.env.NODE_ENV || 'development';
const FIX_MODE = args.fix === true;

// Required environment variables
const REQUIRED_VARS = {
  development: [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'JWT_SECRET',
    'SESSION_SECRET',
    'PORT',
    'NODE_ENV',
    'FRONTEND_URL'
  ],
  production: [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'JWT_SECRET',
    'SESSION_SECRET',
    'NODE_ENV',
    'FRONTEND_URL',
    'ALLOWED_ORIGINS'
  ]
};

// Validation rules
const VALIDATION_RULES = {
  SUPABASE_URL: {
    test: (val) => val?.startsWith('http'),
    message: 'Must be a valid URL starting with http/https',
    production: (val) => val?.startsWith('https'),
    productionMessage: 'Must use HTTPS in production'
  },
  JWT_SECRET: {
    test: (val) => val?.length >= 32,
    message: 'Must be at least 32 characters for security'
  },
  SESSION_SECRET: {
    test: (val) => val?.length >= 32,
    message: 'Must be at least 32 characters for security'
  },
  PORT: {
    test: (val) => !isNaN(parseInt(val)) && parseInt(val) > 0 && parseInt(val) < 65536,
    message: 'Must be a valid port number (1-65535)'
  },
  NODE_ENV: {
    test: (val) => ['development', 'production', 'test'].includes(val),
    message: 'Must be one of: development, production, test'
  },
  FRONTEND_URL: {
    test: (val) => val?.startsWith('http'),
    message: 'Must be a valid URL'
  },
  ALLOWED_ORIGINS: {
    test: (val) => {
      if (!val) return true;
      const origins = val.split(',');
      return origins.every(o => o.trim().startsWith('http'));
    },
    message: 'Must be comma-separated URLs'
  }
};

class ValidationError {
  constructor(key, message, severity = 'error') {
    this.key = key;
    this.message = message;
    this.severity = severity;
  }
}

function checkEnvFile() {
  const envPath = path.join(process.cwd(), '.env');
  const envExamplePath = path.join(process.cwd(), '.env.example');

  const results = {
    envExists: fs.existsSync(envPath),
    envExampleExists: fs.existsSync(envExamplePath),
    gitignored: false
  };

  // Check if .env is in .gitignore
  const gitignorePath = path.join(process.cwd(), '.gitignore');
  if (fs.existsSync(gitignorePath)) {
    const gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');
    results.gitignored = gitignoreContent.includes('.env');
  }

  return results;
}

function validateVariables() {
  const errors = [];
  const warnings = [];
  const required = REQUIRED_VARS[ENV] || REQUIRED_VARS.development;

  console.log(`\n🔍 Validating environment variables for: ${ENV}\n`);

  // Check required variables
  for (const key of required) {
    const value = process.env[key];

    if (!value) {
      errors.push(new ValidationError(
        key,
        'Required variable is missing',
        'error'
      ));
      continue;
    }

    // Apply validation rules
    const rule = VALIDATION_RULES[key];
    if (rule) {
      if (!rule.test(value)) {
        errors.push(new ValidationError(key, rule.message, 'error'));
      }

      // Production-specific validation
      if (ENV === 'production' && rule.production && !rule.production(value)) {
        errors.push(new ValidationError(
          key,
          rule.productionMessage || rule.message,
          'error'
        ));
      }
    }
  }

  // Check for common mistakes
  if (process.env.JWT_SECRET === 'your-jwt-secret-here') {
    warnings.push(new ValidationError(
      'JWT_SECRET',
      'Using default/example value - generate a secure secret!',
      'warning'
    ));
  }

  if (ENV === 'production' && process.env.PORT === '3000') {
    warnings.push(new ValidationError(
      'PORT',
      'Default port 3000 in production - consider changing',
      'warning'
    ));
  }

  return { errors, warnings };
}

function generateSecureSecret() {
  const crypto = await import('crypto');
  return crypto.randomBytes(32).toString('hex');
}

function fixIssues(errors) {
  if (!FIX_MODE) {
    console.log('\n💡 Run with --fix flag to auto-fix some issues\n');
    return;
  }

  console.log('\n🔧 Attempting to fix issues...\n');

  const envPath = path.join(process.cwd(), '.env');
  let envContent = fs.existsSync(envPath)
    ? fs.readFileSync(envPath, 'utf-8')
    : '';

  let fixed = 0;

  for (const error of errors) {
    if (error.key === 'JWT_SECRET' || error.key === 'SESSION_SECRET') {
      const newSecret = generateSecureSecret();

      if (envContent.includes(`${error.key}=`)) {
        envContent = envContent.replace(
          new RegExp(`${error.key}=.*`),
          `${error.key}=${newSecret}`
        );
      } else {
        envContent += `\n${error.key}=${newSecret}`;
      }

      console.log(`   ✅ Generated secure ${error.key}`);
      fixed++;
    }
  }

  if (fixed > 0) {
    fs.writeFileSync(envPath, envContent);
    console.log(`\n✅ Fixed ${fixed} issue(s) in .env file`);
    console.log('⚠️  Please review the changes and restart your application\n');
  } else {
    console.log('   No auto-fixable issues found\n');
  }
}

function printResults(fileCheck, validation) {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 Environment Configuration Report');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // File checks
  console.log('📁 File Checks:');
  console.log(`   .env file:           ${fileCheck.envExists ? '✅' : '❌'} ${fileCheck.envExists ? 'Found' : 'Missing'}`);
  console.log(`   .env.example:        ${fileCheck.envExampleExists ? '✅' : '⚠️'} ${fileCheck.envExampleExists ? 'Found' : 'Not found'}`);
  console.log(`   .gitignore (.env):   ${fileCheck.gitignored ? '✅' : '❌'} ${fileCheck.gitignored ? 'Protected' : 'NOT PROTECTED!'}`);

  if (!fileCheck.gitignored) {
    console.log('\n   ⚠️  CRITICAL: .env is not in .gitignore!');
    console.log('      Add ".env" to .gitignore immediately!\n');
  }

  // Validation errors
  if (validation.errors.length > 0) {
    console.log('\n❌ Errors:');
    for (const error of validation.errors) {
      console.log(`   • ${error.key}: ${error.message}`);
    }
  }

  // Warnings
  if (validation.warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    for (const warning of validation.warnings) {
      console.log(`   • ${warning.key}: ${warning.message}`);
    }
  }

  // Summary
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const totalIssues = validation.errors.length + validation.warnings.length;

  if (totalIssues === 0 && fileCheck.envExists && fileCheck.gitignored) {
    console.log('✅ All checks passed! Environment is properly configured.\n');
  } else {
    console.log(`Status: ${validation.errors.length} error(s), ${validation.warnings.length} warning(s)\n`);

    if (validation.errors.length > 0) {
      console.log('⚠️  Fix errors before deploying to production!');
    }
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

function main() {
  console.log('\n🔐 Environment Validator\n');

  const fileCheck = checkEnvFile();

  if (!fileCheck.envExists) {
    console.error('❌ No .env file found!');
    console.error('\n   Create .env file:');
    console.error('   1. Copy .env.example to .env');
    console.error('   2. Fill in your values');
    console.error('   3. Run this script again\n');
    process.exit(1);
  }

  const validation = validateVariables();
  printResults(fileCheck, validation);

  if (validation.errors.length > 0 && FIX_MODE) {
    fixIssues(validation.errors);
  }

  // Exit with error code if there are errors
  if (validation.errors.length > 0) {
    process.exit(1);
  }
}

main();
