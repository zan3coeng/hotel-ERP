import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileTextOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
  AlertOutlined,
} from '@ant-design/icons';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { dashboard, purchaseRequests, purchaseOrders } from '../api';
import './Dashboard.css';

export default function Dashboard() {
  const [stats, setStats] = useState({
    purchaseRequestCount: 0,
    purchaseOrderCount: 0,
    activeSupplierCount: 0,
    inventoryAlertCount: 0,
  });
  const [trendData, setTrendData] = useState([]);
  const [supplierRatingData, setSupplierRatingData] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, prRes, poRes] = await Promise.allSettled([
        dashboard.getStats(),
        purchaseRequests.getList({ status: 'pending', page: 1, pageSize: 5 }),
        purchaseOrders.getList({ page: 1, pageSize: 5 }),
      ]);

      if (statsRes.status === 'fulfilled' && statsRes.value) {
        const data = statsRes.value.data || statsRes.value;
        setStats({
          purchaseRequestCount: data.purchaseRequestCount || 0,
          purchaseOrderCount: data.purchaseOrderCount || 0,
          activeSupplierCount: data.supplierCount || data.activeSupplierCount || 0,
          inventoryAlertCount: data.inventoryAlertCount || 0,
        });
        setTrendData(data.trendData || generateMockTrend());
        setSupplierRatingData(data.supplierRatingData || generateMockRating());
      } else {
        setTrendData(generateMockTrend());
        setSupplierRatingData(generateMockRating());
      }

      if (prRes.status === 'fulfilled' && prRes.value) {
        setPendingRequests(prRes.value.data?.list || prRes.value.list || []);
      }

      if (poRes.status === 'fulfilled' && poRes.value) {
        setRecentOrders(poRes.value.data?.list || poRes.value.list || []);
      }
    } catch (err) {
      setTrendData(generateMockTrend());
      setSupplierRatingData(generateMockRating());
    } finally {
      setLoading(false);
    }
  };

  const generateMockTrend = () => [
    { month: '1月', amount: 42000 },
    { month: '2月', amount: 38000 },
    { month: '3月', amount: 55000 },
    { month: '4月', amount: 47000 },
    { month: '5月', amount: 62000 },
    { month: '6月', amount: 58000 },
  ];

  const generateMockRating = () => [
    { range: '90-100', count: 5 },
    { range: '80-89', count: 12 },
    { range: '70-79', count: 8 },
    { range: '60-69', count: 3 },
    { range: '<60', count: 1 },
  ];

  if (loading) {
    return <div className="loading"><div className="spinner"></div>加载中...</div>;
  }

  return (
    <div className="dashboard">
      <div className="page-header">
        <h2>工作台</h2>
        <p>欢迎回来，这是您的业务概览</p>
      </div>

      {/* 统计卡片 */}
      <div className="stat-cards">
        <div className="stat-card">
          <div className="stat-icon blue">
            <FileTextOutlined />
          </div>
          <div className="stat-info">
            <h3>{stats.purchaseRequestCount}</h3>
            <p>采购需求总数</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">
            <ShoppingCartOutlined />
          </div>
          <div className="stat-info">
            <h3>{stats.purchaseOrderCount}</h3>
            <p>采购订单总数</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange">
            <TeamOutlined />
          </div>
          <div className="stat-info">
            <h3>{stats.activeSupplierCount}</h3>
            <p>活跃供应商数</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red">
            <AlertOutlined />
          </div>
          <div className="stat-info">
            <h3>{stats.inventoryAlertCount}</h3>
            <p>库存预警数</p>
          </div>
        </div>
      </div>

      {/* 图表行 */}
      <div className="charts-row">
        <div className="chart-card">
          <h3>采购趋势（近6个月）</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => [`¥${value.toLocaleString()}`, '采购金额']} />
              <Line
                type="monotone"
                dataKey="amount"
                stroke="#1890ff"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-card">
          <h3>供应商评分分布</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={supplierRatingData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" />
              <YAxis />
              <Tooltip formatter={(value) => [value, '供应商数量']} />
              <Bar dataKey="count" fill="#1890ff" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 底部行 */}
      <div className="bottom-row">
        {/* 待办事项 */}
        <div className="todo-list">
          <h3>待审批采购需求</h3>
          {pendingRequests.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px 0' }}>
              <p>暂无待审批需求</p>
            </div>
          ) : (
            pendingRequests.map((item) => (
              <div className="todo-item" key={item.id}>
                <div className="todo-item-info">
                  <span className="todo-item-title">{item.title || item.name || `需求单号: ${item.requestNo || item.id}`}</span>
                  <span className="todo-item-meta">
                    申请人: {item.requesterName || item.applicant || '-'} | {item.createdAt || '-'}
                  </span>
                </div>
                <div className="todo-item-action">
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => navigate('/approvals')}
                  >
                    去审批
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 最近订单 */}
        <div className="recent-orders">
          <h3>最近采购订单</h3>
          <div className="table-wrapper" style={{ boxShadow: 'none', borderRadius: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>订单号</th>
                  <th>供应商</th>
                  <th>金额</th>
                  <th>状态</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center" style={{ padding: '30px', color: 'var(--text-muted)' }}>
                      暂无订单数据
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((order) => (
                    <tr key={order.id}>
                      <td>{order.orderNo || order.id}</td>
                      <td>{order.supplierName || '-'}</td>
                      <td>¥{(order.totalAmount || 0).toLocaleString()}</td>
                      <td>
                        <span className={`status-tag ${getStatusClass(order.status)}`}>
                          {getStatusLabel(order.status)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function getStatusClass(status) {
  const map = {
    draft: 'draft',
    pending: 'pending',
    sent: 'sent',
    confirmed: 'confirmed',
    partial: 'partial',
    completed: 'completed',
    closed: 'closed',
  };
  return map[status] || 'pending';
}

function getStatusLabel(status) {
  const map = {
    draft: '草稿',
    pending: '待审批',
    sent: '已发送',
    confirmed: '已确认',
    partial: '部分收货',
    completed: '已完成',
    closed: '已关闭',
  };
  return map[status] || status;
}
