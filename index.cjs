const express = require('express');
const crypto = require('crypto');
const bodyParser = require('body-parser');
const cors = require('cors');
const pool = require('./db-adapter.cjs');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === 'production';
const authSecret = process.env.AUTH_SECRET || 'v2v-default-auth-secret-key-2026';

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});



app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

app.use((err, req, res, next) => {
    if (err && err.type === 'entity.too.large') {
        return res.status(413).json({ error: 'Image too large. Please upload a smaller image file.' });
    }
    if (err && err.type === 'entity.parse.failed') {
        return res.status(400).json({ error: 'Request body must be valid JSON.' });
    }
    next(err);
});

const isTruthy = (v) => v === true || v === 1 || v === '1' || v === 'true';

const formatUserResponse = (user) => {
    const isMainAdmin = (user.role || '').toUpperCase() === 'MAIN_ADMIN';
    const canManageBlogs = isMainAdmin || isTruthy(user.can_manage_blogs);
    const canManageExperiments = isMainAdmin || isTruthy(user.can_manage_experiments);
    return {
        id: user.id,
        email: user.email,
        name: user.name || user.email.split('@')[0],
        image: user.image || '',
        role: isMainAdmin ? 'MAIN_ADMIN' : 'CO_FOUNDER',
        can_manage_blogs: canManageBlogs,
        can_manage_experiments: canManageExperiments,
        blog_manager: canManageBlogs,
        experiment_manager: canManageExperiments,
        blog_granted_by: user.blog_granted_by || '',
        experiment_granted_by: user.experiment_granted_by || ''
    };
};

const createSessionToken = (user) => {
    const payload = Buffer.from(JSON.stringify({
        id: user.id,
        email: user.email,
        expiresAt: Date.now() + 8 * 60 * 60 * 1000
    })).toString('base64url');
    const signature = crypto.createHmac('sha256', authSecret).update(payload).digest('base64url');
    return `${payload}.${signature}`;
};

const getUserFromSessionToken = async (token) => {
    const [payload, signature] = (token || '').split('.');
    if (!payload || !signature) return null;
    const expectedSignature = crypto.createHmac('sha256', authSecret).update(payload).digest('base64url');
    if (signature.length !== expectedSignature.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) return null;
    try {
        const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
        if (!session.email || session.expiresAt < Date.now()) return null;
        const result = await pool.query('SELECT * FROM admin_users WHERE email = $1', [session.email]);
        return result.rows[0] || null;
    } catch {
        return null;
    }
};

const getAdminUserFromHeaders = async (req) => {
    const authorization = req.headers.authorization || '';
    if (!authorization.startsWith('Bearer ')) return null;
    return getUserFromSessionToken(authorization.slice(7));
};

const requireAdminUser = async (req, res) => {
    const user = await getAdminUserFromHeaders(req);
    if (!user) {
        res.status(403).json({ error: '403 Forbidden: Unauthorized access.' });
        return null;
    }
    return user;
};

const requireMainAdmin = async (req, res) => {
    const user = await requireAdminUser(req, res);
    if (!user) return null;
    const normalizedRole = (user.role || '').toUpperCase();
    if (normalizedRole !== 'MAIN_ADMIN') {
        res.status(403).json({ error: '403 Forbidden: Only Main Admin can perform this action.' });
        return null;
    }
    return user;
};

const requirePermission = async (req, res, permission) => {
    const user = await requireAdminUser(req, res);
    if (!user) return null;
    const normalizedRole = (user.role || '').toUpperCase();
    if (normalizedRole === 'MAIN_ADMIN') return user;

    const hasBlogPerm = isTruthy(user.can_manage_blogs) || user.blog_manager === true;
    const hasExpPerm = isTruthy(user.can_manage_experiments) || user.experiment_manager === true;

    if ((permission === 'can_manage_blogs' || permission === 'blog_manager') && hasBlogPerm) {
        return user;
    }
    if ((permission === 'can_manage_experiments' || permission === 'experiment_manager') && hasExpPerm) {
        return user;
    }

    res.status(403).json({ error: '403 Forbidden: Permission denied.' });
    return null;
};

// Configure Transporter with Environment Variables
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// API STATUS
app.get('/api', (req, res) => {
    res.json({ message: "V2V API is running..." });
});

app.post('/api/chat', async (req, res) => {
    const question = typeof req.body?.question === 'string' ? req.body.question.trim() : '';
    if (!question) {
        return res.status(400).json({ error: 'A question is required.' });
    }

    const chatbotApiUrl = (process.env.CHATBOT_API_URL || '').replace(/\/$/, '');

    if (chatbotApiUrl) {
        try {
            const chatbotResponse = await fetch(`${chatbotApiUrl}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question }),
                signal: AbortSignal.timeout(5000)
            });

            if (chatbotResponse.ok) {
                const responseText = await chatbotResponse.text();
                let payload;
                try {
                    payload = JSON.parse(responseText);
                } catch {}

                if (payload && typeof payload.answer === 'string' && payload.answer.trim()) {
                    return res.json({ answer: payload.answer });
                }
            }
        } catch (error) {
            console.warn('External chatbot service unavailable, using built-in V2V assistant:', error.message);
        }
    }

    // Built-in intelligent V2V Assistant fallback
    const qLower = question.toLowerCase();
    let answer = "";

    if (qLower.includes("what is v2v") || qLower.includes("about v2v") || qLower.includes("who are you") || qLower.includes("vision2value")) {
        answer = "**Vision2Value (V2V Tech)** is an R&D and technology transfer powerhouse. We specialize in identifying real-world challenges, conducting cutting-edge R&D, and transferring validated solutions to industries and government organizations.";
    } else if (qLower.includes("service") || qLower.includes("offer") || qLower.includes("what do you do")) {
        answer = "V2V Tech offers end-to-end R&D and technology solutions, including:\n• **Technology R&D:** Building custom hardware & software solutions.\n• **Tech Transfer:** Seamless integration of research into production systems.\n• **Industry Solutions:** Tailored innovations for manufacturing, energy, healthcare, and government.\n• **Consulting & Support:** Ongoing optimization and technical support.";
    } else if (qLower.includes("project") || qLower.includes("experiment") || qLower.includes("work")) {
        answer = "V2V Tech drives multiple high-impact projects and experiments spanning AI, automation, and domain-specific engineering. Explore our **Experiments** page to see live research updates!";
    } else if (qLower.includes("team") || qLower.includes("founder") || qLower.includes("who works")) {
        answer = "Our team consists of passionate researchers, software engineers, and domain experts dedicated to technology transfer. Check out our **Team** page to learn more about our leaders!";
    } else if (qLower.includes("contact") || qLower.includes("email") || qLower.includes("reach") || qLower.includes("touch") || qLower.includes("location")) {
        answer = "You can get in touch with us through the **Contact Us** form on our homepage, or send your inquiries to our team. We'd love to collaborate on your next innovation!";
    } else if (qLower.includes("faq") || qLower.includes("question") || qLower.includes("help")) {
        answer = "We have answers to frequently asked questions about our technology transfer process, project timelines, and post-implementation support in our FAQ section on the homepage!";
    } else {
        answer = `Thank you for asking: "${question}". **Vision2Value (V2V Tech)** bridges research and industry solutions. Feel free to ask about our **services**, **projects**, **team**, or how to **contact** us!`;
    }

    return res.json({ answer });
});


// GET all messages (For Admin Dashboard)
app.get('/api/messages', async (req, res) => {
    const user = await requireMainAdmin(req, res);
    if (!user) return;
    try {
        const result = await pool.query('SELECT * FROM contact_messages ORDER BY created_at DESC');
        res.json({
            "message": "success",
            "data": result.rows
        });
    } catch (err) {
        res.status(400).json({ "error": err.message });
    }
});

// POST a new message (For Contact Form)
app.post('/api/contact', async (req, res) => {
    const { name, email, message } = req.body;

    try {
        // Insert into database
        const result = await pool.query(
            'INSERT INTO contact_messages (name, email, message, created_at) VALUES ($1, $2, $3, CURRENT_TIMESTAMP) RETURNING id',
            [name, email, message]
        );

        // Send email to info.v2vtech@gmail.com
        try {
            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: 'info.v2vtech@gmail.com',
                subject: `New Contact Form Message from ${name}`,
                text: `You have received a new message from the V2V Tech website contact form.\n\nName: ${name}\nEmail: ${email}\nMessage:\n${message}`,
                html: `<h3>New Contact Message</h3>
                       <p><strong>Name:</strong> ${name}</p>
                       <p><strong>Email:</strong> ${email}</p>
                       <p><strong>Message:</strong><br/>${message}</p>`
            });
            console.log("Contact email sent to info.v2vtech@gmail.com");
        } catch (mailError) {
            console.error("Failed to send contact email:", mailError);
            // We still return success since it was saved to the database
        }

        res.json({
            "message": "success",
            "data": { id: result.rows[0].id }
        });
    } catch (err) {
        res.status(400).json({ "error": err.message });
    }
});

// REGISTER - Submit request for admin approval (open to anyone)
app.post('/api/register', async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ "error": "Name, email and password are required." });
    }

    try {
        // Check if already an admin user
        const existing = await pool.query('SELECT id FROM admin_users WHERE email = $1', [email]);
        if (existing.rows.length > 0) {
            return res.status(400).json({ "error": "An account with this email already exists." });
        }

        // Check if already pending
        const pending = await pool.query('SELECT id FROM pending_registrations WHERE email = $1', [email]);
        if (pending.rows.length > 0) {
            return res.status(400).json({ "error": "A registration request for this email is already pending approval." });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert into pending_registrations
        await pool.query(
            'INSERT INTO pending_registrations (name, email, password) VALUES ($1, $2, $3) RETURNING id',
            [name, email, hashedPassword]
        );

        // Notify main admin via email
        try {
            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: 'arunsekar.v2v@gmail.com',
                subject: `🔔 New Admin Registration Request from ${name}`,
                html: `<h3>New Registration Request</h3>
                       <p><strong>Name:</strong> ${name}</p>
                       <p><strong>Email:</strong> ${email}</p>
                       <p>Login to the Admin Dashboard to approve or reject this request.</p>`
            });
        } catch (mailError) {
            console.error('Failed to send registration notification:', mailError);
        }

        res.json({ "message": "success", "data": { info: "Registration request submitted. Awaiting admin approval." } });
    } catch (err) {
        res.status(400).json({ "error": err.message });
    }
});

// LOGIN Admin - uses role and name from database
app.post('/api/login', async (req, res) => {
    const rawEmail = typeof req.body?.email === 'string' ? req.body.email.trim() : '';
    const rawPassword = typeof req.body?.password === 'string' ? req.body.password.trim() : '';

    if (!rawEmail || !rawPassword) {
        return res.status(400).json({ error: "Email and password are required." });
    }

    try {
        const result = await pool.query(
            'SELECT * FROM admin_users WHERE LOWER(TRIM(email)) = LOWER($1)',
            [rawEmail]
        );

        if (result.rows.length > 0) {
            const user = result.rows[0];
            
            let isMatch = false;
            try {
                isMatch = await bcrypt.compare(rawPassword, user.password);
            } catch (err) {
                console.warn('bcrypt compare error, checking legacy password:', err.message);
            }

            if (!isMatch && (rawPassword === user.password || req.body.password === user.password)) {
                isMatch = true;
                try {
                    const hashed = await bcrypt.hash(rawPassword, 10);
                    await pool.query('UPDATE admin_users SET password = $1 WHERE id = $2', [hashed, user.id]);
                } catch (hashErr) {
                    console.error('Failed to auto-upgrade legacy password hash:', hashErr.message);
                }
            }

            if (isMatch) {
                return res.json({ "message": "success", "data": { ...formatUserResponse(user), session_token: createSessionToken(user) } });
            } else {
                return res.status(401).json({ "error": "Invalid credentials" });
            }
        } else {
            const pending = await pool.query(
                'SELECT id FROM pending_registrations WHERE LOWER(TRIM(email)) = LOWER($1)',
                [rawEmail]
            );
            if (pending.rows.length > 0) {
                return res.status(401).json({ "error": "Your registration is pending admin approval. Please wait for confirmation." });
            } else {
                return res.status(401).json({ "error": "Invalid credentials" });
            }
        }
    } catch (err) {
        return res.status(400).json({ "error": err.message });
    }
});

// FORGOT PASSWORD - Generate OTP and Send Email
app.post('/api/forgot-password', async (req, res) => {
    const { email } = req.body;

    // Whitelist check
    const allowedEmails = [
        'arunsekar.v2v@gmail.com',
        'sivagurunathan.v2v@gmail.com',
        'jbavanieswaran.v2v@gmail.com',
        'sivaramireddy.v2v@gmail.com',
        'mareeswaran.v2v@gmail.com',
        'phravin.v2v@gmail.com'
    ];
    if (!allowedEmails.includes(email)) {
        return res.status(403).json({ "error": "Access denied. Email not found." });
    }

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60000); // 10 minutes

    try {
        // Store OTP (upsert)
        await pool.query(
            `INSERT INTO otp_store (email, otp, expires_at) 
             VALUES ($1, $2, $3) 
             ON CONFLICT (email) 
             DO UPDATE SET otp = $2, expires_at = $3`,
            [email, otp, expiresAt]
        );

        // SEND REAL EMAIL
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'V2V Admin Password Reset OTP',
            text: `Your OTP for password reset is: ${otp}\n\nThis OTP expires in 10 minutes.`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
                return res.status(500).json({ "error": "Failed to send OTP email: " + error.message });
            }
            console.log('Email sent: ' + info.response);
            res.json({ "message": "OTP sent successfully to " + email });
        });
    } catch (err) {
        res.status(500).json({ "error": err.message });
    }
});

// RESET PASSWORD
app.post('/api/reset-password', async (req, res) => {
    const { email, otp, newPassword } = req.body;

    try {
        // Verify OTP
        const result = await pool.query(
            'SELECT * FROM otp_store WHERE email = $1 AND otp = $2',
            [email, otp]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({ "error": "Invalid OTP" });
        }

        // Check expiration
        if (new Date(result.rows[0].expires_at) < new Date()) {
            return res.status(400).json({ "error": "OTP Expired" });
        }

        // Hash New Password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update Password
        await pool.query(
            'UPDATE admin_users SET password = $1 WHERE email = $2',
            [hashedPassword, email]
        );

        // Delete used OTP
        await pool.query('DELETE FROM otp_store WHERE email = $1', [email]);

        res.json({ "message": "Password updated successfully" });
    } catch (err) {
        res.status(500).json({ "error": "Failed to update password: " + err.message });
    }
});

// GET current logged-in admin with fresh permissions from DB
app.get('/api/me', async (req, res) => {
    const user = await requireAdminUser(req, res);
    if (!user) return;
    const token = req.headers.authorization ? req.headers.authorization.slice(7) : createSessionToken(user);
    res.json({ message: 'success', data: { ...formatUserResponse(user), session_token: token } });
});

// ==================== ADMIN-GATED REGISTRATION ====================

// GET pending registrations (Main Admin only)
app.get('/api/pending-registrations', async (req, res) => {
    const user = await requireMainAdmin(req, res);
    if (!user) return;
    try {
        const result = await pool.query('SELECT id, name, email, requested_at FROM pending_registrations ORDER BY requested_at DESC');
        res.json({ "message": "success", "data": result.rows });
    } catch (err) {
        res.status(400).json({ "error": err.message });
    }
});

// APPROVE registration (Main Admin only)
app.post('/api/approve-registration', async (req, res) => {
    const user = await requireMainAdmin(req, res);
    if (!user) return;

    const { id, role } = req.body;

    try {
        const pending = await pool.query('SELECT * FROM pending_registrations WHERE id = $1', [id]);
        if (pending.rows.length === 0) {
            return res.status(404).json({ "error": "Registration request not found." });
        }

        const { name, email, password } = pending.rows[0];
        const roleValue = (role && role.toUpperCase() === 'MAIN_ADMIN') ? 'MAIN_ADMIN' : 'CO_FOUNDER';
        const isMainAdmin = roleValue === 'MAIN_ADMIN';

        // Co-founders start with false for manager permissions unless Main Admin explicitly grants
        await pool.query(
            'INSERT INTO admin_users (name, email, password, role, can_manage_blogs, can_manage_experiments) VALUES ($1, $2, $3, $4, $5, $6)',
            [name, email, password, roleValue, isMainAdmin, isMainAdmin]
        );

        // Remove from pending
        await pool.query('DELETE FROM pending_registrations WHERE id = $1', [id]);

        // Send approval email
        try {
            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: email,
                subject: '✅ V2V Admin Access Approved',
                html: `<h3>Welcome to V2V Admin, ${name}!</h3>
                       <p>Your registration has been approved with role: <strong>${roleValue}</strong></p>
                       <p>You can now login with your credentials.</p>`
            });
        } catch (mailError) {
            console.error('Failed to send approval email:', mailError);
        }

        res.json({ "message": "success" });
    } catch (err) {
        res.status(400).json({ "error": err.message });
    }
});

// REJECT registration (Main Admin only)
app.post('/api/reject-registration', async (req, res) => {
    const user = await requireMainAdmin(req, res);
    if (!user) return;

    const { id, reason } = req.body;

    try {
        const pending = await pool.query('SELECT * FROM pending_registrations WHERE id = $1', [id]);
        if (pending.rows.length === 0) {
            return res.status(404).json({ "error": "Registration request not found." });
        }

        const { name, email } = pending.rows[0];

        await pool.query('DELETE FROM pending_registrations WHERE id = $1', [id]);

        // Send rejection email
        try {
            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: email,
                subject: '❌ V2V Admin Access Request Declined',
                html: `<h3>Hello ${name},</h3>
                       <p>Your request for V2V Admin access has been declined.</p>
                       ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
                       <p>If you believe this is an error, please contact the V2V team.</p>`
            });
        } catch (mailError) {
            console.error('Failed to send rejection email:', mailError);
        }

        res.json({ "message": "success" });
    } catch (err) {
        res.status(400).json({ "error": err.message });
    }
});

// GET public team members for the public Team page
app.get('/api/public-team', async (req, res) => {
    try {
        const result = await pool.query('SELECT id, email, name, role, image FROM admin_users ORDER BY id ASC');
        res.json({ "message": "success", "data": result.rows });
    } catch (err) {
        res.status(400).json({ "error": err.message });
    }
});

// GET public blogs for the public Blogs page
app.get('/api/public-blogs', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM blogs ORDER BY published_at DESC');
        res.json({ "message": "success", "data": result.rows });
    } catch (err) {
        res.status(400).json({ "error": err.message });
    }
});

// GET single public blog post
app.get('/api/public-blogs/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM blogs WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ "error": "Blog post not found" });
        }
        res.json({ "message": "success", "data": result.rows[0] });
    } catch (err) {
        res.status(400).json({ "error": err.message });
    }
});

// GET public projects/experiments for public Experiments page
app.get('/api/public-projects', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM projects ORDER BY id DESC');
        res.json({ "message": "success", "data": result.rows });
    } catch (err) {
        res.status(400).json({ "error": err.message });
    }
});

// GET current admin users (Main Admin only)
app.get('/api/admin-users', async (req, res) => {
    const user = await requireMainAdmin(req, res);
    if (!user) return;

    try {
        const result = await pool.query('SELECT id, name, email, role, image, can_manage_blogs, can_manage_experiments, blog_granted_by, experiment_granted_by FROM admin_users ORDER BY email');
        const formattedUsers = result.rows.map(u => formatUserResponse(u));
        res.json({ "message": "success", "data": formattedUsers });
    } catch (err) {
        res.status(400).json({ "error": err.message });
    }
});

// CREATE a new admin user (Main Admin only)
app.post('/api/admin-users', async (req, res) => {
    const user = await requireMainAdmin(req, res);
    if (!user) return;

    const { name, email, role, password, can_manage_blogs, can_manage_experiments, blog_manager, experiment_manager } = req.body;
    if (!email) return res.status(400).json({ "error": "Email is required" });

    try {
        // prevent duplicate emails
        const exists = await pool.query('SELECT id FROM admin_users WHERE email = $1', [email]);
        if (exists.rows.length > 0) return res.status(400).json({ "error": "Admin with that email already exists" });

        const roleValue = (role && role.toUpperCase() === 'MAIN_ADMIN') ? 'MAIN_ADMIN' : 'CO_FOUNDER';
        const isMainAdmin = roleValue === 'MAIN_ADMIN';
        const blogsFlag = isMainAdmin ? true : (typeof can_manage_blogs === 'boolean' ? can_manage_blogs : (typeof blog_manager === 'boolean' ? blog_manager : false));
        const exFlag = isMainAdmin ? true : (typeof can_manage_experiments === 'boolean' ? can_manage_experiments : (typeof experiment_manager === 'boolean' ? experiment_manager : false));
        const userPassword = (password && String(password).trim()) ? password : 'CoFounder@123456';
        const hashedPassword = await bcrypt.hash(userPassword, 12);
        const granter = user.name || user.email;

        const insertRes = await pool.query(
            'INSERT INTO admin_users (name, email, password, role, image, can_manage_blogs, can_manage_experiments, blog_granted_by, experiment_granted_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id',
            [name || '', email, hashedPassword, roleValue, '', blogsFlag, exFlag, blogsFlag ? granter : '', exFlag ? granter : '']
        );

        let created;
        const newId = insertRes.rows[0]?.id;
        if (newId) {
            const fetched = await pool.query('SELECT * FROM admin_users WHERE id = $1', [newId]);
            created = fetched.rows[0];
        }

        if (!created) {
            created = {
                id: newId || 0,
                name: name || '',
                email,
                role: roleValue,
                image: '',
                can_manage_blogs: blogsFlag,
                can_manage_experiments: exFlag,
                blog_granted_by: blogsFlag ? granter : '',
                experiment_granted_by: exFlag ? granter : ''
            };
        }

        res.json({
            "message": "success",
            "data": formatUserResponse(created)
        });
    } catch (err) {
        res.status(400).json({ "error": err.message });
    }
});

// UPDATE admin user role (Main Admin only)
app.put('/api/admin-users/:id/role', async (req, res) => {
    const user = await requireMainAdmin(req, res);
    if (!user) return;

    const { role } = req.body;
    const { id } = req.params;

    const roleValue = (role && role.toUpperCase() === 'MAIN_ADMIN') ? 'MAIN_ADMIN' : 'CO_FOUNDER';

    try {
        // Prevent the acting main admin from demoting themselves to keep a single Main Admin in control.
        if (parseInt(id, 10) === user.id && roleValue !== 'MAIN_ADMIN') {
            return res.status(400).json({ "error": "Main Admin cannot demote themselves." });
        }

        await pool.query(
            'UPDATE admin_users SET role = $1 WHERE id = $2',
            [roleValue, id]
        );
        res.json({ "message": "success" });
    } catch (err) {
        res.status(400).json({ "error": err.message });
    }
});

// UPDATE admin user permissions (Main Admin only)
app.put('/api/admin-users/:id/permissions', async (req, res) => {
    const user = await requireMainAdmin(req, res);
    if (!user) return;

    let { can_manage_blogs, can_manage_experiments, blog_manager, experiment_manager } = req.body;
    if (can_manage_blogs === undefined) can_manage_blogs = blog_manager;
    if (can_manage_experiments === undefined) can_manage_experiments = experiment_manager;

    if (typeof can_manage_blogs !== 'boolean' || typeof can_manage_experiments !== 'boolean') {
        return res.status(400).json({ "error": "Invalid permission payload. Boolean flags required." });
    }

    const { id } = req.params;

    try {
        const target = await pool.query('SELECT id, role FROM admin_users WHERE id = $1', [id]);
        if (target.rows.length === 0) {
            return res.status(404).json({ "error": "Admin user not found." });
        }
        if ((target.rows[0].role || '').toUpperCase() === 'MAIN_ADMIN') {
            return res.status(400).json({ "error": "Main Admin permissions cannot be changed here." });
        }

        const granter = user.name || user.email;
        const blogGrantedBy = can_manage_blogs ? granter : '';
        const experimentGrantedBy = can_manage_experiments ? granter : '';

        await pool.query(
            'UPDATE admin_users SET can_manage_blogs = $1, can_manage_experiments = $2, blog_granted_by = $3, experiment_granted_by = $4 WHERE id = $5',
            [can_manage_blogs, can_manage_experiments, blogGrantedBy, experimentGrantedBy, id]
        );
        res.json({
            "message": "success",
            "data": {
                id: parseInt(id, 10),
                can_manage_blogs,
                can_manage_experiments,
                blog_manager: can_manage_blogs,
                experiment_manager: can_manage_experiments,
                blog_granted_by: blogGrantedBy,
                experiment_granted_by: experimentGrantedBy
            }
        });
    } catch (err) {
        res.status(400).json({ "error": err.message });
    }
});

// DELETE an admin user / co-founder (Main Admin only)
app.delete('/api/admin-users/:id', async (req, res) => {
    const user = await requireMainAdmin(req, res);
    if (!user) return;

    const { id } = req.params;

    try {
        const target = await pool.query('SELECT id, email, role FROM admin_users WHERE id = $1', [id]);
        if (target.rows.length === 0) {
            return res.status(404).json({ "error": "Admin user not found." });
        }

        const targetUser = target.rows[0];
        if (parseInt(id, 10) === user.id) {
            return res.status(400).json({ "error": "You cannot delete your own account." });
        }

        if ((targetUser.role || '').toUpperCase() === 'MAIN_ADMIN') {
            return res.status(400).json({ "error": "Main Admin user cannot be deleted." });
        }

        await pool.query('DELETE FROM custom_manager_permissions WHERE admin_user_id = $1', [id]).catch(() => {});
        await pool.query('DELETE FROM manager_access_requests WHERE admin_user_id = $1', [id]).catch(() => {});
        await pool.query('DELETE FROM admin_users WHERE id = $1', [id]);

        res.json({ "message": "success" });
    } catch (err) {
        console.error('Error deleting admin user:', err);
        res.status(400).json({ "error": err.message });
    }
});

// SET / RESET admin user password (Main Admin only)
app.post('/api/admin-users/set-password', async (req, res) => {
    const user = await requireMainAdmin(req, res);
    if (!user) return;

    const { email, id, newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ "error": "New password must be at least 6 characters long." });
    }

    if (!email && !id) {
        return res.status(400).json({ "error": "User email or ID is required." });
    }

    try {
        let target;
        if (id) {
            target = await pool.query('SELECT id, email, name FROM admin_users WHERE id = $1', [id]);
        } else {
            target = await pool.query('SELECT id, email, name FROM admin_users WHERE LOWER(TRIM(email)) = LOWER(TRIM($1))', [email]);
        }

        if (target.rows.length === 0) {
            return res.status(404).json({ "error": "Admin user not found." });
        }

        const targetUser = target.rows[0];
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await pool.query(
            'UPDATE admin_users SET password = $1 WHERE id = $2',
            [hashedPassword, targetUser.id]
        );

        res.json({
            "message": "success",
            "email": targetUser.email,
            "name": targetUser.name
        });
    } catch (err) {
        res.status(500).json({ "error": "Failed to update password: " + err.message });
    }
});


// UPDATE PROFILE (Any Admin)
app.post('/api/update-profile', async (req, res) => {
    const user = await requireAdminUser(req, res);
    if (!user) return;
    const { name, image } = req.body;
    const email = user.email;

    try {
        await pool.query(
            'UPDATE admin_users SET name = $1, image = $2 WHERE email = $3',
            [name, image || '', email]
        );
        console.log(`Profile updated successfully for: ${email}`);
        res.json({ "message": "success" });
    } catch (err) {
        console.error(`Profile update error for ${email}:`, err);
        res.status(400).json({ "error": err.message });
    }
});

app.get('/api/projects', async (req, res) => {
    const user = await requirePermission(req, res, 'can_manage_experiments');
    if (!user) return;

    try {
        const result = await pool.query('SELECT * FROM projects ORDER BY id');
        res.json({ "message": "success", "data": result.rows });
    } catch (err) {
        res.status(400).json({ "error": err.message });
    }
});

// ADD/UPDATE project (Main Admin + Experiment Manager Only)
app.post('/api/projects', async (req, res) => {
    const user = await requirePermission(req, res, 'can_manage_experiments');
    if (!user) return;

    const { name, technicalName, description, image, status, completion, id } = req.body;
    const creatorName = user.name || user.email.split('@')[0];
    const creatorEmail = user.email;

    try {
        if (id) {
            await pool.query(
                'UPDATE projects SET name = $1, technicalName = $2, description = $3, image = $4, status = $5, completion = $6 WHERE id = $7',
                [name, technicalName, description, image, status, completion, id]
            );
            res.json({ "message": "success", "data": { id: parseInt(id, 10) } });
        } else {
            const result = await pool.query(
                `INSERT INTO projects (name, technicalName, description, image, status, completion, created_by, created_by_email)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
                [name, technicalName, description, image, status, completion, creatorName, creatorEmail]
            );
            res.json({ "message": "success", "data": { id: result.rows[0].id } });
        }
    } catch (err) {
        res.status(400).json({ "error": err.message });
    }
});

// DELETE project (Main Admin + Experiment Manager Only)
app.delete('/api/projects/:id', async (req, res) => {
    const user = await requirePermission(req, res, 'can_manage_experiments');
    if (!user) return;

    try {
        await pool.query('DELETE FROM projects WHERE id = $1', [req.params.id]);
        res.json({ "message": "success" });
    } catch (err) {
        res.status(400).json({ "error": err.message });
    }
});

// ==================== BLOG CRUD ====================

// GET all blogs
app.get('/api/blogs', async (req, res) => {
    const user = await requirePermission(req, res, 'can_manage_blogs');
    if (!user) return;

    try {
        const result = await pool.query('SELECT * FROM blogs ORDER BY published_at DESC');
        res.json({ message: 'success', data: result.rows });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// GET single blog
app.get('/api/blogs/:id', async (req, res) => {
    const user = await requirePermission(req, res, 'can_manage_blogs');
    if (!user) return;

    try {
        const result = await pool.query('SELECT * FROM blogs WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Blog not found' });
        res.json({ message: 'success', data: result.rows[0] });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// POST create new blog (website manager + main admin)
app.post('/api/blogs', async (req, res) => {
    const user = await requirePermission(req, res, 'can_manage_blogs');
    if (!user) return;

    const { title, description, content, image, category, author } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO blogs (title, description, content, image, category, author) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
            [title, description, content || '', image || '', category || 'V2V Insights', author || 'V2V Tech']
        );
        res.json({ message: 'success', data: { id: result.rows[0].id } });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// PUT update blog
app.put('/api/blogs/:id', async (req, res) => {
    const user = await requirePermission(req, res, 'can_manage_blogs');
    if (!user) return;

    const { title, description, content, image, category, author } = req.body;
    try {
        await pool.query(
            'UPDATE blogs SET title=$1, description=$2, content=$3, image=$4, category=$5, author=$6 WHERE id=$7',
            [title, description, content, image, category, author, req.params.id]
        );
        res.json({ message: 'success' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// DELETE blog
app.delete('/api/blogs/:id', async (req, res) => {
    const user = await requirePermission(req, res, 'can_manage_blogs');
    if (!user) return;

    try {
        await pool.query('DELETE FROM blogs WHERE id = $1', [req.params.id]);
        res.json({ message: 'success' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// ==================== MANAGER ACCESS REQUESTS (Co-Founder → Main Admin) ====================

const formatAccessRequestRow = (row) => ({
    id: row.id,
    admin_user_id: row.admin_user_id,
    requester_name: row.requester_name || row.name || '',
    requester_email: row.requester_email || row.email || '',
    request_type: row.request_type,
    manager_id: row.manager_id || null,
    manager_name: row.manager_name || '',
    message: row.message || '',
    status: row.status || 'pending',
    requested_at: row.requested_at,
    reviewed_by: row.reviewed_by || '',
    reviewed_at: row.reviewed_at || null,
    rejection_reason: row.rejection_reason || ''
});

const accessRequestLabel = (type, managerName) => {
    if (type === 'blog') return 'Blog Manager';
    if (type === 'experiment') return 'Experiment Manager';
    return managerName || 'Custom Manager';
};

// GET requestable managers for co-founder
app.get('/api/manager-access-requests/available', async (req, res) => {
    const user = await requireAdminUser(req, res);
    if (!user) return;
    if ((user.role || '').toUpperCase() === 'MAIN_ADMIN') {
        return res.json({ message: 'success', data: [] });
    }
    try {
        const pending = await pool.query(
            `SELECT request_type, manager_id FROM manager_access_requests
             WHERE admin_user_id = $1 AND status = 'pending'`,
            [user.id]
        );
        const pendingKeys = new Set(
            pending.rows.map(p => `${p.request_type}:${p.manager_id || ''}`)
        );
        const items = [];

        if (!isTruthy(user.can_manage_blogs)) {
            const key = 'blog:';
            if (!pendingKeys.has(key)) {
                items.push({ request_type: 'blog', label: 'Blog Manager' });
            }
        }
        if (!isTruthy(user.can_manage_experiments)) {
            const key = 'experiment:';
            if (!pendingKeys.has(key)) {
                items.push({ request_type: 'experiment', label: 'Experiment Manager' });
            }
        }

        const managers = await pool.query(
            `SELECT id, name FROM dynamic_features WHERE is_active = 1
             AND (status IS NULL OR status = '' OR status = 'active')
             ORDER BY name`
        );
        const perms = await pool.query(
            'SELECT feature_id FROM dynamic_feature_permissions WHERE admin_user_id = $1',
            [user.id]
        );
        const granted = new Set(perms.rows.map(r => r.feature_id));
        for (const m of managers.rows) {
            if (granted.has(m.id)) continue;
            const key = `custom:${m.id}`;
            if (!pendingKeys.has(key)) {
                items.push({ request_type: 'custom', manager_id: m.id, label: m.name });
            }
        }

        res.json({ message: 'success', data: items });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// GET my access requests (Co-Founder)
app.get('/api/manager-access-requests/mine', async (req, res) => {
    const user = await requireAdminUser(req, res);
    if (!user) return;
    try {
        const result = await pool.query(
            `SELECT r.*, u.name AS requester_name, u.email AS requester_email, f.name AS manager_name
             FROM manager_access_requests r
             INNER JOIN admin_users u ON u.id = r.admin_user_id
             LEFT JOIN dynamic_features f ON f.id = r.manager_id
             WHERE r.admin_user_id = $1
             ORDER BY r.requested_at DESC`,
            [user.id]
        );
        res.json({ message: 'success', data: result.rows.map(formatAccessRequestRow) });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// GET pending access requests (Main Admin)
app.get('/api/manager-access-requests/pending', async (req, res) => {
    const user = await requireMainAdmin(req, res);
    if (!user) return;
    try {
        const result = await pool.query(
            `SELECT r.*, u.name AS requester_name, u.email AS requester_email, f.name AS manager_name
             FROM manager_access_requests r
             LEFT JOIN admin_users u ON u.id = r.admin_user_id
             LEFT JOIN dynamic_features f ON f.id = r.manager_id
             WHERE r.status = 'pending'
             ORDER BY r.requested_at DESC`
        );
        res.json({ message: 'success', data: result.rows.map(formatAccessRequestRow) });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// POST submit access request (Co-Founder)
app.post('/api/manager-access-requests', async (req, res) => {
    const user = await requireAdminUser(req, res);
    if (!user) return;
    if ((user.role || '').toUpperCase() === 'MAIN_ADMIN') {
        return res.status(400).json({ error: 'Main Admin already has full access.' });
    }

    const { request_type, manager_id, message } = req.body;
    const type = (request_type || '').toLowerCase();
    if (!['blog', 'experiment', 'custom'].includes(type)) {
        return res.status(400).json({ error: 'Invalid request type.' });
    }

    try {
        if (type === 'blog') {
            if (isTruthy(user.can_manage_blogs)) {
                return res.status(400).json({ error: 'You already have Blog Manager access.' });
            }
        } else if (type === 'experiment') {
            if (isTruthy(user.can_manage_experiments)) {
                return res.status(400).json({ error: 'You already have Experiment Manager access.' });
            }
        } else {
            const mid = parseInt(manager_id, 10);
            if (!mid) return res.status(400).json({ error: 'Manager is required for custom requests.' });
            const mgr = await pool.query(
                `SELECT id FROM dynamic_features WHERE id = $1 AND is_active = 1`,
                [mid]
            );
            if (mgr.rows.length === 0) {
                return res.status(404).json({ error: 'Manager not found.' });
            }
            const perm = await pool.query(
                'SELECT id FROM dynamic_feature_permissions WHERE feature_id = $1 AND admin_user_id = $2',
                [mid, user.id]
            );
            if (perm.rows.length > 0) {
                return res.status(400).json({ error: 'You already have access to this manager.' });
            }
        }

        const midVal = type === 'custom' ? parseInt(manager_id, 10) : null;
        const dup = await pool.query(
            `SELECT id FROM manager_access_requests
             WHERE admin_user_id = $1 AND status = 'pending' AND request_type = $2
             AND ((manager_id IS NULL AND $3 IS NULL) OR manager_id = $3)`,
            [user.id, type, midVal]
        );
        if (dup.rows.length > 0) {
            return res.status(400).json({ error: 'You already have a pending request for this access.' });
        }

        const result = await pool.query(
            `INSERT INTO manager_access_requests (admin_user_id, request_type, manager_id, message)
             VALUES ($1, $2, $3, $4) RETURNING id`,
            [user.id, type, midVal, (message || '').trim()]
        );

        res.json({ message: 'success', data: { id: result.rows[0].id } });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// POST approve access request (Main Admin)
app.post('/api/manager-access-requests/:id/approve', async (req, res) => {
    const user = await requireMainAdmin(req, res);
    if (!user) return;
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ error: 'Invalid request id.' });

    try {
        const reqResult = await pool.query(
            `SELECT r.*, u.email AS requester_email, u.name AS requester_name, f.name AS manager_name
             FROM manager_access_requests r
             INNER JOIN admin_users u ON u.id = r.admin_user_id
             LEFT JOIN dynamic_features f ON f.id = r.manager_id
             WHERE r.id = $1 AND r.status = 'pending'`,
            [id]
        );
        if (reqResult.rows.length === 0) {
            return res.status(404).json({ error: 'Pending request not found.' });
        }
        const request = reqResult.rows[0];
        const granter = user.name || user.email;

        if (request.request_type === 'blog') {
            await pool.query(
                'UPDATE admin_users SET can_manage_blogs = TRUE, blog_granted_by = $1 WHERE id = $2',
                [granter, request.admin_user_id]
            );
        } else if (request.request_type === 'experiment') {
            await pool.query(
                'UPDATE admin_users SET can_manage_experiments = TRUE, experiment_granted_by = $1 WHERE id = $2',
                [granter, request.admin_user_id]
            );
        } else if (request.request_type === 'custom' && request.manager_id) {
            const existing = await pool.query(
                'SELECT id FROM dynamic_feature_permissions WHERE feature_id = $1 AND admin_user_id = $2',
                [request.manager_id, request.admin_user_id]
            );
            if (existing.rows.length > 0) {
                await pool.query(
                    'UPDATE dynamic_feature_permissions SET granted_by = $1, granted_at = CURRENT_TIMESTAMP WHERE feature_id = $2 AND admin_user_id = $3',
                    [granter, request.manager_id, request.admin_user_id]
                );
            } else {
                await pool.query(
                    'INSERT INTO dynamic_feature_permissions (feature_id, admin_user_id, granted_by) VALUES ($1, $2, $3)',
                    [request.manager_id, request.admin_user_id, granter]
                );
            }
        }

        await pool.query(
            `UPDATE manager_access_requests SET status = 'approved', reviewed_by = $1, reviewed_at = CURRENT_TIMESTAMP WHERE id = $2`,
            [granter, id]
        );

        const label = accessRequestLabel(request.request_type, request.manager_name);
        try {
            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: request.requester_email,
                subject: `✅ V2V Access Approved: ${label}`,
                html: `<h3>Hello ${request.requester_name},</h3>
                       <p>Your request for <strong>${label}</strong> access has been approved by ${granter}.</p>
                       <p>You can now use this manager from your admin dashboard.</p>`
            });
        } catch (mailError) {
            console.error('Failed to send approval email:', mailError);
        }

        res.json({ message: 'success' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// POST reject access request (Main Admin)
app.post('/api/manager-access-requests/:id/reject', async (req, res) => {
    const user = await requireMainAdmin(req, res);
    if (!user) return;
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ error: 'Invalid request id.' });
    const { reason } = req.body || {};

    try {
        const reqResult = await pool.query(
            `SELECT r.*, u.email AS requester_email, u.name AS requester_name, f.name AS manager_name
             FROM manager_access_requests r
             INNER JOIN admin_users u ON u.id = r.admin_user_id
             LEFT JOIN dynamic_features f ON f.id = r.manager_id
             WHERE r.id = $1 AND r.status = 'pending'`,
            [id]
        );
        if (reqResult.rows.length === 0) {
            return res.status(404).json({ error: 'Pending request not found.' });
        }
        const request = reqResult.rows[0];
        const granter = user.name || user.email;
        const rejectionReason = (reason || '').trim();

        await pool.query(
            `UPDATE manager_access_requests SET status = 'rejected', reviewed_by = $1, reviewed_at = CURRENT_TIMESTAMP, rejection_reason = $2 WHERE id = $3`,
            [granter, rejectionReason, id]
        );

        const label = accessRequestLabel(request.request_type, request.manager_name);
        try {
            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: request.requester_email,
                subject: `❌ V2V Access Request Declined: ${label}`,
                html: `<h3>Hello ${request.requester_name},</h3>
                       <p>Your request for <strong>${label}</strong> access has been declined.</p>
                       ${rejectionReason ? `<p><strong>Reason:</strong> ${rejectionReason}</p>` : ''}`
            });
        } catch (mailError) {
            console.error('Failed to send rejection email:', mailError);
        }

        res.json({ message: 'success' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// ==================== FAQ MANAGEMENT ====================
// GET all FAQs (Public)
app.get('/api/faqs', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM faqs ORDER BY display_order ASC, id ASC');
        res.json({ message: 'success', data: result.rows });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// POST create new FAQ (Authenticated Admin)
app.post('/api/faqs', async (req, res) => {
    const user = await requireAdminUser(req, res);
    if (!user) return;

    const { question, answer, display_order } = req.body;
    if (!question || !answer) {
        return res.status(400).json({ error: 'Question and answer are required.' });
    }

    try {
        const order = display_order !== undefined ? parseInt(display_order, 10) : 0;
        const result = await pool.query(
            'INSERT INTO faqs (question, answer, display_order) VALUES ($1, $2, $3) RETURNING id',
            [question, answer, order]
        );
        res.json({ message: 'success', data: { id: result.rows[0].id } });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// PUT update FAQ (Authenticated Admin)
app.put('/api/faqs/:id', async (req, res) => {
    const user = await requireAdminUser(req, res);
    if (!user) return;

    const { question, answer, display_order } = req.body;
    if (!question || !answer) {
        return res.status(400).json({ error: 'Question and answer are required.' });
    }

    try {
        const order = display_order !== undefined ? parseInt(display_order, 10) : 0;
        await pool.query(
            'UPDATE faqs SET question = $1, answer = $2, display_order = $3 WHERE id = $4',
            [question, answer, order, req.params.id]
        );
        res.json({ message: 'success' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// DELETE FAQ (Authenticated Admin)
app.delete('/api/faqs/:id', async (req, res) => {
    const user = await requireAdminUser(req, res);
    if (!user) return;

    try {
        await pool.query('DELETE FROM faqs WHERE id = $1', [req.params.id]);
        res.json({ message: 'success' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// ==================== FOOTER SERVICES MANAGEMENT ====================
// GET all footer services (Public)
app.get('/api/footer-services', async (req, res) => {
    try {
        let result = await pool.query('SELECT * FROM footer_services ORDER BY display_order ASC, id ASC');
        let rows = result.rows || [];

        // Seed default core services ONLY if the table is completely empty
        if (rows.length === 0) {
            const defaultCoreServices = [
                { name: "Problem Identification", href: "/problem-identification", display_order: 1 },
                { name: "R&D Solutions", href: "/rd-solutions", display_order: 2 },
                { name: "Technology Transfer", href: "/technology-transfer", display_order: 3 },
                { name: "Industry Collaboration", href: "/industry-collaboration", display_order: 4 },
                { name: "Consulting", href: "/consulting", display_order: 5 }
            ];

            for (const defaultSvc of defaultCoreServices) {
                await pool.query(
                    'INSERT INTO footer_services (name, href, display_order, image) VALUES ($1, $2, $3, $4)',
                    [defaultSvc.name, defaultSvc.href, defaultSvc.display_order, '']
                );
            }
            result = await pool.query('SELECT * FROM footer_services ORDER BY display_order ASC, id ASC');
            rows = result.rows || [];
        }

        res.json({ message: 'success', data: rows });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// POST create new footer service (Authenticated Admin)
app.post('/api/footer-services', async (req, res) => {
    const user = await requireAdminUser(req, res);
    if (!user) return;

    const { name, href, image, display_order } = req.body;
    if (!name || !href || typeof name !== 'string' || typeof href !== 'string' || !name.trim() || !href.trim()) {
        return res.status(400).json({ error: 'Name and href are required.' });
    }

    try {
        const parsedOrder = parseInt(display_order, 10);
        const order = !isNaN(parsedOrder) ? parsedOrder : 0;
        const imgStr = typeof image === 'string' ? image.trim() : '';
        const result = await pool.query(
            'INSERT INTO footer_services (name, href, image, display_order) VALUES ($1, $2, $3, $4) RETURNING id',
            [name.trim(), href.trim(), imgStr, order]
        );
        res.json({ message: 'success', data: { id: result.rows[0].id } });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// PUT update footer service (Authenticated Admin)
app.put('/api/footer-services/:id', async (req, res) => {
    const user = await requireAdminUser(req, res);
    if (!user) return;

    const { name, href, image, display_order } = req.body;
    if (!name || !href || typeof name !== 'string' || typeof href !== 'string' || !name.trim() || !href.trim()) {
        return res.status(400).json({ error: 'Name and href are required.' });
    }

    try {
        const parsedOrder = parseInt(display_order, 10);
        const order = !isNaN(parsedOrder) ? parsedOrder : 0;
        const imgStr = typeof image === 'string' ? image.trim() : '';
        await pool.query(
            'UPDATE footer_services SET name = $1, href = $2, image = $3, display_order = $4 WHERE id = $5',
            [name.trim(), href.trim(), imgStr, order, req.params.id]
        );
        res.json({ message: 'success' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// DELETE footer service (Authenticated Admin)
app.delete('/api/footer-services/:id', async (req, res) => {
    const user = await requireAdminUser(req, res);
    if (!user) return;

    try {
        await pool.query('DELETE FROM footer_services WHERE id = $1', [req.params.id]);
        res.json({ message: 'success' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// ==================== HOMEPAGE CONTENT ROUTES ====================
const { HOMEPAGE_DEFAULTS } = require('./homepageDefaults.cjs');

app.get('/api/homepage-content', async (req, res) => {
    try {
        const result = await pool.query('SELECT key, content FROM homepage_content');
        const dbMap = {};
        (result.rows || []).forEach(row => {
            try {
                dbMap[row.key] = JSON.parse(row.content);
            } catch (e) {
                dbMap[row.key] = row.content;
            }
        });
        const merged = { ...HOMEPAGE_DEFAULTS, ...dbMap };
        res.json({ data: merged });
    } catch (err) {
        console.error('Error fetching homepage content:', err);
        res.json({ data: HOMEPAGE_DEFAULTS });
    }
});

app.get('/api/homepage-content/:key', async (req, res) => {
    const key = req.params.key;
    try {
        const result = await pool.query('SELECT content FROM homepage_content WHERE key = $1', [key]);
        if (result.rows && result.rows.length > 0) {
            let data = result.rows[0].content;
            try { data = JSON.parse(data); } catch (e) {}
            return res.json({ data });
        }
        res.json({ data: HOMEPAGE_DEFAULTS[key] || null });
    } catch (err) {
        res.json({ data: HOMEPAGE_DEFAULTS[key] || null });
    }
});

app.put('/api/homepage-content/:key', async (req, res) => {
    const user = await requireAdminUser(req, res);
    if (!user) return;

    const key = req.params.key;
    const content = req.body.content !== undefined ? req.body.content : req.body;
    const contentStr = typeof content === 'string' ? content : JSON.stringify(content);

    try {
        const updateRes = await pool.query('UPDATE homepage_content SET content = $1, updated_at = CURRENT_TIMESTAMP WHERE key = $2', [contentStr, key]);
        if (!updateRes.rowCount || updateRes.rowCount === 0) {
            await pool.query('INSERT INTO homepage_content (key, content) VALUES ($1, $2)', [key, contentStr]);
        }
        res.json({ message: 'success', data: content });
    } catch (err) {
        console.error('Error updating homepage content:', err);
        res.status(500).json({ error: err.message });
    }
});

// ==================== MANAGER MANAGEMENT ====================
const { registerManagerRoutes } = require('./managers.cjs');
registerManagerRoutes(app, pool, { requireAdminUser, requireMainAdmin, isTruthy });

// Serve static frontend files from dist directory if available, or redirect non-API routes to frontend dev URL
const distPath = path.join(__dirname, 'dist');
app.use((req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    
    const indexPath = path.join(distPath, 'index.html');
    if (fs.existsSync(indexPath)) {
        if (req.method === 'GET') {
            const filePath = path.join(distPath, req.path.slice(1));
            if (req.path !== '/' && fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
                return res.sendFile(filePath);
            }
            return res.sendFile(indexPath);
        }
    }

    const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
    if (req.method === 'GET' && (req.headers.accept || '').includes('text/html')) {
        return res.redirect(`${frontendUrl}${req.originalUrl}`);
    }
    next();
});



app.use((err, req, res, next) => {
    console.error('Unhandled server error:', err);
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`V2V Server running on port ${PORT}`);
    });
}

module.exports = app;


