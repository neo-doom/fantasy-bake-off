import express from 'express';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// Enable CORS for development
app.use(cors({
  origin: 'http://localhost:5173', // Vite dev server
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));

// API endpoint to save data back to JSON file
app.post('/api/save-data', (req, res) => {
  try {
    const { data } = req.body;
    
    if (!data) {
      return res.status(400).json({ error: 'No data provided' });
    }

    // Write to the data.json file
    const dataPath = path.join(__dirname, 'src', 'data', 'data.json');
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
    
    console.log('Data saved successfully at', new Date().toLocaleString());
    res.json({ success: true, message: 'Data saved successfully' });
  } catch (error) {
    console.error('Error saving data:', error);
    res.status(500).json({ error: 'Failed to save data', details: error.message });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Fantasy Bakes API server running on http://localhost:${PORT}`);
  console.log('Ready to save data changes to JSON file');
});