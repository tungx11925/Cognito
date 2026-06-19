import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { db } from '../db';
import { hashPassword } from '../utils/hash';

// 1. Get Dashboard Stats
export const getAdminStats = async (req: AuthRequest, res: Response) => {
  try {
    // Total Users
    const usersCount = await db.query('SELECT COUNT(*) as count FROM users');
    
    // Total Documents
    const docsCount = await db.query('SELECT COUNT(*) as count FROM documents');
    
    // Total Revenue (From transactions)
    const revenueSum = await db.query(
      "SELECT COALESCE(SUM(ABS(amount)), 0) as total FROM transactions WHERE amount < 0 AND status = 'success'"
    );

    // Total Study Sessions
    const sessionsCount = await db.query('SELECT COUNT(*) as count FROM study_sessions');

    // Total Flashcard Decks
    const decksCount = await db.query('SELECT COUNT(*) as count FROM flashcard_decks');

    // Monthly revenue chart data (grouped by month of last 6 months)
    const monthlyRevenue = await db.query(`
      SELECT 
        TO_CHAR(created_at, 'MM/YYYY') as month,
        SUM(ABS(amount)) as revenue
      FROM transactions
      WHERE amount < 0 AND status = 'success'
      GROUP BY TO_CHAR(created_at, 'MM/YYYY'), DATE_TRUNC('month', created_at)
      ORDER BY DATE_TRUNC('month', created_at) DESC
      LIMIT 6
    `);

    // Top purchased documents
    const topDocs = await db.query(`
      SELECT 
        d.id,
        d.title,
        d.price,
        COUNT(pr.id) as purchase_count
      FROM purchased_resources pr
      JOIN documents d ON pr.document_id = d.id
      GROUP BY d.id, d.title, d.price
      ORDER BY purchase_count DESC
      LIMIT 5
    `);

    res.status(200).json({
      stats: {
        totalUsers: parseInt(usersCount.rows[0].count),
        totalDocuments: parseInt(docsCount.rows[0].count),
        totalRevenue: parseInt(revenueSum.rows[0].total),
        totalStudySessions: parseInt(sessionsCount.rows[0].count),
        totalDecks: parseInt(decksCount.rows[0].count)
      },
      charts: {
        monthlyRevenue: monthlyRevenue.rows.reverse(),
        topDocuments: topDocs.rows
      }
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ error: 'Lỗi máy chủ khi lấy dữ liệu thống kê' });
  }
};

// 2. Get Users List with Search
export const getUsers = async (req: AuthRequest, res: Response) => {
  try {
    const { search } = req.query;
    let query = `
      SELECT id, name, email, phone, wallet_balance, role, created_at 
      FROM users 
      WHERE email != 'admin@edushare.com'
    `;
    const params: any[] = [];

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (name ILIKE $1 OR email ILIKE $1)`;
    }

    query += ' ORDER BY created_at DESC';
    const result = await db.query(query, params);

    res.status(200).json({ users: result.rows });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Lỗi máy chủ khi lấy danh sách người dùng' });
  }
};

// 3. Delete a User
export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    // Prevent self deletion (extra safety)
    const userCheck = await db.query('SELECT email FROM users WHERE id = $1', [id]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Người dùng không tồn tại' });
    }
    if (userCheck.rows[0].email === 'admin@edushare.com') {
      return res.status(400).json({ error: 'Không thể xóa tài khoản Admin hệ thống' });
    }

    await db.query('DELETE FROM users WHERE id = $1', [id]);
    res.status(200).json({ message: 'Đã xóa người dùng thành công' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Lỗi máy chủ khi xóa người dùng' });
  }
};

// 4. Get Documents List with Search
export const getDocuments = async (req: AuthRequest, res: Response) => {
  try {
    const { search } = req.query;
    let query = `
      SELECT d.id, d.title, d.description, d.price, d.visibility, d.category, d.created_at, u.name as author_name
      FROM documents d
      JOIN users u ON d.user_id = u.id
    `;
    const params: any[] = [];

    if (search) {
      params.push(`%${search}%`);
      query += ` WHERE d.title ILIKE $1 OR d.category ILIKE $1 OR u.name ILIKE $1`;
    }

    query += ' ORDER BY d.created_at DESC';
    const result = await db.query(query, params);

    res.status(200).json({ documents: result.rows });
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ error: 'Lỗi máy chủ khi lấy danh sách tài liệu' });
  }
};

// 5. Delete a Document
export const deleteDocument = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const docCheck = await db.query('SELECT id FROM documents WHERE id = $1', [id]);
    if (docCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Tài liệu không tồn tại' });
    }

    await db.query('DELETE FROM documents WHERE id = $1', [id]);
    res.status(200).json({ message: 'Đã xóa tài liệu thành công' });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: 'Lỗi máy chủ khi xóa tài liệu' });
  }
};

// 6. Get All Transactions / Revenue log
export const getTransactions = async (req: AuthRequest, res: Response) => {
  try {
    const query = `
      SELECT 
        t.id, 
        t.amount, 
        t.status, 
        t.created_at, 
        u.email as buyer_email, 
        u.name as buyer_name,
        d.title as doc_title
      FROM transactions t
      JOIN users u ON t.user_id = u.id
      LEFT JOIN documents d ON t.document_id = d.id
      ORDER BY t.created_at DESC
    `;
    const result = await db.query(query);
    res.status(200).json({ transactions: result.rows });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Lỗi máy chủ khi lấy lịch sử giao dịch' });
  }
};

// 7. Create a User
export const createUser = async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, password, phone, wallet_balance, role } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Họ tên, email và mật khẩu là bắt buộc' });
    }

    // Check if email already registered
    const userCheck = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Email này đã được sử dụng' });
    }

    const hashedPassword = await hashPassword(password);
    const balance = wallet_balance !== undefined ? parseInt(wallet_balance) : 0;

    const result = await db.query(
      `INSERT INTO users (name, email, password, phone, wallet_balance, role, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING id, name, email, phone, wallet_balance, role, created_at`,
      [name, email, hashedPassword, phone || null, balance, role || 'user']
    );

    res.status(201).json({ 
      message: 'Tạo tài khoản thành viên thành công', 
      user: result.rows[0] 
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Lỗi máy chủ khi tạo người dùng' });
  }
};

// 8. Update a User
export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, password, phone, wallet_balance, role } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Họ tên và email là bắt buộc' });
    }

    // Verify user exists and is not admin
    const userCheck = await db.query('SELECT email FROM users WHERE id = $1', [id]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Người dùng không tồn tại' });
    }
    if (userCheck.rows[0].email === 'admin@edushare.com') {
      return res.status(400).json({ error: 'Không thể chỉnh sửa tài khoản Admin hệ thống qua trang này' });
    }

    // Check if new email conflicts with another user
    const emailCheck = await db.query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, id]);
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Email này đã được sử dụng bởi người dùng khác' });
    }

    const balance = wallet_balance !== undefined ? parseInt(wallet_balance) : 0;

    if (password && password.trim() !== '') {
      const hashedPassword = await hashPassword(password);
      await db.query(
        `UPDATE users 
         SET name = $1, email = $2, password = $3, phone = $4, wallet_balance = $5, role = $6 
         WHERE id = $7`,
        [name, email, hashedPassword, phone || null, balance, role || 'user', id]
      );
    } else {
      await db.query(
        `UPDATE users 
         SET name = $1, email = $2, phone = $3, wallet_balance = $4, role = $5 
         WHERE id = $6`,
        [name, email, phone || null, balance, role || 'user', id]
      );
    }

    const updatedResult = await db.query(
      'SELECT id, name, email, phone, wallet_balance, role, created_at FROM users WHERE id = $1',
      [id]
    );

    res.status(200).json({ 
      message: 'Cập nhật thông tin thành viên thành công', 
      user: updatedResult.rows[0] 
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Lỗi máy chủ khi cập nhật thông tin' });
  }
};
