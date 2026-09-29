import { useState, useEffect, useCallback } from 'react';
import { CheckOutlined, CloseOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { approvals as approvalsApi } from '../api';
import './Approvals.css';

export default function Approvals() {
  const [pendingList, setPendingList] = useState([]);
  const [historyList, setHistoryList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');
  const [commentMap, setCommentMap] = useState({});

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [pendingRes, historyRes] = await Promise.allSettled([
        approvalsApi.getList({ status: 'pending' }),
        approvalsApi.getList({ status: 'completed' }),
      ]);

      if (pendingRes.status === 'fulfilled' && pendingRes.value) {
        const data = pendingRes.value.data || pendingRes.value;
        setPendingList(data.list || data || []);
      }
      if (historyRes.status === 'fulfilled' && historyRes.value) {
        const data = historyRes.value.data || historyRes.value;
        setHistoryList(data.list || data || []);
      }
    } catch (err) {
      console.error('加载审批数据失败:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleApprove = async (item) => {
    const comment = commentMap[item.id] || '';
    if (!window.confirm('确定要通过该审批吗？')) return;
    try {
      await approvalsApi.approve(item.id, { comment });
      loadData();
    } catch (err) {
      console.error('审批失败:', err);
    }
  };

  const handleReject = async (item) => {
    const comment = commentMap[item.id] || '';
    if (!comment.trim()) {
      alert('驳回时请填写审批意见');
      return;
    }
    if (!window.confirm('确定要驳回该审批吗？')) return;
    try {
      await approvalsApi.reject(item.id, { comment });
      loadData();
    } catch (err) {
      console.error('驳回失败:', err);
    }
  };

  const updateComment = (id, value) => {
    setCommentMap({ ...commentMap, [id]: value });
  };

  return (
    <div className="approvals-page">
      <div className="page-header">
        <h2>审批中心</h2>
        <p>处理采购需求审批及查看审批历史</p>
      </div>

      <div className="tabs">
        <div className={`tab-item ${activeTab === 'pending' ? 'active' : ''}`} onClick={() => setActiveTab('pending')}>
          待审批 ({pendingList.length})
        </div>
        <div className={`tab-item ${activeTab === 'completed' ? 'active' : ''}`} onClick={() => setActiveTab('completed')}>
          已审批
        </div>
      </div>

      {loading ? (
        <div className="loading"><div className="spinner"></div>加载中...</div>
      ) : activeTab === 'pending' ? (
        pendingList.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-icon"><CheckOutlined /></div>
              <p>暂无待审批事项</p>
            </div>
          </div>
        ) : (
          pendingList.map((item) => (
            <div className="approval-card" key={item.id}>
              <div className="approval-card-header">
                <div>
                  <div className="approval-card-title">{item.title || item.requestTitle || item.request_title || `审批单号: ${item.id}`}</div>
                </div>
                <span className="status-tag pending">待审批</span>
              </div>
              <div className="approval-card-meta">
                <span><ClockCircleOutlined /> {item.createdAt || item.created_at || '-'}</span>
                <span>申请人: {item.requesterName || item.applicant || item.requester_name || item.initiator_name || '-'}</span>
                <span>部门: {item.department || item.departmentName || item.department_name || '-'}</span>
              </div>
              <div className="approval-card-actions">
                <input
                  className="form-input approval-comment"
                  placeholder="请输入审批意见（驳回时必填）"
                  value={commentMap[item.id] || ''}
                  onChange={(e) => updateComment(item.id, e.target.value)}
                />
                <button className="btn btn-success" onClick={() => handleApprove(item)}>
                  <CheckOutlined /> 通过
                </button>
                <button className="btn btn-danger" onClick={() => handleReject(item)}>
                  <CloseOutlined /> 驳回
                </button>
              </div>
            </div>
          ))
        )
      ) : (
        historyList.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <p>暂无审批历史</p>
            </div>
          </div>
        ) : (
          <div className="card">
            {historyList.map((item, index) => (
              <div className="history-item" key={item.id || index}>
                <div className={`history-icon ${item.status}`}>
                  {item.status === 'approved' ? <CheckOutlined /> : <CloseOutlined />}
                </div>
                <div className="history-info">
                  <h4>{item.title || item.requestTitle || item.request_title || `审批单号: ${item.id}`}</h4>
                  <p>
                    {item.status === 'approved' ? '已通过' : '已驳回'}
                    {item.comment ? ` - ${item.comment}` : ''}
                    {' | '}{item.approverName || item.approver_name || '-'} | {item.createdAt || item.created_at || '-'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
