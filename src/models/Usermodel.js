const db = require('../config/db');
const bcrypt = require('bcryptjs');

class User {
    static async createUser(userData) {
        const { first_name, last_name, email, password, role = 'team_member' } = userData;
        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await db.query(
            'INSERT INTO users (first_name, last_name, email, password, role) VALUES (?, ?, ?, ?, ?)',
            [first_name, last_name, email, hashedPassword, role]
        );
        return result.insertId;
    }
    static async findAll() {
        const [rows] = await db.execute(
            'SELECT id, first_name, last_name, email, role, status, created_at FROM users'
        );
        return rows;
    }

    static async findByEmail(email) {
        const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        return rows[0];
    }

    static async findById(id) {
        const [rows] = await db.execute(
            'SELECT id, first_name, last_name, email, role FROM users WHERE id = ?', [id]
        );
        return rows[0];
    }

    static async update(id, updatedData) {
        const { first_name, last_name, profile_image } = updatedData;
        await db.execute(
            'UPDATE users SET first_name = ?, last_name = ?, profile_image = ? WHERE id = ?',
            [first_name, last_name, profile_image || null, id]
        );
        return await User.findById(id); 
    }

    static async updatePassword(id, newPassword) {
        if (!id || isNaN(id)) {
            throw new Error('Invalid user ID');
        }
        if (!newPassword || newPassword.length < 8) {
            throw new Error('Password must be at least 8 characters');
        }
        try {
            const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS);
            const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
            
            const [result] = await db.execute(
                'UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?',
                [hashedPassword, id]
            );
            
            if (result.affectedRows === 0) {
                throw new Error('User not found');
            }
            return true;
            
        } catch (error) {
            console.error('Error updating password:', error.message);
            throw new Error('Failed to update password: ' + error.message);
        }
    }

    static async updateStatus(id, status) {
        await db.execute('UPDATE users SET status = ? WHERE id = ?', [status, id]);
        return await User.findById(id);
    }

    static async updateRole(id, role) {
        await db.execute('UPDATE users SET role = ? WHERE id = ?', [role, id]);
        return await User.findById(id);
    }

    static async verifyPassword(plainPassword, hashedPassword) { 
        return await bcrypt.compare(plainPassword, hashedPassword);
    }

    static async delete(id) {
        await db.execute('DELETE FROM users WHERE id = ?', [id]);
        return true;
    }
}

module.exports = User;