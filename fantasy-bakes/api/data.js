// API route to fetch data from Vercel Blob Storage
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const blobUrl = process.env.VITE_VERCEL_BLOB_URL;
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
    
    if (!blobUrl) {
      console.error('VITE_VERCEL_BLOB_URL not configured');
      return res.status(500).json({ error: 'Blob URL not configured' });
    }

    if (!blobToken) {
      console.error('BLOB_READ_WRITE_TOKEN not configured');
      return res.status(500).json({ error: 'Blob token not configured' });
    }

    console.log('Fetching data from blob storage:', blobUrl);
    
    const response = await fetch(blobUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${blobToken}`,
        'Cache-Control': 'no-cache',
      }
    });

    if (!response.ok) {
      console.error('Failed to fetch from blob storage:', response.status, response.statusText);
      return res.status(response.status).json({ 
        error: `Failed to fetch data: ${response.status} ${response.statusText}` 
      });
    }

    const data = await response.json();
    console.log('Successfully fetched data from blob storage');
    
    res.status(200).json(data);
  } catch (error) {
    console.error('Error in /api/data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}