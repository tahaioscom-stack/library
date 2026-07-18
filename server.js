const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

const DATA_FILE = path.join(__dirname, 'data.json');

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

function loadData() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const raw = fs.readFileSync(DATA_FILE, 'utf8');
            return JSON.parse(raw);
        }
    } catch (e) {
        console.error('❌ خطا در بارگذاری داده:', e.message);
    }
    return { books: [], users: [], chats: {}, visitors: [], lastModified: 0 };
}

function saveData(data) {
    try {
        data.lastModified = Date.now();
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (e) {
        console.error('❌ خطا در ذخیره داده:', e.message);
        return false;
    }
}

app.get('/api/data', (req, res) => {
    try {
        const data = loadData();
        res.json({ success: true, data });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

app.post('/api/data', (req, res) => {
    try {
        const newData = req.body;
        if (!newData || typeof newData !== 'object') {
            return res.status(400).json({ success: false, error: 'داده نامعتبر است' });
        }
        const saved = saveData(newData);
        if (saved) {
            res.json({ success: true, message: 'داده با موفقیت ذخیره شد', lastModified: newData.lastModified });
        } else {
            res.status(500).json({ success: false, error: 'خطا در ذخیره داده' });
        }
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

app.get('/api/books', (req, res) => {
    try {
        const data = loadData();
        res.json({ success: true, books: data.books || [] });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

app.post('/api/books', (req, res) => {
    try {
        const newBook = req.body;
        if (!newBook || !newBook.title || !newBook.author) {
            return res.status(400).json({ success: false, error: 'عنوان و نویسنده الزامی است' });
        }
        const data = loadData();
        if (!data.books) data.books = [];
        newBook.id = Date.now();
        data.books.push(newBook);
        saveData(data);
        res.json({ success: true, book: newBook });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

app.delete('/api/books/:id', (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const data = loadData();
        if (!data.books) data.books = [];
        const index = data.books.findIndex(b => b.id === id);
        if (index === -1) {
            return res.status(404).json({ success: false, error: 'کتاب یافت نشد' });
        }
        data.books.splice(index, 1);
        saveData(data);
        res.json({ success: true, message: 'کتاب حذف شد' });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

app.put('/api/books/:id', (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const updates = req.body;
        const data = loadData();
        if (!data.books) data.books = [];
        const index = data.books.findIndex(b => b.id === id);
        if (index === -1) {
            return res.status(404).json({ success: false, error: 'کتاب یافت نشد' });
        }
        data.books[index] = { ...data.books[index], ...updates };
        saveData(data);
        res.json({ success: true, book: data.books[index] });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

app.get('/api/users', (req, res) => {
    try {
        const data = loadData();
        res.json({ success: true, users: data.users || [] });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

app.post('/api/users', (req, res) => {
    try {
        const newUser = req.body;
        if (!newUser || !newUser.username || !newUser.password) {
            return res.status(400).json({ success: false, error: 'نام کاربری و کلمه عبور الزامی است' });
        }
        const data = loadData();
        if (!data.users) data.users = [];
        if (data.users.find(u => u.username === newUser.username)) {
            return res.status(400).json({ success: false, error: 'این نام کاربری قبلاً ثبت شده است' });
        }
        data.users.push(newUser);
        saveData(data);
        res.json({ success: true, user: newUser });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

app.get('/api/chats', (req, res) => {
    try {
        const data = loadData();
        res.json({ success: true, chats: data.chats || {} });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

app.post('/api/chats', (req, res) => {
    try {
        const { chatId, messages } = req.body;
        if (!chatId) {
            return res.status(400).json({ success: false, error: 'chatId الزامی است' });
        }
        const data = loadData();
        if (!data.chats) data.chats = {};
        data.chats[chatId] = messages || [];
        saveData(data);
        res.json({ success: true, message: 'چت ذخیره شد' });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

app.get('/api/visitors', (req, res) => {
    try {
        const data = loadData();
        res.json({ success: true, visitors: data.visitors || [] });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

app.get('/api/status', (req, res) => {
    res.json({
        success: true,
        status: 'online',
        uptime: process.uptime(),
        timestamp: Date.now(),
        dataFile: DATA_FILE
    });
});

app.get('/', (req, res) => {
    res.json({
        name: '📚 فضای ابری کتابخانه',
        version: '1.0.0',
        status: 'online',
        endpoints: {
            data: '/api/data',
            books: '/api/books',
            users: '/api/users',
            chats: '/api/chats',
            visitors: '/api/visitors',
            status: '/api/status'
        }
    });
});

app.listen(PORT, () => {
    console.log(`🚀 سرور ابری در پورت ${PORT} راه‌اندازی شد`);
    console.log(`📁 فایل داده: ${DATA_FILE}`);
    console.log(`🌐 آدرس: http://localhost:${PORT}`);
});

if (!fs.existsSync(DATA_FILE)) {
    saveData({ books: [], users: [], chats: {}, visitors: [], lastModified: 0 });
    console.log('✅ فایل data.json ایجاد شد');
}
