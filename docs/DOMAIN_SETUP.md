# Domain & Subdomain Setup Guide

This guide explains how to configure Cloudflare and Vercel for Sola+ multi-tenant subdomains and custom domains.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLOUDFLARE                              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  DNS Zone: solaplus.ai                                   │   │
│  │                                                          │   │
│  │  my.solaplus.ai          → CNAME → cname.vercel-dns.com │   │
│  │  *.my.solaplus.ai        → CNAME → cname.vercel-dns.com │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                           VERCEL                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Project Domains:                                        │   │
│  │    - my.solaplus.ai (primary)                           │   │
│  │    - *.my.solaplus.ai (wildcard)                        │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      NEXT.JS MIDDLEWARE                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  my.solaplus.ai         → /dashboard (creator dashboard)│   │
│  │  {slug}.my.solaplus.ai  → /org (member-facing site)     │   │
│  │  custom.domain.com      → /org (via custom domain)      │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Step 1: Cloudflare DNS Configuration

### 1.1 Log into Cloudflare

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com)
2. Select your domain: `solaplus.ai`
3. Click **DNS** in the left sidebar

### 1.2 Add DNS Records

Add these records:

| Type  | Name | Target                  | Proxy Status | TTL  |
|-------|------|-------------------------|--------------|------|
| CNAME | my   | cname.vercel-dns.com    | DNS Only ☁️  | Auto |
| CNAME | *.my | cname.vercel-dns.com    | DNS Only ☁️  | Auto |

**CRITICAL: Set Proxy Status to "DNS Only" (grey cloud)**

The orange cloud (Proxied) will break SSL certificate provisioning. Vercel needs to handle SSL directly.

### 1.3 How to Add Records

1. Click **Add Record**
2. For the main subdomain:
   - Type: `CNAME`
   - Name: `my`
   - Target: `cname.vercel-dns.com`
   - Proxy status: Click the orange cloud to turn it **grey** (DNS Only)
   - Click **Save**

3. For the wildcard:
   - Type: `CNAME`
   - Name: `*.my`
   - Target: `cname.vercel-dns.com`
   - Proxy status: **DNS Only** (grey cloud)
   - Click **Save**

### 1.4 Verify DNS Records

After adding, your DNS section should look like:

```
Type   Name    Content               Proxy  TTL
CNAME  my      cname.vercel-dns.com  ☁️     Auto
CNAME  *.my    cname.vercel-dns.com  ☁️     Auto
```

---

## Step 2: Vercel Configuration

### 2.1 Add Domains to Your Project

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your project: `sola`
3. Go to **Settings** → **Domains**

### 2.2 Add the Main Domain

1. Click **Add Domain**
2. Enter: `my.solaplus.ai`
3. Click **Add**
4. Vercel will show a verification step - it should auto-verify since DNS is configured

### 2.3 Add the Wildcard Domain

1. Click **Add Domain** again
2. Enter: `*.my.solaplus.ai`
3. Click **Add**
4. This enables all subdomains like `grace-church.my.solaplus.ai`

### 2.4 SSL Certificates

Vercel automatically provisions SSL certificates for:
- `my.solaplus.ai`
- `*.my.solaplus.ai` (wildcard certificate)

This may take 5-15 minutes after DNS propagation.

### 2.5 Verify in Vercel

Your Domains page should show:

```
Domain                  Status
my.solaplus.ai         ✓ Valid Configuration
*.my.solaplus.ai       ✓ Valid Configuration
```

---

## Step 3: Environment Variables

### 3.1 Set in Vercel

Go to **Settings** → **Environment Variables** and ensure:

```
NEXT_PUBLIC_SUBDOMAIN_BASE=my.solaplus.ai
NEXT_PUBLIC_APP_URL=https://my.solaplus.ai
```

### 3.2 Redeploy

After adding environment variables, redeploy your application:

```bash
# Push any change or trigger manual redeploy
git commit --allow-empty -m "Trigger redeploy"
git push
```

---

## Step 4: Custom Domain Setup (For Creators)

When a creator wants to use their own domain (e.g., `community.graceChurch.com`):

### 4.1 Creator's Steps (shown in Domain Settings page)

The creator adds a CNAME record in their DNS:

| Type  | Name      | Target           |
|-------|-----------|------------------|
| CNAME | community | my.solaplus.ai   |

### 4.2 Your Steps (Add to Vercel)

1. Go to Vercel → Settings → Domains
2. Add their custom domain: `community.gracechurch.com`
3. Vercel will provision SSL automatically

### 4.3 Automation (Future)

For automation, use the Vercel API:

```javascript
// Add domain via Vercel API
const response = await fetch(
  `https://api.vercel.com/v10/projects/${projectId}/domains`,
  {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${VERCEL_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: 'community.gracechurch.com',
    }),
  }
)
```

---

## Step 5: Testing

### 5.1 Test Main Domain

1. Visit `https://my.solaplus.ai`
2. Should show the login page / dashboard

### 5.2 Test Subdomain

1. Create an organization with slug `test-org`
2. Visit `https://test-org.my.solaplus.ai`
3. Should show the organization's member-facing page

### 5.3 Test 404

1. Visit `https://nonexistent.my.solaplus.ai`
2. Should show "Community Not Found" page

---

## Troubleshooting

### SSL Certificate Issues

**Problem:** Browser shows "Connection not secure"

**Solution:**
1. Ensure Cloudflare proxy is OFF (grey cloud)
2. Wait 15-30 minutes for certificate provisioning
3. Check Vercel Domains page for certificate status

### Subdomain Not Working

**Problem:** `{slug}.my.solaplus.ai` shows 404 or wrong content

**Solution:**
1. Verify wildcard DNS record exists: `*.my`
2. Check Vercel has wildcard domain: `*.my.solaplus.ai`
3. Ensure middleware is deployed (check /src/middleware.ts)
4. Check organization slug matches URL exactly

### Custom Domain Not Working

**Problem:** Creator's custom domain not loading

**Solution:**
1. Verify CNAME points to `my.solaplus.ai`
2. Add the domain to Vercel project
3. Check `customDomain` field is set in organization database
4. DNS propagation can take up to 24 hours

### Cloudflare SSL Mode

If you're using Cloudflare's proxy (orange cloud), set SSL mode:

1. Go to Cloudflare → SSL/TLS
2. Set mode to **Full (strict)**

However, we recommend **DNS Only** mode for simpler setup.

---

## DNS Propagation

DNS changes can take time to propagate:

- **Cloudflare internal:** 1-5 minutes
- **Global propagation:** Up to 24-48 hours (usually faster)

Check propagation status at:
- [dnschecker.org](https://dnschecker.org)
- [whatsmydns.net](https://whatsmydns.net)

---

## Summary Checklist

- [ ] Cloudflare: Add CNAME `my` → `cname.vercel-dns.com` (DNS Only)
- [ ] Cloudflare: Add CNAME `*.my` → `cname.vercel-dns.com` (DNS Only)
- [ ] Vercel: Add domain `my.solaplus.ai`
- [ ] Vercel: Add wildcard `*.my.solaplus.ai`
- [ ] Environment: Set `NEXT_PUBLIC_SUBDOMAIN_BASE=my.solaplus.ai`
- [ ] Deploy: Redeploy application
- [ ] Test: Visit `https://my.solaplus.ai`
- [ ] Test: Visit `https://{your-slug}.my.solaplus.ai`
