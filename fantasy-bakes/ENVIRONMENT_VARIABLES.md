# Environment Variables Configuration

This document lists all environment variables that need to be configured for the Fantasy Bakes application to work properly.

## Required Environment Variables

### 1. ADMIN_PASSWORD (CRITICAL)
- **Description**: Password for accessing the admin console
- **Example**: `ProofReady7!`
- **Location**: Vercel Dashboard > Project Settings > Environment Variables
- **Used by**: `/api/admin/verify.js` for admin authentication

### 2. BLOB_READ_WRITE_TOKEN (CRITICAL)
- **Description**: Vercel Blob storage access token with read/write permissions
- **Format**: `vercel_blob_rw_[your-token]`
- **Location**: Vercel Dashboard > Storage > Blob > Settings
- **Used by**: `/api/data.js` and `/api/save-to-blob.js` for data persistence

### 3. VITE_VERCEL_BLOB_URL (REQUIRED)
- **Description**: Public URL for the blob storage data file
- **Format**: `https://[hash].public.blob.vercel-storage.com/data.json`
- **Location**: Vercel Dashboard > Storage > Blob > Files
- **Used by**: `/api/data.js` for fetching data

## Setup Instructions

1. **In Vercel Dashboard:**
   - Go to your project
   - Navigate to Settings > Environment Variables
   - Add all three variables above
   - Deploy the application

2. **For Local Development:**
   - Create a `.env.local` file (already gitignored)
   - Add the same variables with `VITE_` prefix for client-side access where needed
   - The `.env.local` file should NEVER be committed to the repository

## Security Notes

- ✅ Admin password moved from `config.json` to environment variable
- ✅ Blob storage tokens secured in environment variables
- ✅ `.env.local` is properly gitignored
- ✅ Admin authentication now uses secure API route instead of client-side check

## Previous Security Issues (FIXED)

- ❌ **FIXED**: Admin password was hardcoded in `src/config/config.json`
- ❌ **FIXED**: Blob storage token was in `.env.local` (now only in Vercel env vars)
- ❌ **FIXED**: Admin authentication was done client-side (now server-side API route)