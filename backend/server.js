const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const pool = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'hotel-erp-demo-secret-key';

// CORS 配置 - 支持环境变量配置允许的来源
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:5176')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

// 中间件
app.use(cors({
  origin: function(origin, callback) {
    // 允许没有 origin 的请求（如移动端、Postman 等）
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// 统一响应格式
function success(res, data = null, message = 'success') {
  return res.json({ code: 200, data, message });
}

function fail(res, message = '操作失败', code = 400) {
  return res.json({ code, message });
}

// JWT认证中间件
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return fail(res, '未登录', 401);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return fail(res, 'Token无效或已过期', 401);
  }
}

// ==================== 认证路由 ====================

// 登录
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return fail(res, '用户名和密码不能为空');

    const [rows] = await pool.query(
      'SELECT u.*, d.name as department_name, r.name as role_name, r.code as role_code, r.permissions FROM users u LEFT JOIN departments d ON u.department_id = d.id LEFT JOIN roles r ON u.role_id = r.id WHERE u.username = ? AND u.is_active = 1',
      [username]
    );
    if (rows.length === 0) return fail(res, '用户名或密码错误');

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return fail(res, '用户名或密码错误');

    // 更新最后登录时间
    await pool.query('UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role_code },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const { password_hash, ...userInfo } = user;
    success(res, { token, user: userInfo }, '登录成功');
  } catch (err) {
    console.error('登录失败:', err);
    fail(res, '服务器错误', 500);
  }
});

// 获取当前用户信息
app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT u.id, u.username, u.real_name, u.email, u.phone, u.department_id, u.role_id, d.name as department_name, r.name as role_name, r.code as role_code, r.permissions FROM users u LEFT JOIN departments d ON u.department_id = d.id LEFT JOIN roles r ON u.role_id = r.id WHERE u.id = ?',
      [req.user.id]
    );
    if (rows.length === 0) return fail(res, '用户不存在');
    success(res, rows[0]);
  } catch (err) {
    console.error('获取用户信息失败:', err);
    fail(res, '服务器错误', 500);
  }
});

// ==================== 仪表盘路由 ====================

app.get('/api/dashboard/stats', authMiddleware, async (req, res) => {
  try {
    const [[prCount]] = await pool.query('SELECT COUNT(*) as count FROM purchase_requests WHERE status != ? AND status != ?', ['deleted', 'cancelled']);
    const [[poCount]] = await pool.query('SELECT COUNT(*) as count FROM purchase_orders WHERE status != ? AND status != ?', ['deleted', 'cancelled']);
    const [[supplierCount]] = await pool.query('SELECT COUNT(*) as count FROM suppliers WHERE is_active = 1');
    const [[alertCount]] = await pool.query('SELECT COUNT(*) as count FROM inventory WHERE quantity <= min_quantity');
    const [[pendingApproval]] = await pool.query('SELECT COUNT(*) as count FROM approval_instances WHERE status = ? AND current_step > 0', ['pending']);
    const [[totalAmount]] = await pool.query('SELECT COALESCE(SUM(total_amount), 0) as total FROM purchase_orders WHERE status != ? AND status != ?', ['deleted', 'cancelled']);

    success(res, {
      purchaseRequestCount: prCount.count,
      purchaseOrderCount: poCount.count,
      supplierCount: supplierCount.count,
      inventoryAlertCount: alertCount.count,
      pendingApprovalCount: pendingApproval.count,
      totalPurchaseAmount: totalAmount.total
    });
  } catch (err) {
    console.error('获取统计数据失败:', err);
    fail(res, '服务器错误', 500);
  }
});

// ==================== 供应商路由 ====================

// 供应商列表
app.get('/api/suppliers', authMiddleware, async (req, res) => {
  try {
    const { page = 1, pageSize = 10, keyword = '', status = 'active' } = req.query;
    const offset = (page - 1) * pageSize;
    let where = 'WHERE 1=1';
    const params = [];

    if (keyword) {
      where += ' AND (name LIKE ? OR code LIKE ? OR contact_person LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }
    if (status === 'active') {
      where += ' AND is_active = 1';
    } else if (status === 'inactive') {
      where += ' AND is_active = 0';
    }

    const [list] = await pool.query(`SELECT id, name, code, contact_person as contactName, phone as contactPhone, email, address, rating, is_active as isActive, created_at as createdAt FROM suppliers ${where} ORDER BY created_at DESC LIMIT ${Number(pageSize)} OFFSET ${Number(offset)}`, params);
    const [[{ total }]] = await pool.query(`SELECT COUNT(*) as total FROM suppliers ${where}`, params);

    success(res, { list, total, page: Number(page), pageSize: Number(pageSize) });
  } catch (err) {
    console.error('获取供应商列表失败:', err);
    fail(res, '服务器错误', 500);
  }
});

// 供应商详情
app.get('/api/suppliers/:id', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM suppliers WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return fail(res, '供应商不存在');
    success(res, rows[0]);
  } catch (err) {
    console.error('获取供应商详情失败:', err);
    fail(res, '服务器错误', 500);
  }
});

// 新增供应商
app.post('/api/suppliers', authMiddleware, async (req, res) => {
  try {
    const { name, code, contact_person, phone, email, address, bank_name, bank_account, tax_number } = req.body;
    if (!name || !code) return fail(res, '供应商名称和编码不能为空');

    const id = uuidv4();
    await pool.query(
      `INSERT INTO suppliers (id, name, code, contact_person, phone, email, address, bank_name, bank_account, tax_number)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, name, code, contact_person, phone, email, address, bank_name, bank_account, tax_number]
    );
    success(res, { id }, '新增成功');
  } catch (err) {
    console.error('新增供应商失败:', err);
    if (err.code === '23505') return fail(res, '供应商编码已存在');
    fail(res, '服务器错误', 500);
  }
});

// 修改供应商
app.put('/api/suppliers/:id', authMiddleware, async (req, res) => {
  try {
    const fields = [];
    const values = [];
    const allowed = ['name', 'code', 'contact_person', 'phone', 'email', 'address', 'bank_name', 'bank_account', 'tax_number', 'rating', 'is_active'];
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(req.body[key]);
      }
    }
    if (fields.length === 0) return fail(res, '没有需要更新的字段');
    values.push(req.params.id);
    await pool.query(`UPDATE suppliers SET ${fields.join(', ')} WHERE id = ?`, values);
    success(res, null, '修改成功');
  } catch (err) {
    console.error('修改供应商失败:', err);
    fail(res, '服务器错误', 500);
  }
});

// 删除供应商（软删除）
app.delete('/api/suppliers/:id', authMiddleware, async (req, res) => {
  try {
    await pool.query('UPDATE suppliers SET is_active = 0 WHERE id = ?', [req.params.id]);
    success(res, null, '删除成功');
  } catch (err) {
    console.error('删除供应商失败:', err);
    fail(res, '服务器错误', 500);
  }
});

// ==================== 物料路由 ====================

// 物料列表
app.get('/api/items', authMiddleware, async (req, res) => {
  try {
    const { page = 1, pageSize = 10, keyword = '', category_id } = req.query;
    const offset = (page - 1) * pageSize;
    let where = 'WHERE i.is_active = 1';
    const params = [];

    if (keyword) {
      where += ' AND (i.name LIKE ? OR i.code LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }
    if (category_id) {
      where += ' AND i.category_id = ?';
      params.push(category_id);
    }

    const [list] = await pool.query(
      `SELECT i.*, c.name as category_name FROM items i LEFT JOIN item_categories c ON i.category_id = c.id ${where} ORDER BY i.created_at DESC LIMIT ${Number(pageSize)} OFFSET ${Number(offset)}`,
      params
    );
    const [[{ total }]] = await pool.query(`SELECT COUNT(*) as total FROM items i ${where}`, params);

    success(res, { list, total, page: Number(page), pageSize: Number(pageSize) });
  } catch (err) {
    console.error('获取物料列表失败:', err);
    fail(res, '服务器错误', 500);
  }
});

// 新增物料
app.post('/api/items', authMiddleware, async (req, res) => {
  try {
    const { name, code, specification, unit, category_id, description } = req.body;
    if (!name || !code || !unit) return fail(res, '物料名称、编码和单位不能为空');

    const id = uuidv4();
    await pool.query(
      'INSERT INTO items (id, name, code, specification, unit, category_id, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, name, code, specification, unit, category_id, description]
    );
    success(res, { id }, '新增成功');
  } catch (err) {
    console.error('新增物料失败:', err);
    if (err.code === '23505') return fail(res, '物料编码已存在');
    fail(res, '服务器错误', 500);
  }
});

// 修改物料
app.put('/api/items/:id', authMiddleware, async (req, res) => {
  try {
    const fields = [];
    const values = [];
    const allowed = ['name', 'code', 'specification', 'unit', 'category_id', 'description', 'is_active'];
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(req.body[key]);
      }
    }
    if (fields.length === 0) return fail(res, '没有需要更新的字段');
    values.push(req.params.id);
    await pool.query(`UPDATE items SET ${fields.join(', ')} WHERE id = ?`, values);
    success(res, null, '修改成功');
  } catch (err) {
    console.error('修改物料失败:', err);
    fail(res, '服务器错误', 500);
  }
});

// 删除物料
app.delete('/api/items/:id', authMiddleware, async (req, res) => {
  try {
    await pool.query('UPDATE items SET is_active = 0 WHERE id = ?', [req.params.id]);
    success(res, null, '删除成功');
  } catch (err) {
    console.error('删除物料失败:', err);
    fail(res, '服务器错误', 500);
  }
});

// ==================== 采购需求路由 ====================

// 采购需求列表
app.get('/api/purchase-requests', authMiddleware, async (req, res) => {
  try {
    const { page = 1, pageSize = 10, status, keyword } = req.query;
    const offset = (page - 1) * pageSize;
    let where = 'WHERE 1=1';
    const params = [];

    if (status) {
      where += ' AND pr.status = ?';
      params.push(status);
    }
    if (keyword) {
      where += ' AND (pr.title LIKE ? OR pr.request_no LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    const [list] = await pool.query(
      `SELECT pr.*, u.real_name as requester_name, d.name as department_name
       FROM purchase_requests pr
       LEFT JOIN users u ON pr.requester_id = u.id
       LEFT JOIN departments d ON pr.department_id = d.id
       ${where} ORDER BY pr.created_at DESC LIMIT ${Number(pageSize)} OFFSET ${Number(offset)}`,
      params
    );
    const [[{ total }]] = await pool.query(`SELECT COUNT(*) as total FROM purchase_requests pr ${where}`, params);

    success(res, { list, total, page: Number(page), pageSize: Number(pageSize) });
  } catch (err) {
    console.error('获取采购需求列表失败:', err);
    fail(res, '服务器错误', 500);
  }
});

// 采购需求详情
app.get('/api/purchase-requests/:id', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT pr.*, u.real_name as requester_name, d.name as department_name
       FROM purchase_requests pr
       LEFT JOIN users u ON pr.requester_id = u.id
       LEFT JOIN departments d ON pr.department_id = d.id
       WHERE pr.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) return fail(res, '采购需求不存在');

    const [items] = await pool.query(
      `SELECT pri.*, i.name as item_name, i.code as item_code, i.unit, i.specification
       FROM purchase_request_items pri
       LEFT JOIN items i ON pri.item_id = i.id
       WHERE pri.request_id = ?`,
      [req.params.id]
    );

    success(res, { ...rows[0], items });
  } catch (err) {
    console.error('获取采购需求详情失败:', err);
    fail(res, '服务器错误', 500);
  }
});

// 新增采购需求
app.post('/api/purchase-requests', authMiddleware, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const { title, description, priority, request_date, required_date, items: prItems } = req.body;
    if (!title || !request_date || !prItems || prItems.length === 0) {
      return fail(res, '标题、需求日期和明细不能为空');
    }

    const id = uuidv4();
    const requestNo = `PR-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
    const totalAmount = prItems.reduce((sum, item) => sum + (item.quantity * (item.estimated_price || 0)), 0);

    await conn.query(
      `INSERT INTO purchase_requests (id, request_no, title, description, status, priority, request_date, required_date, requester_id, department_id, total_amount)
       VALUES (?, ?, ?, ?, 'draft', ?, ?, ?, ?, ?, ?)`,
      [id, requestNo, title, description, priority || 'normal', request_date, required_date, req.user.id, req.user.department_id || null, totalAmount]
    );

    for (const item of prItems) {
      await conn.query(
        'INSERT INTO purchase_request_items (id, request_id, item_id, quantity, estimated_price, description) VALUES (?, ?, ?, ?, ?, ?)',
        [uuidv4(), id, item.item_id, item.quantity, item.estimated_price, item.description || null]
      );
    }

    await conn.commit();
    success(res, { id, request_no: requestNo }, '新增成功');
  } catch (err) {
    await conn.rollback();
    console.error('新增采购需求失败:', err);
    fail(res, '服务器错误', 500);
  } finally {
    conn.release();
  }
});

// 更新采购需求状态
app.put('/api/purchase-requests/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return fail(res, '状态不能为空');

    await pool.query('UPDATE purchase_requests SET status = ? WHERE id = ?', [status, req.params.id]);
    success(res, null, '状态更新成功');
  } catch (err) {
    console.error('更新采购需求状态失败:', err);
    fail(res, '服务器错误', 500);
  }
});

// ==================== 采购订单路由 ====================

// 采购订单列表
app.get('/api/purchase-orders', authMiddleware, async (req, res) => {
  try {
    const { page = 1, pageSize = 10, status, keyword } = req.query;
    const offset = (page - 1) * pageSize;
    let where = 'WHERE 1=1';
    const params = [];

    if (status) {
      where += ' AND po.status = ?';
      params.push(status);
    }
    if (keyword) {
      where += ' AND (po.title LIKE ? OR po.order_no LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    const [list] = await pool.query(
      `SELECT po.*, s.name as supplier_name, u.real_name as creator_name
       FROM purchase_orders po
       LEFT JOIN suppliers s ON po.supplier_id = s.id
       LEFT JOIN users u ON po.created_by = u.id
       ${where} ORDER BY po.created_at DESC LIMIT ${Number(pageSize)} OFFSET ${Number(offset)}`,
      params
    );
    const [[{ total }]] = await pool.query(`SELECT COUNT(*) as total FROM purchase_orders po ${where}`, params);

    success(res, { list, total, page: Number(page), pageSize: Number(pageSize) });
  } catch (err) {
    console.error('获取采购订单列表失败:', err);
    fail(res, '服务器错误', 500);
  }
});

// 采购订单详情
app.get('/api/purchase-orders/:id', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT po.*, s.name as supplier_name, s.contact_person as supplier_contact, s.phone as supplier_phone, u.real_name as creator_name
       FROM purchase_orders po
       LEFT JOIN suppliers s ON po.supplier_id = s.id
       LEFT JOIN users u ON po.created_by = u.id
       WHERE po.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) return fail(res, '采购订单不存在');

    const [items] = await pool.query(
      `SELECT poi.*, i.name as item_name, i.code as item_code, i.unit, i.specification
       FROM po_items poi
       LEFT JOIN items i ON poi.item_id = i.id
       WHERE poi.po_id = ?`,
      [req.params.id]
    );

    success(res, { ...rows[0], items });
  } catch (err) {
    console.error('获取采购订单详情失败:', err);
    fail(res, '服务器错误', 500);
  }
});

// 新增采购订单
app.post('/api/purchase-orders', authMiddleware, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const { request_id, title, description, supplier_id, order_date, expected_delivery_date, payment_terms, delivery_address, contact_person, contact_phone, items: poItems } = req.body;
    if (!title || !order_date || !supplier_id || !poItems || poItems.length === 0) {
      return fail(res, '标题、订单日期、供应商和明细不能为空');
    }

    const id = uuidv4();
    const orderNo = `PO-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
    const totalAmount = poItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

    await conn.query(
      `INSERT INTO purchase_orders (id, order_no, request_id, title, description, status, supplier_id, order_date, expected_delivery_date, total_amount, payment_terms, delivery_address, contact_person, contact_phone, created_by)
       VALUES (?, ?, ?, ?, ?, 'draft', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, orderNo, request_id || null, title, description, supplier_id, order_date, expected_delivery_date, totalAmount, payment_terms, delivery_address, contact_person, contact_phone, req.user.id]
    );

    for (const item of poItems) {
      const amount = item.quantity * item.unit_price;
      await conn.query(
        'INSERT INTO po_items (id, po_id, item_id, quantity, unit_price, amount, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [uuidv4(), id, item.item_id, item.quantity, item.unit_price, amount, item.description || null]
      );
    }

    await conn.commit();
    success(res, { id, order_no: orderNo }, '新增成功');
  } catch (err) {
    await conn.rollback();
    console.error('新增采购订单失败:', err);
    fail(res, '服务器错误', 500);
  } finally {
    conn.release();
  }
});

// 更新采购订单状态
app.put('/api/purchase-orders/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return fail(res, '状态不能为空');

    await pool.query('UPDATE purchase_orders SET status = ? WHERE id = ?', [status, req.params.id]);
    success(res, null, '状态更新成功');
  } catch (err) {
    console.error('更新采购订单状态失败:', err);
    fail(res, '服务器错误', 500);
  }
});

// ==================== 审批路由 ====================

// 待审批列表
app.get('/api/approvals', authMiddleware, async (req, res) => {
  try {
    const [list] = await pool.query(
      `SELECT ai.*, u.real_name as initiator_name
       FROM approval_instances ai
       LEFT JOIN users u ON ai.initiator_id = u.id
       WHERE ai.status = 'pending'
       ORDER BY ai.created_at DESC`
    );
    success(res, list);
  } catch (err) {
    console.error('获取待审批列表失败:', err);
    fail(res, '服务器错误', 500);
  }
});

// 审批通过
app.post('/api/approvals/:id/approve', authMiddleware, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const { comment } = req.body;
    const [instances] = await conn.query('SELECT * FROM approval_instances WHERE id = ?', [req.params.id]);
    if (instances.length === 0) return fail(res, '审批实例不存在');
    const instance = instances[0];

    // 获取流程定义
    const [workflows] = await conn.query('SELECT * FROM workflow_definitions WHERE id = ?', [instance.workflow_definition_id]);
    if (workflows.length === 0) return fail(res, '审批流程不存在');
    const steps = JSON.parse(workflows[0].steps);

    // 记录审批历史
    await conn.query(
      'INSERT INTO approval_history (id, approval_instance_id, step, approver_id, action, comment) VALUES (?, ?, ?, ?, ?, ?)',
      [uuidv4(), instance.id, instance.current_step, req.user.id, 'approve', comment || null]
    );

    // 判断是否是最后一步
    if (instance.current_step >= steps.length) {
      await conn.query('UPDATE approval_instances SET status = ?, current_step = ? WHERE id = ?', ['approved', instance.current_step, instance.id]);
      // 更新关联实体状态
      if (instance.entity_type === 'purchase_request') {
        await conn.query('UPDATE purchase_requests SET status = ? WHERE id = ?', ['approved', instance.entity_id]);
      }
    } else {
      await conn.query('UPDATE approval_instances SET current_step = ? WHERE id = ?', [instance.current_step + 1, instance.id]);
    }

    await conn.commit();
    success(res, null, '审批通过');
  } catch (err) {
    await conn.rollback();
    console.error('审批通过失败:', err);
    fail(res, '服务器错误', 500);
  } finally {
    conn.release();
  }
});

// 审批驳回
app.post('/api/approvals/:id/reject', authMiddleware, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const { comment } = req.body;
    const [instances] = await conn.query('SELECT * FROM approval_instances WHERE id = ?', [req.params.id]);
    if (instances.length === 0) return fail(res, '审批实例不存在');
    const instance = instances[0];

    // 记录审批历史
    await conn.query(
      'INSERT INTO approval_history (id, approval_instance_id, step, approver_id, action, comment) VALUES (?, ?, ?, ?, ?, ?)',
      [uuidv4(), instance.id, instance.current_step, req.user.id, 'reject', comment || null]
    );

    // 更新审批实例状态
    await conn.query('UPDATE approval_instances SET status = ? WHERE id = ?', ['rejected', instance.id]);

    // 更新关联实体状态
    if (instance.entity_type === 'purchase_request') {
      await conn.query('UPDATE purchase_requests SET status = ? WHERE id = ?', ['rejected', instance.entity_id]);
    }

    await conn.commit();
    success(res, null, '审批驳回');
  } catch (err) {
    await conn.rollback();
    console.error('审批驳回失败:', err);
    fail(res, '服务器错误', 500);
  } finally {
    conn.release();
  }
});

// ==================== 合同路由 ====================

// 合同列表
app.get('/api/contracts', authMiddleware, async (req, res) => {
  try {
    const { page = 1, pageSize = 10, status } = req.query;
    const offset = (page - 1) * pageSize;
    let where = 'WHERE 1=1';
    const params = [];

    if (status) {
      where += ' AND c.status = ?';
      params.push(status);
    }

    const [list] = await pool.query(
      `SELECT c.*, s.name as supplier_name, u.real_name as creator_name
       FROM contracts c
       LEFT JOIN suppliers s ON c.supplier_id = s.id
       LEFT JOIN users u ON c.created_by = u.id
       ${where} ORDER BY c.created_at DESC LIMIT ${Number(pageSize)} OFFSET ${Number(offset)}`,
      params
    );
    const [[{ total }]] = await pool.query(`SELECT COUNT(*) as total FROM contracts c ${where}`, params);

    success(res, { list, total, page: Number(page), pageSize: Number(pageSize) });
  } catch (err) {
    console.error('获取合同列表失败:', err);
    fail(res, '服务器错误', 500);
  }
});

// 新增合同
app.post('/api/contracts', authMiddleware, async (req, res) => {
  try {
    const { contract_no, title, supplier_id, type, amount, start_date, end_date, terms } = req.body;
    if (!title) return fail(res, '合同标题不能为空');

    const id = uuidv4();
    const contractNo = contract_no || `CT-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
    await pool.query(
      `INSERT INTO contracts (id, contract_no, title, supplier_id, type, amount, start_date, end_date, status, terms, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?)`,
      [id, contractNo, title, supplier_id, type, amount, start_date, end_date, terms, req.user.id]
    );
    success(res, { id, contract_no: contractNo }, '新增成功');
  } catch (err) {
    console.error('新增合同失败:', err);
    if (err.code === '23505') return fail(res, '合同编号已存在');
    fail(res, '服务器错误', 500);
  }
});

// 修改合同
app.put('/api/contracts/:id', authMiddleware, async (req, res) => {
  try {
    const fields = [];
    const values = [];
    const allowed = ['title', 'supplier_id', 'type', 'amount', 'start_date', 'end_date', 'status', 'terms'];
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(req.body[key]);
      }
    }
    if (fields.length === 0) return fail(res, '没有需要更新的字段');
    values.push(req.params.id);
    await pool.query(`UPDATE contracts SET ${fields.join(', ')} WHERE id = ?`, values);
    success(res, null, '修改成功');
  } catch (err) {
    console.error('修改合同失败:', err);
    fail(res, '服务器错误', 500);
  }
});

// ==================== 付款路由 ====================

// 付款列表
app.get('/api/payments', authMiddleware, async (req, res) => {
  try {
    const { page = 1, pageSize = 10, status } = req.query;
    const offset = (page - 1) * pageSize;
    let where = 'WHERE 1=1';
    const params = [];

    if (status) {
      where += ' AND p.status = ?';
      params.push(status);
    }

    const [list] = await pool.query(
      `SELECT p.*, s.name as supplier_name, u.real_name as creator_name
       FROM payments p
       LEFT JOIN suppliers s ON p.supplier_id = s.id
       LEFT JOIN users u ON p.created_by = u.id
       ${where} ORDER BY p.created_at DESC LIMIT ${Number(pageSize)} OFFSET ${Number(offset)}`,
      params
    );
    const [[{ total }]] = await pool.query(`SELECT COUNT(*) as total FROM payments p ${where}`, params);

    success(res, { list, total, page: Number(page), pageSize: Number(pageSize) });
  } catch (err) {
    console.error('获取付款列表失败:', err);
    fail(res, '服务器错误', 500);
  }
});

// 新增付款
app.post('/api/payments', authMiddleware, async (req, res) => {
  try {
    const { po_id, contract_id, supplier_id, amount, payment_date, payment_method, reference_no, notes } = req.body;
    if (!amount || !payment_date) return fail(res, '金额和付款日期不能为空');

    const id = uuidv4();
    const paymentNo = `PAY-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
    await pool.query(
      `INSERT INTO payments (id, payment_no, po_id, contract_id, supplier_id, amount, payment_date, payment_method, status, reference_no, notes, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)`,
      [id, paymentNo, po_id || null, contract_id || null, supplier_id || null, amount, payment_date, payment_method, reference_no, notes, req.user.id]
    );
    success(res, { id, payment_no: paymentNo }, '新增成功');
  } catch (err) {
    console.error('新增付款失败:', err);
    fail(res, '服务器错误', 500);
  }
});

// ==================== 库存路由 ====================

// 库存列表
app.get('/api/inventory', authMiddleware, async (req, res) => {
  try {
    const { page = 1, pageSize = 10, keyword, warehouse } = req.query;
    const offset = (page - 1) * pageSize;
    let where = 'WHERE 1=1';
    const params = [];

    if (keyword) {
      where += ' AND (i.name LIKE ? OR i.code LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }
    if (warehouse) {
      where += ' AND inv.warehouse = ?';
      params.push(warehouse);
    }

    const [list] = await pool.query(
      `SELECT inv.*, i.name as item_name, i.code as item_code, i.unit, i.specification, i.category_id
       FROM inventory inv
       LEFT JOIN items i ON inv.item_id = i.id
       ${where} ORDER BY inv.updated_at DESC LIMIT ${Number(pageSize)} OFFSET ${Number(offset)}`,
      params
    );
    const [[{ total }]] = await pool.query(`SELECT COUNT(*) as total FROM inventory inv LEFT JOIN items i ON inv.item_id = i.id ${where}`, params);

    success(res, { list, total, page: Number(page), pageSize: Number(pageSize) });
  } catch (err) {
    console.error('获取库存列表失败:', err);
    fail(res, '服务器错误', 500);
  }
});

// 库存预警
app.get('/api/inventory/alerts', authMiddleware, async (req, res) => {
  try {
    const [list] = await pool.query(
      `SELECT inv.*, i.name as item_name, i.code as item_code, i.unit, i.specification, c.name as category_name
       FROM inventory inv
       LEFT JOIN items i ON inv.item_id = i.id
       LEFT JOIN item_categories c ON i.category_id = c.id
       WHERE inv.quantity <= inv.min_quantity
       ORDER BY (inv.quantity / inv.min_quantity) ASC`
    );
    success(res, list);
  } catch (err) {
    console.error('获取库存预警失败:', err);
    fail(res, '服务器错误', 500);
  }
});

// ==================== 报表路由 ====================

// 采购汇总
app.get('/api/reports/purchase-summary', authMiddleware, async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    let dateFilter = '';
    const params = [];

    if (start_date && end_date) {
      dateFilter = ' WHERE po.order_date BETWEEN ? AND ?';
      params.push(start_date, end_date);
    }

    // 按状态统计
    const [statusSummary] = await pool.query(
      `SELECT po.status, COUNT(*) as count, SUM(po.total_amount) as total_amount
       FROM purchase_orders po ${dateFilter}
       GROUP BY po.status`,
      params
    );

    // 按供应商统计
    const [supplierSummary] = await pool.query(
      `SELECT s.id, s.name, COUNT(po.id) as order_count, SUM(po.total_amount) as total_amount
       FROM purchase_orders po
       LEFT JOIN suppliers s ON po.supplier_id = s.id
       ${dateFilter}
       GROUP BY s.id, s.name
       ORDER BY total_amount DESC`,
      params
    );

    // 按月统计
    const [monthlySummary] = await pool.query(
      `SELECT TO_CHAR(po.order_date, 'YYYY-MM') as month, COUNT(*) as count, SUM(po.total_amount) as total_amount
       FROM purchase_orders po
       ${dateFilter ? dateFilter : ' WHERE 1=1'}
       GROUP BY TO_CHAR(po.order_date, 'YYYY-MM')
       ORDER BY month DESC`,
      params
    );

    success(res, { statusSummary, supplierSummary, monthlySummary });
  } catch (err) {
    console.error('获取采购汇总失败:', err);
    fail(res, '服务器错误', 500);
  }
});

// 供应商表现
app.get('/api/reports/supplier-performance', authMiddleware, async (req, res) => {
  try {
    const [list] = await pool.query(
      `SELECT s.id, s.name, s.code, s.contact_person, s.phone, s.rating,
        (SELECT COUNT(*) FROM purchase_orders po WHERE po.supplier_id = s.id) as order_count,
        (SELECT COALESCE(SUM(po.total_amount), 0) FROM purchase_orders po WHERE po.supplier_id = s.id) as total_amount,
        (SELECT COUNT(*) FROM receipts r WHERE r.supplier_id = s.id AND r.status = 'completed') as completed_receipts,
        (SELECT COUNT(*) FROM receipts r WHERE r.supplier_id = s.id AND r.status = 'partial') as partial_receipts
       FROM suppliers s
       WHERE s.is_active = 1
       ORDER BY s.rating DESC`
    );
    success(res, list);
  } catch (err) {
    console.error('获取供应商表现失败:', err);
    fail(res, '服务器错误', 500);
  }
});

// ==================== 启动服务器 ====================

app.listen(PORT, () => {
  console.log(`酒店ERP后端服务已启动，端口: ${PORT}`);
  console.log(`API地址: http://localhost:${PORT}`);
});
