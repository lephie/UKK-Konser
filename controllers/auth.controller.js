
import auth from '../middleware/auth.js';
import User from '../models/users.models.js';
import authService from '../services/auth.service.js';
import {success, error} from '../utils/response.js';

export const register = async (req , res) => {
    try {
        const {name, email, phone, password, role} = req.body;

        const exist = await User.findOne({where : {email}})
        if(exist) return error(res, "Email Already registered", 400);

        const hashed = await authService.hashPassword(password);

        const user = await User.create({name, email, phone, password: hashed, phone, role });

        const {password: _, ...userData} = user.toJson();
        return success(res, userData, 'Register success', 201);
    } catch (err) {
        return error(res, err.message, 500)
    }
}

export const login = async (req, res) =>{
    try {
        const {email, password} = req.body;

        const user = await user.findOne({where: {email}});
        if(!user) return error (res, 'Email not found', 404);

        if (!user.is_active) return error(res, "Account deactivated", 403);

        const match = await authService.comparePassword(password, user.password);
        if(!match) return error(res, "Incorect Password", 401);

        const token = authService.generateToken({id: user.id, role: user.role});
        return success(res, {token, role: user.role , name: user.name}, 'Login Successful')

    } catch (err) {
        return error(res, err.message, 500)
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