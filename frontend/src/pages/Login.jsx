import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserOutlined, LockOutlined, AppstoreOutlined } from '@ant-design/icons';
import { auth } from '../api';
import './Login.css';

export default function Login() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.username.trim()) {
      setError('请输入用户名');
      return;
    }
    if (!form.password.trim()) {
      setError('请输入密码');
      return;
    }

    setLoading(true);
    try {
      const res = await auth.login(form);
      const { token, user } = res.data || res;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      navigate('/dashboard');
    } catch (err) {
      setError('登录失败，请检查用户名和密码');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">
            <AppstoreOutlined />
          </div>
          <h1>酒店供应链ERP</h1>
          <p>Hotel Supply Chain Management System</p>
        </div>
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <div className="login-input-wrapper">
              <span className="login-icon"><UserOutlined /></span>
              <input
                className="login-input"
                type="text"
                placeholder="请输入用户名"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                autoComplete="username"
              />
            </div>
          </div>
          <div className="form-group">
            <div className="login-input-wrapper">
              <span className="login-icon"><LockOutlined /></span>
              <input
                className="login-input"
                type="password"
                placeholder="请输入密码"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                autoComplete="current-password"
              />
            </div>
          </div>
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? '登录中...' : '登 录'}
          </button>
          <div className="login-error">{error}</div>
        </form>
      </div>
    </div>
  );
}
