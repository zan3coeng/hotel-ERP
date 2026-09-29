import axios from 'axios';

// 开发环境使用 Vite 代理 (/api)，生产环境使用环境变量
const baseURL = import.meta.env.VITE_API_BASE_URL || '/api';

const request = axios.create({
  baseURL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器：自动附加 JWT token
request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器：统一错误处理
request.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      if (status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      } else if (status === 403) {
        alert('没有权限执行此操作');
      } else if (status === 404) {
        alert('请求的资源不存在');
      } else if (status === 500) {
        alert('服务器内部错误，请稍后重试');
      } else {
        alert(data?.message || `请求失败 (${status})`);
      }
    } else if (error.code === 'ECONNABORTED') {
      alert('请求超时，请稍后重试');
    } else {
      alert('网络连接异常，请检查网络');
    }
    return Promise.reject(error);
  }
);

export default request;
