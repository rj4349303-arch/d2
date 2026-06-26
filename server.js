const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS with custom configuration to support mobile WebView traffic (null origins, capacitor://, file://, etc.)
app.use(cors({
    origin: (origin, callback) => {
        // Echo back the request origin to allow it, supporting null, local files, and mobile wrappers
        callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json());

// Initialize Google Generative AI with API Key from environment
const apiKey = process.env.GEMINI_API_KEY;
let genAI;
if (apiKey) {
    genAI = new GoogleGenerativeAI(apiKey);
} else {
    console.warn("WARNING: GEMINI_API_KEY is not defined in environment variables. Chat API will return simulated responses.");
}

// GET /api/status - Check backend and API status
app.get('/api/status', (req, res) => {
    res.json({
        success: true,
        message: "Minnoli backend is online",
        geminiConfigured: !!apiKey
    });
});

// POST /api/chat - Chat with Gemini AI in Tamil
app.post('/api/chat', async (req, res) => {
    const { message } = req.body;
    if (!message) {
        return res.status(400).json({ error: "Message is required" });
    }

    try {
        if (!apiKey) {
            // Safe fallback response if API key is not configured yet
            const simulatedResponse = `வணக்கம்! மின்னொளி லோக்கல் சர்வர் வெற்றிகரமாக இயங்குகிறது. ஆனால் .env கோப்பில் GEMINI_API_KEY இன்னும் வழங்கப்படவில்லை. நீங்கள் கூறியது: "${message}"`;
            return res.json({ response: simulatedResponse });
        }

        // Get the generative model
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction: "You are 'மின்னொளி' (Minnoli), a helpful AI voice assistant for training modules. Keep your answers brief, polite, and always respond in clear, natural Tamil. Ensure the output is easy to read and suitable for text-to-speech synthesis.",
        });

        const result = await model.generateContent(message);
        const responseText = result.response.text();
        res.json({ response: responseText });

    } catch (error) {
        console.error("Gemini API Error:", error);
        res.status(500).json({
            error: "Gemini API error",
            message: error.message || "Something went wrong while contacting the AI."
        });
    }
});

// Start the Express server
app.listen(PORT, () => {
    console.log(`Minnoli Backend Server running on http://localhost:${PORT}`);
});
