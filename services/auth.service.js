import bcrypt from "bcryptjs";
import jwt from 'jsonwebtoken';

const hashPassword = async (password) => {
    return await bcrypt.hash(password, 10)
};

const comparePassword = async (hashPassword, hash) => {
    return await bcrypt.compare(password, hashed);
};

const generateToken = (payload) =>{
    return jwt.sign(payload, process.env.JWT_SECRET,{
        expiresIn: process.env.JWT_EXPIRES_IN
    })
};

export default {
    hashPassword, comparePassword, generateToken
}