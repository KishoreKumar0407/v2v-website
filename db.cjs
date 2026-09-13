const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'v2v.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
        return;
    }

    console.log('Connected to the SQLite database.');

    db.serialize(() => {
        db.run(`CREATE TABLE IF NOT EXISTS contact_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            message TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) {
                console.error('Error creating contact_messages table', err.message);
            }
        });

        db.run(`CREATE TABLE IF NOT EXISTS admin_users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) {
                console.error('Error creating admin_users table', err.message);
            } else {
                const bcrypt = require('bcryptjs');
                const adminEmail = process.env.INITIAL_ADMIN_EMAIL || 'arunsekar.v2v@gmail.com';
                const adminPass = process.env.INITIAL_ADMIN_PASSWORD || 'Admin@123456';
                const adminName = process.env.INITIAL_ADMIN_NAME || 'Arun Sekar';
                const adminImage = '/team/arun.jpg';

                db.get('SELECT COUNT(*) as count FROM admin_users', [], async (err, row) => {
                    if (!err && row) {
                        try {
                            const hash = await bcrypt.hash(adminPass, 12);
                            if (row.count === 0) {
                                db.run(
                                    `INSERT INTO admin_users (email, password, name, image, role, can_manage_blogs, can_manage_experiments)
                                     VALUES (?, ?, ?, ?, 'MAIN_ADMIN', 1, 1)`,
                                    [adminEmail, hash, adminName, adminImage],
                                    (err) => {
                                        if (err) console.error('Error seeding initial admin user:', err.message);
                                        else console.log(`Seeded default admin user: ${adminEmail}`);
                                    }
                                );
                            } else {
                                db.run(
                                    `INSERT INTO admin_users (email, password, name, image, role, can_manage_blogs, can_manage_experiments)
                                     VALUES (?, ?, ?, ?, 'MAIN_ADMIN', 1, 1)
                                     ON CONFLICT(email) DO UPDATE SET password = ?, name = ?, image = ?, role = 'MAIN_ADMIN', can_manage_blogs = 1, can_manage_experiments = 1`,
                                    [adminEmail, hash, adminName, adminImage, hash, adminName, adminImage],
                                    (err) => {
                                        if (err) console.error('Error updating initial admin user:', err.message);
                                        else console.log(`Updated default admin user: ${adminEmail}`);
                                    }
                                );
                            }
                        } catch (e) {
                            console.error('Error hashing default admin password:', e.message);
                        }
                    }
                });
            }
        });

        const alterStatements = [
            { sql: `ALTER TABLE admin_users ADD COLUMN role TEXT DEFAULT 'CO_FOUNDER'`, name: 'role' },
            { sql: `ALTER TABLE admin_users ADD COLUMN can_manage_blogs INTEGER DEFAULT 0`, name: 'can_manage_blogs' },
            { sql: `ALTER TABLE admin_users ADD COLUMN can_manage_experiments INTEGER DEFAULT 0`, name: 'can_manage_experiments' },
            { sql: `ALTER TABLE admin_users ADD COLUMN name TEXT DEFAULT ''`, name: 'name' },
            { sql: `ALTER TABLE admin_users ADD COLUMN image TEXT DEFAULT ''`, name: 'image' },
            { sql: `ALTER TABLE admin_users ADD COLUMN blog_granted_by TEXT DEFAULT ''`, name: 'blog_granted_by' },
            { sql: `ALTER TABLE admin_users ADD COLUMN experiment_granted_by TEXT DEFAULT ''`, name: 'experiment_granted_by' }
        ];

        alterStatements.forEach(({ sql, name }) => {
            db.run(sql, (err) => {
                if (err && !err.message.includes('duplicate') && !err.message.includes('already exists')) {
                    console.error(`Error adding ${name} column`, err.message);
                }
            });
        });

        const coreUsers = [
            { email: 'arunsekar.v2v@gmail.com', name: 'Arun Sekar', role: 'MAIN_ADMIN', blogs: 1, experiments: 1, image: '/team/arun.jpg' },
            { email: 'sivaramireddy.v2v@gmail.com', name: 'Siva Rami Reddy', role: 'CO_FOUNDER', blogs: 0, experiments: 0, image: '/team/sivarami.jpg' },
            { email: 'phravin.v2v@gmail.com', name: 'Phravin S', role: 'CO_FOUNDER', blogs: 0, experiments: 0, image: '/team/phravin.jpg' },
            { email: 'mareeswaran.v2v@gmail.com', name: 'Mareeswaran V', role: 'CO_FOUNDER', blogs: 0, experiments: 0, image: '/team/Mareeswaran.jpg' },
            { email: 'sivagurunathan.v2v@gmail.com', name: 'Sivagurunathan', role: 'CO_FOUNDER', blogs: 0, experiments: 0, image: '/team/sivagurunathan.jpg' },
            { email: 'jbavanieswaran.v2v@gmail.com', name: 'Bavanieswaran J', role: 'CO_FOUNDER', blogs: 0, experiments: 0, image: '/team/bavanies.jpg' }
        ];

        const bcryptForTeam = require('bcryptjs');
        const defaultTeamPassHash = bcryptForTeam.hashSync('Admin@123456', 10);

        coreUsers.forEach((u) => {
            db.run(
                `INSERT INTO admin_users (email, password, name, role, image, can_manage_blogs, can_manage_experiments)
                 VALUES (?, ?, ?, ?, ?, ?, ?)
                 ON CONFLICT(email) DO UPDATE SET password = ?, name = ?, role = ?, image = ?, can_manage_blogs = ?, can_manage_experiments = ?`,
                [u.email, defaultTeamPassHash, u.name, u.role, u.image, u.blogs, u.experiments, defaultTeamPassHash, u.name, u.role, u.image, u.blogs, u.experiments],
                (err) => {
                    if (err) {
                        console.error(`Error updating user ${u.email}`, err.message);
                    }
                }
            );
        });

        db.run(`CREATE TABLE IF NOT EXISTS otp_store (
            email TEXT PRIMARY KEY,
            otp TEXT NOT NULL,
            expires_at DATETIME NOT NULL
        )`, (err) => {
            if (err) {
                console.error('Error creating otp_store table', err.message);
            }
        });

        db.run(`CREATE TABLE IF NOT EXISTS projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            technicalName TEXT,
            description TEXT,
            image TEXT,
            status TEXT,
            completion INTEGER DEFAULT 0,
            created_by TEXT DEFAULT '',
            created_by_email TEXT DEFAULT ''
        )`, (err) => {
            if (err) {
                console.error('Error creating projects table', err.message);
            }
        });

        db.run(`ALTER TABLE projects ADD COLUMN created_by TEXT DEFAULT ''`, (err) => {
            if (err && !err.message.includes('duplicate') && !err.message.includes('already exists')) {
                console.error('Error adding created_by column', err.message);
            }
        });
        db.run(`ALTER TABLE projects ADD COLUMN created_by_email TEXT DEFAULT ''`, (err) => {
            if (err && !err.message.includes('duplicate') && !err.message.includes('already exists')) {
                console.error('Error adding created_by_email column', err.message);
            }
        });

        db.run(`CREATE TABLE IF NOT EXISTS blogs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            content TEXT,
            image TEXT,
            category TEXT DEFAULT 'V2V Insights',
            author TEXT DEFAULT 'V2V Tech',
            published_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) {
                console.error('Error creating blogs table', err.message);
            }
        });

        db.run(`CREATE TABLE IF NOT EXISTS pending_registrations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            requested_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) {
                console.error('Error creating pending_registrations table', err.message);
            }
        });

        db.run(`CREATE TABLE IF NOT EXISTS dynamic_features (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            slug TEXT NOT NULL UNIQUE,
            description TEXT DEFAULT '',
            created_by TEXT DEFAULT '',
            created_by_email TEXT DEFAULT '',
            is_active INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) console.error('Error creating dynamic_features table', err.message);
        });

        db.run(`CREATE TABLE IF NOT EXISTS dynamic_feature_fields (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            feature_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            field_type TEXT NOT NULL DEFAULT 'text',
            required INTEGER DEFAULT 0,
            options TEXT DEFAULT '',
            display_order INTEGER DEFAULT 0,
            is_active INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (feature_id) REFERENCES dynamic_features(id)
        )`, (err) => {
            if (err) console.error('Error creating dynamic_feature_fields table', err.message);
        });

        db.run(`CREATE TABLE IF NOT EXISTS dynamic_feature_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            feature_id INTEGER NOT NULL,
            created_by TEXT DEFAULT '',
            created_by_email TEXT DEFAULT '',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (feature_id) REFERENCES dynamic_features(id)
        )`, (err) => {
            if (err) console.error('Error creating dynamic_feature_records table', err.message);
        });

        db.run(`CREATE TABLE IF NOT EXISTS dynamic_feature_record_values (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            record_id INTEGER NOT NULL,
            field_id INTEGER NOT NULL,
            value TEXT DEFAULT '',
            FOREIGN KEY (record_id) REFERENCES dynamic_feature_records(id),
            FOREIGN KEY (field_id) REFERENCES dynamic_feature_fields(id),
            UNIQUE(record_id, field_id)
        )`, (err) => {
            if (err) console.error('Error creating dynamic_feature_record_values table', err.message);
        });

        db.run(`CREATE TABLE IF NOT EXISTS dynamic_feature_permissions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            feature_id INTEGER NOT NULL,
            admin_user_id INTEGER NOT NULL,
            granted_by TEXT DEFAULT '',
            granted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (feature_id) REFERENCES dynamic_features(id),
            FOREIGN KEY (admin_user_id) REFERENCES admin_users(id),
            UNIQUE(feature_id, admin_user_id)
        )`, (err) => {
            if (err) console.error('Error creating dynamic_feature_permissions table', err.message);
        });

        db.run(`CREATE TABLE IF NOT EXISTS manager_access_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            admin_user_id INTEGER NOT NULL,
            request_type TEXT NOT NULL,
            manager_id INTEGER,
            message TEXT DEFAULT '',
            status TEXT DEFAULT 'pending',
            requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            reviewed_by TEXT DEFAULT '',
            reviewed_at DATETIME,
            rejection_reason TEXT DEFAULT '',
            FOREIGN KEY (admin_user_id) REFERENCES admin_users(id),
            FOREIGN KEY (manager_id) REFERENCES dynamic_features(id)
        )`, (err) => {
            if (err) console.error('Error creating manager_access_requests table', err.message);
        });

        // Safe migrations for manager metadata columns
        const managerMetaCols = [
            ['category', "TEXT DEFAULT ''"],
            ['project_name', "TEXT DEFAULT ''"],
            ['icon', "TEXT DEFAULT 'layers'"],
            ['image', "TEXT DEFAULT ''"],
            ['status', "TEXT DEFAULT 'active'"],
        ];
        db.all(`PRAGMA table_info(dynamic_features)`, (err, cols) => {
            if (err || !cols) return;
            const existing = new Set(cols.map(c => c.name));
            managerMetaCols.forEach(([col, def]) => {
                if (!existing.has(col)) {
                    db.run(`ALTER TABLE dynamic_features ADD COLUMN ${col} ${def}`, e => {
                        if (e) console.error(`Error adding dynamic_features.${col}`, e.message);
                    });
                }
            });
        });

        // FAQ Table Creation and Seeding
        db.run(`CREATE TABLE IF NOT EXISTS faqs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            question TEXT NOT NULL,
            answer TEXT NOT NULL,
            display_order INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) {
                console.error('Error creating faqs table', err.message);
            } else {
                db.get('SELECT COUNT(*) AS count FROM faqs', (err, row) => {
                    if (err) {
                        console.error('Error counting faqs', err.message);
                    } else if (row && row.count === 0) {
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
                        const insertFaqSql = `INSERT INTO faqs (question, answer, display_order) VALUES (?, ?, ?)`;
                        defaultFaqs.forEach((faq) => {
                            db.run(insertFaqSql, [faq.question, faq.answer, faq.display_order], (err) => {
                                if (err) {
                                    console.error(`Error inserting default FAQ ${faq.question}`, err.message);
                                }
                            });
                        });
                        console.log('Seeded default FAQs successfully.');
                    }
                });
            }
        });

        // Footer Services Table Creation and Seeding
        db.run(`CREATE TABLE IF NOT EXISTS footer_services (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            href TEXT NOT NULL,
            image TEXT DEFAULT '',
            display_order INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) {
                console.error('Error creating footer_services table', err.message);
            } else {
                db.run(`ALTER TABLE footer_services ADD COLUMN image TEXT DEFAULT ''`, (alterErr) => {
                    if (alterErr && !alterErr.message.includes('duplicate column') && !alterErr.message.includes('already exists')) {
                        console.error('Error adding image column to footer_services', alterErr.message);
                    }
                });

                db.get('SELECT COUNT(*) AS count FROM footer_services', (err, row) => {
                    if (err) {
                        console.error('Error counting footer_services', err.message);
                    } else if (row && row.count === 0) {
                        const defaultServices = [
                            { name: "Problem Identification", href: "/problem-identification", display_order: 1 },
                            { name: "R&D Solutions", href: "/rd-solutions", display_order: 2 },
                            { name: "Technology Transfer", href: "/technology-transfer", display_order: 3 },
                            { name: "Industry Collaboration", href: "/industry-collaboration", display_order: 4 },
                            { name: "Consulting", href: "/consulting", display_order: 5 }
                        ];
                        const insertSvcSql = `INSERT INTO footer_services (name, href, display_order) VALUES (?, ?, ?)`;
                        defaultServices.forEach((svc) => {
                            db.run(insertSvcSql, [svc.name, svc.href, svc.display_order], (err) => {
                                if (err) {
                                    console.error(`Error inserting default service ${svc.name}`, err.message);
                                }
                            });
                        });
                        console.log('Seeded default footer services successfully.');
                    }
                });
            }
        });

        db.run(`CREATE TABLE IF NOT EXISTS homepage_content (
            key TEXT PRIMARY KEY,
            content TEXT NOT NULL,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) {
                console.error('Error creating homepage_content table', err.message);
            }
        });
    });
});

module.exports = db;
