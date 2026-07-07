const db = require('../config/db');
const bcrypt = require('bcryptjs');

const safeParseTags = (tags) => {
    if (!tags) return [];
    if (Array.isArray(tags)) return tags;
    try {
        const parsed = JSON.parse(tags);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return tags.split(',').map(t => t.trim()).filter(Boolean);
    }
};

class Client {
    static async create(data) {
        const {
            name, company, email, phone, website, industry, logo, tags,
            status = 'active', priority = 'medium', preferred_contact = 'email',
            timezone = 'UTC', notes, billing_contact, payment_terms,
            currency = 'USD', tax_number, assigned_to, created_by
        } = data;

        const [result] = await db.execute(
            `INSERT INTO clients (
                name, company, email, phone, website, industry, logo, tags,
                status, priority, preferred_contact, timezone, notes,
                billing_contact, payment_terms, currency, tax_number,
                assigned_to, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                name ?? null,
                company ?? null,
                email ?? null,
                phone ?? null,
                website ?? null,
                industry ?? null,
                logo ?? null,
                JSON.stringify(tags || []),
                status,
                priority,
                preferred_contact,
                timezone,
                notes ?? null,
                billing_contact ?? null,
                payment_terms ?? null,
                currency,
                tax_number ?? null,
                assigned_to ?? null,
                created_by ?? null
            ]
        );

        return result.insertId;
    }

    static async findAll({ page = 1, limit = 10, search = '', status = '', industry = '', priority = '', assigned_to = '' }) {
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const offset = (pageNum - 1) * limitNum;

        let conditions = ['deleted_at IS NULL'];
        let params = [];

        if (search) {
            conditions.push('(name LIKE ? OR company LIKE ? OR email LIKE ?)');
            const searchParam = `%${search}%`;
            params.push(searchParam, searchParam, searchParam);
        }
        if (status) { conditions.push('status = ?'); params.push(status); }
        if (industry) { conditions.push('industry = ?'); params.push(industry); }
        if (priority) { conditions.push('priority = ?'); params.push(priority); }
        if (assigned_to) { conditions.push('assigned_to = ?'); params.push(assigned_to); }

        const whereClause = `WHERE ${conditions.join(' AND ')}`;

        const countQuery = `SELECT COUNT(*) as total FROM clients ${whereClause}`;
        const [countResult] = await db.execute(countQuery, params);
        const total = countResult[0]?.total || 0;

        const clientsQuery = `
            SELECT 
                c.*,
                u.first_name as assigned_first_name,
                u.last_name as assigned_last_name,
                u.email as assigned_email,
                creator.first_name as created_first_name,
                creator.last_name as created_last_name
            FROM clients c
            LEFT JOIN users u ON c.assigned_to = u.id
            LEFT JOIN users creator ON c.created_by = creator.id
            ${whereClause}
            ORDER BY c.created_at DESC
            LIMIT ${limitNum} OFFSET ${offset}
        `;

        const [clients] = await db.execute(clientsQuery, params);

        const parsedClients = clients.map(client => ({
            ...client,
            tags: safeParseTags(client.tags)
        }));

        return {
            clients: parsedClients,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum),
            },
        };
    }

    static async findById(id) {
        const [rows] = await db.execute(
            `SELECT 
                c.*,
                u.first_name as assigned_first_name,
                u.last_name as assigned_last_name,
                u.email as assigned_email,
                creator.first_name as created_first_name,
                creator.last_name as created_last_name
            FROM clients c
            LEFT JOIN users u ON c.assigned_to = u.id
            LEFT JOIN users creator ON c.created_by = creator.id
            WHERE c.id = ? AND c.deleted_at IS NULL`,
            [id]
        );

        if (rows.length === 0) return null;

        const client = rows[0];
        client.tags = safeParseTags(client.tags); 
        return client;
    }

    static async update(id, data) {
        const {
            name, company, email, phone, website, industry, logo, tags,
            status, priority, preferred_contact, timezone, notes,
            billing_contact, payment_terms, currency, tax_number, assigned_to
        } = data;

        const [result] = await db.execute(
            `UPDATE clients SET
                name = ?, company = ?, email = ?, phone = ?, website = ?,
                industry = ?, logo = ?, tags = ?, status = ?, priority = ?,
                preferred_contact = ?, timezone = ?, notes = ?,
                billing_contact = ?, payment_terms = ?, currency = ?,
                tax_number = ?, assigned_to = ?
            WHERE id = ? AND deleted_at IS NULL`,
            [
                name ?? null,
                company ?? null,
                email ?? null,
                phone ?? null,
                website ?? null,
                industry ?? null,
                logo ?? null,
                JSON.stringify(tags || []),
                status ?? null,
                priority ?? null,
                preferred_contact ?? null,
                timezone ?? null,
                notes ?? null,
                billing_contact ?? null,
                payment_terms ?? null,
                currency ?? null,
                tax_number ?? null,
                assigned_to ?? null,
                id
            ]
        );

        return result.affectedRows > 0;
    }

    static async updateStatus(id, status) {
        const [result] = await db.execute(
            'UPDATE clients SET status = ? WHERE id = ? AND deleted_at IS NULL',
            [status, id]
        );
        return result.affectedRows > 0;
    }

    static async archive(id) {
        const [result] = await db.execute(
            'UPDATE clients SET deleted_at = NOW() WHERE id = ?',
            [id]
        );
        return result.affectedRows > 0;
    }

    static async restore(id) {
        const [result] = await db.execute(
            'UPDATE clients SET deleted_at = NULL WHERE id = ?',
            [id]
        );
        return result.affectedRows > 0;
    }

    static async delete(id) {
        const [result] = await db.execute(
            'DELETE FROM clients WHERE id = ?',
            [id]
        );
        return result.affectedRows > 0;
    }

    static async emailExists(email, excludeId = null) {
        let query = 'SELECT id FROM clients WHERE email = ? AND deleted_at IS NULL';
        const params = [email];
        if (excludeId) {
            query += ' AND id != ?';
            params.push(excludeId);
        }
        const [rows] = await db.execute(query, params);
        return rows.length > 0;
    }

    static async getStats() {
        const [rows] = await db.execute(
            `SELECT 
                COUNT(*) as \`total\`,
                SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as \`active\`,
                SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as \`inactive\`,
                SUM(CASE WHEN priority = 'high' THEN 1 ELSE 0 END) as \`high_priority\`,
                SUM(CASE WHEN priority = 'medium' THEN 1 ELSE 0 END) as \`medium_priority\`,
                SUM(CASE WHEN priority = 'low' THEN 1 ELSE 0 END) as \`low_priority\`
            FROM clients
            WHERE deleted_at IS NULL`
        );

        const stats = rows[0];

        const [industryRows] = await db.execute(
            `SELECT industry, COUNT(*) as count
            FROM clients
            WHERE deleted_at IS NULL AND industry IS NOT NULL AND industry != ''
            GROUP BY industry
            ORDER BY count DESC`
        );

        stats.industries = industryRows.map(row => row.industry);
        stats.industryBreakdown = industryRows;

        return stats;
    }

    static async bulkStatusUpdate(ids, status) {
        if (!ids || ids.length === 0) return 0;
        const placeholders = ids.map(() => '?').join(',');
        const [result] = await db.execute(
            `UPDATE clients SET status = ? WHERE id IN (${placeholders}) AND deleted_at IS NULL`,
            [status, ...ids]
        );
        return result.affectedRows;
    }

    static async bulkArchive(ids) {
        if (!ids || ids.length === 0) return 0;
        const placeholders = ids.map(() => '?').join(',');
        const [result] = await db.execute(
            `UPDATE clients SET deleted_at = NOW() WHERE id IN (${placeholders})`,
            ids
        );
        return result.affectedRows;
    }

    static async bulkDelete(ids) {
        if (!ids || ids.length === 0) return 0;
        const placeholders = ids.map(() => '?').join(',');
        const [result] = await db.execute(
            `DELETE FROM clients WHERE id IN (${placeholders})`,
            ids
        );
        return result.affectedRows;
    }
}

module.exports = Client;