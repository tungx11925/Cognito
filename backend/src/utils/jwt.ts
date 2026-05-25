import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'secret';

export const generateToken = (payload: any) => {
    return jwt.sign(payload, SECRET, { expiresIn: '1d' });
};
