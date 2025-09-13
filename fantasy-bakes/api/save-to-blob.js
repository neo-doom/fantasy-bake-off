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
    // Get environment-specific blob token
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
    
    if (!blobToken) {
      console.error('BLOB_READ_WRITE_TOKEN not configured');
      return response.status(500).json({ error: 'Blob token not configured' });
    }

    // Get deployment-specific filename from environment or default to data.json
    const deploymentName = process.env.VERCEL_ENV || process.env.DEPLOYMENT_NAME || 'default';
    const filename = deploymentName !== 'production' ? `${deploymentName}_data.json` : 'data.json';

    console.log('📝 Saving data to blob storage with deployment-specific token');
    console.log('📁 Using filename:', filename);
    
    // Use @vercel/blob with the deployment-specific token and raw request body
    const blob = await put(filename, request, {
      access: 'public',
      contentType: 'application/json',
      allowOverwrite: true,
      token: blobToken,
    });

    console.log('✅ Data saved to blob storage:', blob.url);
    
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