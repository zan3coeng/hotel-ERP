import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  DashboardOutlined,
  FileTextOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
  AppstoreOutlined,
  AuditOutlined,
  FileProtectOutlined,
  PayCircleOutlined,
  InboxOutlined,
  BarChartOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined,
  UserOutlined,
} from '@ant-design/icons';
import './MainLayout.css';

const menuItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, text: '工作台' },
  { key: '/purchase-requests', icon: <FileTextOutlined />, text: '采购需求' },
  { key: '/purchase-orders', icon: <ShoppingCartOutlined />, text: '采购订单' },
  { key: '/suppliers', icon: <TeamOutlined />, text: '供应商管理' },
  { key: '/items', icon: <AppstoreOutlined />, text: '物料管理' },
  { key: '/approvals', icon: <AuditOutlined />, text: '审批中心' },
  { key: '/contracts', icon: <FileProtectOutlined />, text: '合同管理' },
  { key: '/payments', icon: <PayCircleOutlined />, text: '付款管理' },
  { key: '/inventory', icon: <InboxOutlined />, text: '库存管理' },
  { key: '/reports', icon: <BarChartOutlined />, text: '数据报表' },
];

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    if (window.confirm('确定要退出登录吗？')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
    }
  };

  return (
    <div className="main-layout">
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-logo">
          <span className="logo-icon">
            <AppstoreOutlined />
          </span>
          <span className="logo-text">酒店供应链ERP</span>
        </div>
        <nav className="sidebar-menu">
          {menuItems.map((item) => (
            <div
              key={item.key}
              className={`menu-item ${location.pathname === item.key ? 'active' : ''}`}
              onClick={() => navigate(item.key)}
            >
              <span className="menu-icon">{item.icon}</span>
              <span className="menu-text">{item.text}</span>
            </div>
          ))}
        </nav>
      </aside>
      <div className="main-content">
        <header className="header">
          <div className="header-left">
            <button
              className="collapse-btn"
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            </button>
            <span className="header-title">酒店供应链ERP</span>
          </div>
          <div className="header-right">
            <div className="user-info">
              <span className="user-avatar">
                <UserOutlined />
              </span>
              <span>{user.username || '管理员'}</span>
            </div>
            <button className="logout-btn" onClick={handleLogout}>
              <LogoutOutlined /> 退出
            </button>
          </div>
        </header>
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
