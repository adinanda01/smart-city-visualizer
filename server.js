const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Hugging Face API endpoint
const HF_API_URL = "https://api-inference.huggingface.co/models/";

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Configure multer
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const uploadDir = 'uploads';
        try {
            await fs.access(uploadDir);
        } catch {
            await fs.mkdir(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }
});

// Generate with Hugging Face
app.post('/analyze-and-generate', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image uploaded' });
        }

        const { developmentType, features, generationModel } = req.body;
        
        // Create smart city prompt
        const imagePrompt = createSmartCityPrompt(developmentType, features);
        console.log('Generating with prompt:', imagePrompt);

        // Select model based on user choice
        const models = {
            'fast': 'stabilityai/stable-diffusion-2-1',
            'quality': 'runwayml/stable-diffusion-v1-5',
            'artistic': 'prompthero/openjourney',
            'realistic': 'dreamlike-art/dreamlike-photoreal-2.0'
        };

        const selectedModel = models[generationModel] || models['fast'];
        
        // Call Hugging Face API
        const response = await axios.post(
            `${HF_API_URL}${selectedModel}`,
            {
                inputs: imagePrompt,
                parameters: {
                    negative_prompt: "blurry, bad quality, distorted",
                    num_inference_steps: 25,
                    guidance_scale: 7.5,
                    width: 512,
                    height: 512
                }
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.HF_API_TOKEN}`,
                    'Content-Type': 'application/json',
                },
                responseType: 'arraybuffer'
            }
        );

        // Convert to base64
        const imageData = {
            data: Buffer.from(response.data).toString('base64'),
            mimeType: 'image/png'
        };

        // Clean up
        await fs.unlink(req.file.path);

        res.json({
            success: true,
            generatedImage: imageData,
            prompt: imagePrompt,
            message: "Smart city visualization generated!",
            modelUsed: selectedModel
        });

    } catch (error) {
        console.error('Error:', error.message);
        
        if (req.file && req.file.path) {
            try {
                await fs.unlink(req.file.path);
            } catch (e) {}
        }
        
        // Handle model loading delays
        if (error.response && error.response.status === 503) {
            res.status(503).json({ 
                error: 'Model is loading, please try again in 20 seconds',
                details: 'First request takes longer as model loads'
            });
        } else {
            res.status(500).json({ 
                error: 'Failed to generate image',
                details: error.message 
            });
        }
    }
});

// Simplified prompt creation
function createSmartCityPrompt(developmentType, features) {
    const types = {
        'mixed-use': 'futuristic smart city with glass skyscrapers',
        'residential': 'modern eco-friendly residential complex',
        'commercial': 'high-tech business district',
        'green-city': 'sustainable green city with solar panels',
        'waterfront': 'smart waterfront development',
        'transit-oriented': 'transit hub with metro station'
    };
    
    let prompt = `${types[developmentType] || types['mixed-use']}`;
    
    if (features) {
        prompt += `, ${features}`;
    }
    
    prompt += `, photorealistic, architectural visualization, high quality, detailed`;
    
    return prompt;
}

// Test endpoint
app.get('/test-api', async (req, res) => {
    try {
        const response = await axios.get(
            `${HF_API_URL}stabilityai/stable-diffusion-2-1`,
            {
                headers: {
                    'Authorization': `Bearer ${process.env.HF_API_TOKEN}`
                }
            }
        );
        
        res.json({
            success: true,
            message: 'Hugging Face API connected',
            status: 'ready'
        });
    } catch (error) {
        res.json({
            success: false,
            error: error.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`
    🚀 Smart City Visualizer (FREE Edition)
    📍 URL: http://localhost:${PORT}
    
    ✅ Using Hugging Face FREE API
    🎨 Available Models:
    - Stable Diffusion 2.1 (Fast)
    - Stable Diffusion 1.5 (Quality)
    - OpenJourney (Artistic)
    - Dreamlike PhotoReal (Realistic)
    
    ${process.env.HF_API_TOKEN ? '✓ HF API configured' : '✗ Add HF_API_TOKEN to .env'}
    `);
});