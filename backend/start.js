const { spawn } = require('child_process');

async function startServer() {
  console.log('=== 酒店ERP系统启动 ===');
  
  // 等待数据库连接就绪
  console.log('等待数据库连接...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // 初始化数据库表
  console.log('初始化数据库表...');
  try {
    const initResult = await runScript('init-db.js');
    if (initResult !== 0) {
      console.warn('数据库表初始化有警告，继续启动...');
    }
  } catch (err) {
    console.warn('数据库表初始化失败:', err.message);
  }
  
  // 插入种子数据
  console.log('插入种子数据...');
  try {
    const seedResult = await runScript('seed.js');
    if (seedResult !== 0) {
      console.warn('种子数据插入有警告，继续启动...');
    }
  } catch (err) {
    console.warn('种子数据插入失败:', err.message);
  }
  
  // 启动服务器
  console.log('启动后端服务...');
  const server = spawn('node', ['server.js'], { stdio: 'inherit' });
  
  server.on('close', (code) => {
    console.log(`服务器退出，退出码: ${code}`);
    process.exit(code);
  });
}

function runScript(scriptPath) {
  return new Promise((resolve, reject) => {
    const child = spawn('node', [scriptPath], { stdio: 'inherit' });
    child.on('close', resolve);
    child.on('error', reject);
  });
}

startServer().catch(err => {
  console.error('启动失败:', err);
  process.exit(1);
});
