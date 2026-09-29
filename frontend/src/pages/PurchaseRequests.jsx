import { useState, useEffect, useCallback } from 'react';
import { SearchOutlined, PlusOutlined, EyeOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { purchaseRequests as prApi } from '../api';
import './PurchaseRequests.css';

const PAGE_SIZE = 10;
const tabList = [
  { key: '', label: '全部' },
  { key: 'pending', label: '待审批' },
  { key: 'approved', label: '已通过' },
  { key: 'rejected', label: '已驳回' },
  { key: 'converted', label: '已转单' },
];

export default function PurchaseRequests() {
  const [list, setList] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState('');
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const [form, setForm] = useState({ title: '', department: '', urgency: 'normal', remark: '' });
  const [lineItems, setLineItems] = useState([{ itemName: '', specification: '', quantity: '', unit: '', estimatedPrice: '' }]);

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, pageSize: PAGE_SIZE };
      if (activeTab) params.status = activeTab;
      if (keyword) params.keyword = keyword;
      const res = await prApi.getList(params);
      const data = res.data || res;
      setList(data.list || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('加载采购需求列表失败:', err);
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
    setForm({ title: '', department: '', urgency: 'normal', remark: '' });
    setLineItems([{ itemName: '', specification: '', quantity: '', unit: '', estimatedPrice: '' }]);
    setModalVisible(true);
  };

  const handleViewDetail = async (item) => {
    try {
      const res = await prApi.getDetail(item.id);
      setDetailData(res.data || res);
    } catch (err) {
      setDetailData(item);
    }
    setDetailVisible(true);
  };

  const handleStatusChange = async (item, newStatus) => {
    const actionText = newStatus === 'approved' ? '通过' : '驳回';
    if (!window.confirm(`确定要${actionText}该采购需求吗？`)) return;
    try {
      await prApi.updateStatus(item.id, { status: newStatus });
      loadList();
    } catch (err) {
      console.error('操作失败:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { alert('请输入需求标题'); return; }
    const validItems = lineItems.filter((i) => i.itemName.trim());
    if (validItems.length === 0) { alert('请至少添加一项物料'); return; }
    try {
      await prApi.create({ ...form, items: validItems });
      setModalVisible(false);
      loadList();
    } catch (err) {
      console.error('创建失败:', err);
    }
  };

  const addLineItem = () => {
    setLineItems([...lineItems, { itemName: '', specification: '', quantity: '', unit: '', estimatedPrice: '' }]);
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
    <div className="purchase-requests-page">
      <div className="page-header">
        <h2>采购需求管理</h2>
        <p>管理所有采购需求申请及审批流程</p>
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
              <input placeholder="搜索需求标题/编号" value={keyword} onChange={(e) => setKeyword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && loadList()} />
            </div>
          </div>
          <button className="btn btn-primary" onClick={handleAdd}>
            <PlusOutlined /> 新增需求
          </button>
        </div>

        {loading ? (
          <div className="loading"><div className="spinner"></div>加载中...</div>
        ) : (
          <>
            <table>
              <thead>
                <tr>
                  <th>需求编号</th>
                  <th>标题</th>
                  <th>申请部门</th>
                  <th>申请人</th>
                  <th>紧急程度</th>
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
                      <td>{item.requestNo || item.request_no || item.id}</td>
                      <td><strong>{item.title || '-'}</strong></td>
                      <td>{item.department || item.departmentName || item.department_name || '-'}</td>
                      <td>{item.requesterName || item.applicant || item.requester_name || '-'}</td>
                      <td>{getUrgencyLabel(item.urgency)}</td>
                      <td><span className={`status-tag ${item.status}`}>{getStatusLabel(item.status)}</span></td>
                      <td>{item.createdAt || item.created_at || '-'}</td>
                      <td>
                        <div className="action-btns">
                          <button className="btn btn-sm btn-link" onClick={() => handleViewDetail(item)}><EyeOutlined /> 详情</button>
                          {item.status === 'pending' && (
                            <>
                              <button className="btn btn-sm btn-link text-success" onClick={() => handleStatusChange(item, 'approved')}><CheckOutlined /> 通过</button>
                              <button className="btn btn-sm btn-link text-danger" onClick={() => handleStatusChange(item, 'rejected')}><CloseOutlined /> 驳回</button>
                            </>
                          )}
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

      {/* 新增需求弹窗 */}
      {modalVisible && (
        <div className="modal-overlay" onClick={() => setModalVisible(false)}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">新增采购需求</span>
              <button className="modal-close" onClick={() => setModalVisible(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label"><span className="required">*</span>需求标题</label>
                    <input className="form-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="请输入需求标题" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">申请部门</label>
                    <input className="form-input" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} placeholder="请输入申请部门" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">紧急程度</label>
                    <select className="form-select" value={form.urgency} onChange={(e) => setForm({ ...form, urgency: e.target.value })}>
                      <option value="normal">普通</option>
                      <option value="urgent">紧急</option>
                      <option value="veryUrgent">非常紧急</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">备注</label>
                    <input className="form-input" value={form.remark} onChange={(e) => setForm({ ...form, remark: e.target.value })} placeholder="请输入备注" />
                  </div>
                </div>

                <h4 style={{ fontSize: 15, fontWeight: 600, margin: '16px 0 12px' }}>需求明细</h4>
                <div className="line-item-row" style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-secondary)' }}>
                  <span>物料名称</span><span>规格</span><span>数量</span><span>单位</span><span>预估单价</span><span></span>
                </div>
                {lineItems.map((item, index) => (
                  <div className="line-item-row" key={index}>
                    <input placeholder="物料名称" value={item.itemName} onChange={(e) => updateLineItem(index, 'itemName', e.target.value)} />
                    <input placeholder="规格" value={item.specification} onChange={(e) => updateLineItem(index, 'specification', e.target.value)} />
                    <input type="number" placeholder="数量" value={item.quantity} onChange={(e) => updateLineItem(index, 'quantity', e.target.value)} />
                    <input placeholder="单位" value={item.unit} onChange={(e) => updateLineItem(index, 'unit', e.target.value)} />
                    <input type="number" placeholder="预估单价" value={item.estimatedPrice} onChange={(e) => updateLineItem(index, 'estimatedPrice', e.target.value)} />
                    <button type="button" className="btn btn-sm btn-danger" disabled={lineItems.length <= 1} onClick={() => removeLineItem(index)}>删除</button>
                  </div>
                ))}
                <button type="button" className="btn btn-sm add-line-btn" onClick={addLineItem}><PlusOutlined /> 添加明细行</button>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn" onClick={() => setModalVisible(false)}>取消</button>
                <button type="submit" className="btn btn-primary">提交需求</button>
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
              <span className="modal-title">采购需求详情</span>
              <button className="modal-close" onClick={() => setDetailVisible(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="detail-section">
                <h4>基本信息</h4>
                <div className="desc-list">
                  <div className="desc-item"><span className="desc-label">需求编号:</span><span className="desc-value">{detailData.requestNo || detailData.request_no || detailData.id}</span></div>
                  <div className="desc-item"><span className="desc-label">状态:</span><span className="desc-value"><span className={`status-tag ${detailData.status}`}>{getStatusLabel(detailData.status)}</span></span></div>
                  <div className="desc-item"><span className="desc-label">标题:</span><span className="desc-value">{detailData.title || '-'}</span></div>
                  <div className="desc-item"><span className="desc-label">申请部门:</span><span className="desc-value">{detailData.department || detailData.departmentName || detailData.department_name || '-'}</span></div>
                  <div className="desc-item"><span className="desc-label">申请人:</span><span className="desc-value">{detailData.requesterName || detailData.applicant || detailData.requester_name || '-'}</span></div>
                  <div className="desc-item"><span className="desc-label">紧急程度:</span><span className="desc-value">{getUrgencyLabel(detailData.urgency)}</span></div>
                </div>
              </div>
              {detailData.items && detailData.items.length > 0 && (
                <div className="detail-section">
                  <h4>需求明细</h4>
                  <table className="detail-items-table">
                    <thead>
                      <tr><th>物料名称</th><th>规格</th><th>数量</th><th>单位</th><th>预估单价</th><th>预估金额</th></tr>
                    </thead>
                    <tbody>
                      {detailData.items.map((item, i) => (
                        <tr key={i}>
                          <td>{item.itemName || item.item_name || '-'}</td>
                          <td>{item.specification || '-'}</td>
                          <td>{item.quantity || 0}</td>
                          <td>{item.unit || '-'}</td>
                          <td>¥{Number(item.estimatedPrice || item.estimated_price || 0).toFixed(2)}</td>
                          <td>¥{((item.quantity || 0) * (item.estimatedPrice || item.estimated_price || 0)).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {detailData.approvalHistory && detailData.approvalHistory.length > 0 && (
                <div className="detail-section approval-history">
                  <h4>审批历史</h4>
                  {detailData.approvalHistory.map((record, i) => (
                    <div className="approval-record" key={i}>
                      <span className={`approval-status-dot ${record.status}`}></span>
                      <div>
                        <div style={{ fontSize: 14, color: 'var(--text-color)' }}>{record.approverName || record.approver_name || '-'}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          {getStatusLabel(record.status)} {record.comment ? `- ${record.comment}` : ''} | {record.createdAt || record.created_at || '-'}
                        </div>
                      </div>
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
  const map = { draft: '草稿', pending: '待审批', approved: '已通过', rejected: '已驳回', converted: '已转单' };
  return map[status] || status || '-';
}

function getUrgencyLabel(urgency) {
  const map = { normal: '普通', urgent: '紧急', veryUrgent: '非常紧急' };
  return map[urgency] || urgency || '-';
}
