require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const connectDB = require('./config/db');
connectDB();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ── Routes ──────────────────────────────────────────

// Health check
app.get('/', (req, res) => {
    res.json({ status: 'MedSaathi backend running' });
});

// Prescription scan
app.post('/api/scan', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No image provided' });

        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const base64Image = req.file.buffer.toString('base64');

        const response = await model.generateContent([
            {
                inlineData: {
                    mimeType: req.file.mimetype,
                    data: base64Image,
                },
            },
            `This is a doctor's prescription. Extract all medicines.
            Return ONLY valid JSON, nothing else:
            {
              "medicines": [
                {
                  "name": "medicine name",
                  "dose": "500mg",
                  "times": "8:00 AM · 8:00 PM",
                  "duration": "5 days"
                }
              ]
            }`,
        ]);

        const text = response.response.text();
        const clean = text.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(clean);

        res.json(parsed);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to scan prescription' });
    }
});

// OTP send (mock for now)
app.post('/api/auth/send-otp', (req, res) => {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: 'Phone required' });
    console.log(`OTP sent to ${phone}: 123456`);
    res.json({ success: true, message: 'OTP sent' });
});

// OTP verify (mock for now)
app.post('/api/auth/verify-otp', (req, res) => {
    const { phone, otp } = req.body;
    if (otp === '123456') {
        res.json({ success: true, token: 'mock-token-' + phone });
    } else {
        res.status(401).json({ error: 'Invalid OTP' });
    }
});
// Proof photo verification
app.post('/api/verify-proof', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No image provided' });

        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const base64Image = req.file.buffer.toString('base64');

        const response = await model.generateContent([
            {
                inlineData: {
                    mimeType: req.file.mimetype,
                    data: base64Image,
                },
            },
            `Look at this image. Does it show a medicine tablet, pill, capsule, liquid medicine, or injection being taken or held?
            Return ONLY valid JSON:
            {
              "verified": true or false,
              "confidence": "high" or "medium" or "low",
              "message": "one line explanation"
            }`,
        ]);

        const text = response.response.text();
        const clean = text.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(clean);
        res.json(parsed);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Verification failed' });
    }
});
// ── Start ────────────────────────────────────────────
app.listen(3000, '0.0.0.0', () => {
    console.log('Backend running on http://0.0.0.0:3000');
});