
import auth from '../middleware/auth.js';
import User from '../models/users.models.js';
import authService from '../services/auth.service.js';
import {success, error} from '../utils/response.js';
import { isEmail } from '../utils/validate.js';

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

export const getMe = async (req, res) =>{
    try {
        const user = await user.findByPk(req.user.id, {
            attribute: {exlude: ['password']}
        })
        return success(res, user, 'user fetched')
    } catch (err) {
        return error(res, err.message, 500);   
    }
}

export default {register, login, getMe}