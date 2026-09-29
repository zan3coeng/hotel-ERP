import { useState, useEffect, useCallback } from 'react';
import { SearchOutlined, PlusOutlined } from '@ant-design/icons';
import { payments as paymentsApi } from '../api';
import './Payments.css';

const PAGE_SIZE = 10;

export default function Payments() {
  const [list, setList] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState({
    orderId: '', supplierName: '', amount: '', paymentMethod: 'bank_transfer',
    paymentDate: '', remark: '',
  });

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, pageSize: PAGE_SIZE };
      if (keyword) params.keyword = keyword;
      const res = await paymentsApi.getList(params);
      const data = res.data || res;
      setList(data.list || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('加载付款列表失败:', err);
    } finally {
      setLoading(false);
    }
  }, [page, keyword]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  const handleAdd = () => {
    setForm({ orderId: '', supplierName: '', amount: '', paymentMethod: 'bank_transfer', paymentDate: '', remark: '' });
    setModalVisible(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.amount) { alert('请输入付款金额'); return; }
    try {
      await paymentsApi.create(form);
      setModalVisible(false);
      loadList();
    } catch (err) {
      console.error('创建失败:', err);
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="payments-page">
      <div className="page-header">
        <h2>付款管理</h2>
        <p>管理采购订单的付款记录</p>
      </div>

      <div className="table-wrapper">
        <div className="table-toolbar">
          <div className="table-toolbar-left">
            <div className="search-input">
              <span className="search-icon"><SearchOutlined /></span>
              <input placeholder="搜索订单号/供应商" value={keyword} onChange={(e) => setKeyword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && loadList()} />
            </div>
          </div>
          <button className="btn btn-primary" onClick={handleAdd}>
            <PlusOutlined /> 新增付款
          </button>
        </div>

        {loading ? (
          <div className="loading"><div className="spinner"></div>加载中...</div>
        ) : (
          <>
            <table>
              <thead>
                <tr>
                  <th>付款编号</th>
                  <th>关联订单</th>
                  <th>供应商</th>
                  <th>付款金额</th>
                  <th>付款方式</th>
                  <th>付款日期</th>
                  <th>状态</th>
                </tr>
              </thead>
              <tbody>
                {list.length === 0 ? (
                  <tr><td colSpan={7} className="text-center" style={{ padding: '40px', color: 'var(--text-muted)' }}>暂无数据</td></tr>
                ) : (
                  list.map((item) => (
                    <tr key={item.id}>
                      <td>{item.paymentNo || item.payment_no || item.id}</td>
                      <td>{item.orderNo || item.order_no || '-'}</td>
                      <td>{item.supplierName || item.supplier_name || '-'}</td>
                      <td><span className="payment-amount">¥{(item.amount || 0).toLocaleString()}</span></td>
                      <td>{getPaymentMethodLabel(item.paymentMethod || item.payment_method)}</td>
                      <td>{item.paymentDate || item.payment_date || item.createdAt || item.created_at || '-'}</td>
                      <td><span className={`status-tag ${item.status || 'completed'}`}>{getStatusLabel(item.status)}</span></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            {total > PAGE_SIZE && (
              <div className="pagination">
                <span className="pagination-info">共 {total} 条</span>
                <button className="page-btn" disabled={page <= 1} onClick={() => setPage(page - 1)}>上一页</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
                ))}
                <button className="page-btn" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>下一页</button>
              </div>
            )}
          </>
        )}
      </div>

      {/* 新增付款弹窗 */}
      {modalVisible && (
        <div className="modal-overlay" onClick={() => setModalVisible(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">新增付款</span>
              <button className="modal-close" onClick={() => setModalVisible(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">关联订单ID</label>
                    <input className="form-input" value={form.orderId} onChange={(e) => setForm({ ...form, orderId: e.target.value })} placeholder="请输入订单ID" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">供应商名称</label>
                    <input className="form-input" value={form.supplierName} onChange={(e) => setForm({ ...form, supplierName: e.target.value })} placeholder="请输入供应商名称" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label"><span className="required">*</span>付款金额</label>
                    <input className="form-input" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="请输入付款金额" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">付款方式</label>
                    <select className="form-select" value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}>
                      <option value="bank_transfer">银行转账</option>
                      <option value="cash">现金</option>
                      <option value="check">支票</option>
                      <option value="other">其他</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">付款日期</label>
                  <input className="form-input" type="date" value={form.paymentDate} onChange={(e) => setForm({ ...form, paymentDate: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">备注</label>
                  <textarea className="form-textarea" value={form.remark} onChange={(e) => setForm({ ...form, remark: e.target.value })} placeholder="请输入备注" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn" onClick={() => setModalVisible(false)}>取消</button>
                <button type="submit" className="btn btn-primary">确认付款</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function getPaymentMethodLabel(method) {
  const map = { bank_transfer: '银行转账', cash: '现金', check: '支票', other: '其他' };
  return map[method] || method || '-';
}

function getStatusLabel(status) {
  const map = { pending: '待付款', completed: '已完成', cancelled: '已取消' };
  return map[status] || status || '已完成';
}
