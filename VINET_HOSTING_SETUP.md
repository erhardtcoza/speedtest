# Vinet Hosting Domain Configuration

This document outlines the specific configuration for deploying the Vinet speedtest using the `vinethosting.org` domain structure.

## 🌐 Domain Structure

### Primary Domains
- **Frontend**: `speedtest.vinethosting.org` - Main speedtest interface
- **API**: `speedtest-api.vinethosting.org` - Speedtest worker endpoints
- **TURN**: `turn-api.vinethosting.org` - TURN server credentials (optional)

## 🚀 Deployment Steps

### 1. Configure DNS Records in Cloudflare

Add the following DNS records in your `vinethosting.org` zone:

```
Type: CNAME
Name: speedtest-api
Target: custom-speedtest.your-subdomain.workers.dev
Proxy: ✅ Proxied

Type: CNAME  
Name: turn-api
Target: custom-turn-worker.your-subdomain.workers.dev
Proxy: ✅ Proxied

Type: CNAME
Name: speedtest
Target: your-pages-deployment.pages.dev (or your hosting provider)
Proxy: ✅ Proxied
```

### 2. Deploy Workers with Custom Domains

**Main Speedtest Worker:**
```bash
cd custom-speedtest-worker
wrangler deploy
```

**TURN Worker (with your pre-configured credentials):**

Your Cloudflare Realtime TURN server is already set up:
- **App Name**: speedtest
- **Token ID**: ea3219ecd43a7f5eebb8da4064d0c531
- **API Token**: 2cc033e78fe10b32a7496224b793f20c34f597512442ed6c7d332e15d84585b9

```bash
# Quick deployment with automated setup
./deploy-turn-server.sh

# OR manual deployment:
cd custom-turn-worker
echo "ea3219ecd43a7f5eebb8da4064d0c531" | wrangler secret put REALTIME_TURN_TOKEN_ID
echo "2cc033e78fe10b32a7496224b793f20c34f597512442ed6c7d332e15d84585b9" | wrangler secret put REALTIME_TURN_TOKEN_SECRET
wrangler deploy
```

### 3. Configure Frontend

Update the frontend configuration to use the production domains:

1. Open `https://speedtest.vinethosting.org`
2. Go to **Advanced Settings**
3. Configure:
   - **Server URL**: `https://speedtest-api.vinethosting.org`
   - **TURN Server URL**: `https://turn-api.vinethosting.org/turn-credentials`

### 4. SSL/TLS Configuration

Ensure SSL/TLS is configured properly:
- **SSL/TLS encryption mode**: Full (strict)
- **Always Use HTTPS**: On
- **Minimum TLS Version**: 1.2

## 🔧 Configuration Files

### Main Worker (`custom-speedtest-worker/wrangler.toml`)
```toml
name = "custom-speedtest"
main = "src/index.ts"
compatibility_date = "2023-10-30"

[vars]
CORS_ORIGINS = "https://speedtest.vinethosting.org"
MAX_FILE_SIZE = "268435456"
ENABLE_METRICS = "false"

[[routes]]
pattern = "speedtest-api.vinethosting.org/*"
zone_name = "vinethosting.org"
```

### TURN Worker (`custom-turn-worker/wrangler.toml`)
```toml
name = "custom-turn-worker"
main = "src/index.ts"
compatibility_date = "2023-10-30"

[vars]
REALTIME_TURN_TOKEN_TTL_SECONDS = "86400"
REALTIME_TURN_ORIGINS = "https://speedtest.vinethosting.org"

[[routes]]
pattern = "turn-api.vinethosting.org/*"
zone_name = "vinethosting.org"
```

## 🧪 Testing

### 1. Test API Endpoints

```bash
# Test download endpoint
curl "https://speedtest-api.vinethosting.org/__down?bytes=1048576"

# Test health check
curl "https://speedtest-api.vinethosting.org/health"

# Test TURN credentials (if configured)
curl "https://turn-api.vinethosting.org/turn-credentials" \
  -H "Referer: https://speedtest.vinethosting.org"
```

### 2. Test Frontend

1. Visit `https://speedtest.vinethosting.org`
2. Click "Start Speed Test"
3. Verify all measurements complete successfully
4. Check browser console for any CORS errors

## 🔒 Security Considerations

### CORS Configuration
- Production CORS is restricted to `speedtest.vinethosting.org`
- Local development includes localhost for testing

### TURN Server Security
- TURN credentials have 24-hour TTL
- Access restricted by referrer header
- Requires Cloudflare Realtime TURN subscription

## 📊 Monitoring

### Cloudflare Analytics
- Monitor worker requests and errors
- Track bandwidth usage
- Review security events

### Custom Metrics (Optional)
Enable metrics collection by:
1. Creating a KV namespace
2. Updating `ENABLE_METRICS = "true"`
3. Configuring KV binding in wrangler.toml

## 🚨 Troubleshooting

### Common Issues

**CORS Errors**
- Verify CORS_ORIGINS matches frontend domain exactly
- Check that custom domains are properly configured
- Ensure SSL certificates are valid

**Worker Not Found**
- Confirm routes are configured in wrangler.toml
- Verify DNS records point to correct worker subdomains
- Check Cloudflare proxy status (should be proxied)

**TURN Server Issues**
- Verify Realtime TURN credentials are set as secrets
- Check referrer header restrictions
- Ensure TURN server subscription is active

### Support

For domain-specific issues:
- Email: support@vinet.co.za
- Check Cloudflare dashboard for DNS/Worker status
- Review worker logs: `wrangler tail`

## 🎯 Production Checklist

- [ ] DNS records configured and propagated
- [ ] Workers deployed with custom routes
- [ ] Frontend uploaded to hosting/Pages
- [ ] SSL/TLS properly configured
- [ ] CORS restricted to production domain
- [ ] TURN secrets configured (if using packet loss)
- [ ] Testing completed successfully
- [ ] Monitoring/analytics enabled