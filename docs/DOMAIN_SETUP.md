# Domain & Subdomain Setup Guide

## Final Domain Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    SOLA+ DOMAIN STRUCTURE                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  solaplus.ai                → Marketing site (separate)        │
│  app.solaplus.ai            → Creator dashboard (login/manage) │
│  {slug}.solaplus.ai         → Creator's member site            │
│                                                                 │
│  Examples:                                                      │
│  ├── grace-church.solaplus.ai                                  │
│  ├── pastor-john.solaplus.ai                                   │
│  └── ministry-name.solaplus.ai                                 │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  CUSTOM DOMAINS (creator's own)                                 │
│                                                                 │
│  theirdomain.com            → Creator's member site            │
│  community.theirdomain.com  → Creator's member site            │
│  courses.theirdomain.com    → Creator's member site            │
│                                                                 │
│  All custom domains point to the same Vercel project           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Quick Reference

| Domain Type | Example | Points To | DNS Record |
|-------------|---------|-----------|------------|
| Marketing | `solaplus.ai` | Separate hosting | N/A |
| Dashboard | `app.solaplus.ai` | Vercel | CNAME |
| Creator subdomain | `grace-church.solaplus.ai` | Vercel | Wildcard CNAME |
| Custom domain | `theirdomain.com` | Vercel | A record or CNAME |
| Custom subdomain | `community.theirdomain.com` | Vercel | CNAME |

---

## Step 1: Find Your Vercel DNS Target

**⚠️ IMPORTANT: Get the correct target from Vercel**

1. Go to [vercel.com](https://vercel.com) → Your Project → **Settings** → **Domains**
2. Click **Add Domain** and enter `app.solaplus.ai`
3. Vercel will show you the **exact DNS configuration**

Typically, Vercel shows:
- **CNAME target:** `cname.vercel-dns.com`
- **A record (for apex):** `76.76.21.21`

**Screenshot what Vercel tells you - use THOSE values.**

---

## Step 2: Cloudflare DNS Configuration

### 2.1 Log into Cloudflare

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com)
2. Select **solaplus.ai**
3. Click **DNS** in the sidebar

### 2.2 Add These Records

| Type | Name | Target | Proxy Status |
|------|------|--------|--------------|
| CNAME | `app` | `cname.vercel-dns.com` | **DNS Only** (grey cloud) ☁️ |
| CNAME | `*` | `cname.vercel-dns.com` | **DNS Only** (grey cloud) ☁️ |

### 2.3 Step-by-Step

**Add `app` subdomain (for creator dashboard):**
1. Click **Add Record**
2. Type: `CNAME`
3. Name: `app`
4. Target: `cname.vercel-dns.com` (or whatever Vercel shows you)
5. **Click the orange cloud → turn it GREY (DNS Only)**
6. Click **Save**

**Add wildcard (for all creator subdomains):**
1. Click **Add Record**
2. Type: `CNAME`
3. Name: `*`
4. Target: `cname.vercel-dns.com` (or whatever Vercel shows you)
5. **Click the orange cloud → turn it GREY (DNS Only)**
6. Click **Save**

### 2.4 Your DNS Should Look Like This

```
Type    Name    Content                  Proxy    TTL
─────────────────────────────────────────────────────
CNAME   app     cname.vercel-dns.com     ☁️ DNS   Auto
CNAME   *       cname.vercel-dns.com     ☁️ DNS   Auto
```

### ⚠️ Why DNS Only (Grey Cloud)?

**The grey cloud is REQUIRED because:**
- Vercel needs to provision SSL certificates
- Orange cloud (Proxied) blocks Vercel's SSL process
- Wildcard certificates require direct DNS validation

---

## Step 3: Vercel Domain Configuration

### 3.1 Add the App Domain

1. Go to Vercel → Your Project → **Settings** → **Domains**
2. Click **Add**
3. Enter: `app.solaplus.ai`
4. Click **Add**

### 3.2 Add the Wildcard Domain

1. Click **Add** again
2. Enter: `*.solaplus.ai`
3. Click **Add**

### 3.3 Verify Both Are Valid

After a few minutes, you should see:
```
✓ app.solaplus.ai      Valid Configuration
✓ *.solaplus.ai        Valid Configuration
```

---

## Step 4: Environment Variables

In Vercel → **Settings** → **Environment Variables**, set:

```env
# Root domain (without subdomain)
NEXT_PUBLIC_ROOT_DOMAIN=solaplus.ai

# App subdomain (where creators log in)
NEXT_PUBLIC_APP_SUBDOMAIN=app

# Full app URL
NEXT_PUBLIC_APP_URL=https://app.solaplus.ai
```

Then **redeploy** the app.

---

## Step 5: Custom Domain Setup

When a creator wants their own domain:

### Option A: Apex Domain (theirdomain.com)

**Creator does this in their DNS:**
```
Type: A
Name: @ (or blank)
Value: 76.76.21.21   ← Vercel's IP address
```

**You do this in Vercel:**
1. Go to Vercel → Domains → **Add**
2. Enter: `theirdomain.com`
3. Vercel provisions SSL automatically

### Option B: Subdomain (community.theirdomain.com)

**Creator does this in their DNS:**
```
Type: CNAME
Name: community
Value: cname.vercel-dns.com
```

**You do this in Vercel:**
1. Go to Vercel → Domains → **Add**
2. Enter: `community.theirdomain.com`
3. Vercel provisions SSL automatically

### Database Update

When a creator configures a custom domain in settings, update their organization:

```sql
UPDATE "Organization"
SET "customDomain" = 'theirdomain.com'
WHERE "slug" = 'their-slug';
```

---

## Step 6: Testing

### Test Dashboard
```
https://app.solaplus.ai
→ Should show login / creator dashboard
```

### Test Creator Subdomain
```
https://grace-church.solaplus.ai
→ Should show that org's member site
→ (Requires org with slug "grace-church" in database)
```

### Test 404
```
https://nonexistent-org.solaplus.ai
→ Should show "Community Not Found"
```

### Test Custom Domain
```
https://theirdomain.com
→ Should show that org's member site
→ (Requires customDomain set in database)
```

### Local Development
```
http://localhost:3000?org=grace-church
→ Simulates grace-church.solaplus.ai
```

---

## Reserved Subdomains

These subdomains are reserved and won't route to organizations:

| Subdomain | Purpose |
|-----------|---------|
| `app` | Creator dashboard |
| `www` | Redirect to root |
| `api` | API endpoints |
| `admin` | Admin panel |
| `help` | Help center |
| `docs` | Documentation |
| `blog` | Blog |
| `status` | Status page |

---

## Troubleshooting

### "This site can't be reached"
- DNS hasn't propagated yet (wait 5-60 minutes)
- Check at [dnschecker.org](https://dnschecker.org)

### "Connection not secure" / SSL Error
- Cloudflare proxy is ON (orange cloud) → Turn it OFF (grey)
- Wait 15-30 minutes for Vercel to provision certificate

### Subdomain shows wrong content
- Verify org exists in database with matching slug
- Check middleware is deployed
- Clear browser cache

### Custom domain not working
- Verify DNS points to Vercel (CNAME or A record)
- Add domain to Vercel project
- Set `customDomain` in organization's database record

### Vercel says "Invalid Configuration"
- DNS record doesn't match what Vercel expects
- Check the exact value Vercel shows when adding the domain

---

## Complete Checklist

```
CLOUDFLARE
□ CNAME "app" → cname.vercel-dns.com (DNS Only - grey cloud)
□ CNAME "*" → cname.vercel-dns.com (DNS Only - grey cloud)

VERCEL
□ Domain "app.solaplus.ai" added
□ Wildcard "*.solaplus.ai" added
□ Both show "Valid Configuration"

ENVIRONMENT VARIABLES
□ NEXT_PUBLIC_ROOT_DOMAIN=solaplus.ai
□ NEXT_PUBLIC_APP_SUBDOMAIN=app
□ NEXT_PUBLIC_APP_URL=https://app.solaplus.ai

DEPLOY
□ Push latest code with updated middleware
□ Wait for deployment to complete

TEST
□ https://app.solaplus.ai loads dashboard
□ https://{slug}.solaplus.ai loads org site
□ https://fake.solaplus.ai shows 404
□ localhost:3000?org=slug works for dev

CUSTOM DOMAINS (as needed)
□ Creator adds DNS record pointing to Vercel
□ You add domain to Vercel project
□ Set customDomain in database
```

---

## API Automation (Future)

Automate custom domain setup with Vercel API:

```typescript
// Add a custom domain to Vercel
async function addDomainToVercel(domain: string) {
  const response = await fetch(
    `https://api.vercel.com/v10/projects/${VERCEL_PROJECT_ID}/domains`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${VERCEL_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: domain }),
    }
  )
  return response.json()
}

// Call this when creator saves custom domain in settings
await addDomainToVercel('theirdomain.com')
```

Get your Vercel token at: https://vercel.com/account/tokens
