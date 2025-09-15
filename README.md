# Vinet Internet Solutions Custom Speedtest

A complete custom-branded speedtest solution for **Vinet Internet Solutions** using Cloudflare Workers, based on the Cloudflare speedtest infrastructure. This implementation features Vinet's branding, South African localization, and professional design tailored for the South African internet market.

## 🇿🇦 Vinet Customizations

### Brand Integration
- **Vinet Internet Solutions** branding and logo integration
- Professional blue and green color scheme matching ISP industry standards
- South African market-focused messaging and localization
- Contact information and company details pre-configured

### Visual Design
- Modern gradient designs using Vinet's brand colors
- Responsive logo placement with professional typography
- Enhanced animations and visual feedback
- Mobile-optimized layout for South African users

### User Experience
- South African flag emoji in sharing features
- Localized messaging and error handling
- Connection quality descriptions tailored for local market
- Vinet package upgrade suggestions for poor connections

## 🏗️ Architecture

The solution consists of three main components:

1. **Main Speedtest Worker** (`custom-speedtest-worker/`) - Handles download/upload endpoints
2. **TURN Credentials Worker** (`custom-turn-worker/`) - Provides TURN server credentials for packet loss testing
3. **Frontend Application** (`custom-speedtest-frontend/`) - Custom-branded web interface

## 🚀 Quick Start

### Prerequisites

- Node.js >= 16
- Cloudflare Workers account
- Wrangler CLI installed (`npm install -g wrangler`)

### 1. Deploy the Main Speedtest Worker

```bash
cd custom-speedtest-worker
npm install
wrangler login
wrangler deploy
```

The worker will be available at `https://custom-speedtest.your-subdomain.workers.dev`

**For Vinet Production**: Configure a custom domain like `speedtest-api.vinet.co.za`

**For Vinet Production**: Configure a custom domain like `speedtest-api.vinet.co.za`

### 2. (Optional) Deploy the TURN Worker for Packet Loss Testing

First, set up Cloudflare Realtime TURN server:

1. Go to Cloudflare Dashboard → Realtime → TURN Server
2. Create a new TURN server
3. Note the Token ID and API Token

Then deploy the worker:

```bash
cd custom-turn-worker
npm install

# Set secrets
wrangler secret put REALTIME_TURN_TOKEN_ID
wrangler secret put REALTIME_TURN_TOKEN_SECRET

wrangler deploy
```

### 3. Deploy the Frontend

The frontend is fully customized for Vinet Internet Solutions. Upload the contents of `custom-speedtest-frontend/` to:
- Cloudflare Pages (recommended for Vinet)
- Your web hosting provider
- Or serve locally for testing

**Demo Available**: Open `custom-speedtest-frontend/demo.html` to see the fully branded interface

## ⚙️ Configuration

### Main Speedtest Worker Configuration

Edit `custom-speedtest-worker/wrangler.toml`:

```toml
[vars]
CORS_ORIGINS = "https://speedtest.vinethosting.org"  # Your frontend domain
MAX_FILE_SIZE = "268435456"  # 256MB max upload
ENABLE_METRICS = "true"  # Enable metrics collection

# Optional: KV binding for metrics storage
[[kv_namespaces]]
binding = "SPEEDTEST_KV"
id = "your-kv-namespace-id"
```

### Custom Domain Setup

For production, configure custom domains in your `wrangler.toml`:

```toml
[[routes]]
pattern = "speedtest-api.vinethosting.org/*"
zone_name = "vinethosting.org"
```

### Frontend Configuration

1. Open the Vinet speedtest frontend in a browser
2. Click "Advanced Settings"
3. Configure:
   - **Server URL**: Your main worker URL (e.g., `https://speedtest-api.vinethosting.org`)
   - **TURN Server URL**: Your TURN worker URL (optional)
   - Enable/disable packet loss testing and loaded latency

Settings are automatically saved in browser localStorage.

### Vinet Branding

The speedtest is pre-configured with:
- Vinet Internet Solutions logo and branding
- Professional blue/green color scheme
- South African contact information
- Localized messaging and features

## 🚀 Quick Demo

To see the fully customized Vinet speedtest interface:

```bash
cd custom-speedtest-frontend
python -m http.server 8080
# Open http://localhost:8080/demo.html
```

This shows the complete Vinet branding, colors, and South African customizations.

## 🎨 Customization

### Branding

Edit `custom-speedtest-frontend/index.html`:

```html
<!-- Update logo and brand name -->
<h1 class="brand-name">YourBrand</h1>
<span class="brand-tagline">Speed Test</span>

<!-- Update contact information -->
<a href="mailto:support@yourdomain.com" class="footer-link">support@yourdomain.com</a>
```

### Styling

Modify `custom-speedtest-frontend/styles.css`:

```css
/* Update brand colors */
:root {
  --primary-gradient: linear-gradient(135deg, #your-color-1 0%, #your-color-2 100%);
  --accent-color: #your-accent-color;
}
```

### Measurements Configuration

Customize the test sequence by modifying the SpeedTest configuration in `script.js`:

```javascript
const speedTestConfig = {
    autoStart: false,
    downloadApiUrl: `${this.config.serverUrl}/__down`,
    uploadApiUrl: `${this.config.serverUrl}/__up`,
    measurements: [
        { type: 'latency', numPackets: 20 },
        { type: 'download', bytes: 1e6, count: 5 },
        { type: 'upload', bytes: 1e6, count: 5 },
        // Add custom measurements
    ]
};
```

### 🎯 Vinet-Specific Features:
- **Brand Integration**: Vinet logo, colors, and professional styling
- **Local Focus**: South African flag, local messaging, and market-specific content
- **Contact Ready**: Pre-configured with Vinet support details
- **Package Integration**: Smart suggestions for Vinet internet packages
- **Professional Design**: ISP-grade interface with modern aesthetics

### 🎨 Vinet Customizations Ready:

✅ **Professional ISP branding** with Vinet logo and colors
✅ **South African localization** with local messaging  
✅ **Responsive design** optimized for all devices
✅ **Contact integration** with Vinet support details
✅ **Modern UI/UX** with enhanced animations
✅ **Mobile optimization** for South African users

## 📊 Features

### Core Functionality
- ✅ Download/Upload bandwidth testing
- ✅ Latency and jitter measurements
- ✅ Packet loss detection (with TURN server)
- ✅ Real-time results display
- ✅ Network quality scoring (AIM scores)

### Advanced Features
- ✅ Custom server endpoints
- ✅ CORS configuration
- ✅ Metrics collection (optional)
- ✅ Progressive results display
- ✅ Responsive design
- ✅ Share results functionality
- ✅ Error handling and retry logic

### Customization Options
- ✅ Custom branding and styling
- ✅ Configurable test parameters
- ✅ Custom domains
- ✅ Flexible deployment options

## 🔧 API Endpoints

### Main Speedtest Worker

- `GET /__down?bytes=N` - Download test endpoint
- `POST /__up` - Upload test endpoint (send data in body)
- `GET /health` - Health check

### TURN Credentials Worker

- `GET /turn-credentials` - Returns TURN server credentials (JSON)

## 📈 Monitoring and Metrics

If metrics are enabled, the worker can store test results in Cloudflare KV for analysis:

```javascript
// Metrics structure
{
  timestamp: 1234567890,
  type: 'download' | 'upload',
  bytes: 1048576,
  serverTime: 45,
  country: 'US',
  colo: 'LAX',
  userAgent: 'Mozilla/5.0...'
}
```

## 🛠️ Development

### Local Development

```bash
# Start main worker
cd custom-speedtest-worker
npm run dev

# Start TURN worker (separate terminal)
cd custom-turn-worker
npm run dev

# Serve frontend (separate terminal)
cd custom-speedtest-frontend
python -m http.server 8080  # or your preferred static server
```

### Environment Variables

Create `.dev.vars` files for local development:

**custom-speedtest-worker/.dev.vars**:
```
CORS_ORIGINS=http://localhost:8080
ENABLE_METRICS=false
```

**custom-turn-worker/.dev.vars**:
```
REALTIME_TURN_TOKEN_ID=your-token-id
REALTIME_TURN_TOKEN_SECRET=your-api-token
REALTIME_TURN_ORIGINS=http://localhost:8080
```

## 🔒 Security Considerations

1. **CORS Configuration**: Restrict `CORS_ORIGINS` to your domain in production
2. **Rate Limiting**: Consider implementing rate limiting for public deployments
3. **TURN Server**: Use authentication for TURN server access
4. **File Size Limits**: Configure appropriate `MAX_FILE_SIZE` limits

## 📋 Troubleshooting

### Common Issues

**"speedtest.vinet.co.za not configured"**
- Configure the server URL to your deployed Vinet worker
- Ensure the worker is deployed and accessible
- Check Cloudflare DNS settings for custom domains

**"CORS error"**
- Check CORS_ORIGINS configuration in worker
- Ensure frontend domain is whitelisted

**"Packet loss test not working"**
- Verify TURN worker is deployed
- Check TURN server credentials
- Ensure TURN URL is configured in frontend

**"Tests failing with network errors"**
- Check worker logs: `wrangler tail`
- Verify DNS resolution for worker domains
- Test endpoints directly with curl

### Debug Mode

Enable debug logging in the frontend by adding to localStorage:

```javascript
localStorage.setItem('speedtest-debug', 'true');
```

## 📄 License

This project is based on the Cloudflare Speedtest engine. Please review the [original license](https://github.com/cloudflare/speedtest) for usage terms.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Vinet Support

For Vinet-specific deployment questions:
- Email: support@vinet.co.za
- Website: https://www.vinet.co.za
- Location: Wellington, Western Cape, South Africa

For technical issues with the speedtest infrastructure:
- Check the troubleshooting section above
- Review Cloudflare Workers documentation
- Open an issue in the project repository