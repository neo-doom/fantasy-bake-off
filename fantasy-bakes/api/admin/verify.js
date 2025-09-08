// Secure admin password verification API route
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
    const { password } = request.body;
    
    if (!password) {
      return response.status(400).json({ error: 'Password required' });
    }

    // Get admin password from environment variable
    const adminPassword = process.env.ADMIN_PASSWORD;
    
    if (!adminPassword) {
      console.error('ADMIN_PASSWORD environment variable not set');
      return response.status(500).json({ error: 'Server configuration error' });
    }

    // Verify password
    if (password === adminPassword) {
      response.status(200).json({ success: true });
    } else {
      response.status(401).json({ error: 'Invalid password' });
    }
  } catch (error) {
    console.error('Error in admin verification:', error);
    response.status(500).json({ error: 'Authentication error' });
  }
}