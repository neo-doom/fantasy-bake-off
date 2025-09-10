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
    const { data } = request.body;
    
    if (!data) {
      return response.status(400).json({ error: 'No data provided' });
    }

    // Get environment-specific blob URL and token (same as data.js)
    const blobUrl = process.env.VITE_VERCEL_BLOB_URL;
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
    
    if (!blobUrl) {
      console.error('VITE_VERCEL_BLOB_URL not configured');
      return response.status(500).json({ error: 'Blob URL not configured' });
    }

    if (!blobToken) {
      console.error('BLOB_READ_WRITE_TOKEN not configured');
      return response.status(500).json({ error: 'Blob token not configured' });
    }

    console.log('📝 Saving data to deployment-specific blob storage:', blobUrl);
    
    const jsonData = JSON.stringify(data, null, 2);
    
    // Save directly to the deployment-specific blob URL using PUT
    const saveResponse = await fetch(blobUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${blobToken}`,
        'Content-Type': 'application/json',
      },
      body: jsonData
    });

    if (!saveResponse.ok) {
      console.error('Failed to save to blob storage:', saveResponse.status, saveResponse.statusText);
      return response.status(saveResponse.status).json({ 
        error: `Failed to save data: ${saveResponse.status} ${saveResponse.statusText}` 
      });
    }

    console.log('✅ Data saved to deployment-specific blob storage');
    
    response.status(200).json({ 
      success: true, 
      url: blobUrl,
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

// Config for Pages API Routes
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};