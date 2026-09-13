const { Pool } = require('pg');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';
const databaseUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;
const isPostgresConfigured = Boolean(databaseUrl) &&
    !databaseUrl.includes('default:password') &&
    !databaseUrl.includes('ep-shiny-bar');

if (isProduction && !isPostgresConfigured) {
    console.warn('WARNING: Neither POSTGRES_URL nor DATABASE_URL is configured in production. Falling back to local SQLite adapter.');
}


const sqliteDb = require('./db.cjs');

const sqliteQuery = (text, params) => {
    return new Promise((resolve, reject) => {
        let sql = text.replace(/\$\d+/g, '?');
        const hasReturningId = /RETURNING\s+id/i.test(sql);
        if (hasReturningId) {
            sql = sql.replace(/RETURNING\s+id/i, '');
        }

        const command = sql.trim().split(' ')[0].toUpperCase();

        if (command === 'SELECT') {
            sqliteDb.all(sql, params, (err, rows) => {
                if (err) {
                    console.error('SQLite SELECT Error:', err, 'SQL:', sql, 'Params:', params);
                    reject(err);
                } else {
                    resolve({ rows });
                }
            });
        } else {
            const sqliteParams = (params || []).map(p => typeof p === 'boolean' ? (p ? 1 : 0) : p);
            sqliteDb.run(sql, sqliteParams, function (err) {
                if (err) {
                    console.error('SQLite RUN Error:', err, 'SQL:', sql, 'Params:', params);
                    reject(err);
                } else {
                    const result = { rows: [], rowCount: this.changes };
                    if (command === 'INSERT' && hasReturningId) {
                        result.rows.push({ id: this.lastID });
                    }
                    resolve(result);
                }
            });
        }
    });
};

let pool;
let mode = 'sqlite';
let pgFailed = false;

if (isPostgresConfigured) {
    console.log('Using PostgreSQL database');
    mode = 'postgres';
    const pgPool = new Pool({
        connectionString: databaseUrl,
        ssl: isProduction ? { rejectUnauthorized: false } : false
    });

    pool = {
        query: async (text, params) => {
            if (!pgFailed) {
                try {
                    return await pgPool.query(text, params);
                } catch (err) {
                    if (err.code === 'ENOTFOUND' || (err.message && err.message.includes('ENOTFOUND')) || err.code === 'ECONNREFUSED') {
                        if (!pgFailed) {
                            console.warn(`WARNING: PostgreSQL connection error (${err.message}). Falling back to local SQLite database.`);
                            pgFailed = true;
                        }
                        return sqliteQuery(text, params);
                    }
                    throw err;
                }
            }
            return sqliteQuery(text, params);
        }
    };

    // Initialize Database for Postgres
    const initializeDatabase = async () => {
        try {
            await pool.query(`
                CREATE TABLE IF NOT EXISTS contact_messages (
                    id SERIAL PRIMARY KEY,
                    name TEXT NOT NULL,
                    email TEXT NOT NULL,
                    message TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            await pool.query(`
                CREATE TABLE IF NOT EXISTS admin_users (
                    id SERIAL PRIMARY KEY,
                    email TEXT UNIQUE NOT NULL,
                    password TEXT NOT NULL,
                    name TEXT DEFAULT '',
                    image TEXT DEFAULT '',
                    role TEXT DEFAULT 'CO_FOUNDER',
                    can_manage_blogs BOOLEAN DEFAULT FALSE,
                    can_manage_experiments BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            await pool.query(`ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS name TEXT DEFAULT ''`).catch(() => {});
            await pool.query(`ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS image TEXT DEFAULT ''`).catch(() => {});
            await pool.query(`ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'CO_FOUNDER'`).catch(() => {});
            await pool.query(`ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS can_manage_blogs BOOLEAN DEFAULT FALSE`).catch(() => {});
            await pool.query(`ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS can_manage_experiments BOOLEAN DEFAULT FALSE`).catch(() => {});

            const coreUsers = [
                { email: 'arunsekar.v2v@gmail.com', name: 'Arun Sekar', role: 'MAIN_ADMIN', blogs: true, experiments: true, image: '/team/arun.jpg' },
                { email: 'sivaramireddy.v2v@gmail.com', name: 'Siva Rami Reddy', role: 'CO_FOUNDER', blogs: false, experiments: false, image: '/team/sivarami.jpg' },
                { email: 'phravin.v2v@gmail.com', name: 'Phravin S', role: 'CO_FOUNDER', blogs: false, experiments: false, image: '/team/phravin.jpg' },
                { email: 'mareeswaran.v2v@gmail.com', name: 'Mareeswaran V', role: 'CO_FOUNDER', blogs: false, experiments: false, image: '/team/Mareeswaran.jpg' },
                { email: 'sivagurunathan.v2v@gmail.com', name: 'Sivagurunathan', role: 'CO_FOUNDER', blogs: false, experiments: false, image: '/team/sivagurunathan.jpg' },
                { email: 'jbavanieswaran.v2v@gmail.com', name: 'Bavanieswaran J', role: 'CO_FOUNDER', blogs: false, experiments: false, image: '/team/bavanies.jpg' }
            ];

            const defaultPassHash = await bcrypt.hash('Admin@123456', 10);
            for (const u of coreUsers) {
                await pool.query(
                    `INSERT INTO admin_users (email, password, name, image, role, can_manage_blogs, can_manage_experiments)
                     VALUES ($1, $2, $3, $4, $5, $6, $7)
                     ON CONFLICT (email) DO UPDATE SET password = $2, name = $3, image = $4, role = $5, can_manage_blogs = $6, can_manage_experiments = $7`,
                    [u.email, defaultPassHash, u.name, u.image, u.role, u.blogs, u.experiments]
                ).catch((e) => console.error(`Error seeding admin user ${u.email}:`, e.message));
            }

await pool.query(`
                CREATE TABLE IF NOT EXISTS otp_store (
                    email TEXT PRIMARY KEY,
                    otp TEXT NOT NULL,
                    expires_at TIMESTAMP NOT NULL
                )
            `);
            await pool.query(`
                CREATE TABLE IF NOT EXISTS projects (
                    id SERIAL PRIMARY KEY,
                    name TEXT NOT NULL,
                    technicalName TEXT,
                    description TEXT,
                    image TEXT,
                    status TEXT,
                    completion INTEGER DEFAULT 0
                )
            `);
            await pool.query(`
                CREATE TABLE IF NOT EXISTS blogs (
                    id SERIAL PRIMARY KEY,
                    title TEXT NOT NULL,
                    description TEXT NOT NULL,
                    content TEXT,
                    image TEXT,
                    category TEXT DEFAULT 'V2V Insights',
                    author TEXT DEFAULT 'V2V Tech',
                    published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            await pool.query(`
                CREATE TABLE IF NOT EXISTS pending_registrations (
                    id SERIAL PRIMARY KEY,
                    name TEXT NOT NULL,
                    email TEXT UNIQUE NOT NULL,
                    password TEXT NOT NULL,
                    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            await pool.query(`
                CREATE TABLE IF NOT EXISTS dynamic_features (
                    id SERIAL PRIMARY KEY,
                    name TEXT NOT NULL UNIQUE,
                    slug TEXT NOT NULL UNIQUE,
                    description TEXT DEFAULT '',
                    created_by TEXT DEFAULT '',
                    created_by_email TEXT DEFAULT '',
                    is_active BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            await pool.query(`
                CREATE TABLE IF NOT EXISTS dynamic_feature_fields (
                    id SERIAL PRIMARY KEY,
                    feature_id INTEGER NOT NULL REFERENCES dynamic_features(id),
                    name TEXT NOT NULL,
                    field_type TEXT NOT NULL DEFAULT 'text',
                    required BOOLEAN DEFAULT FALSE,
                    options TEXT DEFAULT '',
                    display_order INTEGER DEFAULT 0,
                    is_active BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            await pool.query(`
                CREATE TABLE IF NOT EXISTS dynamic_feature_records (
                    id SERIAL PRIMARY KEY,
                    feature_id INTEGER NOT NULL REFERENCES dynamic_features(id),
                    created_by TEXT DEFAULT '',
                    created_by_email TEXT DEFAULT '',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            await pool.query(`
                CREATE TABLE IF NOT EXISTS dynamic_feature_record_values (
                    id SERIAL PRIMARY KEY,
                    record_id INTEGER NOT NULL REFERENCES dynamic_feature_records(id),
                    field_id INTEGER NOT NULL REFERENCES dynamic_feature_fields(id),
                    value TEXT DEFAULT '',
                    UNIQUE(record_id, field_id)
                )
            `);
            await pool.query(`
                CREATE TABLE IF NOT EXISTS dynamic_feature_permissions (
                    id SERIAL PRIMARY KEY,
                    feature_id INTEGER NOT NULL REFERENCES dynamic_features(id),
                    admin_user_id INTEGER NOT NULL REFERENCES admin_users(id),
                    granted_by TEXT DEFAULT '',
                    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(feature_id, admin_user_id)
                )
            `);
            await pool.query(`
                CREATE TABLE IF NOT EXISTS manager_access_requests (
                    id SERIAL PRIMARY KEY,
                    admin_user_id INTEGER NOT NULL REFERENCES admin_users(id),
                    request_type TEXT NOT NULL,
                    manager_id INTEGER REFERENCES dynamic_features(id),
                    message TEXT DEFAULT '',
                    status TEXT DEFAULT 'pending',
                    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    reviewed_by TEXT DEFAULT '',
                    reviewed_at TIMESTAMP,
                    rejection_reason TEXT DEFAULT ''
                )
            `);
            // Add role, permissions, name and image columns to admin_users if they don't exist
            await pool.query(`ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'CO_FOUNDER'`);
            await pool.query(`ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS can_manage_blogs BOOLEAN DEFAULT FALSE`);
            await pool.query(`ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS can_manage_experiments BOOLEAN DEFAULT FALSE`);
            await pool.query(`ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS name TEXT DEFAULT ''`);
            await pool.query(`ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS image TEXT DEFAULT ''`);
            await pool.query(`ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS blog_granted_by TEXT DEFAULT ''`);
            await pool.query(`ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS experiment_granted_by TEXT DEFAULT ''`);
            await pool.query(`ALTER TABLE dynamic_features ADD COLUMN IF NOT EXISTS category TEXT DEFAULT ''`);
            await pool.query(`ALTER TABLE dynamic_features ADD COLUMN IF NOT EXISTS project_name TEXT DEFAULT ''`);
            await pool.query(`ALTER TABLE dynamic_features ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT 'layers'`);
            await pool.query(`ALTER TABLE dynamic_features ADD COLUMN IF NOT EXISTS image TEXT DEFAULT ''`);
            await pool.query(`ALTER TABLE dynamic_features ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active'`);
            await pool.query(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS created_by TEXT DEFAULT ''`);
            await pool.query(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS created_by_email TEXT DEFAULT ''`);
            const coreUpdates = [
                { email: 'arunsekar.v2v@gmail.com', name: 'Arun Sekar', role: 'MAIN_ADMIN', blogs: true, experiments: true, image: '/team/arun.jpg' },
                { email: 'jbavanieswaran.v2v@gmail.com', name: 'Bavanieswaran J', role: 'CO_FOUNDER', blogs: false, experiments: false, image: '/team/bavanies.jpg' },
                { email: 'sivagurunathan.v2v@gmail.com', name: 'Sivagurunathan', role: 'CO_FOUNDER', blogs: false, experiments: false, image: '/team/sivagurunathan.jpg' },
                { email: 'sivaramireddy.v2v@gmail.com', name: 'Siva Rami Reddy', role: 'CO_FOUNDER', blogs: false, experiments: false, image: '/team/sivarami.jpg' },
                { email: 'mareeswaran.v2v@gmail.com', name: 'Mareeswaran V', role: 'CO_FOUNDER', blogs: false, experiments: false, image: '/team/Mareeswaran.jpg' },
                { email: 'phravin.v2v@gmail.com', name: 'Phravin S', role: 'CO_FOUNDER', blogs: false, experiments: false, image: '/team/phravin.jpg' }
            ];
            for (const u of coreUpdates) {
                await pool.query(
                    `INSERT INTO admin_users (email, password, name, role, image, can_manage_blogs, can_manage_experiments)
                     VALUES ($1, $2, $3, $4, $5, $6, $7)
                     ON CONFLICT (email) DO UPDATE SET name = $3, role = $4, image = $5, can_manage_blogs = $6, can_manage_experiments = $7`,
                    [u.email, initialAdminPassword, u.name, u.role, u.image, u.blogs, u.experiments]
                ).catch((e) => console.error(`Error seeding team member ${u.email}:`, e.message));
            }
            // Create and seed faqs table for Postgres
            await pool.query(`
                CREATE TABLE IF NOT EXISTS faqs (
                    id SERIAL PRIMARY KEY,
                    question TEXT NOT NULL,
                    answer TEXT NOT NULL,
                    display_order INTEGER DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            const faqCountRes = await pool.query('SELECT COUNT(*) AS count FROM faqs');
            if (parseInt(faqCountRes.rows[0].count) === 0) {
                const defaultFaqs = [
                    {
                        question: "What is V2V's primary focus?",
                        answer: "V2V specializes in identifying real-world problems, conducting deep R&D to develop innovative solutions, and transferring these technologies to industries and government bodies.",
                        display_order: 1
                    },
                    {
                        question: "How does the technology transfer process work?",
                        answer: "We follow a comprehensive process that includes problem identification, solution development through R&D, validation and testing, and finally seamless integration with your existing systems and processes.",
                        display_order: 2
                    },
                    {
                        question: "What industries do you work with?",
                        answer: "We collaborate with a wide range of industries including manufacturing, healthcare, energy, transportation, and government sectors, providing tailored solutions for each domain.",
                        display_order: 3
                    },
                    {
                        question: "How long does a typical project take?",
                        answer: "Project timelines vary based on complexity and scope. Typically, projects range from 3 to 12 months, with ongoing support and optimization available after implementation.",
                        display_order: 4
                    },
                    {
                        question: "Do you provide post-implementation support?",
                        answer: "Yes, we offer comprehensive post-implementation support including training, maintenance, updates, and continuous optimization to ensure long-term success.",
                        display_order: 5
                    }
                ];
                for (const faq of defaultFaqs) {
                    await pool.query(
                        'INSERT INTO faqs (question, answer, display_order) VALUES ($1, $2, $3)',
                        [faq.question, faq.answer, faq.display_order]
                    );
                }
                console.log('Postgres seeded default FAQs');
            }

            // Create and seed footer_services table for Postgres
            await pool.query(`
                CREATE TABLE IF NOT EXISTS footer_services (
                    id SERIAL PRIMARY KEY,
                    name TEXT NOT NULL,
                    href TEXT NOT NULL,
                    display_order INTEGER DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            const serviceCountRes = await pool.query('SELECT COUNT(*) AS count FROM footer_services');
            if (parseInt(serviceCountRes.rows[0].count) === 0) {
                const defaultServices = [
                    { name: "Problem Identification", href: "/problem-identification", display_order: 1 },
                    { name: "R&D Solutions", href: "/rd-solutions", display_order: 2 },
                    { name: "Technology Transfer", href: "/technology-transfer", display_order: 3 },
                    { name: "Industry Collaboration", href: "/industry-collaboration", display_order: 4 },
                    { name: "Consulting", href: "/consulting", display_order: 5 }
                ];
                for (const svc of defaultServices) {
                    await pool.query(
                        'INSERT INTO footer_services (name, href, display_order) VALUES ($1, $2, $3)',
                        [svc.name, svc.href, svc.display_order]
                    );
                }
                console.log('Postgres seeded default footer services');
            }

            console.log('PostgreSQL Database initialized successfully');
        } catch (error) {
            console.error('Error initializing PostgreSQL database:', error);
            process.exitCode = 1;
        }
    };
    initializeDatabase();

} else {
    console.log('Using SQLite fallback for local development (PostgreSQL not configured)');
    pool = {
        query: (text, params) => sqliteQuery(text, params)
    };
}

module.exports = pool;
