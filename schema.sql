-- PostgreSQL Schema for V2V Application

-- Contact Messages Table
CREATE TABLE IF NOT EXISTS contact_messages (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Admin Users Table
CREATE TABLE IF NOT EXISTS admin_users (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT DEFAULT '',
    image TEXT DEFAULT '',
    role TEXT DEFAULT 'CO_FOUNDER',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- OTP Store Table
CREATE TABLE IF NOT EXISTS otp_store (
    email TEXT PRIMARY KEY,
    otp TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL
);

-- Pending Registrations Table (Admin-Gated Onboarding)
CREATE TABLE IF NOT EXISTS pending_registrations (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Dynamic Feature Managers (Task 4)
CREATE TABLE IF NOT EXISTS dynamic_features (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT DEFAULT '',
    category TEXT DEFAULT '',
    project_name TEXT DEFAULT '',
    icon TEXT DEFAULT 'layers',
    image TEXT DEFAULT '',
    status TEXT DEFAULT 'active',
    created_by TEXT DEFAULT '',
    created_by_email TEXT DEFAULT '',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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
);

CREATE TABLE IF NOT EXISTS dynamic_feature_records (
    id SERIAL PRIMARY KEY,
    feature_id INTEGER NOT NULL REFERENCES dynamic_features(id),
    created_by TEXT DEFAULT '',
    created_by_email TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dynamic_feature_record_values (
    id SERIAL PRIMARY KEY,
    record_id INTEGER NOT NULL REFERENCES dynamic_feature_records(id),
    field_id INTEGER NOT NULL REFERENCES dynamic_feature_fields(id),
    value TEXT DEFAULT '',
    UNIQUE(record_id, field_id)
);

CREATE TABLE IF NOT EXISTS dynamic_feature_permissions (
    id SERIAL PRIMARY KEY,
    feature_id INTEGER NOT NULL REFERENCES dynamic_features(id),
    admin_user_id INTEGER NOT NULL REFERENCES admin_users(id),
    granted_by TEXT DEFAULT '',
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(feature_id, admin_user_id)
);

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
);

-- Footer Services Table
CREATE TABLE IF NOT EXISTS footer_services (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    href TEXT NOT NULL,
    image TEXT DEFAULT '',
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed Default Footer Services
INSERT INTO footer_services (name, href, display_order)
VALUES
    ('Problem Identification', '/problem-identification', 1),
    ('R&D Solutions', '/rd-solutions', 2),
    ('Technology Transfer', '/technology-transfer', 3),
    ('Industry Collaboration', '/industry-collaboration', 4),
    ('Consulting', '/consulting', 5);
