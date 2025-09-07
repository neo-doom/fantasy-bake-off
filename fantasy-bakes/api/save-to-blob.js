import { put } from '@vercel/blob';

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { data } = request.body;
    
    if (!data) {
      return response.status(400).json({ error: 'No data provided' });
    }

    // Save to Vercel Blob storage
    const blob = await put('data.json', JSON.stringify(data, null, 2), {
      access: 'public',
      contentType: 'application/json',
    });

    console.log('✅ Data saved to blob storage:', blob.url);
    
    response.status(200).json({ 
      success: true, 
      url: blob.url,
      message: 'Data saved to blob storage successfully' 
    });
  } catch (error) {
    console.error('❌ Error saving to blob storage:', error);
    response.status(500).json({ 
      error: 'Failed to save data to blob storage',
      details: error.message 
    });
  }
}