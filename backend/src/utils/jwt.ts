import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET_KEY as string;

export const generateToken = (payload: any) => {
    return jwt.sign(payload, SECRET, { expiresIn: '1d' });
};

/**
 * Sinh JWT với role trong payload (Question Generator role check).
 * Fallback: token cũ chỉ { id, email } vẫn hoạt động — requireRole sẽ tra DB.
 */
export const generateUserToken = (user: { id: number; email: string; role?: string | null }) => {
    return jwt.sign(
        { id: user.id, email: user.email, role: user.role || null },
        SECRET,
        { expiresIn: '1d' }
    );
};
