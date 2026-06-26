const db = require('../config/db');
const crypto = require('crypto');

class PasswordResetToken {
    static async create(userId) {
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 1); // Token expires in 1 hour

        await db.execute(
            'DELETE FROM password_reset_tokens WHERE user_id = ?',
            [userId]
        );

        // create new token  
        await db.execute(
            'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
            [userId, token, expiresAt]
        );

        return token;
    }
    
    //finding token and validating it
    static async findByToken(token) {
        const [rows] = await db.execute(
            'SELECT * FROM password_reset_tokens WHERE token = ? AND expires_at > NOW()',
            [token]
        );
        return rows[0] || null;
    }

    //deleting token after use
    static async delete(token) {
        await db.execute(
            'DELETE FROM password_reset_tokens WHERE token = ?',
            [token]
        );
    }

    //deleting all tokens for a user
    static async deleteByUserId(userId) {
        await db.execute(
            'DELETE FROM password_reset_tokens WHERE user_id = ?',
            [userId]
        );
    }
}

module.exports = PasswordResetToken;