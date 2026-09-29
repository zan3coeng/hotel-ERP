import { useState, useEffect, useCallback } from 'react';
import { SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { items as itemsApi } from '../api';
import './Items.css';

const PAGE_SIZE = 10;

export default function Items() {
  const [list, setList] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState({
    name: '', code: '', category: '', specification: '',
    unit: '', unitPrice: '', description: '',
  });

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, pageSize: PAGE_SIZE };
      if (keyword) params.keyword = keyword;
      if (categoryFilter) params.category = categoryFilter;
      const res = await itemsApi.getList(params);
      const data = res.data || res;
      setList(data.list || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('加载物料列表失败:', err);
    } finally {
      setLoading(false);
    }
  }, [page, keyword, categoryFilter]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  const handleAdd = () => {
    setEditingItem(null);
    setForm({ name: '', code: '', category: '', specification: '', unit: '', unitPrice: '', description: '' });
    setModalVisible(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setForm({
      name: item.name || '', code: item.code || '', category: item.category || '',
      specification: item.specification || '', unit: item.unit || '',
      unitPrice: item.unitPrice || '', description: item.description || '',
    });
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('确定要删除该物料吗？')) return;
    try {
      await itemsApi.delete(id);
      loadList();
    } catch (err) {
      console.error('删除失败:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { alert('请输入物料名称'); return; }
    if (!form.code.trim()) { alert('请输入物料编码'); return; }
    try {
      if (editingItem) {
        await itemsApi.update(editingItem.id, form);
      } else {
        await itemsApi.create(form);
      }
      setModalVisible(false);
      loadList();
    } catch (err) {
      console.error('保存失败:', err);
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="items-page">
      <div className="page-header">
        <h2>物料管理</h2>
        <p>管理酒店采购物料的基础信息</p>
      </div>

      <div className="table-wrapper">
        <div className="table-toolbar">
          <div className="table-toolbar-left">
            <div className="search-input">
              <span className="search-icon"><SearchOutlined /></span>
              <input placeholder="搜索物料名称/编码" value={keyword} onChange={(e) => setKeyword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && loadList()} />
            </div>
            <select className="filter-select" value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}>
              <option value="">全部分类</option>
              <option value="food">食材</option>
              <option value="linen">布草</option>
              <option value="cleaning">清洁用品</option>
              <option value="equipment">设备</option>
              <option value="decor">装饰品</option>
              <option value="other">其他</option>
            </select>
          </div>
          <button className="btn btn-primary" onClick={handleAdd}>
            <PlusOutlined /> 新增物料
          </button>
        </div>

        {loading ? (
          <div className="loading"><div className="spinner"></div>加载中...</div>
        ) : (
          <>
            <table>
              <thead>
                <tr>
                  <th>物料名称</th>
                  <th>编码</th>
                  <th>分类</th>
                  <th>规格</th>
                  <th>单位</th>
                  <th>参考单价</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {list.length === 0 ? (
                  <tr><td colSpan={7} className="text-center" style={{ padding: '40px', color: 'var(--text-muted)' }}>暂无数据</td></tr>
                ) : (
                  list.map((item) => (
                    <tr key={item.id}>
                      <td><strong>{item.name || item.item_name || '-'}</strong></td>
                      <td>{item.code || item.item_code || '-'}</td>
                      <td><span className="category-tag">{getCategoryLabel(item.category || item.categoryName || item.category_name)}</span></td>
                      <td>{item.specification || '-'}</td>
                      <td><span className="unit-tag">{item.unit || '-'}</span></td>
                      <td>¥{Number(item.unitPrice || item.unit_price || 0).toFixed(2)}</td>
                      <td>
                        <div className="action-btns">
                          <button className="btn btn-sm btn-link" onClick={() => handleEdit(item)}><EditOutlined /> 编辑</button>
                          <button className="btn btn-sm btn-link text-danger" onClick={() => handleDelete(item.id)}><DeleteOutlined /> 删除</button>
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
              <span className="modal-title">{editingItem ? '编辑物料' : '新增物料'}</span>
              <button className="modal-close" onClick={() => setModalVisible(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label"><span className="required">*</span>物料名称</label>
                    <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="请输入物料名称" />
                  </div>
                  <div className="form-group">
                    <label className="form-label"><span className="required">*</span>物料编码</label>
                    <input className="form-input" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="请输入物料编码" disabled={!!editingItem} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">分类</label>
                    <select className="form-select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                      <option value="">请选择分类</option>
                      <option value="food">食材</option>
                      <option value="linen">布草</option>
                      <option value="cleaning">清洁用品</option>
                      <option value="equipment">设备</option>
                      <option value="decor">装饰品</option>
                      <option value="other">其他</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">单位</label>
                    <input className="form-input" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="如：个、箱、kg" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">规格</label>
                    <input className="form-input" value={form.specification} onChange={(e) => setForm({ ...form, specification: e.target.value })} placeholder="请输入规格" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">参考单价</label>
                    <input className="form-input" type="number" value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: e.target.value })} placeholder="请输入参考单价" />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">描述</label>
                  <textarea className="form-textarea" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="请输入描述" />
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

function getCategoryLabel(category) {
  const map = { food: '食材', linen: '布草', cleaning: '清洁用品', equipment: '设备', decor: '装饰品', other: '其他' };
  return map[category] || category || '-';
}
