import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import cors from 'cors';
import { analyzeMedia } from './services/sightengineService.js';

// Load environment variables
dotenv.config();

// ES modules fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
// Add this line near the top of your server.js file, after the middleware setup
app.use(express.static(path.join(__dirname, '../frontend')));

// Add this specific MIME type handling for CSS files
app.get('*.css', (req, res, next) => {
  res.set('Content-Type', 'text/css');
  next();
});

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
    storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// API endpoint for AI content detection
app.post('/api/detect', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // Check if API credentials are configured
        if (!process.env.SIGHTENGINE_API_USER || !process.env.SIGHTENGINE_API_SECRET) {
            return res.status(500).json({ message: 'API credentials not configured on server' });
        }

        // Process the file using Sightengine API
        const result = await analyzeMedia(
            req.file.buffer,
            req.file.originalname,
            req.file.mimetype
        );
        
        // Return the analysis results
        return res.json(result);
        
    } catch (error) {
        console.error('Error processing detection request:', error);
        res.status(500).json({ message: 'Server error processing request' });
    }
});

// Serve frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});