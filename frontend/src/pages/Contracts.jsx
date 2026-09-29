import { useState, useEffect, useCallback } from 'react';
import { SearchOutlined, PlusOutlined, EditOutlined } from '@ant-design/icons';
import { contracts as contractsApi } from '../api';
import './Contracts.css';

const PAGE_SIZE = 10;

export default function Contracts() {
  const [list, setList] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState({
    title: '', supplierId: '', supplierName: '', amount: '',
    startDate: '', endDate: '', status: 'active', terms: '',
  });

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, pageSize: PAGE_SIZE };
      if (keyword) params.keyword = keyword;
      const res = await contractsApi.getList(params);
      const data = res.data || res;
      setList(data.list || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('加载合同列表失败:', err);
    } finally {
      setLoading(false);
    }
  }, [page, keyword]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  const handleAdd = () => {
    setEditingItem(null);
    setForm({ title: '', supplierId: '', supplierName: '', amount: '', startDate: '', endDate: '', status: 'active', terms: '' });
    setModalVisible(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setForm({
      title: item.title || '', supplierId: item.supplierId || '', supplierName: item.supplierName || '',
      amount: item.amount || '', startDate: item.startDate || '', endDate: item.endDate || '',
      status: item.status || 'active', terms: item.terms || '',
    });
    setModalVisible(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { alert('请输入合同名称'); return; }
    try {
      if (editingItem) {
        await contractsApi.update(editingItem.id, form);
      } else {
        await contractsApi.create(form);
      }
      setModalVisible(false);
      loadList();
    } catch (err) {
      console.error('保存失败:', err);
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="contracts-page">
      <div className="page-header">
        <h2>合同管理</h2>
        <p>管理与供应商的采购合同</p>
      </div>

      <div className="table-wrapper">
        <div className="table-toolbar">
          <div className="table-toolbar-left">
            <div className="search-input">
              <span className="search-icon"><SearchOutlined /></span>
              <input placeholder="搜索合同名称/供应商" value={keyword} onChange={(e) => setKeyword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && loadList()} />
            </div>
          </div>
          <button className="btn btn-primary" onClick={handleAdd}>
            <PlusOutlined /> 新增合同
          </button>
        </div>

        {loading ? (
          <div className="loading"><div className="spinner"></div>加载中...</div>
        ) : (
          <>
            <table>
              <thead>
                <tr>
                  <th>合同名称</th>
                  <th>供应商</th>
                  <th>合同金额</th>
                  <th>有效期</th>
                  <th>状态</th>
                  <th>创建时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {list.length === 0 ? (
                  <tr><td colSpan={7} className="text-center" style={{ padding: '40px', color: 'var(--text-muted)' }}>暂无数据</td></tr>
                ) : (
                  list.map((item) => (
                    <tr key={item.id}>
                      <td><strong>{item.title || item.contractNo || item.contract_no || '-'}</strong></td>
                      <td>{item.supplierName || item.supplier_name || '-'}</td>
                      <td><span className="contract-amount">¥{(item.amount || item.contract_amount || 0).toLocaleString()}</span></td>
                      <td>
                        <div className="contract-period">
                          {item.startDate || item.start_date || '-'} ~ {item.endDate || item.end_date || '-'}
                        </div>
                      </td>
                      <td><span className={`status-tag ${item.status}`}>{getStatusLabel(item.status)}</span></td>
                      <td>{item.createdAt || item.created_at || '-'}</td>
                      <td>
                        <button className="btn btn-sm btn-link" onClick={() => handleEdit(item)}>
                          <EditOutlined /> 编辑
                        </button>
                      </td>
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

      {/* 新增/编辑弹窗 */}
      {modalVisible && (
        <div className="modal-overlay" onClick={() => setModalVisible(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{editingItem ? '编辑合同' : '新增合同'}</span>
              <button className="modal-close" onClick={() => setModalVisible(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label"><span className="required">*</span>合同名称</label>
                  <input className="form-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="请输入合同名称" />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">供应商ID</label>
                    <input className="form-input" value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })} placeholder="请输入供应商ID" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">合同金额</label>
                    <input className="form-input" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="请输入合同金额" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">开始日期</label>
                    <input className="form-input" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">结束日期</label>
                    <input className="form-input" type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">状态</label>
                  <select className="form-select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    <option value="active">生效中</option>
                    <option value="expired">已过期</option>
                    <option value="terminated">已终止</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">合同条款</label>
                  <textarea className="form-textarea" value={form.terms} onChange={(e) => setForm({ ...form, terms: e.target.value })} placeholder="请输入合同条款" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn" onClick={() => setModalVisible(false)}>取消</button>
                <button type="submit" className="btn btn-primary">确定</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function getStatusLabel(status) {
  const map = { active: '生效中', expired: '已过期', terminated: '已终止' };
  return map[status] || status;
}
