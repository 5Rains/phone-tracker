// Toggle-based app tracker
// GET /api/log/toggle/微信 → 自动记录打开/关闭

const apps = {};

function cleanOld(appData) {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  appData.sessions = (appData.sessions || []).filter(s => s.end && s.end > cutoff || !s.end && s.start > cutoff);
}

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const path = req.url.split('?')[0];
  const parts = path.split('/').filter(Boolean);

  // GET /api/log/toggle/APP名
  if (req.method === 'GET' && parts[1] === 'toggle' && parts[2]) {
    const app = decodeURIComponent(parts[2]);
    if (!apps[app]) apps[app] = { sessions: [], state: 'closed' };
    const appData = apps[app];
    cleanOld(appData);

    const now = Date.now();
    if (appData.state === 'closed') {
      // 打开APP
      appData.state = 'open';
      appData.sessions.push({ start: now, end: null });
      return res.status(200).json({ app, action: 'opened', time: new Date(now).toISOString() });
    } else {
      // 关闭APP
      appData.state = 'closed';
      const last = appData.sessions[appData.sessions.length - 1];
      if (last && !last.end) {
        last.end = now;
        last.duration = Math.round((now - last.start) / 1000 / 60); // 分钟
      }
      return res.status(200).json({ app, action: 'closed', duration: last?.duration + '分钟', time: new Date(now).toISOString() });
    }
  }

  // GET /api/log/report → 查看今天使用情况
  if (req.method === 'GET' && parts[1] === 'report') {
    const report = {};
    for (const [app, data] of Object.entries(apps)) {
      cleanOld(data);
      const totalMin = data.sessions.reduce((sum, s) => {
        if (s.end) return sum + (s.duration || 0);
        // 正在使用中
        return sum + Math.round((Date.now() - s.start) / 1000 / 60);
      }, 0);
      report[app] = {
        total: totalMin + '分钟',
        sessions: data.sessions.length,
        state: data.state
      };
    }
    return res.status(200).json({ report, generated: new Date().toISOString() });
  }

  return res.status(404).json({ error: '未知路径' });
}
