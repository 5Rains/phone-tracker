// Vercel Serverless Function
// 接收手机上传的使用记录并存储

let logs = [];

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const secret = req.headers['authorization'];
 if (secret !== 'Bearer xiaoyu2024') {

    return res.status(401).json({ error: '未授权' });
  }

  if (req.method === 'POST') {
    const data = req.body;
    const entry = {
      timestamp: new Date().toISOString(),
      ...data
    };
    logs.push(entry);
    if (logs.length > 100) logs = logs.slice(-100);
    return res.status(200).json({ success: true, message: '记录成功' });
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      total: logs.length,
      logs: logs.slice(-20)
    });
  }

  return res.status(405).json({ error: '方法不允许' });
}
