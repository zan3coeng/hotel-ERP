const pool = require('./db');

async function initDatabase() {
  console.log('开始初始化数据库...');

  const createDatabase = `CREATE DATABASE IF NOT EXISTS hotel_erp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`;
  await pool.query(createDatabase);
  console.log('数据库 hotel_erp 已就绪');

  await pool.query('USE hotel_erp');

  // ==================== 部门表 ====================
  await pool.query(`
    CREATE TABLE IF NOT EXISTS departments (
      id CHAR(36) PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      code VARCHAR(50) NOT NULL UNIQUE,
      description TEXT,
      manager_id CHAR(36),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // ==================== 角色表 ====================
  await pool.query(`
    CREATE TABLE IF NOT EXISTS roles (
      id CHAR(36) PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      code VARCHAR(50) NOT NULL UNIQUE,
      description TEXT,
      permissions JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // ==================== 用户表 ====================
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id CHAR(36) PRIMARY KEY,
      username VARCHAR(100) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      real_name VARCHAR(100),
      email VARCHAR(200),
      phone VARCHAR(50),
      department_id CHAR(36),
      role_id CHAR(36),
      is_active TINYINT(1) DEFAULT 1,
      last_login_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (department_id) REFERENCES departments(id),
      FOREIGN KEY (role_id) REFERENCES roles(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // ==================== 物料品类表 ====================
  await pool.query(`
    CREATE TABLE IF NOT EXISTS item_categories (
      id CHAR(36) PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      code VARCHAR(50) NOT NULL UNIQUE,
      description TEXT,
      parent_id CHAR(36),
      is_active TINYINT(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (parent_id) REFERENCES item_categories(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // ==================== 物料表 ====================
  await pool.query(`
    CREATE TABLE IF NOT EXISTS items (
      id CHAR(36) PRIMARY KEY,
      name VARCHAR(200) NOT NULL,
      code VARCHAR(50) NOT NULL UNIQUE,
      specification VARCHAR(200),
      unit VARCHAR(50) NOT NULL,
      category_id CHAR(36),
      description TEXT,
      is_active TINYINT(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES item_categories(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // ==================== 供应商表 ====================
  await pool.query(`
    CREATE TABLE IF NOT EXISTS suppliers (
      id CHAR(36) PRIMARY KEY,
      name VARCHAR(200) NOT NULL,
      code VARCHAR(50) NOT NULL UNIQUE,
      contact_person VARCHAR(100),
      phone VARCHAR(50),
      email VARCHAR(200),
      address TEXT,
      bank_name VARCHAR(200),
      bank_account VARCHAR(100),
      tax_number VARCHAR(100),
      rating DECIMAL(3,2) DEFAULT 0,
      is_active TINYINT(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // ==================== 供应商报价表 ====================
  await pool.query(`
    CREATE TABLE IF NOT EXISTS supplier_quotes (
      id CHAR(36) PRIMARY KEY,
      supplier_id CHAR(36) NOT NULL,
      item_id CHAR(36) NOT NULL,
      price DECIMAL(12,2) NOT NULL,
      currency VARCHAR(10) DEFAULT 'CNY',
      valid_from DATE,
      valid_to DATE,
      min_order_quantity INT DEFAULT 1,
      lead_time_days INT DEFAULT 7,
      is_active TINYINT(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
      FOREIGN KEY (item_id) REFERENCES items(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // ==================== 采购需求表 ====================
  await pool.query(`
    CREATE TABLE IF NOT EXISTS purchase_requests (
      id CHAR(36) PRIMARY KEY,
      request_no VARCHAR(50) NOT NULL UNIQUE,
      title VARCHAR(200) NOT NULL,
      description TEXT,
      status VARCHAR(20) DEFAULT 'draft',
      priority VARCHAR(20) DEFAULT 'normal',
      request_type VARCHAR(20) DEFAULT 'normal',
      request_date DATE NOT NULL,
      required_date DATE,
      requester_id CHAR(36) NOT NULL,
      department_id CHAR(36),
      total_amount DECIMAL(12,2) DEFAULT 0,
      approval_instance_id CHAR(36),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (requester_id) REFERENCES users(id),
      FOREIGN KEY (department_id) REFERENCES departments(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // ==================== 采购需求明细表 ====================
  await pool.query(`
    CREATE TABLE IF NOT EXISTS purchase_request_items (
      id CHAR(36) PRIMARY KEY,
      request_id CHAR(36) NOT NULL,
      item_id CHAR(36) NOT NULL,
      quantity DECIMAL(12,2) NOT NULL,
      estimated_price DECIMAL(12,2),
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (request_id) REFERENCES purchase_requests(id) ON DELETE CASCADE,
      FOREIGN KEY (item_id) REFERENCES items(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // ==================== 审批流程定义表 ====================
  await pool.query(`
    CREATE TABLE IF NOT EXISTS workflow_definitions (
      id CHAR(36) PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      code VARCHAR(50) NOT NULL UNIQUE,
      description TEXT,
      entity_type VARCHAR(50) NOT NULL,
      steps JSON NOT NULL,
      is_active TINYINT(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // ==================== 审批实例表 ====================
  await pool.query(`
    CREATE TABLE IF NOT EXISTS approval_instances (
      id CHAR(36) PRIMARY KEY,
      workflow_definition_id CHAR(36) NOT NULL,
      entity_type VARCHAR(50) NOT NULL,
      entity_id CHAR(36) NOT NULL,
      title VARCHAR(200),
      status VARCHAR(20) DEFAULT 'pending',
      current_step INT DEFAULT 0,
      initiator_id CHAR(36) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (workflow_definition_id) REFERENCES workflow_definitions(id),
      FOREIGN KEY (initiator_id) REFERENCES users(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // ==================== 审批历史表 ====================
  await pool.query(`
    CREATE TABLE IF NOT EXISTS approval_history (
      id CHAR(36) PRIMARY KEY,
      approval_instance_id CHAR(36) NOT NULL,
      step INT NOT NULL,
      approver_id CHAR(36) NOT NULL,
      action VARCHAR(20) NOT NULL,
      comment TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (approval_instance_id) REFERENCES approval_instances(id),
      FOREIGN KEY (approver_id) REFERENCES users(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // ==================== 采购订单表 ====================
  await pool.query(`
    CREATE TABLE IF NOT EXISTS purchase_orders (
      id CHAR(36) PRIMARY KEY,
      order_no VARCHAR(50) NOT NULL UNIQUE,
      request_id CHAR(36),
      title VARCHAR(200) NOT NULL,
      description TEXT,
      status VARCHAR(20) DEFAULT 'draft',
      supplier_id CHAR(36),
      order_date DATE NOT NULL,
      expected_delivery_date DATE,
      total_amount DECIMAL(12,2) DEFAULT 0,
      payment_terms VARCHAR(50),
      delivery_address TEXT,
      contact_person VARCHAR(100),
      contact_phone VARCHAR(50),
      created_by CHAR(36) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (request_id) REFERENCES purchase_requests(id),
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // ==================== 采购订单明细表 ====================
  await pool.query(`
    CREATE TABLE IF NOT EXISTS po_items (
      id CHAR(36) PRIMARY KEY,
      po_id CHAR(36) NOT NULL,
      item_id CHAR(36) NOT NULL,
      quantity DECIMAL(12,2) NOT NULL,
      unit_price DECIMAL(12,2) NOT NULL,
      amount DECIMAL(12,2) NOT NULL,
      description TEXT,
      received_quantity DECIMAL(12,2) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (po_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
      FOREIGN KEY (item_id) REFERENCES items(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // ==================== 收货记录表 ====================
  await pool.query(`
    CREATE TABLE IF NOT EXISTS receipts (
      id CHAR(36) PRIMARY KEY,
      receipt_no VARCHAR(50) NOT NULL UNIQUE,
      po_id CHAR(36) NOT NULL,
      receipt_date DATE NOT NULL,
      supplier_id CHAR(36),
      warehouse VARCHAR(100),
      receiver_id CHAR(36) NOT NULL,
      status VARCHAR(20) DEFAULT 'partial',
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (po_id) REFERENCES purchase_orders(id),
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
      FOREIGN KEY (receiver_id) REFERENCES users(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // ==================== 收货明细表 ====================
  await pool.query(`
    CREATE TABLE IF NOT EXISTS receipt_items (
      id CHAR(36) PRIMARY KEY,
      receipt_id CHAR(36) NOT NULL,
      po_item_id CHAR(36) NOT NULL,
      item_id CHAR(36) NOT NULL,
      quantity DECIMAL(12,2) NOT NULL,
      unit_price DECIMAL(12,2),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (receipt_id) REFERENCES receipts(id) ON DELETE CASCADE,
      FOREIGN KEY (po_item_id) REFERENCES po_items(id),
      FOREIGN KEY (item_id) REFERENCES items(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // ==================== 合同表 ====================
  await pool.query(`
    CREATE TABLE IF NOT EXISTS contracts (
      id CHAR(36) PRIMARY KEY,
      contract_no VARCHAR(50) NOT NULL UNIQUE,
      title VARCHAR(200) NOT NULL,
      supplier_id CHAR(36),
      type VARCHAR(50),
      amount DECIMAL(12,2) DEFAULT 0,
      start_date DATE,
      end_date DATE,
      status VARCHAR(20) DEFAULT 'draft',
      terms TEXT,
      attachments JSON,
      created_by CHAR(36) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // ==================== 付款记录表 ====================
  await pool.query(`
    CREATE TABLE IF NOT EXISTS payments (
      id CHAR(36) PRIMARY KEY,
      payment_no VARCHAR(50) NOT NULL UNIQUE,
      po_id CHAR(36),
      contract_id CHAR(36),
      supplier_id CHAR(36),
      amount DECIMAL(12,2) NOT NULL,
      payment_date DATE NOT NULL,
      payment_method VARCHAR(50),
      status VARCHAR(20) DEFAULT 'pending',
      reference_no VARCHAR(100),
      notes TEXT,
      created_by CHAR(36) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (po_id) REFERENCES purchase_orders(id),
      FOREIGN KEY (contract_id) REFERENCES contracts(id),
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // ==================== 发票表 ====================
  await pool.query(`
    CREATE TABLE IF NOT EXISTS invoices (
      id CHAR(36) PRIMARY KEY,
      invoice_no VARCHAR(50) NOT NULL UNIQUE,
      po_id CHAR(36),
      supplier_id CHAR(36),
      amount DECIMAL(12,2) NOT NULL,
      tax_amount DECIMAL(12,2) DEFAULT 0,
      invoice_date DATE,
      status VARCHAR(20) DEFAULT 'pending',
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (po_id) REFERENCES purchase_orders(id),
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // ==================== 库存表 ====================
  await pool.query(`
    CREATE TABLE IF NOT EXISTS inventory (
      id CHAR(36) PRIMARY KEY,
      item_id CHAR(36) NOT NULL UNIQUE,
      warehouse VARCHAR(100) DEFAULT 'main',
      quantity DECIMAL(12,2) DEFAULT 0,
      min_quantity DECIMAL(12,2) DEFAULT 0,
      max_quantity DECIMAL(12,2) DEFAULT 0,
      unit_cost DECIMAL(12,2) DEFAULT 0,
      last_in_date DATE,
      last_out_date DATE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (item_id) REFERENCES items(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // ==================== 库存事务表 ====================
  await pool.query(`
    CREATE TABLE IF NOT EXISTS inventory_transactions (
      id CHAR(36) PRIMARY KEY,
      item_id CHAR(36) NOT NULL,
      type VARCHAR(20) NOT NULL,
      quantity DECIMAL(12,2) NOT NULL,
      reference_type VARCHAR(50),
      reference_id CHAR(36),
      warehouse VARCHAR(100) DEFAULT 'main',
      operator_id CHAR(36),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (item_id) REFERENCES items(id),
      FOREIGN KEY (operator_id) REFERENCES users(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // ==================== 审计日志表 ====================
  await pool.query(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id CHAR(36) PRIMARY KEY,
      user_id CHAR(36),
      action VARCHAR(100) NOT NULL,
      entity_type VARCHAR(50),
      entity_id CHAR(36),
      details JSON,
      ip_address VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  console.log('所有数据表创建完成！');
}

initDatabase()
  .then(() => {
    console.log('数据库初始化成功！');
    process.exit(0);
  })
  .catch((err) => {
    console.error('数据库初始化失败:', err);
    process.exit(1);
  });
