import request from '../utils/request';

// ==================== 认证 ====================
export const auth = {
  login: (data) => request.post('/auth/login', data),
  getMe: () => request.get('/auth/me'),
};

// ==================== 供应商 ====================
export const suppliers = {
  getList: (params) => request.get('/suppliers', { params }),
  getDetail: (id) => request.get(`/suppliers/${id}`),
  create: (data) => request.post('/suppliers', data),
  update: (id, data) => request.put(`/suppliers/${id}`, data),
  delete: (id) => request.delete(`/suppliers/${id}`),
};

// ==================== 物料 ====================
export const items = {
  getList: (params) => request.get('/items', { params }),
  create: (data) => request.post('/items', data),
  update: (id, data) => request.put(`/items/${id}`, data),
  delete: (id) => request.delete(`/items/${id}`),
};

// ==================== 采购需求 ====================
export const purchaseRequests = {
  getList: (params) => request.get('/purchase-requests', { params }),
  getDetail: (id) => request.get(`/purchase-requests/${id}`),
  create: (data) => request.post('/purchase-requests', data),
  updateStatus: (id, data) => request.put(`/purchase-requests/${id}/status`, data),
};

// ==================== 采购订单 ====================
export const purchaseOrders = {
  getList: (params) => request.get('/purchase-orders', { params }),
  getDetail: (id) => request.get(`/purchase-orders/${id}`),
  create: (data) => request.post('/purchase-orders', data),
  updateStatus: (id, data) => request.put(`/purchase-orders/${id}/status`, data),
};

// ==================== 审批 ====================
export const approvals = {
  getList: (params) => request.get('/approvals', { params }),
  approve: (id, data) => request.post(`/approvals/${id}/approve`, data),
  reject: (id, data) => request.post(`/approvals/${id}/reject`, data),
};

// ==================== 合同 ====================
export const contracts = {
  getList: (params) => request.get('/contracts', { params }),
  create: (data) => request.post('/contracts', data),
  update: (id, data) => request.put(`/contracts/${id}`, data),
};

// ==================== 付款 ====================
export const payments = {
  getList: (params) => request.get('/payments', { params }),
  create: (data) => request.post('/payments', data),
};

// ==================== 库存 ====================
export const inventory = {
  getList: (params) => request.get('/inventory', { params }),
  getAlerts: (params) => request.get('/inventory/alerts', { params }),
};

// ==================== 工作台 ====================
export const dashboard = {
  getStats: () => request.get('/dashboard/stats'),
};

// ==================== 报表 ====================
export const reports = {
  getPurchaseSummary: (params) => request.get('/reports/purchase-summary', { params }),
  getSupplierPerformance: (params) => request.get('/reports/supplier-performance', { params }),
};
