const pool = require('./db');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

async function seedData() {
  console.log('开始插入种子数据...');

  // ==================== 部门 ====================
  const departments = [
    { id: uuidv4(), name: '采购部', code: 'PURCHASE', description: '负责酒店物资采购管理' },
    { id: uuidv4(), name: '财务部', code: 'FINANCE', description: '负责酒店财务管理与审批' },
    { id: uuidv4(), name: '客房部', code: 'HOUSEKEEPING', description: '负责客房物资需求与管理' }
  ];
  for (const d of departments) {
    await pool.query('INSERT IGNORE INTO departments (id, name, code, description) VALUES (?, ?, ?, ?)',
      [d.id, d.name, d.code, d.description]);
  }
  console.log('部门数据插入完成');

  // ==================== 角色 ====================
  const roles = [
    { id: uuidv4(), name: '系统管理员', code: 'admin', description: '拥有所有权限', permissions: JSON.stringify({ all: true }) },
    { id: uuidv4(), name: '采购专员', code: 'purchaser', description: '采购需求创建与订单管理', permissions: JSON.stringify({ purchase: true, items: true, suppliers: true }) },
    { id: uuidv4(), name: '财务人员', code: 'finance', description: '财务审批与付款管理', permissions: JSON.stringify({ finance: true, approval: true, contracts: true, payments: true }) }
  ];
  for (const r of roles) {
    await pool.query('INSERT IGNORE INTO roles (id, name, code, description, permissions) VALUES (?, ?, ?, ?, ?)',
      [r.id, r.name, r.code, r.description, r.permissions]);
  }
  console.log('角色数据插入完成');

  // ==================== 用户 ====================
  const passwordHash = await bcrypt.hash('123456', 10);
  const users = [
    { id: uuidv4(), username: 'admin', password_hash: passwordHash, real_name: '管理员', department_id: departments[0].id, role_id: roles[0].id },
    { id: uuidv4(), username: 'zhangsan', password_hash: passwordHash, real_name: '张三', department_id: departments[0].id, role_id: roles[1].id },
    { id: uuidv4(), username: 'lisi', password_hash: passwordHash, real_name: '李四', department_id: departments[1].id, role_id: roles[2].id },
    { id: uuidv4(), username: 'wangwu', password_hash: passwordHash, real_name: '王五', department_id: departments[2].id, role_id: roles[1].id },
    { id: uuidv4(), username: 'zhaoliu', password_hash: passwordHash, real_name: '赵六', department_id: departments[0].id, role_id: roles[1].id }
  ];
  for (const u of users) {
    await pool.query(
      'INSERT IGNORE INTO users (id, username, password_hash, real_name, department_id, role_id) VALUES (?, ?, ?, ?, ?, ?)',
      [u.id, u.username, u.password_hash, u.real_name, u.department_id, u.role_id]
    );
  }
  console.log('用户数据插入完成');

  // ==================== 物料品类 ====================
  const categories = [
    { id: uuidv4(), name: '食材', code: 'FOOD', description: '厨房食材类物资' },
    { id: uuidv4(), name: '布草', code: 'LINEN', description: '客房布草类物资' },
    { id: uuidv4(), name: '设备', code: 'EQUIPMENT', description: '酒店设备类物资' },
    { id: uuidv4(), name: '易耗品', code: 'CONSUMABLE', description: '日常易耗品' },
    { id: uuidv4(), name: '饮品', code: 'BEVERAGE', description: '各类饮品' }
  ];
  for (const c of categories) {
    await pool.query('INSERT IGNORE INTO item_categories (id, name, code, description) VALUES (?, ?, ?, ?)',
      [c.id, c.name, c.code, c.description]);
  }
  console.log('物料品类数据插入完成');

  // ==================== 物料 ====================
  const items = [
    { id: uuidv4(), name: '大米', code: 'RICE-001', specification: '50kg/袋', unit: '袋', category_id: categories[0].id },
    { id: uuidv4(), name: '食用油', code: 'OIL-001', specification: '5L/桶', unit: '桶', category_id: categories[0].id },
    { id: uuidv4(), name: '床单', code: 'SHEET-001', specification: '1.8m白色纯棉', unit: '条', category_id: categories[1].id },
    { id: uuidv4(), name: '毛巾', code: 'TOWEL-001', specification: '白色纯棉 70x140cm', unit: '条', category_id: categories[1].id },
    { id: uuidv4(), name: '空调', code: 'AC-001', specification: '1.5匹壁挂式', unit: '台', category_id: categories[2].id },
    { id: uuidv4(), name: '电视', code: 'TV-001', specification: '55寸智能电视', unit: '台', category_id: categories[2].id },
    { id: uuidv4(), name: '洗发水', code: 'SHAMPOO-001', specification: '500ml', unit: '瓶', category_id: categories[3].id },
    { id: uuidv4(), name: '沐浴露', code: 'BODYWASH-001', specification: '500ml', unit: '瓶', category_id: categories[3].id },
    { id: uuidv4(), name: '矿泉水', code: 'WATER-001', specification: '550ml', unit: '瓶', category_id: categories[4].id },
    { id: uuidv4(), name: '咖啡豆', code: 'COFFEE-001', specification: '1kg/袋', unit: '袋', category_id: categories[4].id }
  ];
  for (const i of items) {
    await pool.query(
      'INSERT IGNORE INTO items (id, name, code, specification, unit, category_id) VALUES (?, ?, ?, ?, ?, ?)',
      [i.id, i.name, i.code, i.specification, i.unit, i.category_id]
    );
  }
  console.log('物料数据插入完成');

  // ==================== 供应商 ====================
  const suppliers = [
    { id: uuidv4(), name: '绿源粮油有限公司', code: 'SUP-001', contact_person: '刘经理', phone: '13800138001', email: 'liu@lvyuan.com', address: '市南区粮油市场A区12号', bank_name: '工商银行', bank_account: '6222021234567890123', tax_number: '91370200MA3ABCDEF1', rating: 4.5 },
    { id: uuidv4(), name: '洁雅纺织有限公司', code: 'SUP-002', contact_person: '陈经理', phone: '13800138002', email: 'chen@jieya.com', address: '市北区纺织路88号', bank_name: '建设银行', bank_account: '6227001234567890123', tax_number: '91370200MA3ABCDEG2', rating: 4.2 },
    { id: uuidv4(), name: '华强电器有限公司', code: 'SUP-003', contact_person: '黄经理', phone: '13800138003', email: 'huang@huaqiang.com', address: '高新区科技路66号', bank_name: '中国银行', bank_account: '6216601234567890123', tax_number: '91370200MA3ABCDEH3', rating: 4.0 },
    { id: uuidv4(), name: '清新日化有限公司', code: 'SUP-004', contact_person: '吴经理', phone: '13800138004', email: 'wu@qingxin.com', address: '开发区化工路22号', bank_name: '农业银行', bank_account: '6228481234567890123', tax_number: '91370200MA3ABCDEFGHI4', rating: 3.8 },
    { id: uuidv4(), name: '怡泉饮品有限公司', code: 'SUP-005', contact_person: '周经理', phone: '13800138005', email: 'zhou@yiquan.com', address: '市南区饮料街55号', bank_name: '交通银行', bank_account: '6222601234567890123', tax_number: '91370200MA3ABCDEFGHIJ5', rating: 4.3 }
  ];
  for (const s of suppliers) {
    await pool.query(
      `INSERT IGNORE INTO suppliers (id, name, code, contact_person, phone, email, address, bank_name, bank_account, tax_number, rating)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [s.id, s.name, s.code, s.contact_person, s.phone, s.email, s.address, s.bank_name, s.bank_account, s.tax_number, s.rating]
    );
  }
  console.log('供应商数据插入完成');

  // ==================== 供应商报价 ====================
  const quotes = [
    { id: uuidv4(), supplier_id: suppliers[0].id, item_id: items[0].id, price: 120.00, valid_from: '2025-01-01', valid_to: '2025-12-31', min_order_quantity: 10, lead_time_days: 3 },
    { id: uuidv4(), supplier_id: suppliers[0].id, item_id: items[1].id, price: 45.00, valid_from: '2025-01-01', valid_to: '2025-12-31', min_order_quantity: 5, lead_time_days: 3 },
    { id: uuidv4(), supplier_id: suppliers[1].id, item_id: items[2].id, price: 85.00, valid_from: '2025-01-01', valid_to: '2025-12-31', min_order_quantity: 50, lead_time_days: 7 },
    { id: uuidv4(), supplier_id: suppliers[1].id, item_id: items[3].id, price: 25.00, valid_from: '2025-01-01', valid_to: '2025-12-31', min_order_quantity: 100, lead_time_days: 7 },
    { id: uuidv4(), supplier_id: suppliers[2].id, item_id: items[4].id, price: 2800.00, valid_from: '2025-01-01', valid_to: '2025-12-31', min_order_quantity: 1, lead_time_days: 15 },
    { id: uuidv4(), supplier_id: suppliers[2].id, item_id: items[5].id, price: 2200.00, valid_from: '2025-01-01', valid_to: '2025-12-31', min_order_quantity: 1, lead_time_days: 15 },
    { id: uuidv4(), supplier_id: suppliers[3].id, item_id: items[6].id, price: 18.00, valid_from: '2025-01-01', valid_to: '2025-12-31', min_order_quantity: 50, lead_time_days: 5 },
    { id: uuidv4(), supplier_id: suppliers[3].id, item_id: items[7].id, price: 22.00, valid_from: '2025-01-01', valid_to: '2025-12-31', min_order_quantity: 50, lead_time_days: 5 },
    { id: uuidv4(), supplier_id: suppliers[4].id, item_id: items[8].id, price: 1.50, valid_from: '2025-01-01', valid_to: '2025-12-31', min_order_quantity: 100, lead_time_days: 2 },
    { id: uuidv4(), supplier_id: suppliers[4].id, item_id: items[9].id, price: 120.00, valid_from: '2025-01-01', valid_to: '2025-12-31', min_order_quantity: 5, lead_time_days: 5 }
  ];
  for (const q of quotes) {
    await pool.query(
      `INSERT IGNORE INTO supplier_quotes (id, supplier_id, item_id, price, valid_from, valid_to, min_order_quantity, lead_time_days)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [q.id, q.supplier_id, q.item_id, q.price, q.valid_from, q.valid_to, q.min_order_quantity, q.lead_time_days]
    );
  }
  console.log('供应商报价数据插入完成');

  // ==================== 采购需求 ====================
  const prs = [
    { id: uuidv4(), request_no: 'PR-2025-001', title: '食材采购需求-1月', description: '1月份厨房食材采购', status: 'approved', priority: 'high', request_date: '2025-01-05', required_date: '2025-01-10', requester_id: users[1].id, department_id: departments[0].id, total_amount: 2850.00 },
    { id: uuidv4(), request_no: 'PR-2025-002', title: '布草采购需求', description: '客房部布草补充采购', status: 'pending', priority: 'normal', request_date: '2025-01-08', required_date: '2025-01-20', requester_id: users[3].id, department_id: departments[2].id, total_amount: 6750.00 },
    { id: uuidv4(), request_no: 'PR-2025-003', title: '设备采购需求', description: '客房空调更换采购', status: 'draft', priority: 'low', request_date: '2025-01-10', required_date: '2025-02-01', requester_id: users[4].id, department_id: departments[0].id, total_amount: 8400.00 },
    { id: uuidv4(), request_no: 'PR-2025-004', title: '易耗品采购需求', description: '客房易耗品补充', status: 'rejected', priority: 'normal', request_date: '2025-01-12', required_date: '2025-01-25', requester_id: users[1].id, department_id: departments[0].id, total_amount: 2000.00 },
    { id: uuidv4(), request_no: 'PR-2025-005', title: '饮品采购需求', description: '大堂吧饮品补充', status: 'approved', priority: 'high', request_date: '2025-01-15', required_date: '2025-01-20', requester_id: users[4].id, department_id: departments[0].id, total_amount: 1300.00 }
  ];
  for (const pr of prs) {
    await pool.query(
      `INSERT IGNORE INTO purchase_requests (id, request_no, title, description, status, priority, request_date, required_date, requester_id, department_id, total_amount)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [pr.id, pr.request_no, pr.title, pr.description, pr.status, pr.priority, pr.request_date, pr.required_date, pr.requester_id, pr.department_id, pr.total_amount]
    );
  }
  console.log('采购需求数据插入完成');

  // ==================== 采购需求明细 ====================
  const prItems = [
    { id: uuidv4(), request_id: prs[0].id, item_id: items[0].id, quantity: 20, estimated_price: 120.00 },
    { id: uuidv4(), request_id: prs[0].id, item_id: items[1].id, quantity: 10, estimated_price: 45.00 },
    { id: uuidv4(), request_id: prs[1].id, item_id: items[2].id, quantity: 50, estimated_price: 85.00 },
    { id: uuidv4(), request_id: prs[1].id, item_id: items[3].id, quantity: 100, estimated_price: 25.00 },
    { id: uuidv4(), request_id: prs[2].id, item_id: items[4].id, quantity: 3, estimated_price: 2800.00 },
    { id: uuidv4(), request_id: prs[3].id, item_id: items[6].id, quantity: 50, estimated_price: 18.00 },
    { id: uuidv4(), request_id: prs[3].id, item_id: items[7].id, quantity: 50, estimated_price: 22.00 },
    { id: uuidv4(), request_id: prs[4].id, item_id: items[8].id, quantity: 500, estimated_price: 1.50 },
    { id: uuidv4(), request_id: prs[4].id, item_id: items[9].id, quantity: 5, estimated_price: 120.00 }
  ];
  for (const pri of prItems) {
    await pool.query(
      'INSERT IGNORE INTO purchase_request_items (id, request_id, item_id, quantity, estimated_price) VALUES (?, ?, ?, ?, ?)',
      [pri.id, pri.request_id, pri.item_id, pri.quantity, pri.estimated_price]
    );
  }
  console.log('采购需求明细数据插入完成');

  // ==================== 采购订单 ====================
  const pos = [
    { id: uuidv4(), order_no: 'PO-2025-001', request_id: prs[0].id, title: '食材采购订单-1月', description: '1月份食材采购', status: 'completed', supplier_id: suppliers[0].id, order_date: '2025-01-06', expected_delivery_date: '2025-01-10', total_amount: 2850.00, payment_terms: '月结30天', delivery_address: '酒店后门仓库', contact_person: '张三', contact_phone: '13900139001', created_by: users[1].id },
    { id: uuidv4(), order_no: 'PO-2025-002', request_id: prs[1].id, title: '布草采购订单', description: '客房布草采购', status: 'in_progress', supplier_id: suppliers[1].id, order_date: '2025-01-12', expected_delivery_date: '2025-01-20', total_amount: 6750.00, payment_terms: '月结30天', delivery_address: '酒店布草间', contact_person: '王五', contact_phone: '13900139003', created_by: users[3].id },
    { id: uuidv4(), order_no: 'PO-2025-003', request_id: prs[4].id, title: '饮品采购订单', description: '大堂吧饮品采购', status: 'pending', supplier_id: suppliers[4].id, order_date: '2025-01-16', expected_delivery_date: '2025-01-20', total_amount: 1300.00, payment_terms: '货到付款', delivery_address: '酒店仓库', contact_person: '赵六', contact_phone: '13900139005', created_by: users[4].id }
  ];
  for (const po of pos) {
    await pool.query(
      `INSERT IGNORE INTO purchase_orders (id, order_no, request_id, title, description, status, supplier_id, order_date, expected_delivery_date, total_amount, payment_terms, delivery_address, contact_person, contact_phone, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [po.id, po.order_no, po.request_id, po.title, po.description, po.status, po.supplier_id, po.order_date, po.expected_delivery_date, po.total_amount, po.payment_terms, po.delivery_address, po.contact_person, po.contact_phone, po.created_by]
    );
  }
  console.log('采购订单数据插入完成');

  // ==================== 采购订单明细 ====================
  const poItems = [
    { id: uuidv4(), po_id: pos[0].id, item_id: items[0].id, quantity: 20, unit_price: 120.00, amount: 2400.00, received_quantity: 20 },
    { id: uuidv4(), po_id: pos[0].id, item_id: items[1].id, quantity: 10, unit_price: 45.00, amount: 450.00, received_quantity: 10 },
    { id: uuidv4(), po_id: pos[1].id, item_id: items[2].id, quantity: 50, unit_price: 85.00, amount: 4250.00, received_quantity: 0 },
    { id: uuidv4(), po_id: pos[1].id, item_id: items[3].id, quantity: 100, unit_price: 25.00, amount: 2500.00, received_quantity: 0 },
    { id: uuidv4(), po_id: pos[2].id, item_id: items[8].id, quantity: 500, unit_price: 1.50, amount: 750.00, received_quantity: 0 },
    { id: uuidv4(), po_id: pos[2].id, item_id: items[9].id, quantity: 5, unit_price: 110.00, amount: 550.00, received_quantity: 0 }
  ];
  for (const poi of poItems) {
    await pool.query(
      `INSERT IGNORE INTO po_items (id, po_id, item_id, quantity, unit_price, amount, received_quantity) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [poi.id, poi.po_id, poi.item_id, poi.quantity, poi.unit_price, poi.amount, poi.received_quantity]
    );
  }
  console.log('采购订单明细数据插入完成');

  // ==================== 收货记录 ====================
  const receipts = [
    { id: uuidv4(), receipt_no: 'RCV-2025-001', po_id: pos[0].id, receipt_date: '2025-01-09', supplier_id: suppliers[0].id, warehouse: '主食仓库', receiver_id: users[1].id, status: 'completed', notes: '全部到货，质量合格' },
    { id: uuidv4(), receipt_no: 'RCV-2025-002', po_id: pos[1].id, receipt_date: '2025-01-18', supplier_id: suppliers[1].id, warehouse: '布草间', receiver_id: users[3].id, status: 'partial', notes: '床单已到，毛巾待发货' }
  ];
  for (const r of receipts) {
    await pool.query(
      `INSERT IGNORE INTO receipts (id, receipt_no, po_id, receipt_date, supplier_id, warehouse, receiver_id, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [r.id, r.receipt_no, r.po_id, r.receipt_date, r.supplier_id, r.warehouse, r.receiver_id, r.status, r.notes]
    );
  }
  console.log('收货记录数据插入完成');

  // ==================== 合同 ====================
  const contracts = [
    { id: uuidv4(), contract_no: 'CT-2025-001', title: '绿源粮油年度供货合同', supplier_id: suppliers[0].id, type: 'framework', amount: 100000.00, start_date: '2025-01-01', end_date: '2025-12-31', status: 'active', terms: '月结30天，质量不合格可退货', created_by: users[0].id },
    { id: uuidv4(), contract_no: 'CT-2025-002', title: '洁雅纺织供货合同', supplier_id: suppliers[1].id, type: 'single', amount: 50000.00, start_date: '2025-01-01', end_date: '2025-06-30', status: 'active', terms: '预付30%，到货后付70%', created_by: users[0].id }
  ];
  for (const c of contracts) {
    await pool.query(
      `INSERT IGNORE INTO contracts (id, contract_no, title, supplier_id, type, amount, start_date, end_date, status, terms, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [c.id, c.contract_no, c.title, c.supplier_id, c.type, c.amount, c.start_date, c.end_date, c.status, c.terms, c.created_by]
    );
  }
  console.log('合同数据插入完成');

  // ==================== 付款记录 ====================
  const payments = [
    { id: uuidv4(), payment_no: 'PAY-2025-001', po_id: pos[0].id, contract_id: contracts[0].id, supplier_id: suppliers[0].id, amount: 2850.00, payment_date: '2025-02-05', payment_method: '银行转账', status: 'completed', reference_no: 'BK20250205001', notes: '1月食材采购付款', created_by: users[2].id },
    { id: uuidv4(), payment_no: 'PAY-2025-002', po_id: pos[1].id, contract_id: contracts[1].id, supplier_id: suppliers[1].id, amount: 2025.00, payment_date: '2025-01-13', payment_method: '银行转账', status: 'completed', reference_no: 'BK20250113001', notes: '布草采购预付款30%', created_by: users[2].id },
    { id: uuidv4(), payment_no: 'PAY-2025-003', po_id: pos[2].id, supplier_id: suppliers[4].id, amount: 1300.00, payment_date: '2025-01-20', payment_method: '现金', status: 'pending', reference_no: '', notes: '饮品采购待付款', created_by: users[2].id }
  ];
  for (const p of payments) {
    await pool.query(
      `INSERT IGNORE INTO payments (id, payment_no, po_id, contract_id, supplier_id, amount, payment_date, payment_method, status, reference_no, notes, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [p.id, p.payment_no, p.po_id, p.contract_id, p.supplier_id, p.amount, p.payment_date, p.payment_method, p.status, p.reference_no, p.notes, p.created_by]
    );
  }
  console.log('付款记录数据插入完成');

  // ==================== 库存 ====================
  const inventoryData = [
    { id: uuidv4(), item_id: items[0].id, warehouse: '主食仓库', quantity: 50, min_quantity: 20, max_quantity: 200, unit_cost: 120.00, last_in_date: '2025-01-09' },
    { id: uuidv4(), item_id: items[1].id, warehouse: '主食仓库', quantity: 15, min_quantity: 5, max_quantity: 50, unit_cost: 45.00, last_in_date: '2025-01-09' },
    { id: uuidv4(), item_id: items[2].id, warehouse: '布草间', quantity: 200, min_quantity: 100, max_quantity: 500, unit_cost: 85.00, last_in_date: '2025-01-01' },
    { id: uuidv4(), item_id: items[3].id, warehouse: '布草间', quantity: 300, min_quantity: 150, max_quantity: 800, unit_cost: 25.00, last_in_date: '2025-01-01' },
    { id: uuidv4(), item_id: items[4].id, warehouse: '设备仓库', quantity: 5, min_quantity: 2, max_quantity: 10, unit_cost: 2800.00, last_in_date: '2024-12-15' },
    { id: uuidv4(), item_id: items[5].id, warehouse: '设备仓库', quantity: 3, min_quantity: 2, max_quantity: 10, unit_cost: 2200.00, last_in_date: '2024-12-15' },
    { id: uuidv4(), item_id: items[6].id, warehouse: '日用品仓库', quantity: 80, min_quantity: 50, max_quantity: 300, unit_cost: 18.00, last_in_date: '2025-01-05' },
    { id: uuidv4(), item_id: items[7].id, warehouse: '日用品仓库', quantity: 60, min_quantity: 50, max_quantity: 300, unit_cost: 22.00, last_in_date: '2025-01-05' },
    { id: uuidv4(), item_id: items[8].id, warehouse: '饮品仓库', quantity: 1000, min_quantity: 500, max_quantity: 5000, unit_cost: 1.50, last_in_date: '2025-01-10' },
    { id: uuidv4(), item_id: items[9].id, warehouse: '饮品仓库', quantity: 8, min_quantity: 5, max_quantity: 30, unit_cost: 120.00, last_in_date: '2025-01-10' }
  ];
  for (const inv of inventoryData) {
    await pool.query(
      `INSERT IGNORE INTO inventory (id, item_id, warehouse, quantity, min_quantity, max_quantity, unit_cost, last_in_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [inv.id, inv.item_id, inv.warehouse, inv.quantity, inv.min_quantity, inv.max_quantity, inv.unit_cost, inv.last_in_date]
    );
  }
  console.log('库存数据插入完成');

  // ==================== 审批流程定义 ====================
  const workflows = [
    { id: uuidv4(), name: '采购需求审批流程', code: 'PR_APPROVAL', description: '采购需求的标准审批流程', entity_type: 'purchase_request', steps: JSON.stringify([{ step: 1, name: '部门主管审批', role: 'admin' }, { step: 2, name: '财务审批', role: 'finance' }]) },
    { id: uuidv4(), name: '采购订单审批流程', code: 'PO_APPROVAL', description: '采购订单的标准审批流程', entity_type: 'purchase_order', steps: JSON.stringify([{ step: 1, name: '采购经理审批', role: 'admin' }]) }
  ];
  for (const w of workflows) {
    await pool.query(
      'INSERT IGNORE INTO workflow_definitions (id, name, code, description, entity_type, steps) VALUES (?, ?, ?, ?, ?, ?)',
      [w.id, w.name, w.code, w.description, w.entity_type, w.steps]
    );
  }
  console.log('审批流程定义数据插入完成');

  // ==================== 审批实例 ====================
  const approvalInstances = [
    { id: uuidv4(), workflow_definition_id: workflows[0].id, entity_type: 'purchase_request', entity_id: prs[0].id, title: prs[0].title, status: 'approved', current_step: 2, initiator_id: prs[0].requester_id },
    { id: uuidv4(), workflow_definition_id: workflows[0].id, entity_type: 'purchase_request', entity_id: prs[1].id, title: prs[1].title, status: 'pending', current_step: 1, initiator_id: prs[1].requester_id },
    { id: uuidv4(), workflow_definition_id: workflows[0].id, entity_type: 'purchase_request', entity_id: prs[4].id, title: prs[4].title, status: 'approved', current_step: 2, initiator_id: prs[4].requester_id }
  ];
  for (const ai of approvalInstances) {
    await pool.query(
      `INSERT IGNORE INTO approval_instances (id, workflow_definition_id, entity_type, entity_id, title, status, current_step, initiator_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [ai.id, ai.workflow_definition_id, ai.entity_type, ai.entity_id, ai.title, ai.status, ai.current_step, ai.initiator_id]
    );
  }
  console.log('审批实例数据插入完成');

  // ==================== 审批历史 ====================
  const approvalHistory = [
    { id: uuidv4(), approval_instance_id: approvalInstances[0].id, step: 1, approver_id: users[0].id, action: 'approve', comment: '同意采购' },
    { id: uuidv4(), approval_instance_id: approvalInstances[0].id, step: 2, approver_id: users[2].id, action: 'approve', comment: '预算充足，同意' },
    { id: uuidv4(), approval_instance_id: approvalInstances[2].id, step: 1, approver_id: users[0].id, action: 'approve', comment: '同意' },
    { id: uuidv4(), approval_instance_id: approvalInstances[2].id, step: 2, approver_id: users[2].id, action: 'approve', comment: '同意采购' }
  ];
  for (const ah of approvalHistory) {
    await pool.query(
      'INSERT IGNORE INTO approval_history (id, approval_instance_id, step, approver_id, action, comment) VALUES (?, ?, ?, ?, ?, ?)',
      [ah.id, ah.approval_instance_id, ah.step, ah.approver_id, ah.action, ah.comment]
    );
  }
  console.log('审批历史数据插入完成');

  console.log('所有种子数据插入完成！');
}

seedData()
  .then(() => {
    console.log('种子数据初始化成功！');
    process.exit(0);
  })
  .catch((err) => {
    console.error('种子数据初始化失败:', err);
    process.exit(1);
  });
