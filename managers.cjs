const VALID_FIELD_TYPES = ['text', 'long_text', 'number', 'percentage', 'date', 'select', 'boolean', 'email', 'url', 'image'];
const MAX_FIELDS = 20;

const slugify = (name) =>
    (name || '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

const parseOptions = (options) => {
    if (!options) return [];
    if (Array.isArray(options)) return options.filter(Boolean);
    try {
        const parsed = JSON.parse(options);
        return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
    } catch {
        return String(options).split(',').map(s => s.trim()).filter(Boolean);
    }
};

const formatField = (row) => ({
    id: row.id,
    manager_id: row.feature_id,
    name: row.name,
    field_type: row.field_type,
    required: row.required === true || row.required === 1 || row.required === '1',
    options: parseOptions(row.options),
    display_order: row.display_order ?? 0,
    is_active: row.is_active === undefined || row.is_active === true || row.is_active === 1
});

const formatManager = (row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description || '',
    category: row.category || '',
    project_name: row.project_name || '',
    icon: row.icon || 'layers',
    image: row.image || '',
    status: row.status || 'active',
    created_by: row.created_by || '',
    created_by_email: row.created_by_email || '',
    is_active: row.is_active === undefined || row.is_active === true || row.is_active === 1,
    created_at: row.created_at,
    updated_at: row.updated_at,
});

function registerManagerRoutes(app, pool, { requireAdminUser, requireMainAdmin, isTruthy }) {
    const getManagerByIdOrSlug = async (idOrSlug) => {
        const isNumeric = /^\d+$/.test(String(idOrSlug));
        const result = isNumeric
            ? await pool.query('SELECT * FROM dynamic_features WHERE id = $1', [idOrSlug])
            : await pool.query('SELECT * FROM dynamic_features WHERE slug = $1', [idOrSlug]);
        return result.rows[0] || null;
    };

    const userHasManagerAccess = async (user, managerId) => {
        if ((user.role || '').toUpperCase() === 'MAIN_ADMIN') return true;
        const perm = await pool.query(
            'SELECT id FROM dynamic_feature_permissions WHERE feature_id = $1 AND admin_user_id = $2',
            [managerId, user.id]
        );
        return perm.rows.length > 0;
    };

    const requireManagerAccess = async (req, res, idOrSlug) => {
        const user = await requireAdminUser(req, res);
        if (!user) return null;
        const manager = await getManagerByIdOrSlug(idOrSlug);
        if (!manager || !isTruthy(manager.is_active)) {
            res.status(404).json({ error: 'Manager not found.' });
            return null;
        }
        if (manager.status === 'inactive') {
            res.status(403).json({ error: '403 Forbidden: This manager is inactive.' });
            return null;
        }
        const allowed = await userHasManagerAccess(user, manager.id);
        if (!allowed) {
            res.status(403).json({ error: '403 Forbidden: You do not have access to this manager.' });
            return null;
        }
        return { user, manager };
    };

    const getManagerFields = async (managerId, activeOnly = true) => {
        const sql = activeOnly
            ? 'SELECT * FROM dynamic_feature_fields WHERE feature_id = $1 AND is_active = 1 ORDER BY display_order, id'
            : 'SELECT * FROM dynamic_feature_fields WHERE feature_id = $1 ORDER BY display_order, id';
        const result = await pool.query(sql, [managerId]);
        return result.rows.map(formatField);
    };

    const buildRecordPayload = async (managerId, recordRow, valuesRows, fields) => {
        const valuesMap = {};
        valuesRows.forEach(v => { valuesMap[v.field_id] = v.value ?? ''; });
        const values = {};
        fields.forEach(f => { values[f.name] = valuesMap[f.id] ?? ''; });
        return {
            id: recordRow.id,
            feature_id: recordRow.feature_id,
            created_by: recordRow.created_by || '',
            created_by_email: recordRow.created_by_email || '',
            created_at: recordRow.created_at,
            updated_at: recordRow.updated_at,
            values,
            valuesByFieldId: valuesMap
        };
    };

    // LIST features (admin: all accessible; main admin sees all active)
    app.get('/api/managers', async (req, res) => {
        const user = await requireAdminUser(req, res);
        if (!user) return;
        try {
            const isMainAdmin = (user.role || '').toUpperCase() === 'MAIN_ADMIN';
            let result;
            if (isMainAdmin) {
                result = await pool.query(
                    `SELECT * FROM dynamic_features WHERE is_active = 1
                     AND (status IS NULL OR status = '' OR status = 'active')
                     ORDER BY name`
                );
            } else {
                result = await pool.query(
                    `SELECT f.* FROM dynamic_features f
                     INNER JOIN dynamic_feature_permissions p ON p.feature_id = f.id
                     WHERE p.admin_user_id = $1 AND f.is_active = 1
                     AND (f.status IS NULL OR f.status = '' OR f.status = 'active')
                     ORDER BY f.name`,
                    [user.id]
                );
            }
            res.json({ message: 'success', data: result.rows.map(formatManager) });
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    });

    // GET all public managers, fields, and records for the homepage
    app.get('/api/public-managers', async (req, res) => {
        try {
            const managersResult = await pool.query(
                `SELECT * FROM dynamic_features WHERE is_active = 1
                 AND (status IS NULL OR status = '' OR status = 'active')
                 ORDER BY name`
            );
            const managers = managersResult.rows.map(formatManager);
            const data = [];
            for (const mgr of managers) {
                const fields = await getManagerFields(mgr.id);
                const recordsResult = await pool.query(
                    'SELECT * FROM dynamic_feature_records WHERE feature_id = $1 ORDER BY id DESC',
                    [mgr.id]
                );
                const records = [];
                for (const rec of recordsResult.rows) {
                    const vals = await pool.query(
                        'SELECT * FROM dynamic_feature_record_values WHERE record_id = $1',
                        [rec.id]
                    );
                    records.push(await buildRecordPayload(mgr.id, rec, vals.rows, fields));
                }
                data.push({
                    manager: mgr,
                    fields,
                    records
                });
            }
            res.json({ message: 'success', data });
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    });

    // GET all manager permissions matrix (Main Admin) — must be before :idOrSlug routes
    app.get('/api/managers/permissions/all', async (req, res) => {
        const user = await requireMainAdmin(req, res);
        if (!user) return;
        try {
            const result = await pool.query(
                `SELECT p.feature_id AS manager_id, p.admin_user_id, p.granted_by, p.granted_at, u.name, u.email
                 FROM dynamic_feature_permissions p
                 INNER JOIN admin_users u ON u.id = p.admin_user_id
                 ORDER BY u.name, p.feature_id`
            );
            res.json({ message: 'success', data: result.rows });
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    });

    // CREATE manager (Main Admin only)
    app.post('/api/managers', async (req, res) => {
        const user = await requireMainAdmin(req, res);
        if (!user) return;

        const { name, description, category, project_name, icon, image, status, fields } = req.body;
        if (!name || !String(name).trim()) {
            return res.status(400).json({ error: 'Manager name is required.' });
        }
        if (!category || !String(category).trim()) {
            return res.status(400).json({ error: 'Category is required.' });
        }
        const slug = slugify(name);
        if (!slug) return res.status(400).json({ error: 'Invalid manager name.' });

        const fieldList = Array.isArray(fields) ? fields : [];
        if (fieldList.length > MAX_FIELDS) {
            return res.status(400).json({ error: `Maximum ${MAX_FIELDS} fields allowed per manager.` });
        }

        const names = fieldList.map(f => (f.name || '').trim().toLowerCase()).filter(Boolean);
        if (new Set(names).size !== names.length) {
            return res.status(400).json({ error: 'Duplicate field names are not allowed.' });
        }

        try {
            const existing = await pool.query(
                `SELECT * FROM dynamic_features WHERE slug = $1 OR LOWER(name) = LOWER($2)`,
                [slug, name.trim()]
            );

            const creator = user.name || user.email;
            const managerStatus = status === 'inactive' ? 'inactive' : 'active';
            let managerId;

            if (existing.rows.length > 0) {
                const row = existing.rows[0];
                if (isTruthy(row.is_active)) {
                    return res.status(400).json({ error: 'An active manager with this name already exists.' });
                }
                // Reactivate a previously deactivated manager (same slug/name)
                managerId = row.id;
                await pool.query(
                    `UPDATE dynamic_features SET name = $1, slug = $2, description = $3, category = $4, project_name = $5,
                     icon = $6, image = $7, status = $8, is_active = 1, created_by = $9, created_by_email = $10,
                     updated_at = CURRENT_TIMESTAMP WHERE id = $11`,
                    [name.trim(), slug, description || '', category.trim(), (project_name || '').trim(), icon || 'layers', image || '', managerStatus, creator, user.email, managerId]
                );
                await pool.query('UPDATE dynamic_feature_fields SET is_active = 0 WHERE feature_id = $1', [managerId]);
            } else {
                const insert = await pool.query(
                    `INSERT INTO dynamic_features (name, slug, description, category, project_name, icon, image, status, created_by, created_by_email)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
                    [name.trim(), slug, description || '', category.trim(), (project_name || '').trim(), icon || 'layers', image || '', managerStatus, creator, user.email]
                );
                managerId = insert.rows[0].id;
            }

            for (let i = 0; i < fieldList.length; i++) {
                const f = fieldList[i];
                if (!f.name || !String(f.name).trim()) continue;
                const fieldType = VALID_FIELD_TYPES.includes(f.field_type) ? f.field_type : 'text';
                const options = fieldType === 'select' ? JSON.stringify(parseOptions(f.options)) : '';
                await pool.query(
                    `INSERT INTO dynamic_feature_fields (feature_id, name, field_type, required, options, display_order)
                     VALUES ($1, $2, $3, $4, $5, $6)`,
                    [managerId, f.name.trim(), fieldType, !!f.required, options, i]
                );
            }

            const manager = await getManagerByIdOrSlug(managerId);
            const savedFields = await getManagerFields(managerId);
            res.json({ message: 'success', data: { ...formatManager(manager), fields: savedFields } });
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    });

    // GET single manager with fields
    app.get('/api/managers/:idOrSlug', async (req, res) => {
        const ctx = await requireManagerAccess(req, res, req.params.idOrSlug);
        if (!ctx) return;
        try {
            const fields = await getManagerFields(ctx.manager.id);
            res.json({ message: 'success', data: { ...formatManager(ctx.manager), fields } });
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    });

    // UPDATE manager metadata (Main Admin)
    app.put('/api/managers/:idOrSlug', async (req, res) => {
        const user = await requireMainAdmin(req, res);
        if (!user) return;
        const manager = await getManagerByIdOrSlug(req.params.idOrSlug);
        if (!manager) return res.status(404).json({ error: 'Manager not found.' });

        const { name, description, category, project_name, icon, image, status } = req.body;
        try {
            let slug = manager.slug;
            if (name && name.trim() && name.trim().toLowerCase() !== (manager.name || '').toLowerCase()) {
                slug = slugify(name);
                const dup = await pool.query(
                    `SELECT id FROM dynamic_features WHERE (LOWER(name) = LOWER($1) OR slug = $2) AND id != $3 AND is_active = 1`,
                    [name.trim(), slug, manager.id]
                );
                if (dup.rows.length > 0) {
                    return res.status(400).json({ error: 'An active manager with this name already exists.' });
                }
            }
            const managerStatus = status === 'inactive' ? 'inactive' : (status === 'active' ? 'active' : (manager.status || 'active'));
            await pool.query(
                `UPDATE dynamic_features SET name = $1, slug = $2, description = $3, category = $4, project_name = $5,
                 icon = $6, image = $7, status = $8, updated_at = CURRENT_TIMESTAMP WHERE id = $9`,
                [
                    name?.trim() || manager.name,
                    slug,
                    description ?? manager.description,
                    category !== undefined ? String(category).trim() : (manager.category || ''),
                    project_name !== undefined ? String(project_name).trim() : (manager.project_name || ''),
                    icon || manager.icon || 'layers',
                    image !== undefined ? image : (manager.image || ''),
                    managerStatus,
                    manager.id
                ]
            );
            const updated = await getManagerByIdOrSlug(manager.id);
            const fields = await getManagerFields(manager.id);
            res.json({ message: 'success', data: { ...formatManager(updated), fields } });
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    });

    // DELETE manager (soft delete, Main Admin)
    app.delete('/api/managers/:idOrSlug', async (req, res) => {
        const user = await requireMainAdmin(req, res);
        if (!user) return;
        const manager = await getManagerByIdOrSlug(req.params.idOrSlug);
        if (!manager) return res.status(404).json({ error: 'Manager not found.' });
        try {
            await pool.query('UPDATE dynamic_features SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = $1', [manager.id]);
            res.json({ message: 'success' });
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    });

    // SYNC field definitions (Main Admin) — soft-deletes removed fields
    app.put('/api/managers/:idOrSlug/fields', async (req, res) => {
        const user = await requireMainAdmin(req, res);
        if (!user) return;
        const manager = await getManagerByIdOrSlug(req.params.idOrSlug);
        if (!manager) return res.status(404).json({ error: 'Manager not found.' });

        const { fields, confirmRemove } = req.body;
        const fieldList = Array.isArray(fields) ? fields : [];
        if (fieldList.length > MAX_FIELDS) {
            return res.status(400).json({ error: `Maximum ${MAX_FIELDS} fields allowed.` });
        }

        const names = fieldList.map(f => (f.name || '').trim().toLowerCase()).filter(Boolean);
        if (new Set(names).size !== names.length) {
            return res.status(400).json({ error: 'Duplicate field names are not allowed.' });
        }

        try {
            const existing = await pool.query(
                'SELECT * FROM dynamic_feature_fields WHERE feature_id = $1 AND is_active = 1',
                [manager.id]
            );
            const incomingIds = new Set(fieldList.filter(f => f.id).map(f => Number(f.id)));
            const toDeactivate = existing.rows.filter(r => !incomingIds.has(r.id));

            if (toDeactivate.length > 0 && !confirmRemove) {
                return res.status(400).json({
                    error: 'Removing fields requires confirmation. Existing record data for removed fields will be preserved but hidden.',
                    requiresConfirmation: true,
                    fieldsToRemove: toDeactivate.map(r => r.name)
                });
            }

            if (toDeactivate.length > 0) {
                for (const row of toDeactivate) {
                    await pool.query('UPDATE dynamic_feature_fields SET is_active = 0 WHERE id = $1', [row.id]);
                }
            }

            for (let i = 0; i < fieldList.length; i++) {
                const f = fieldList[i];
                if (!f.name || !String(f.name).trim()) continue;
                const fieldType = VALID_FIELD_TYPES.includes(f.field_type) ? f.field_type : 'text';
                const options = fieldType === 'select' ? JSON.stringify(parseOptions(f.options)) : '';

                if (f.id) {
                    await pool.query(
                        `UPDATE dynamic_feature_fields SET name = $1, field_type = $2, required = $3, options = $4, display_order = $5, is_active = 1 WHERE id = $6 AND feature_id = $7`,
                        [f.name.trim(), fieldType, !!f.required, options, i, f.id, manager.id]
                    );
                } else {
                    await pool.query(
                        `INSERT INTO dynamic_feature_fields (feature_id, name, field_type, required, options, display_order) VALUES ($1, $2, $3, $4, $5, $6)`,
                        [manager.id, f.name.trim(), fieldType, !!f.required, options, i]
                    );
                }
            }

            await pool.query('UPDATE dynamic_features SET updated_at = CURRENT_TIMESTAMP WHERE id = $1', [manager.id]);
            const savedFields = await getManagerFields(manager.id);
            res.json({ message: 'success', data: savedFields });
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    });

    // LIST records
    app.get('/api/managers/:idOrSlug/records', async (req, res) => {
        const ctx = await requireManagerAccess(req, res, req.params.idOrSlug);
        if (!ctx) return;
        try {
            const fields = await getManagerFields(ctx.manager.id);
            const records = await pool.query(
                'SELECT * FROM dynamic_feature_records WHERE feature_id = $1 ORDER BY id DESC',
                [ctx.manager.id]
            );
            const data = [];
            for (const rec of records.rows) {
                const vals = await pool.query(
                    'SELECT * FROM dynamic_feature_record_values WHERE record_id = $1',
                    [rec.id]
                );
                data.push(await buildRecordPayload(ctx.manager.id, rec, vals.rows, fields));
            }
            res.json({ message: 'success', data, fields });
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    });

    // GET single record
    app.get('/api/managers/:idOrSlug/records/:recordId', async (req, res) => {
        const ctx = await requireManagerAccess(req, res, req.params.idOrSlug);
        if (!ctx) return;
        try {
            const fields = await getManagerFields(ctx.manager.id);
            const rec = await pool.query(
                'SELECT * FROM dynamic_feature_records WHERE id = $1 AND feature_id = $2',
                [req.params.recordId, ctx.manager.id]
            );
            if (rec.rows.length === 0) return res.status(404).json({ error: 'Record not found.' });
            const vals = await pool.query(
                'SELECT * FROM dynamic_feature_record_values WHERE record_id = $1',
                [req.params.recordId]
            );
            res.json({ message: 'success', data: await buildRecordPayload(ctx.manager.id, rec.rows[0], vals.rows, fields), fields });
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    });

    const isImageField = (field) => {
        const name = String(field?.name || '').toLowerCase().replace(/[_-]+/g, ' ');
        return field?.field_type === 'image' || /(^|\s)(image|cover)(\s|$)/i.test(name) || /image.*url|cover.*url/i.test(name);
    };

    const validateRecordValues = (fields, values) => {
        const errors = [];
        fields.forEach(f => {
            const val = values[f.name];
            const empty = val === undefined || val === null || String(val).trim() === '';
            if (f.required && empty) errors.push(`${f.name} is required.`);
            if (!empty && f.field_type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(val))) {
                errors.push(`${f.name} must be a valid email.`);
            }
            if (!empty && !isImageField(f) && (f.field_type === 'url' || /url/i.test(f.name || '')) && !/^https?:\/\/.+/i.test(String(val)) && !/^data:image\//i.test(String(val))) {
                errors.push(`${f.name} must be a valid URL (http/https).`);
            }
            if (!empty && isImageField(f) && !/^https?:\/\/.+/i.test(String(val)) && !/^data:image\//i.test(String(val))) {
                errors.push(`${f.name} must be a valid image URL or upload.`);
            }
            if (!empty && (f.field_type === 'number' || f.field_type === 'percentage')) {
                if (isNaN(Number(val))) errors.push(`${f.name} must be a number.`);
            }
        });
        return errors;
    };

    // CREATE record
    app.post('/api/managers/:idOrSlug/records', async (req, res) => {
        const ctx = await requireManagerAccess(req, res, req.params.idOrSlug);
        if (!ctx) return;
        const values = req.body.values || req.body;
        try {
            const fields = await getManagerFields(ctx.manager.id);
            const errors = validateRecordValues(fields, values);
            if (errors.length) return res.status(400).json({ error: errors.join(' ') });

            const creator = ctx.user.name || ctx.user.email;
            const insert = await pool.query(
                'INSERT INTO dynamic_feature_records (feature_id, created_by, created_by_email) VALUES ($1, $2, $3) RETURNING id',
                [ctx.manager.id, creator, ctx.user.email]
            );
            const recordId = insert.rows[0].id;

            for (const f of fields) {
                const val = values[f.name] ?? '';
                await pool.query(
                    'INSERT INTO dynamic_feature_record_values (record_id, field_id, value) VALUES ($1, $2, $3)',
                    [recordId, f.id, String(val)]
                );
            }

            res.json({ message: 'success', data: { id: recordId } });
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    });

    // UPDATE record
    app.put('/api/managers/:idOrSlug/records/:recordId', async (req, res) => {
        const ctx = await requireManagerAccess(req, res, req.params.idOrSlug);
        if (!ctx) return;
        const values = req.body.values || req.body;
        try {
            const fields = await getManagerFields(ctx.manager.id);
            const rec = await pool.query(
                'SELECT id FROM dynamic_feature_records WHERE id = $1 AND feature_id = $2',
                [req.params.recordId, ctx.manager.id]
            );
            if (rec.rows.length === 0) return res.status(404).json({ error: 'Record not found.' });

            const errors = validateRecordValues(fields, values);
            if (errors.length) return res.status(400).json({ error: errors.join(' ') });

            await pool.query(
                'UPDATE dynamic_feature_records SET updated_at = CURRENT_TIMESTAMP WHERE id = $1',
                [req.params.recordId]
            );

            for (const f of fields) {
                const val = values[f.name] ?? '';
                const existing = await pool.query(
                    'SELECT id FROM dynamic_feature_record_values WHERE record_id = $1 AND field_id = $2',
                    [req.params.recordId, f.id]
                );
                if (existing.rows.length > 0) {
                    await pool.query(
                        'UPDATE dynamic_feature_record_values SET value = $1 WHERE record_id = $2 AND field_id = $3',
                        [String(val), req.params.recordId, f.id]
                    );
                } else {
                    await pool.query(
                        'INSERT INTO dynamic_feature_record_values (record_id, field_id, value) VALUES ($1, $2, $3)',
                        [req.params.recordId, f.id, String(val)]
                    );
                }
            }
            res.json({ message: 'success' });
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    });

    // DELETE record
    app.delete('/api/managers/:idOrSlug/records/:recordId', async (req, res) => {
        const ctx = await requireManagerAccess(req, res, req.params.idOrSlug);
        if (!ctx) return;
        try {
            const rec = await pool.query(
                'SELECT id FROM dynamic_feature_records WHERE id = $1 AND feature_id = $2',
                [req.params.recordId, ctx.manager.id]
            );
            if (rec.rows.length === 0) return res.status(404).json({ error: 'Record not found.' });
            await pool.query('DELETE FROM dynamic_feature_record_values WHERE record_id = $1', [req.params.recordId]);
            await pool.query('DELETE FROM dynamic_feature_records WHERE id = $1', [req.params.recordId]);
            res.json({ message: 'success' });
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    });

    // BATCH set manager permissions for a co-founder (Main Admin)
    app.put('/api/admin-users/:userId/manager-permissions', async (req, res) => {
        const user = await requireMainAdmin(req, res);
        if (!user) return;
        const targetUserId = parseInt(req.params.userId, 10);
        const { permissions } = req.body;
        if (!permissions || typeof permissions !== 'object') {
            return res.status(400).json({ error: 'Permissions object is required.' });
        }
        try {
            const granter = user.name || user.email;
            for (const [managerIdStr, granted] of Object.entries(permissions)) {
                const managerId = parseInt(managerIdStr, 10);
                if (!managerId) continue;
                if (granted) {
                    const existing = await pool.query(
                        'SELECT id FROM dynamic_feature_permissions WHERE feature_id = $1 AND admin_user_id = $2',
                        [managerId, targetUserId]
                    );
                    if (existing.rows.length > 0) {
                        await pool.query(
                            'UPDATE dynamic_feature_permissions SET granted_by = $1, granted_at = CURRENT_TIMESTAMP WHERE feature_id = $2 AND admin_user_id = $3',
                            [granter, managerId, targetUserId]
                        );
                    } else {
                        await pool.query(
                            'INSERT INTO dynamic_feature_permissions (feature_id, admin_user_id, granted_by) VALUES ($1, $2, $3)',
                            [managerId, targetUserId, granter]
                        );
                    }
                } else {
                    await pool.query(
                        'DELETE FROM dynamic_feature_permissions WHERE feature_id = $1 AND admin_user_id = $2',
                        [managerId, targetUserId]
                    );
                }
            }
            res.json({ message: 'success' });
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    });

    // GET permissions for a manager (Main Admin)
    app.get('/api/managers/:idOrSlug/permissions', async (req, res) => {
        const user = await requireMainAdmin(req, res);
        if (!user) return;
        const manager = await getManagerByIdOrSlug(req.params.idOrSlug);
        if (!manager) return res.status(404).json({ error: 'Manager not found.' });
        try {
            const result = await pool.query(
                `SELECT p.*, u.name, u.email FROM dynamic_feature_permissions p
                 INNER JOIN admin_users u ON u.id = p.admin_user_id
                 WHERE p.feature_id = $1 ORDER BY u.name`,
                [manager.id]
            );
            res.json({ message: 'success', data: result.rows });
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    });

    // SET permission for user on manager (Main Admin)
    app.put('/api/managers/:idOrSlug/permissions/:userId', async (req, res) => {
        const user = await requireMainAdmin(req, res);
        if (!user) return;
        const manager = await getManagerByIdOrSlug(req.params.idOrSlug);
        if (!manager) return res.status(404).json({ error: 'Manager not found.' });

        const { granted } = req.body;
        const targetUserId = parseInt(req.params.userId, 10);
        try {
            if (granted) {
                const granter = user.name || user.email;
                const existing = await pool.query(
                    'SELECT id FROM dynamic_feature_permissions WHERE feature_id = $1 AND admin_user_id = $2',
                    [manager.id, targetUserId]
                );
                if (existing.rows.length > 0) {
                    await pool.query(
                        'UPDATE dynamic_feature_permissions SET granted_by = $1, granted_at = CURRENT_TIMESTAMP WHERE feature_id = $2 AND admin_user_id = $3',
                        [granter, manager.id, targetUserId]
                    );
                } else {
                    await pool.query(
                        'INSERT INTO dynamic_feature_permissions (feature_id, admin_user_id, granted_by) VALUES ($1, $2, $3)',
                        [manager.id, targetUserId, granter]
                    );
                }
            } else {
                await pool.query(
                    'DELETE FROM dynamic_feature_permissions WHERE feature_id = $1 AND admin_user_id = $2',
                    [manager.id, targetUserId]
                );
            }
            res.json({ message: 'success' });
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    });
}

module.exports = { registerManagerRoutes, slugify, VALID_FIELD_TYPES, MAX_FIELDS };
