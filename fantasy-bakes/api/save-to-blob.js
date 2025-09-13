import { put } from '@vercel/blob';

// Pages API Route for saving data to Vercel Blob Storage
export default async function handler(request, response) {
  // Set CORS headers
  response.setHeader('Access-Control-Allow-Credentials', true);
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  response.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (request.method === 'OPTIONS') {
    response.status(200).end();
    return;
  }

  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get environment-specific blob token and URL
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
    const blobUrl = process.env.VITE_VERCEL_BLOB_URL;
    
    if (!blobToken) {
      console.error('BLOB_READ_WRITE_TOKEN not configured');
      return response.status(500).json({ error: 'Blob token not configured' });
    }

    if (!blobUrl) {
      console.error('VITE_VERCEL_BLOB_URL not configured');
      return response.status(500).json({ error: 'Blob URL not configured - cannot determine target filename' });
    }

    // Extract filename from the blob URL - MUST be environment specific
    let filename;
    try {
      const url = new URL(blobUrl);
      const pathParts = url.pathname.split('/');
      filename = pathParts[pathParts.length - 1];
      
      if (!filename || filename === '') {
        throw new Error('Empty filename from blob URL');
      }
    } catch (error) {
      console.error('Failed to extract filename from blob URL:', blobUrl, error);
      return response.status(500).json({ 
        error: 'Invalid blob URL - cannot determine target filename',
        details: error.message 
      });
    }

    console.log('📝 Saving data to blob storage with deployment-specific token');
    console.log('📁 Using filename:', filename);
    
    // Use @vercel/blob with the deployment-specific token and raw request body
    const blob = await put(filename, request, {
      access: 'public',
      contentType: 'application/json',
      allowOverwrite: true,
      token: blobToken,
    });

    console.log('✅ Data saved to deployment-specific blob storage:', blob.url);
    
    response.status(200).json({ 
      success: true, 
      url: blob.url,
      filename: filename,
      message: 'Data saved to deployment-specific blob storage successfully' 
    });
  } catch (error) {
    console.error('❌ Error saving to blob storage:', error);
    response.status(500).json({ 
      error: 'Failed to save data to blob storage',
      details: error.message 
    });
  }
}

// Config for Pages API Routes - disable body parser for blob uploads
export const config = {
  api: {
    bodyParser: false,
  },
};