# Fantasy Bakes Development Guide

## New Architecture - Vercel Blob Storage

This application now uses **Vercel Blob Storage** as the primary data source for truly persistent, cloud-based data storage.

### Data Flow
1. **Primary Storage**: Vercel Blob Storage (`data.json`)
2. **Cache Layer**: 30-second in-memory cache + localStorage fallback
3. **Real-time Updates**: Admin changes save to blob storage immediately
4. **Auto-refresh**: Frontend polls blob storage every 30 seconds for updates

## Running the Application

### Development Setup
```bash
# Install dependencies
npm install

# Set up environment variables in .env.local
VITE_VERCEL_BLOB_URL=https://bzlu2cegueubqyt4.public.blob.vercel-storage.com/data.json
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token

# Run the application
npm run dev
```

### Production Setup
For production deployments, the app will automatically:
- Load data from blob storage on page load
- Save admin changes directly to blob storage
- Provide localStorage fallback for offline usage

## Blob Storage Benefits

✅ **Persistent across deployments** - Data survives app updates  
✅ **Real-time sync** - Multiple users see changes instantly  
✅ **No server required** - Serverless architecture  
✅ **Global CDN** - Fast data access worldwide  
✅ **Automatic backups** - Vercel handles data reliability  

## Commands

```bash
# Development
npm run dev                 # Run frontend only
npm run dev:both           # Run frontend + local API (legacy)
npm run build              # Build for production
npm run init-blob          # Initialize blob storage (one-time setup)
```

## Environment Variables

- `VITE_VERCEL_BLOB_URL` - Public blob storage URL for reading data
- `BLOB_READ_WRITE_TOKEN` - Vercel blob token for writing data (server-side only)