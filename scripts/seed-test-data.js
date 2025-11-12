#!/usr/bin/env node

/**
 * Seed Test Data
 *
 * 테스트용 앱과 Analytics 데이터 생성
 *
 * 사용법:
 *   node scripts/seed-test-data.js
 *   node scripts/seed-test-data.js --count=10 --events=500
 *   node scripts/seed-test-data.js --clean
 */

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// CLI arguments
const args = process.argv.slice(2).reduce((acc, arg) => {
  const [key, value] = arg.split('=');
  acc[key.replace('--', '')] = value || true;
  return acc;
}, {});

const APP_COUNT = parseInt(args.count) || 5;
const EVENTS_PER_APP = parseInt(args.events) || 300;
const CLEAN_FIRST = args.clean === true;

// Test apps data
const TEST_APPS = [
  {
    name: 'OJT Platform',
    description: 'Employee training and onboarding system',
    redirect_urls: ['http://localhost:3001/callback', 'https://ojt.example.com/callback'],
    allowed_origins: ['http://localhost:3001', 'https://ojt.example.com'],
    is_active: true
  },
  {
    name: 'Contents Factory',
    description: 'Content management and publishing platform',
    redirect_urls: ['http://localhost:3002/auth', 'https://contents.example.com/auth'],
    allowed_origins: ['http://localhost:3002', 'https://contents.example.com'],
    is_active: true
  },
  {
    name: 'HR System',
    description: 'Human resources management system',
    redirect_urls: ['http://localhost:3003/callback'],
    allowed_origins: ['http://localhost:3003'],
    is_active: false
  },
  {
    name: 'Customer Portal',
    description: 'Customer self-service portal',
    redirect_urls: ['https://portal.example.com/sso'],
    allowed_origins: ['https://portal.example.com'],
    is_active: true
  },
  {
    name: 'Analytics Dashboard',
    description: 'Business intelligence and analytics',
    redirect_urls: ['http://localhost:3004/callback', 'https://analytics.example.com/callback'],
    allowed_origins: ['http://localhost:3004', 'https://analytics.example.com'],
    is_active: true
  }
];

function generateApiKey() {
  return crypto.randomUUID();
}

function generateApiSecret() {
  return crypto.randomBytes(32).toString('hex');
}

async function hashSecret(secret) {
  return await bcrypt.hash(secret, 10);
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDateLast30Days() {
  const now = new Date();
  const daysAgo = randomInt(0, 30);
  const hoursAgo = randomInt(0, 23);
  const minutesAgo = randomInt(0, 59);

  const date = new Date(now);
  date.setDate(date.getDate() - daysAgo);
  date.setHours(date.getHours() - hoursAgo);
  date.setMinutes(date.getMinutes() - minutesAgo);

  return date.toISOString();
}

function randomIP() {
  return `${randomInt(1, 255)}.${randomInt(0, 255)}.${randomInt(0, 255)}.${randomInt(1, 255)}`;
}

async function cleanOldData() {
  console.log('🧹 Cleaning old test data...');

  // Delete test apps (analytics will cascade delete)
  const { error } = await supabase
    .from('apps')
    .delete()
    .like('name', '%Test%')
    .or('name.in.(OJT Platform,Contents Factory,HR System,Customer Portal,Analytics Dashboard)');

  if (error) {
    console.warn('⚠️  Could not clean old data:', error.message);
  } else {
    console.log('✅ Old test data cleaned');
  }
}

async function getAdminUser() {
  // Get first admin user
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email')
    .eq('role', 'admin')
    .limit(1)
    .single();

  if (error || !data) {
    console.error('❌ No admin user found. Please run setup-admin-user.js first');
    process.exit(1);
  }

  return data;
}

async function seedApps(adminUser) {
  console.log(`\n📱 Creating ${APP_COUNT} test apps...`);

  const credentials = [];
  const apps = [];

  for (let i = 0; i < APP_COUNT; i++) {
    const appData = TEST_APPS[i % TEST_APPS.length];
    const api_key = generateApiKey();
    const api_secret = generateApiSecret();
    const api_secret_hash = await hashSecret(api_secret);

    const { data, error } = await supabase
      .from('apps')
      .insert({
        name: `${appData.name}${i >= TEST_APPS.length ? ` ${i + 1}` : ''}`,
        description: appData.description,
        api_key,
        api_secret_hash,
        redirect_urls: appData.redirect_urls,
        allowed_origins: appData.allowed_origins,
        is_active: appData.is_active,
        owner_id: adminUser.id
      })
      .select()
      .single();

    if (error) {
      console.error(`❌ Error creating app: ${error.message}`);
      continue;
    }

    apps.push(data);
    credentials.push({
      name: data.name,
      api_key,
      api_secret
    });

    console.log(`   ✅ ${data.name} (${data.is_active ? 'Active' : 'Inactive'})`);
  }

  return { apps, credentials };
}

async function seedAnalytics(apps) {
  console.log(`\n📊 Creating analytics events...`);

  const eventTypes = ['login', 'token_exchange', 'error', 'app_created'];
  let totalEvents = 0;

  for (const app of apps) {
    if (!app.is_active) continue; // Skip inactive apps

    const eventCount = randomInt(EVENTS_PER_APP - 100, EVENTS_PER_APP + 100);
    const events = [];

    for (let i = 0; i < eventCount; i++) {
      const eventType = eventTypes[randomInt(0, eventTypes.length - 1)];

      events.push({
        app_id: app.id,
        event_type: eventType,
        user_id: app.owner_id,
        metadata: {
          ip: randomIP(),
          user_agent: 'Mozilla/5.0 (Test Data)',
          success: eventType !== 'error' ? true : false
        },
        created_at: randomDateLast30Days()
      });
    }

    const { error } = await supabase
      .from('app_analytics')
      .insert(events);

    if (error) {
      console.error(`   ❌ Error creating analytics for ${app.name}`);
      continue;
    }

    totalEvents += eventCount;
    console.log(`   ✅ ${app.name}: ${eventCount} events`);
  }

  return totalEvents;
}

function saveCredentials(credentials) {
  const filename = 'seed-data-credentials.txt';
  const content = [
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    'SSO Test Apps - API Credentials',
    '⚠️  FOR TESTING ONLY - DELETE AFTER USE',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n',
    ...credentials.map(c =>
      `${c.name}\n` +
      `  API Key:    ${c.api_key}\n` +
      `  API Secret: ${c.api_secret}\n`
    ),
    '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    'Generated: ' + new Date().toISOString(),
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
  ].join('\n');

  fs.writeFileSync(filename, content);
  console.log(`\n🔑 Credentials saved to: ${filename}`);
  console.log('⚠️  Keep this file secure and delete after testing!\n');
}

async function main() {
  console.log('\n🌱 SSO Test Data Seeder\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const startTime = Date.now();

  try {
    // Clean old data if requested
    if (CLEAN_FIRST) {
      await cleanOldData();
    }

    // Get admin user
    const adminUser = await getAdminUser();
    console.log(`👤 Using admin: ${adminUser.email}`);

    // Seed apps
    const { apps, credentials } = await seedApps(adminUser);

    // Seed analytics
    const totalEvents = await seedAnalytics(apps);

    // Save credentials
    saveCredentials(credentials);

    // Summary
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Seeding Complete!\n');
    console.log(`   Apps Created:        ${apps.length}`);
    console.log(`   Analytics Events:    ${totalEvents.toLocaleString()}`);
    console.log(`   Time Taken:          ${elapsed}s\n`);

    // Apps summary table
    console.log('📱 Apps Summary:');
    console.log('┌────┬─────────────────────────┬──────────┬─────────┐');
    console.log('│ #  │ Name                    │ Status   │ Events  │');
    console.log('├────┼─────────────────────────┼──────────┼─────────┤');

    for (let i = 0; i < apps.length; i++) {
      const app = apps[i];
      const { count } = await supabase
        .from('app_analytics')
        .select('*', { count: 'exact', head: true })
        .eq('app_id', app.id);

      const status = app.is_active ? '✅ Active' : '🔴 Inactive';
      const name = app.name.padEnd(23);
      console.log(`│ ${(i + 1).toString().padStart(2)} │ ${name} │ ${status}  │ ${count.toString().padStart(7)} │`);
    }
    console.log('└────┴─────────────────────────┴──────────┴─────────┘\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
