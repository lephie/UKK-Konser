import { User } from '../models/index.js';
import authService from '../services/auth.service.js';
import {success, error} from '../utils/response.js';
import { isEmail, missingFields } from '../utils/validate.js';

export const register = async (req , res) => {
    try {
        const body = req.body ?? {}; // not null shi
        const missing = missingFields(body, ['name', 'email', 'password']); 
        if (missing.length) return error(res, `Missing fields: ${missing.join(', ')}`, 400); // cek field 

        const email = String(body.email).trim().toLowerCase(); // lowercase & blank shi
        if (!isEmail(email)) return error(res, 'Invalid email format', 400); // check email dari isEmail pke regex shi
        if (String(body.password).length < 6) return error(res, 'Password must be at least 6 characters', 400);

        const exist = await User.findOne({ where: { email } });
        if (exist) return error(res, 'Email already registered', 400);

        const hashed = await authService.hashPassword(String(body.password)); 

        const user = await User.create({
            name: String(body.name).trim(),
            email,
            phone: body.phone ? String(body.phone).trim() : null,
            password: hashed,
            role: 'user'
        });

        return success(res, user.toSafeJSON(), 'Register success', 201);
    } catch (err) {
        return error(res, err.message, 500);
    }
};

export const login = async (req, res) =>{
    try {
        const body = req.body ?? {};
        const missing = missingFields(body, ['email', 'password']);
        if (missing.length) return error(res, `Missing fields: ${missing.join(', ')}`, 400);

        const email = String(body.email).trim().toLowerCase();
        const user = await User.findOne({ where: { email } });

        
        const match = user ? await authService.comparePassword(String(body.password), user.password) : false;
        if (!match) return error(res, 'Email / password invalid', 401);

        if (!user.is_active) return error(res, 'Account deactivated', 403);

        const token = authService.generateToken({ id: user.id, role: user.role });
      
        return success(res, { token, id: user.id, role: user.role, name: user.name }, 'Login successful');
    } catch (err) {
        return error(res, err.message, 500);
    }
}

// get current user / ambil data user sekarang
export const logout = async (req, res) => {
    return success(res, null, 'Logout successful, please delete the token on the client');
};

export const getMe = async (req, res) => {
    // authMiddleware already loaded the user (without the password)
    return success(res, req.user, 'User fetched');
};

export const changePassword = async (req, res) => {
    try {
        const body = req.body ?? {};
        const missing = missingFields(body, ['old_password', 'new_password']);
        if (missing.length) return error(res, `Missing fields: ${missing.join(', ')}`, 400);
        if (String(body.new_password).length < 6) return error(res, 'New password must be at least 6 characters', 400);

        const user = await User.findByPk(req.user.id);
        const match = await authService.comparePassword(String(body.old_password), user.password);
        if (!match) return error(res, 'Old password is incorrect', 400);

        user.password = await authService.hashPassword(String(body.new_password));
        await user.save();

        return success(res, null, 'Password changed successfully');
    } catch (err) {
        return error(res, err.message, 500);
    }
};

export const updateProfile = async (req, res) => {
    try {
        const {name, phone} = req.body ?? {};
        const values = {};

        if(name !== undefined){
            const n = String(name).trim();
            if(!n) return error(res, 'Name cannot be empty', 400);
            if(n.length > 100) return error(res, 'Characters cannot be more than 100', 400);
            values.name = n;
        }
        if(phone !== undefined){
            const p = String(phone).trim();
            if (p && !/^[0-9+\-\s]{8,20}$/.test(p)) return error(res, 'phone number is not valid', 400);
            values.phone = p || null;
        }
        if(Object.keys(values).length === 0) return error('Nothing to update', 400);

        const user = await User.findByPk(req.user.id);
        await user.update(values)
        const {password, ...safe} = user.toJSON();
        return success(res, safe, 'Profile Updated')
    } catch (err) {
        return error(res, err.message, 500)
    }
}

export const updateAvatar = async (req, res) => {
    try {
        if (!req.file) {
            return error(res, 'Please select an image', 400);
        }

        const user = await User.findByPk(req.user.id);
        if (!user) {
            return error(res, 'User not found', 404);
        }

        const avatarUrl = `/uploads/avatars/${req.file.filename}`;
        await user.update({
            avatar_url: avatarUrl
        });

        return success(
            res, user.toSafeJSON(),'Profile picture updated'
        );

    } catch (err) {
        return error(res, err.message, 500);
    }
};


export default {register, login, getMe, logout, changePassword, updateProfile, updateAvatar }