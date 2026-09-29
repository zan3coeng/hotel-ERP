import { useState, useEffect, useCallback } from 'react';
import { SearchOutlined, PlusOutlined, EyeOutlined } from '@ant-design/icons';
import { purchaseOrders as poApi } from '../api';
import './PurchaseOrders.css';

const PAGE_SIZE = 10;
const tabList = [
  { key: '', label: '全部' },
  { key: 'draft', label: '草稿' },
  { key: 'sent', label: '已发送' },
  { key: 'confirmed', label: '已确认' },
  { key: 'partial', label: '部分收货' },
  { key: 'completed', label: '已完成' },
  { key: 'closed', label: '已关闭' },
];

export default function PurchaseOrders() {
  const [list, setList] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState('');
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const [form, setForm] = useState({ supplierId: '', expectedDate: '', remark: '' });
  const [lineItems, setLineItems] = useState([{ itemName: '', specification: '', quantity: '', unit: '', unitPrice: '' }]);

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, pageSize: PAGE_SIZE };
      if (activeTab) params.status = activeTab;
      if (keyword) params.keyword = keyword;
      const res = await poApi.getList(params);
      const data = res.data || res;
      setList(data.list || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('加载采购订单列表失败:', err);
    } finally {
      setLoading(false);
    }
  }, [page, activeTab, keyword]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  const handleTabChange = (key) => {
    setActiveTab(key);
    setPage(1);
  };

  const handleAdd = () => {
    setForm({ supplierId: '', expectedDate: '', remark: '' });
    setLineItems([{ itemName: '', specification: '', quantity: '', unit: '', unitPrice: '' }]);
    setModalVisible(true);
  };

  const handleViewDetail = async (item) => {
    try {
      const res = await poApi.getDetail(item.id);
      setDetailData(res.data || res);
    } catch (err) {
      setDetailData(item);
    }
    setDetailVisible(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.supplierId) { alert('请选择供应商'); return; }
    const validItems = lineItems.filter((i) => i.itemName.trim());
    if (validItems.length === 0) { alert('请至少添加一项物料'); return; }
    try {
      await poApi.create({ ...form, items: validItems });
      setModalVisible(false);
      loadList();
    } catch (err) {
      console.error('创建失败:', err);
    }
  };

  const addLineItem = () => {
    setLineItems([...lineItems, { itemName: '', specification: '', quantity: '', unit: '', unitPrice: '' }]);
  };

  const removeLineItem = (index) => {
    if (lineItems.length <= 1) return;
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const updateLineItem = (index, field, value) => {
    const updated = [...lineItems];
    updated[index][field] = value;
    setLineItems(updated);
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="purchase-orders-page">
      <div className="page-header">
        <h2>采购订单管理</h2>
        <p>管理所有采购订单的创建、发送与收货</p>
      </div>

      <div className="tabs">
        {tabList.map((tab) => (
          <div key={tab.key} className={`tab-item ${activeTab === tab.key ? 'active' : ''}`} onClick={() => handleTabChange(tab.key)}>
            {tab.label}
          </div>
        ))}
      </div>

      <div className="table-wrapper" style={{ borderRadius: '0 0 var(--radius-lg) var(--radius-lg)' }}>
        <div className="table-toolbar">
          <div className="table-toolbar-left">
            <div className="search-input">
              <span className="search-icon"><SearchOutlined /></span>
              <input placeholder="搜索订单号/供应商" value={keyword} onChange={(e) => setKeyword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && loadList()} />
            </div>
          </div>
          <button className="btn btn-primary" onClick={handleAdd}>
            <PlusOutlined /> 新增订单
          </button>
        </div>

        {loading ? (
          <div className="loading"><div className="spinner"></div>加载中...</div>
        ) : (
          <>
            <table>
              <thead>
                <tr>
                  <th>订单号</th>
                  <th>供应商</th>
                  <th>物料数量</th>
                  <th>订单金额</th>
                  <th>期望到货日期</th>
                  <th>状态</th>
                  <th>创建时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {list.length === 0 ? (
                  <tr><td colSpan={8} className="text-center" style={{ padding: '40px', color: 'var(--text-muted)' }}>暂无数据</td></tr>
                ) : (
                  list.map((item) => (
                    <tr key={item.id}>
                      <td><strong>{item.orderNo || item.order_no || item.id}</strong></td>
                      <td>{item.supplierName || item.supplier_name || '-'}</td>
                      <td>{item.itemCount || item.item_count || (item.items ? item.items.length : '-')}</td>
                      <td><span className="amount">¥{(item.totalAmount || item.total_amount || 0).toLocaleString()}</span></td>
                      <td>{item.expectedDate || item.expected_date || '-'}</td>
                      <td><span className={`status-tag ${item.status}`}>{getStatusLabel(item.status)}</span></td>
                      <td>{item.createdAt || item.created_at || '-'}</td>
                      <td>
                        <button className="btn btn-sm btn-link" onClick={() => handleViewDetail(item)}>
                          <EyeOutlined /> 详情
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

      {/* 新增订单弹窗 */}
      {modalVisible && (
        <div className="modal-overlay" onClick={() => setModalVisible(false)}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">新增采购订单</span>
              <button className="modal-close" onClick={() => setModalVisible(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label"><span className="required">*</span>供应商ID</label>
                    <input className="form-input" value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })} placeholder="请输入供应商ID" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">期望到货日期</label>
                    <input className="form-input" type="date" value={form.expectedDate} onChange={(e) => setForm({ ...form, expectedDate: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">备注</label>
                  <input className="form-input" value={form.remark} onChange={(e) => setForm({ ...form, remark: e.target.value })} placeholder="请输入备注" />
                </div>

                <h4 style={{ fontSize: 15, fontWeight: 600, margin: '16px 0 12px' }}>订单明细</h4>
                <div className="line-item-row" style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-secondary)' }}>
                  <span>物料名称</span><span>规格</span><span>数量</span><span>单位</span><span>单价</span><span></span>
                </div>
                {lineItems.map((item, index) => (
                  <div className="line-item-row" key={index}>
                    <input placeholder="物料名称" value={item.itemName} onChange={(e) => updateLineItem(index, 'itemName', e.target.value)} />
                    <input placeholder="规格" value={item.specification} onChange={(e) => updateLineItem(index, 'specification', e.target.value)} />
                    <input type="number" placeholder="数量" value={item.quantity} onChange={(e) => updateLineItem(index, 'quantity', e.target.value)} />
                    <input placeholder="单位" value={item.unit} onChange={(e) => updateLineItem(index, 'unit', e.target.value)} />
                    <input type="number" placeholder="单价" value={item.unitPrice} onChange={(e) => updateLineItem(index, 'unitPrice', e.target.value)} />
                    <button type="button" className="btn btn-sm btn-danger" disabled={lineItems.length <= 1} onClick={() => removeLineItem(index)}>删除</button>
                  </div>
                ))}
                <button type="button" className="btn btn-sm" style={{ marginTop: 8 }} onClick={addLineItem}><PlusOutlined /> 添加明细行</button>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn" onClick={() => setModalVisible(false)}>取消</button>
                <button type="submit" className="btn btn-primary">创建订单</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 详情弹窗 */}
      {detailVisible && detailData && (
        <div className="modal-overlay" onClick={() => setDetailVisible(false)}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">采购订单详情</span>
              <button className="modal-close" onClick={() => setDetailVisible(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="detail-section">
                <h4>基本信息</h4>
                <div className="desc-list">
                  <div className="desc-item"><span className="desc-label">订单号:</span><span className="desc-value">{detailData.orderNo || detailData.order_no || detailData.id}</span></div>
                  <div className="desc-item"><span className="desc-label">状态:</span><span className="desc-value"><span className={`status-tag ${detailData.status}`}>{getStatusLabel(detailData.status)}</span></span></div>
                  <div className="desc-item"><span className="desc-label">供应商:</span><span className="desc-value">{detailData.supplierName || detailData.supplier_name || '-'}</span></div>
                  <div className="desc-item"><span className="desc-label">期望到货:</span><span className="desc-value">{detailData.expectedDate || detailData.expected_date || '-'}</span></div>
                  <div className="desc-item"><span className="desc-label">创建时间:</span><span className="desc-value">{detailData.createdAt || detailData.created_at || '-'}</span></div>
                  <div className="desc-item"><span className="desc-label">备注:</span><span className="desc-value">{detailData.remark || '-'}</span></div>
                </div>
              </div>
              {detailData.items && detailData.items.length > 0 && (
                <div className="detail-section">
                  <h4>订单明细</h4>
                  <table>
                    <thead>
                      <tr><th>物料名称</th><th>规格</th><th>数量</th><th>单位</th><th>单价</th><th>金额</th></tr>
                    </thead>
                    <tbody>
                      {detailData.items.map((item, i) => (
                        <tr key={i}>
                          <td>{item.itemName || item.item_name || '-'}</td>
                          <td>{item.specification || '-'}</td>
                          <td>{item.quantity || 0}</td>
                          <td>{item.unit || '-'}</td>
                          <td>¥{Number(item.unitPrice || item.unit_price || 0).toFixed(2)}</td>
                          <td>¥{((item.quantity || 0) * (item.unitPrice || item.unit_price || 0)).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="order-summary">
                    订单总额: ¥{(detailData.totalAmount || detailData.total_amount || 0).toLocaleString()}
                  </div>
                </div>
              )}
              {detailData.receivingRecords && detailData.receivingRecords.length > 0 && (
                <div className="detail-section receiving-record">
                  <h4>收货记录</h4>
                  {detailData.receivingRecords.map((record, i) => (
                    <div className="receiving-item" key={i}>
                      <span>收货数量: {record.quantity || 0} {record.unit || ''}</span>
                      <span>{record.receivedAt || record.received_at || record.createdAt || record.created_at || '-'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setDetailVisible(false)}>关闭</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getStatusLabel(status) {
  const map = { draft: '草稿', sent: '已发送', confirmed: '已确认', partial: '部分收货', completed: '已完成', closed: '已关闭' };
  return map[status] || status;
}
