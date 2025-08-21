# Farcaster MiniApp Testing Guide

## Pre-Deployment Checklist

### 1. Build and Deploy
```bash
npm run build
# Deploy to your hosting provider
```

### 2. Required Endpoints
After deployment, ensure these URLs are accessible:

- ✅ **Manifest**: https://www.marranitostucop.xyz/.well-known/farcaster.json
- ✅ **Webhook**: https://www.marranitostucop.xyz/api/webhook
- ✅ **Images**: 
  - https://www.marranitostucop.xyz/icon.png
  - https://www.marranitostucop.xyz/miniapp-image.png
  - https://www.marranitostucop.xyz/frame-image.png
  - https://www.marranitostucop.xyz/splash.png

## Testing Steps

### 1. Enable Developer Mode
1. Open Farcaster (Warpcast)
2. Go to Settings
3. Toggle "Developer Mode" ON

### 2. Test Manifest
Visit: https://www.marranitostucop.xyz/.well-known/farcaster.json
Should return:
```json
{
  "version": "1",
  "accountAssociation": {...},
  "app": {
    "name": "cPiggyFX",
    "homeUrl": "https://www.marranitostucop.xyz",
    ...
  }
}
```

### 3. Test Meta Tags
View page source of https://www.marranitostucop.xyz
Look for:
```html
<meta property="fc:miniapp" content='{"version":"1",...}' />
<meta property="fc:frame" content='{"version":"next",...}' />
```

### 4. Test in Warpcast Embed Tool
1. Go to: https://warpcast.com/~/developers/mini-apps/embed
2. Enter: https://www.marranitostucop.xyz
3. Click "Preview"
4. Should show your app in MiniApp format

### 5. Test Sharing
1. Create a cast with your URL
2. Should display as a MiniApp embed
3. Click "Open cPiggyFX" button
4. Should launch in MiniApp modal

## Account Association (Required for Production)

To generate proper account association:

1. Install Farcaster CLI or use their tools
2. Generate JWT for domain `marranitostucop.xyz`
3. Replace the placeholder signature in manifest

## Troubleshooting

**404 on manifest**: Ensure `.well-known` folder is deployed
**Meta tags missing**: Check if Next.js build includes metadata
**Images not loading**: Verify public folder deployment
**MiniApp not detected**: Check iframe context detection logic

## Success Indicators

✅ Manifest accessible at /.well-known/farcaster.json
✅ Meta tags present in page source
✅ Images load correctly
✅ Warpcast embed tool shows preview
✅ App launches in MiniApp context
✅ Social sharing works
✅ Responsive design adapts to 424px width