import { put } from '@vercel/blob';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initializeBlobStorage() {
  try {
    // Read the current data.json file
    const dataPath = path.join(__dirname, '..', 'src', 'data', 'data.json');
    const dataContent = fs.readFileSync(dataPath, 'utf8');
    
    // Upload to Vercel Blob storage
    const blob = await put('data.json', dataContent, {
      access: 'public',
      contentType: 'application/json',
    });

    console.log('✅ Successfully initialized blob storage:');
    console.log('📍 Blob URL:', blob.url);
    console.log('📝 Update your .env.local with:');
    console.log(`VITE_VERCEL_BLOB_URL=${blob.url}`);
  } catch (error) {
    console.error('❌ Error initializing blob storage:', error);
  }
}

initializeBlobStorage();