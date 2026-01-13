const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');
const fs = require('fs');
const multer = require('multer');

// --- 1. ตั้งค่าการอัปโหลดไฟล์ (Multer) ---
const storage = multer.diskStorage({
    destination: './public/uploads/',
    filename: function(req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'logo-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const uploadDir = './public/uploads';
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }
});

// --- 2. Express Setup ---
app.use(express.static(path.join(__dirname, 'public')));

app.post('/upload', upload.single('logoFile'), (req, res) => {
    if (!req.file) return res.status(400).send('No file uploaded.');
    res.json({ url: '/uploads/' + req.file.filename });
});

// --- 3. Socket.io Logic ---
io.on('connection', (socket) => {
    console.log('Client connected');

    socket.on('update_lowerthird', (data) => {
        io.emit('show_lowerthird', data);
    });

    socket.on('hide_lowerthird', () => {
        io.emit('hide_lowerthird');
    });

    socket.on('change_font', (fontName) => {
        io.emit('update_font', fontName);
    });

    // รับค่า Style (Scale, Radius, Color, AccentColor)
    socket.on('change_style', (styleData) => {
        io.emit('update_style', styleData);
    });
});

// --- 4. Start Server ---
const PORT = 3000;
http.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Admin Page: http://localhost:${PORT}/admin.html`);
    console.log(`OBS Overlay: http://localhost:${PORT}/index.html`);
});