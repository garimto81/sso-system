# Admin Setup - Quick Reference

## Create Admin User

### Method 1: npm Script (Recommended)
```bash
npm run admin:setup
```

### Method 2: Windows Wrapper
```bash
scripts\setup-admin-user.bat
```

### Method 3: Linux/macOS Wrapper
```bash
bash scripts/setup-admin-user.sh
```

### Method 4: Direct Execution
```bash
cd server
node scripts/setup-admin.js --email=admin@test.com --password=Test1234!
```

### Method 5: SQL (No Node.js)
```bash
npm run admin:setup:sql
```

## Verify Admin User

```bash
cd server
node scripts/verify-admin.js
```

## Default Credentials

```
Email:    admin@test.com
Password: Test1234!
Role:     admin
```

## Test Login

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"Test1234!"}'
```

## Troubleshooting

| Error | Solution |
|-------|----------|
| Module not found | `cd server && npm install` |
| SUPABASE_URL missing | Check `server/.env` exists |
| User already exists | **OK!** Role updated to admin |
| psql not found | Use Method 1-4 (Node.js) |

## Files

- `server/scripts/setup-admin.js` - Primary script
- `server/scripts/verify-admin.js` - Verification
- `scripts/setup-admin-user.sql` - SQL alternative
- `scripts/setup-admin-user.bat` - Windows wrapper
- `scripts/setup-admin-user.sh` - Bash wrapper

## Documentation

- **Full Guide:** [scripts/README.md](scripts/README.md#-admin-user-setup)
- **Architecture:** [DEPLOYMENT_SCRIPTS_SUMMARY.md](DEPLOYMENT_SCRIPTS_SUMMARY.md)
