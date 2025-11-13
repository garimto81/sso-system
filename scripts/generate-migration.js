#!/usr/bin/env node

/**
 * Generate Migration Helper
 *
 * 데이터베이스 스키마 변경을 Supabase 마이그레이션 SQL로 변환하는 도우미
 *
 * 사용법:
 *   node scripts/generate-migration.js add-column users phone
 *   node scripts/generate-migration.js create-table sessions
 *   node scripts/generate-migration.js add-index apps email
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const args = process.argv.slice(2);
const command = args[0];
const tableName = args[1];
const columnName = args[2];

if (!command || !tableName) {
  console.error('\n❌ Usage: node generate-migration.js <command> <table> [column]\n');
  console.error('Commands:');
  console.error('  add-column <table> <column>    Add a new column');
  console.error('  create-table <table>           Create a new table');
  console.error('  add-index <table> <column>     Add an index');
  console.error('  add-rls <table>                Add RLS policy');
  console.error('');
  process.exit(1);
}

function getTimestamp() {
  const now = new Date();
  return now.toISOString().replace(/[-:]/g, '').split('.')[0];
}

function generateMigrationSQL(command, tableName, columnName) {
  const templates = {
    'add-column': `
-- Add column ${columnName} to ${tableName}
ALTER TABLE ${tableName}
ADD COLUMN ${columnName} TEXT;

-- Add comment
COMMENT ON COLUMN ${tableName}.${columnName} IS 'TODO: Add description';
`,

    'create-table': `
-- Create ${tableName} table
CREATE TABLE IF NOT EXISTS ${tableName} (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS
ALTER TABLE ${tableName} ENABLE ROW LEVEL SECURITY;

-- Add updated_at trigger
CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON ${tableName}
  FOR EACH ROW
  EXECUTE FUNCTION moddatetime (updated_at);

-- Add comment
COMMENT ON TABLE ${tableName} IS 'TODO: Add table description';
`,

    'add-index': `
-- Add index on ${tableName}.${columnName}
CREATE INDEX IF NOT EXISTS idx_${tableName}_${columnName}
ON ${tableName}(${columnName});

-- Add comment
COMMENT ON INDEX idx_${tableName}_${columnName} IS 'Index for ${columnName} lookups';
`,

    'add-rls': `
-- Add RLS policies for ${tableName}

-- Enable RLS
ALTER TABLE ${tableName} ENABLE ROW LEVEL SECURITY;

-- SELECT policy (all authenticated users)
CREATE POLICY "${tableName}_select_policy"
ON ${tableName}
FOR SELECT
TO authenticated
USING (true);

-- INSERT policy (authenticated users can insert their own)
CREATE POLICY "${tableName}_insert_policy"
ON ${tableName}
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- UPDATE policy (users can update their own)
CREATE POLICY "${tableName}_update_policy"
ON ${tableName}
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- DELETE policy (users can delete their own)
CREATE POLICY "${tableName}_delete_policy"
ON ${tableName}
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
`
  };

  const template = templates[command];
  if (!template) {
    throw new Error(`Unknown command: ${command}`);
  }

  return template.trim() + '\n';
}

function createMigrationFile(sql, command, tableName, columnName) {
  const timestamp = getTimestamp();
  const migrationName = columnName
    ? `${command}_${tableName}_${columnName}`
    : `${command}_${tableName}`;

  const filename = `${timestamp}_${migrationName}.sql`;
  const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');

  // Create migrations directory if it doesn't exist
  if (!fs.existsSync(migrationsDir)) {
    fs.mkdirSync(migrationsDir, { recursive: true });
  }

  const filepath = path.join(migrationsDir, filename);
  fs.writeFileSync(filepath, sql);

  return { filename, filepath };
}

function main() {
  console.log('\n🔄 Supabase Migration Generator\n');

  try {
    const sql = generateMigrationSQL(command, tableName, columnName);
    const { filename, filepath } = createMigrationFile(sql, command, tableName, columnName);

    console.log('✅ Migration file created!\n');
    console.log(`   File: supabase/migrations/${filename}\n`);
    console.log('📝 Generated SQL:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(sql);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('Next steps:');
    console.log('1. Review and edit the migration file');
    console.log('2. Test locally: npx supabase db reset');
    console.log('3. Apply to production: npx supabase db push\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
