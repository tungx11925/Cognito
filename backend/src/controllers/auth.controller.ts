import { Request, Response } from 'express';
import { db } from '../db';
import bcrypt from 'bcryptjs';
import https from 'https';

const getJson = (url: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', (err) => reject(err));
  });
};

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await db.query(
      'INSERT INTO users (email, password, name) VALUES ($1, $2, $3) RETURNING id, email, name',
      [email, hashedPassword, name]
    );
    
    res.status(201).json({ message: 'User created', user: result.rows[0] });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid password' });
    
    res.status(200).json({ message: 'Login successful', user: { id: user.id, email: user.email, name: user.name } });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const googleLogin = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    // Verify the Google ID Token via Google API
    const payload = await getJson(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`);
    
    if (payload.error_description || payload.error) {
      return res.status(400).json({ error: payload.error_description || 'Invalid Google token' });
    }

    // Validate audience matches our Client ID
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (payload.aud !== clientId) {
      return res.status(400).json({ error: 'Invalid audience configuration' });
    }

    const email = payload.email;
    const name = payload.name || email.split('@')[0];

    // Check if user already exists
    let result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    let user = result.rows[0];

    if (!user) {
      // If user does not exist, create a new user with a random password hash
      const randomPassword = Math.random().toString(36).substring(2, 15);
      const hashedPassword = await bcrypt.hash(randomPassword, 10);
      
      const insertResult = await db.query(
        'INSERT INTO users (email, password, name) VALUES ($1, $2, $3) RETURNING id, email, name',
        [email, hashedPassword, name]
      );
      user = insertResult.rows[0];
    }

    res.status(200).json({
      message: 'Google login successful',
      user: { id: user.id, email: user.email, name: user.name }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getUsers = async (req: Request, res: Response) => {
  try {
    const result = await db.query('SELECT id, email, name FROM users');
    res.status(200).json(result.rows);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

