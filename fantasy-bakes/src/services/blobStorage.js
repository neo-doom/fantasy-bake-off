// Vercel Blob Storage Service
const BLOB_URL = import.meta.env.VITE_VERCEL_BLOB_URL;

class BlobStorageService {
  constructor() {
    this.blobUrl = BLOB_URL;
  }

  /**
   * Fetch data from Vercel Blob storage
   */
  async fetchData() {
    try {
      console.log('🔗 Blob URL:', this.blobUrl);
      if (!this.blobUrl) {
        throw new Error('Blob URL not configured - check VITE_VERCEL_BLOB_URL environment variable');
      }
      
      const response = await fetch(this.blobUrl, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
        }
      });
      
      console.log('📡 Blob response status:', response.status, response.statusText);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ Data fetched from blob storage');
      return data;
    } catch (error) {
      console.error('❌ Error fetching from blob storage:', error);
      throw error;
    }
  }

  /**
   * Save data to Vercel Blob storage
   */
  async saveData(data) {
    try {
      // For now, we'll use the PUT endpoint with the blob URL
      // In production, this would typically go through an API route
      const response = await fetch('/api/save-to-blob', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data })
      });

      if (!response.ok) {
        throw new Error(`Failed to save data: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Data saved to blob storage');
      return result;
    } catch (error) {
      console.error('❌ Error saving to blob storage:', error);
      throw error;
    }
  }

  /**
   * Check if blob storage is available
   */
  async healthCheck() {
    try {
      const response = await fetch(this.blobUrl, { 
        method: 'HEAD',
        headers: {
          'Cache-Control': 'no-cache',
        }
      });
      return response.ok;
    } catch (error) {
      console.warn('Blob storage health check failed:', error);
      return false;
    }
  }
}

export default new BlobStorageService();