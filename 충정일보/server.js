
const express = require('express');
const path = require('path');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const app = express();
const PORT = 3000;
const JWT_SECRET = 'my_super_secret_key';

app.use(express.json());
app.use('/static', express.static(path.join(__dirname, 'static')));

const pool = mysql.createPool({
    host: 'localhost',
    user: 'testuser',
    password: '1234',
    database: 'testdb',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

function createToken(user) {
    return jwt.sign(
        {
            userId: user.user_id,
            userName: user.user_name,
            role: user.role
        },
        JWT_SECRET,
        { expiresIn: '1h' }
    );
}

function verifyToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            message: '토큰이 없습니다.'
        });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({
                success: false,
                message: '토큰이 유효하지 않습니다.'
            });
        }

        req.user = decoded;
        next();
    });
}

function verifyWriter(req, res, next) {
    if (req.user.role !== '기자') {
        return res.status(403).json({
            success: false,
            message: '기자만 접근 가능합니다.'
        });
    }
    next();
}

// 페이지 라우팅
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'templates', 'main.html'));
});

app.get('/writer', (req, res) => {
    res.sendFile(path.join(__dirname, 'templates', 'writer.html'));
});

app.get('/customer', (req, res) => {
    res.sendFile(path.join(__dirname, 'templates', 'customer.html'));
});

// 회원가입
app.post('/api/signup', async (req, res) => {
    try {
        const { userId, password, userName, role } = req.body;

        if (!userId || !password || !userName || !role) {
            return res.status(400).json({
                success: false,
                message: '모든 항목을 입력해주세요.'
            });
        }

        const [exists] = await pool.execute(
            'SELECT id FROM users WHERE user_id = ?',
            [userId]
        );

        if (exists.length > 0) {
            return res.status(409).json({
                success: false,
                message: '이미 존재하는 아이디입니다.'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await pool.execute(
            'INSERT INTO users (user_id, password, user_name, role) VALUES (?, ?, ?, ?)',
            [userId, hashedPassword, userName, role]
        );

        const token = createToken({
            user_id: userId,
            user_name: userName,
            role: role
        });

        res.json({
            success: true,
            token,
            role
        });
    } catch (err) {
        console.error('회원가입 오류:', err);
        res.status(500).json({
            success: false,
            message: '회원가입 중 오류가 발생했습니다.'
        });
    }
});

// 로그인
app.post('/api/login', async (req, res) => {
    try {
        const { userId, password } = req.body;

        if (!userId || !password) {
            return res.status(400).json({
                success: false,
                message: '아이디와 비밀번호를 입력해주세요.'
            });
        }

        const [rows] = await pool.execute(
            'SELECT * FROM users WHERE user_id = ?',
            [userId]
        );

        const user = rows[0];

        if (!user) {
            return res.status(401).json({
                success: false,
                message: '아이디 또는 비밀번호가 올바르지 않습니다.'
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: '아이디 또는 비밀번호가 올바르지 않습니다.'
            });
        }

        const token = createToken(user);

        res.json({
            success: true,
            token,
            role: user.role
        });
    } catch (err) {
        console.error('로그인 오류:', err);
        res.status(500).json({
            success: false,
            message: '로그인 중 오류가 발생했습니다.'
        });
    }
});

// 토큰 검증
app.get('/api/verify', verifyToken, (req, res) => {
    res.json({
        success: true,
        user: req.user
    });
});

// 기사 작성
app.post('/api/news/write', verifyToken, verifyWriter, async (req, res) => {
    try {
        const { title, reporterPhoto, reporterName, newsPhoto, content } = req.body;

        if (!title || !content) {
            return res.status(400).json({
                success: false,
                message: '제목과 본문은 필수입니다.'
            });
        }

        await pool.execute(
            `
            INSERT INTO news (title, reporter_name, reporter_photo, news_photo, content)
            VALUES (?, ?, ?, ?, ?)
            `,
            [
                title,
                reporterName || req.user.userName,
                reporterPhoto || '',
                newsPhoto || '',
                content
            ]
        );

        res.json({
            success: true,
            message: '기사가 등록되었습니다.'
        });
    } catch (err) {
        console.error('기사 등록 오류:', err);
        res.status(500).json({
            success: false,
            message: '기사 등록 중 오류가 발생했습니다.'
        });
    }
});

// 기사 검색
app.get('/api/news/search', async (req, res) => {
    try {
        const keyword = (req.query.q || '').trim();

        let sql = `
            SELECT
                id,
                title,
                reporter_name,
                reporter_photo,
                news_photo,
                content,
                DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') AS created_at
            FROM news
        `;
        let params = [];

        if (keyword) {
            sql += `
                WHERE title LIKE ?
                   OR content LIKE ?
                   OR reporter_name LIKE ?
            `;
            params = [`%${keyword}%`, `%${keyword}%`, `%${keyword}%`];
        }

        sql += ' ORDER BY id DESC';

        const [rows] = await pool.execute(sql, params);
        res.json(rows);
    } catch (err) {
        console.error('기사 검색 오류:', err);
        res.status(500).json([]);
    }
});

app.listen(PORT, () => {
    console.log(`서버 실행 중: http://localhost:${PORT}`);
});
