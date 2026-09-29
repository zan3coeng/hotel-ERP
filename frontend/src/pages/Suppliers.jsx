import { useState, useEffect, useCallback } from 'react';
import { SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { suppliers as suppliersApi } from '../api';
import './Suppliers.css';

const PAGE_SIZE = 10;

export default function Suppliers() {
  const [list, setList] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState({
    name: '', code: '', category: '', contactName: '',
    contactPhone: '', email: '', address: '', description: '',
  });

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, pageSize: PAGE_SIZE };
      if (keyword) params.keyword = keyword;
      if (statusFilter) params.status = statusFilter;
      const res = await suppliersApi.getList(params);
      const data = res.data || res;
      setList(data.list || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('加载供应商列表失败:', err);
    } finally {
      setLoading(false);
    }
  }, [page, keyword, statusFilter]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  const handleSearch = () => {
    setPage(1);
    loadList();
  };

  const handleAdd = () => {
    setEditingItem(null);
    setForm({
      name: '', code: '', category: '', contactName: '',
      contactPhone: '', email: '', address: '', description: '',
    });
    setModalVisible(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setForm({
      name: item.name || '',
      code: item.code || '',
      category: item.category || '',
      contactName: item.contactName || '',
      contactPhone: item.contactPhone || '',
      email: item.email || '',
      address: item.address || '',
      description: item.description || '',
    });
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('确定要删除该供应商吗？此操作不可恢复。')) return;
    try {
      await suppliersApi.delete(id);
      loadList();
    } catch (err) {
      console.error('删除失败:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      alert('请输入供应商名称');
      return;
    }
    if (!form.code.trim()) {
      alert('请输入供应商编码');
      return;
    }
    try {
      if (editingItem) {
        await suppliersApi.update(editingItem.id, form);
      } else {
        await suppliersApi.create(form);
      }
      setModalVisible(false);
      loadList();
    } catch (err) {
      console.error('保存失败:', err);
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="suppliers-page">
      <div className="page-header">
        <h2>供应商管理</h2>
        <p>管理酒店供应链中的所有供应商信息</p>
      </div>

      <div className="table-wrapper">
        <div className="table-toolbar">
          <div className="table-toolbar-left">
            <div className="search-bar">
              <div className="search-input">
                <span className="search-icon"><SearchOutlined /></span>
                <input
                  placeholder="搜索供应商名称/编码"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <select
                className="filter-select"
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              >
                <option value="">全部状态</option>
                <option value="active">活跃</option>
                <option value="suspended">暂停</option>
                <option value="blacklist">黑名单</option>
              </select>
              <button className="btn" onClick={handleSearch}>搜索</button>
            </div>
          </div>
          <button className="btn btn-primary" onClick={handleAdd}>
            <PlusOutlined /> 新增供应商
          </button>
        </div>

        {loading ? (
          <div className="loading"><div className="spinner"></div>加载中...</div>
        ) : (
          <>
            <table>
              <thead>
                <tr>
                  <th>供应商名称</th>
                  <th>编码</th>
                  <th>品类</th>
                  <th>联系人</th>
                  <th>电话</th>
                  <th>评分</th>
                  <th>状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {list.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center" style={{ padding: '40px', color: 'var(--text-muted)' }}>
                      暂无数据
                    </td>
                  </tr>
                ) : (
                  list.map((item) => (
                    <tr key={item.id}>
                      <td><strong>{item.name}</strong></td>
                      <td>{item.code}</td>
                      <td><span className="category-tag">{item.category || '-'}</span></td>
                      <td>
                        <div className="contact-info">
                          <span className="contact-name">{item.contactName || '-'}</span>
                        </div>
                      </td>
                      <td>{item.contactPhone || '-'}</td>
                      <td><span className="rating">{item.rating != null ? Number(item.rating).toFixed(1) : '-'}</span></td>
                      <td>
                        <span className={`status-tag ${item.isActive ? 'active' : 'inactive'}`}>
                          {item.isActive ? '活跃' : '暂停'}
                        </span>
                      </td>
                      <td>
                        <div className="action-btns">
                          <button className="btn btn-sm btn-link" onClick={() => handleEdit(item)}>
                            <EditOutlined /> 编辑
                          </button>
                          <button className="btn btn-sm btn-link text-danger" onClick={() => handleDelete(item.id)}>
                            <DeleteOutlined /> 删除
                          </button>
                        </div>
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
                  <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>
                    {p}
                  </button>
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
              <span className="modal-title">{editingItem ? '编辑供应商' : '新增供应商'}</span>
              <button className="modal-close" onClick={() => setModalVisible(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label"><span className="required">*</span>供应商名称</label>
                    <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="请输入供应商名称" />
                  </div>
                  <div className="form-group">
                    <label className="form-label"><span className="required">*</span>供应商编码</label>
                    <input className="form-input" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="请输入供应商编码" disabled={!!editingItem} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">品类</label>
                    <input className="form-input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="如：食材、布草、清洁用品" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">联系人</label>
                    <input className="form-input" value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} placeholder="请输入联系人姓名" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">联系电话</label>
                    <input className="form-input" value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} placeholder="请输入联系电话" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">邮箱</label>
                    <input className="form-input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="请输入邮箱地址" />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">地址</label>
                  <input className="form-input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="请输入地址" />
                </div>
                <div className="form-group">
                  <label className="form-label">备注</label>
                  <textarea className="form-textarea" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="请输入备注信息" />
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
  const map = { active: '活跃', suspended: '暂停', blacklist: '黑名单' };
  return map[status] || status;
}
