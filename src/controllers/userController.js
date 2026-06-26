const User = require('../models/Usermodel');
const {validationResult} = require('express-validator');

class UserController {
    // get all users(admin only)
    async getAllUsers(req, res) {
        try {
            const users = await User.findAll();
            res.json({
                success: true,
                data: users
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    //getting user by id(admin only)
    async getUserById(req, res) {
        try {
            const user = await User.findById(req.params.id);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }
            res.json({
                success: true,
                data: {user}
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    //updating user profile(admin only)
    async updateUserStatus(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }
        try{
            const {status } = req.body;
            const user = await User.updateStatus(req.params.id, status);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'user not found'
                })
            }
            res.json({
                success: true,
                message: 'User status updated successfully',
                data: {user}
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    // updating user role(admin only)
    async updateUserRole(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }
        try {
            const {role} = req.body;

            if (parseInt(req.params.id)=== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'cannot change your own role'
                });
            }
            const user = await User.updateRole(req.params.id, role);

        if (!user){
            return res.status(404).json({
                success: false,
                message: 'user not found'
            });
        }
        res.json({
            success: true,
            message: 'User role updated successfully',
            data: {user}
        });
        } catch (error){
            res.status(400).json({
                success: false,
                message:error.message
            })
        }  
    }

    //deleting users(admin only)
    async deleteUser(req, res){
        try{
            if (parseInt(req.params.id)=== req.user.id){
                return res.status(403).json({
                    success:false,
                    message:'cannot delete your own account'
                });
            }

            await User.delete(req.params.id);

            res.json({
                success: true,
                message:'user deleted successfully'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message:error.message
            })
        }
    }
}

module.exports = new UserController();