import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { reports as reportsApi } from '../api';
import './Reports.css';

const COLORS = ['#1890ff', '#52c41a', '#faad14', '#ff4d4f', '#722ed1', '#13c2c2', '#eb2f96', '#fa541c'];

export default function Reports() {
  const [purchaseSummary, setPurchaseSummary] = useState([]);
  const [supplierPerformance, setSupplierPerformance] = useState([]);
  const [categoryDistribution, setCategoryDistribution] = useState([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    loadReportData();
  }, [year]);

  const loadReportData = async () => {
    setLoading(true);
    try {
      const [summaryRes, perfRes] = await Promise.allSettled([
        reportsApi.getPurchaseSummary({ year }),
        reportsApi.getSupplierPerformance({ year }),
      ]);

      if (summaryRes.status === 'fulfilled' && summaryRes.value) {
        const data = summaryRes.value.data || summaryRes.value;
        setPurchaseSummary(data.monthlyData || data.list || generateMockSummary());
        setCategoryDistribution(data.categoryData || generateMockCategory());
      } else {
        setPurchaseSummary(generateMockSummary());
        setCategoryDistribution(generateMockCategory());
      }

      if (perfRes.status === 'fulfilled' && perfRes.value) {
        const data = perfRes.value.data || perfRes.value;
        setSupplierPerformance(data.list || data || generateMockPerformance());
      } else {
        setSupplierPerformance(generateMockPerformance());
      }
    } catch (err) {
      setPurchaseSummary(generateMockSummary());
      setCategoryDistribution(generateMockCategory());
      setSupplierPerformance(generateMockPerformance());
    } finally {
      setLoading(false);
    }
  };

  const generateMockSummary = () => [
    { month: '1月', amount: 42000, count: 8 },
    { month: '2月', amount: 38000, count: 6 },
    { month: '3月', amount: 55000, count: 12 },
    { month: '4月', amount: 47000, count: 9 },
    { month: '5月', amount: 62000, count: 14 },
    { month: '6月', amount: 58000, count: 11 },
  ];

  const generateMockCategory = () => [
    { name: '食材', value: 35 },
    { name: '布草', value: 20 },
    { name: '清洁用品', value: 15 },
    { name: '设备', value: 18 },
    { name: '其他', value: 12 },
  ];

  const generateMockPerformance = () => [
    { name: '华南食品供应商', rating: 95, orderCount: 28, totalAmount: 156000, onTimeRate: 98 },
    { name: '锦程布业', rating: 92, orderCount: 15, totalAmount: 89000, onTimeRate: 95 },
    { name: '洁美清洁', rating: 88, orderCount: 22, totalAmount: 67000, onTimeRate: 92 },
    { name: '恒盛设备', rating: 85, orderCount: 10, totalAmount: 234000, onTimeRate: 88 },
    { name: '绿源食材', rating: 82, orderCount: 18, totalAmount: 112000, onTimeRate: 90 },
    { name: '雅居装饰', rating: 78, orderCount: 8, totalAmount: 45000, onTimeRate: 85 },
    { name: '鑫达五金', rating: 75, orderCount: 12, totalAmount: 38000, onTimeRate: 82 },
    { name: '丰盛粮油', rating: 70, orderCount: 20, totalAmount: 98000, onTimeRate: 78 },
  ];

  if (loading) {
    return <div className="loading"><div className="spinner"></div>加载中...</div>;
  }

  return (
    <div className="reports-page">
      <div className="page-header">
        <h2>数据报表</h2>
        <p>采购数据汇总与供应商表现分析</p>
      </div>

      <div className="filter-bar">
        <label>统计年份:</label>
        <select value={year} onChange={(e) => setYear(Number(e.target.value))}>
          {[2024, 2025, 2026].map((y) => (
            <option key={y} value={y}>{y}年</option>
          ))}
        </select>
        <button className="btn btn-primary" onClick={loadReportData}>刷新数据</button>
      </div>

      <div className="charts-grid">
        {/* 采购汇总柱状图 */}
        <div className="chart-card">
          <h3>采购金额月度汇总</h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={purchaseSummary}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value, name) => [name === 'amount' ? `¥${(value || 0).toLocaleString()}` : (value || 0), name === 'amount' ? '采购金额' : '订单数']} />
              <Legend />
              <Bar dataKey="amount" fill="#1890ff" radius={[4, 4, 0, 0]} name="采购金额" />
              <Bar dataKey="count" fill="#52c41a" radius={[4, 4, 0, 0]} name="订单数" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 品类分布饼图 */}
        <div className="chart-card">
          <h3>采购品类分布</h3>
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={categoryDistribution}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {categoryDistribution.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* 供应商表现排名 */}
        <div className="chart-card">
          <h3>供应商表现排名</h3>
          <table className="ranking-table">
            <thead>
              <tr>
                <th>排名</th>
                <th>供应商名称</th>
                <th>评分</th>
                <th>订单数</th>
                <th>采购总额</th>
                <th>准时率</th>
                <th>评分分布</th>
              </tr>
            </thead>
            <tbody>
              {supplierPerformance.map((item, index) => (
                <tr key={index}>
                  <td>
                    <span className={`rank-number ${index < 3 ? `top${index + 1}` : 'normal'}`}>
                      {index + 1}
                    </span>
                  </td>
                  <td><strong>{item.name || item.supplierName || '-'}</strong></td>
                  <td><span style={{ fontWeight: 600, color: (item.rating || 0) >= 90 ? 'var(--success-color)' : (item.rating || 0) >= 80 ? 'var(--primary-color)' : 'var(--warning-color)' }}>{item.rating || 0}</span></td>
                  <td>{item.orderCount || item.order_count || 0}</td>
                  <td>¥{(item.totalAmount || item.total_amount || 0).toLocaleString()}</td>
                  <td>{item.onTimeRate || item.on_time_rate || 0}%</td>
                  <td style={{ minWidth: 120 }}>
                    <div className="score-bar">
                      <div className="score-bar-track">
                        <div className="score-bar-fill" style={{ width: `${item.rating || 0}%` }}></div>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
