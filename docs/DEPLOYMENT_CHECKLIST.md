# Deployment Checklist - SSO System

**Date Created**: 2025-11-13
**Version**: 1.0.0
**Related**: PR #17 Hotfix - Prevent Production Bugs

---

## 📋 Overview

This checklist ensures that all deployments to production are properly tested and validated before going live. It was created after the PR #17 production incident where login redirects failed in production but worked locally.

**Key Principle**: If it's not tested in production-like environment, it's not ready for production.

---

## 🚀 Pre-Deployment Checklist

### 1. Code Review ✅

- [ ] **Pull Request Created**
  - PR title follows convention: `type: description [PRD-####]`
  - Description includes problem, solution, and testing done
  - Screenshots/videos for UI changes

- [ ] **Code Review Completed**
  - At least 1 approval from team member
  - All comments addressed
  - No merge conflicts

- [ ] **Security Review** (for auth/redirect/payment features)
  - [ ] Input validation added
  - [ ] SQL injection prevention verified
  - [ ] XSS prevention verified
  - [ ] CSRF protection verified
  - [ ] Open redirect attacks blocked
  - [ ] Secrets not committed

### 2. Automated Tests ✅

#### Backend Tests
- [ ] **Unit Tests Pass**
  ```bash
  cd server
  npm test
  # Target: 80%+ coverage
  ```

- [ ] **Integration Tests Pass**
  ```bash
  npm test -- src/routes/__tests__/
  # All admin API tests passing
  ```

#### Frontend Tests
- [ ] **Build Succeeds**
  ```bash
  cd admin-dashboard
  npm run build
  # No TypeScript errors, no build errors
  ```

- [ ] **Type Check Passes**
  ```bash
  npm run type-check
  # No TypeScript compilation errors
  ```

- [ ] **Lint Passes**
  ```bash
  npm run lint
  # No linting errors (warnings acceptable)
  ```

#### E2E Tests
- [ ] **All E2E Tests Pass**
  ```bash
  npm run test:e2e
  # All Playwright tests passing
  ```

- [ ] **Login Redirect Tests Pass** (Critical after PR #17)
  ```bash
  npm run test:e2e -- login-redirect.spec.ts
  # All 16 tests must pass
  ```

### 3. Local Testing ✅

- [ ] **Development Environment Works**
  - Supabase running locally
  - Backend server running
  - Frontend dev server running
  - No console errors
  - No network errors

- [ ] **Feature Functionality**
  - [ ] Happy path tested manually
  - [ ] Error cases tested manually
  - [ ] Edge cases considered
  - [ ] Mobile responsive (if UI changes)

- [ ] **Authentication Flow** (if auth-related changes)
  - [ ] Login works
  - [ ] Logout works
  - [ ] Protected routes work
  - [ ] httpOnly cookies set correctly
  - [ ] Middleware validates tokens

- [ ] **Database Changes** (if schema changes)
  - [ ] Migration tested locally
  - [ ] Rollback tested
  - [ ] Data integrity verified
  - [ ] No data loss

### 4. Vercel Preview Deployment ✅

**CRITICAL**: Always test on Vercel preview before merging to production

- [ ] **Preview URL Generated**
  - Vercel automatically creates preview deployment
  - URL format: `https://sso-frontend-<hash>-garimto81s-projects.vercel.app`

- [ ] **Preview Environment Verification**
  ```bash
  # Check deployment status
  curl -I https://your-preview-url.vercel.app

  # Expected: HTTP 200 OK
  ```

- [ ] **Smoke Tests on Preview**
  - [ ] Login page loads
  - [ ] Login with valid credentials works
  - [ ] Redirect after login works (CRITICAL!)
  - [ ] Protected routes accessible after auth
  - [ ] Logout works
  - [ ] No console errors in browser DevTools

- [ ] **Network Tab Verification**
  - [ ] API calls succeed (200 OK)
  - [ ] httpOnly cookies set correctly
  - [ ] CORS headers present
  - [ ] Security headers present (CSP, HSTS, X-Frame-Options)

- [ ] **Production Parity Check**
  - [ ] Environment variables correctly set
  - [ ] Backend API URL correct
  - [ ] Database connection works
  - [ ] External services accessible (if any)

### 5. Production Environment Preparation ✅

#### Environment Variables
- [ ] **All Required Env Vars Set in Vercel**
  ```bash
  vercel env list

  # Required:
  # - SUPABASE_URL
  # - SUPABASE_ANON_KEY
  # - SUPABASE_SERVICE_ROLE_KEY
  # - NEXT_PUBLIC_API_URL
  # - JWT_SECRET
  # - SESSION_SECRET
  ```

- [ ] **Secrets Rotated** (if security incident)
  - [ ] New JWT_SECRET
  - [ ] New SESSION_SECRET
  - [ ] Database credentials updated
  - [ ] API keys regenerated

#### Database
- [ ] **Migrations Ready** (if DB changes)
  ```bash
  # Test migration first
  npx supabase db reset --local

  # Then apply to production
  npx supabase db push --db-url postgresql://...
  ```

- [ ] **Backup Created**
  - [ ] Database backup taken
  - [ ] Backup tested (can restore)
  - [ ] Backup retention policy verified

### 6. Documentation ✅

- [ ] **Code Comments Added**
  - Complex logic explained
  - Security decisions documented
  - Trade-offs explained (e.g., reliability > UX)

- [ ] **README Updated** (if needed)
  - New environment variables
  - Setup instructions
  - Deployment instructions

- [ ] **CHANGELOG Updated**
  - Version bumped (Semantic Versioning)
  - Changes documented
  - Breaking changes noted

- [ ] **API Documentation Updated** (if API changes)
  - OpenAPI spec updated
  - Example requests/responses
  - Error codes documented

---

## 🎯 Deployment Execution

### Step 1: Final Pre-Flight Check

- [ ] **Review Checklist**
  - All items above completed
  - No blockers or concerns

- [ ] **Team Notification**
  - [ ] Inform team of upcoming deployment
  - [ ] Deployment window communicated
  - [ ] Rollback plan ready

### Step 2: Merge to Production Branch

```bash
# Verify you're on the correct branch
git branch

# Merge PR via GitHub (squash and merge)
gh pr merge <PR_NUMBER> --squash --delete-branch

# Or via git
git checkout master
git merge --squash feature/branch-name
git push origin master
```

- [ ] **Merge Successful**
- [ ] **Vercel Automatic Deployment Triggered**

### Step 3: Monitor Deployment

- [ ] **Vercel Deployment Status**
  ```bash
  # Watch deployment progress
  vercel --prod
  ```

- [ ] **Build Logs Checked**
  - No errors in build logs
  - All steps completed successfully

- [ ] **Deployment Time**
  - Record deployment timestamp
  - Note deployment duration

### Step 4: Post-Deployment Verification

#### Immediate Verification (< 5 minutes)

- [ ] **Health Check**
  ```bash
  curl https://sso-frontend.vercel.app/health
  # Expected: HTTP 200 OK
  ```

- [ ] **Critical Path Testing**
  - [ ] Login page loads
  - [ ] Admin login succeeds
  - [ ] Redirect after login works
  - [ ] Dashboard loads
  - [ ] Core features work

- [ ] **Error Monitoring**
  - [ ] No 500 errors in logs
  - [ ] No JavaScript errors in console
  - [ ] No failed API calls

#### Extended Verification (30 minutes)

- [ ] **Run Production E2E Tests**
  ```bash
  npm run test:e2e -- prod-login.spec.ts
  # All tests should pass
  ```

- [ ] **Performance Check**
  - [ ] Page load time < 3s
  - [ ] API response time < 500ms
  - [ ] No memory leaks

- [ ] **Cross-Browser Testing** (if UI changes)
  - [ ] Chrome works
  - [ ] Firefox works
  - [ ] Safari works (if possible)

- [ ] **Mobile Testing** (if UI changes)
  - [ ] Responsive design works
  - [ ] Touch interactions work
  - [ ] Mobile browsers work

#### Monitoring (24 hours)

- [ ] **Error Rate Monitoring**
  - [ ] Vercel Analytics checked
  - [ ] No spike in error rate
  - [ ] No user-reported issues

- [ ] **Performance Monitoring**
  - [ ] Response times normal
  - [ ] Resource usage normal
  - [ ] No degradation

---

## 🚨 Rollback Procedure

If any issue is detected post-deployment:

### Step 1: Assess Severity

**P0 - CRITICAL** (System down, login broken, data loss)
→ **Immediate Rollback**

**P1 - HIGH** (Major feature broken, affects many users)
→ **Rollback within 30 minutes**

**P2 - MEDIUM** (Minor feature broken, affects some users)
→ **Hotfix or rollback within 2 hours**

**P3 - LOW** (UI issue, affects few users)
→ **Fix in next deployment**

### Step 2: Execute Rollback

```bash
# Option 1: Revert via Vercel Dashboard
# Go to Vercel → Deployments → Previous Deployment → Promote to Production

# Option 2: Git Revert
git revert <commit-sha>
git push origin master

# Option 3: Redeploy Previous Version
vercel --prod --force --yes
```

### Step 3: Notify Team

- [ ] **Incident Report Created**
  - What happened
  - When it happened
  - Impact (how many users affected)
  - Resolution (rollback or hotfix)

- [ ] **Team Notified**
  - Slack/Discord message
  - Email if critical
  - Update status page

### Step 4: Root Cause Analysis

- [ ] **Why did tests not catch this?**
  - Add new test cases
  - Improve test coverage
  - Update CI/CD checks

- [ ] **Why did preview deployment not catch this?**
  - Improve preview testing
  - Add production parity checks

- [ ] **Document Lessons Learned**
  - Update this checklist
  - Create incident report
  - Share with team

---

## 📊 Deployment Metrics

Track these metrics for each deployment:

| Metric | Target | Actual |
|--------|--------|--------|
| Build Time | < 5 min | _____ |
| Deployment Time | < 2 min | _____ |
| Total Time (PR → Live) | < 30 min | _____ |
| Test Coverage | > 80% | _____ |
| E2E Tests Pass Rate | 100% | _____ |
| Post-Deploy Errors | 0 | _____ |
| Rollback Rate | < 5% | _____ |

---

## 🎓 Lessons Learned from PR #17

### What Went Wrong

1. **Insufficient Production Testing**
   - PR #15 tested locally only
   - Vercel preview not tested
   - Production behavior different from local

2. **Environment Parity Issue**
   - Dev server behaves differently than production
   - httpOnly cookie handling differs
   - router.push() works locally, fails in production

3. **Missing E2E Tests**
   - No E2E test for redirect flow
   - No test for httpOnly cookie transmission
   - Regression not caught

### How This Checklist Prevents It

✅ **Vercel Preview Testing Required**
- Section 4: Test on preview before merging
- Verify actual production behavior

✅ **E2E Tests Required**
- Section 2: Run login-redirect.spec.ts
- 16 comprehensive tests cover the bug

✅ **Production Parity Checks**
- Section 4: Verify preview environment
- Check httpOnly cookies, network tab

✅ **Post-Deployment Verification**
- Section 4: Run production E2E tests
- Monitor error rates

---

## 🔧 Tools and Commands

### Quick Reference

**Check Deployment Status:**
```bash
vercel --prod
```

**Run All Tests:**
```bash
# Backend
cd server && npm test

# Frontend Build
cd admin-dashboard && npm run build

# E2E Tests
npm run test:e2e

# Production E2E
npm run test:e2e -- prod-login.spec.ts
```

**Database Management:**
```bash
# Create migration
npx supabase migration new migration_name

# Test locally
npx supabase db reset

# Apply to production
npx supabase db push --db-url postgresql://...
```

**Emergency Rollback:**
```bash
git revert HEAD
git push origin master
```

---

## ✅ Sign-Off

Before deploying to production, the following people must approve:

- [ ] **Developer**: Code author confirms all checklist items complete
- [ ] **Reviewer**: Code reviewer approves PR
- [ ] **QA** (if applicable): Manual testing completed
- [ ] **Tech Lead** (for high-risk changes): Final approval

**Deployment Authorized By**: _________________
**Date**: _________________
**Time**: _________________

---

## 📚 Related Documentation

- **Hotfix Report**: `docs/HOTFIX_LOGIN_REDIRECT.md`
- **E2E Testing Guide**: `docs/E2E_TESTING_GUIDE.md`
- **Security Fix Report**: `docs/REDIRECT_SECURITY_FIX_REPORT.md`
- **Vercel Documentation**: https://vercel.com/docs
- **Supabase Documentation**: https://supabase.com/docs

---

## 🔄 Checklist Maintenance

This checklist should be reviewed and updated:

- **After each incident**: Add learnings from production issues
- **Quarterly**: Review all items for relevance
- **When tools change**: Update commands and procedures
- **When team grows**: Add role-specific checks

**Last Updated**: 2025-11-13
**Version**: 1.0.0
**Next Review**: 2025-02-13

---

**Report Generated**: 2025-11-13
**Author**: Claude Code
**Status**: ✅ Ready for Use

---

*This deployment checklist was created after the PR #17 production incident to prevent similar issues in the future.*
