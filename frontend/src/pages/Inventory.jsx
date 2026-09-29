import { useState, useEffect, useCallback } from 'react';
import { SearchOutlined, AlertOutlined } from '@ant-design/icons';
import { inventory as inventoryApi } from '../api';
import './Inventory.css';

const PAGE_SIZE = 10;

export default function Inventory() {
  const [list, setList] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('stock');

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, pageSize: PAGE_SIZE };
      if (keyword) params.keyword = keyword;
      const res = await inventoryApi.getList(params);
      const data = res.data || res;
      setList(data.list || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('加载库存列表失败:', err);
    } finally {
      setLoading(false);
    }
  }, [page, keyword]);

  const loadAlerts = useCallback(async () => {
    try {
      const res = await inventoryApi.getAlerts();
      const data = res.data || res;
      setAlerts(data.list || data || []);
    } catch (err) {
      console.error('加载库存预警失败:', err);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'stock') {
      loadList();
    } else {
      loadAlerts();
    }
  }, [activeTab, loadList, loadAlerts]);

  const getStockClass = (item) => {
    const qty = item.quantity;
    const minStock = item.minStock || item.minQuantity || item.min_stock || item.min_quantity;
    if (item.alertLevel === 'danger' || (qty != null && minStock != null && qty <= minStock * 0.5)) return 'low';
    if (item.alertLevel === 'warning' || (qty != null && minStock != null && qty <= minStock)) return 'warning';
    return 'normal';
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="inventory-page">
      <div className="page-header">
        <h2>库存管理</h2>
        <p>查看库存状况及预警信息</p>
      </div>

      <div className="tabs">
        <div className={`tab-item ${activeTab === 'stock' ? 'active' : ''}`} onClick={() => setActiveTab('stock')}>
          库存列表
        </div>
        <div className={`tab-item ${activeTab === 'alerts' ? 'active' : ''}`} onClick={() => setActiveTab('alerts')}>
          库存预警 {alerts.length > 0 && `(${alerts.length})`}
        </div>
      </div>

      {activeTab === 'stock' ? (
        <div className="table-wrapper" style={{ borderRadius: '0 0 var(--radius-lg) var(--radius-lg)' }}>
          <div className="table-toolbar">
            <div className="table-toolbar-left">
              <div className="search-input">
                <span className="search-icon"><SearchOutlined /></span>
                <input placeholder="搜索物料名称/编码" value={keyword} onChange={(e) => setKeyword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && loadList()} />
              </div>
            </div>
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
                    <th>当前库存</th>
                    <th>安全库存</th>
                    <th>单位</th>
                    <th>仓库</th>
                    <th>最后更新</th>
                  </tr>
                </thead>
                <tbody>
                  {list.length === 0 ? (
                    <tr><td colSpan={8} className="text-center" style={{ padding: '40px', color: 'var(--text-muted)' }}>暂无数据</td></tr>
                  ) : (
                    list.map((item) => (
                      <tr key={item.id} className={getStockClass(item) === 'low' ? 'alert-row' : ''}>
                        <td><strong>{item.itemName || item.name || item.item_name || '-'}</strong></td>
                        <td>{item.itemCode || item.code || item.item_code || '-'}</td>
                        <td>{item.category || item.categoryName || item.category_name || '-'}</td>
                        <td><span className={`stock-qty ${getStockClass(item)}`}>{item.quantity ?? '-'}</span></td>
                        <td>{item.minStock || item.minQuantity || item.min_stock || item.min_quantity || '-'}</td>
                        <td>{item.unit || '-'}</td>
                        <td>{item.warehouse || '-'}</td>
                        <td>{item.updatedAt || item.updated_at || item.createdAt || item.created_at || '-'}</td>
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
      ) : (
        <div className="card">
          {alerts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><AlertOutlined /></div>
              <p>暂无库存预警</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>物料名称</th>
                  <th>当前库存</th>
                  <th>安全库存</th>
                  <th>预警级别</th>
                  <th>建议补货数量</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((item, index) => (
                  <tr key={item.id || index} className="alert-row">
                    <td><strong>{item.itemName || item.name || item.item_name || '-'}</strong></td>
                    <td><span className="stock-qty low">{item.quantity ?? '-'}</span></td>
                    <td>{item.minStock || item.minQuantity || item.min_stock || item.min_quantity || '-'}</td>
                    <td>
                      <span className={`status-tag ${item.alertLevel === 'danger' ? 'danger' : 'pending'}`}>
                        {item.alertLevel === 'danger' ? '紧急' : '警告'}
                      </span>
                    </td>
                    <td>{item.suggestedQuantity || item.suggested_quantity || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
