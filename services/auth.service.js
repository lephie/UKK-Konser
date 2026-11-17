import bcrypt from "bcryptjs";
import jwt from 'jsonwebtoken';
import config from "../config/env";

const hashPassword = async (password) => {
    return await bcrypt.hash(password, 10)
};

const comparePassword = async (password, hashed) => {
    return await bcrypt.compare(password, hashed);
};

const generateToken = (payload) =>{
    return jwt.sign(payload, config.env.JWT_SECRET,{
        expiresIn: config.env.JWT_EXPIRES_IN
    })
};

export default {
    hashPassword, comparePassword, generateToken
}