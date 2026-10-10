import jwt, { SignOptions, VerifyOptions } from 'jsonwebtoken';

const getSecret = (): string => {
  const secret = process.env.JWT_SECRET_KEY || process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('Missing JWT_SECRET_KEY in environment variables');
  }
  return secret;
};

export const FIXED_JWT_ALGORITHM = 'HS256';

export interface CognitoJwtPayload {
  id: number;
  email: string;
  role?: string | null;
  jti?: string;
  [key: string]: any;
}

/**
 * Ký JWT tập trung — Một module duy nhất, cố định thuật toán HS256 (Spec 3.7)
 */
export const signToken = (payload: CognitoJwtPayload, options?: SignOptions): string => {
  const secret = getSecret();
  return jwt.sign(payload, secret, {
    algorithm: FIXED_JWT_ALGORITHM,
    expiresIn: '1d',
    ...options,
  });
};

/**
 * Xác thực JWT tập trung — Cố định thuật toán HS256, ngăn chặn Algorithm Confusion (Spec 3.7)
 */
export const verifyToken = (token: string, options?: VerifyOptions): CognitoJwtPayload => {
  const secret = getSecret();
  return jwt.verify(token, secret, {
    algorithms: [FIXED_JWT_ALGORITHM],
    ...options,
  }) as CognitoJwtPayload;
};

export const generateToken = (payload: any) => {
  return signToken(payload);
};

/**
 * Sinh JWT với role trong payload (Question Generator role check).
 * Fallback: token cũ chỉ { id, email } vẫn hoạt động — requireRole sẽ tra DB.
 */
export const generateUserToken = (user: { id: number; email: string; role?: string | null }, options?: SignOptions) => {
  return signToken(
    { id: user.id, email: user.email, role: user.role || null },
    options
  );
};
