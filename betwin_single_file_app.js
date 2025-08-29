/* Single-file Betwin app (Node.js + Express)

How to use:

1. Create a new project folder and put this file betwin_single_file_app.js inside.


2. Create package.json (example below) or run npm init -y.


3. Install deps: npm install express mongoose multer dotenv (Node >=18 recommended)


4. Create a folder uploads (or the app will create it automatically).


5. Set environment variables (Render dashboard or local .env):

MONGODB_URI  (e.g. mongodb+srv://user:pass@cluster/...)

TELEGRAM_BOT_TOKEN (e.g. 123456:ABC-...)

TELEGRAM_CHAT_ID (channel or chat id, e.g. -1001234567890)

PORT (optional, default 3000)

ADMIN_PASS (optional admin password to view /admin)




Sample package.json (if needed): { "name": "betwin-single", "version": "1.0.0", "main": "betwin_single_file_app.js", "scripts": { "start": "node betwin_single_file_app.js" }, "dependencies": { "dotenv": "^16.0.0", "express": "^4.18.2", "mongoose": "^7.0.0", "multer": "^1.4.5" } }


---

This single file does:

Serves a professional-looking Deposit and Withdrawal UI (single page)

POST /api/deposit (multipart/form-data) -> saves to MongoDB, stores screenshot in /uploads, posts details to Telegram

POST /api/withdraw -> saves to MongoDB and posts details to Telegram

GET /admin?pass=YOUR_ADMIN_PASS -> shows recent deposits & withdrawals (basic HTML)


Note: set TELEGRAM_CHAT_ID to your channel/chat. For channels, the bot must be an admin of the channel.

*/

require('dotenv').config(); const express = require('express'); const mongoose = require('mongoose'); const multer = require('multer'); const fs = require('fs'); const path = require('path');

const app = express(); app.use(express.json());

// create uploads dir if not exists const UPLOAD_DIR = path.join(__dirname, 'uploads'); if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// multer setup const storage = multer.diskStorage({ destination: (req, file, cb) => cb(null, UPLOAD_DIR), filename: (req, file, cb) => { const ts = Date.now(); const safe = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_'); cb(null, ${ts}_${safe}); } }); const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB limit

// MongoDB models const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/betwin'; mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true }) .then(() => console.log('MongoDB connected')) .catch(err => console.error('MongoDB error:', err.message));

const Schema = mongoose.Schema; const DepositSchema = new Schema({ username: String, amount: Number, txnId: String, wallet: String, screenshotPath: String, status: { type: String, default: 'pending' }, createdAt: { type: Date, default: Date.now } }); const WithdrawSchema = new Schema({ username: String, amount: Number, walletAddress: String, status: { type: String, default: 'pending' }, createdAt: { type: Date, default: Date.now } });

const Deposit = mongoose.model('Deposit', DepositSchema); const Withdraw = mongoose.model('Withdraw', WithdrawSchema);

// telegram helper const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || ''; const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || ''; async function sendTelegramMessage(text) { if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return; // skip if not set try { const url = https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage; await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text, parse_mode: 'HTML' }) }); } catch (e) { console.error('Telegram send error', e.message); } }

// Serve frontend app.get('/', (req, res) => { res.setHeader('Content-Type', 'text/html'); res.send(`<!doctype html>

<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Betwin - Deposit & Withdrawal</title>
  <style>
    body{font-family:Inter, system-ui, -apple-system, sans-serif;background:#f3f6fb;margin:0;padding:40px}
    .card{max-width:1000px;margin:0 auto;background:white;border-radius:12px;box-shadow:0 6px 20px rgba(20,30,50,0.08);padding:24px}
    h1{margin:0 0 12px}
    .grid{display:grid;grid-template-columns:1fr 1fr;gap:20px}
    label{display:block;font-size:13px;margin-bottom:6px;color:#333}
    input,select,button{width:100%;padding:10px;border-radius:8px;border:1px solid #e2e8f0}
    .small{font-size:13px;color:#666;margin-top:6px}
    .btn{background:#0b5cff;color:white;border:none;padding:12px;border-radius:10px;cursor:pointer}
    .center{text-align:center}
    .status{margin-top:10px}
    @media(max-width:800px){.grid{grid-template-columns:1fr}}
  </style>
</head>
<body>
  <div class="card">
    <h1>Betwin — Deposit & Withdrawal</h1>
    <p class="small">Professional simple interface. Deposits go to MongoDB and a Telegram channel.</p><div class="grid">
  <div>
    <h3>Deposit</h3>
    <form id="depositForm">
      <label>Username<input name="username" required></label>
      <label>Amount<input name="amount" type="number" step="0.0001" required></label>
      <label>Transaction ID<input name="txnId" required></label>
      <label>Choose Wallet
        <select name="wallet" required>
          <option value="BTC">BTC</option>
          <option value="USDT">USDT</option>
          <option value="ETH">ETH</option>
          <option value="TRX">TRX</option>
        </select>
      </label>
      <label>Payment Screenshot (optional)<input name="screenshot" type="file" accept="image/*"></label>
      <button class="btn" type="submit">Submit Deposit</button>
      <div id="depStatus" class="status"></div>
    </form>
  </div>

  <div>
    <h3>Withdrawal</h3>
    <form id="withdrawForm">
      <label>Username<input name="username" required></label>
      <label>Wallet Address<input name="walletAddress" required></label>
      <label>Amount<input name="amount" type="number" step="0.0001" required></label>
      <button class="btn" type="submit">Submit Withdrawal</button>
      <div id="withStatus" class="status"></div>
    </form>

    <div style="margin-top:18px">
      <h4>Admin</h4>
      <p class="small">Open <code>/admin?pass=YOUR_ADMIN_PASS</code> to view recent requests.</p>
    </div>
  </div>
</div>

  </div><script>
  const depForm = document.getElementById('depositForm');
  const withForm = document.getElementById('withdrawForm');

  depForm.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const fd = new FormData(depForm);
    const status = document.getElementById('depStatus');
    status.textContent = 'Submitting...';
    try{
      const res = await fetch('/api/deposit', { method:'POST', body: fd });
      const data = await res.json();
      if (res.ok) { status.textContent = 'Deposit saved. ID: ' + data.id; depForm.reset(); }
      else status.textContent = 'Error: ' + (data.error || JSON.stringify(data));
    } catch(err){ status.textContent = 'Network error'; }
  });

  withForm.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const body = {
      username: withForm.username.value,
      walletAddress: withForm.walletAddress.value,
      amount: Number(withForm.amount.value)
    };
    const status = document.getElementById('withStatus');
    status.textContent = 'Submitting...';
    try{
      const res = await fetch('/api/withdraw', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
      const data = await res.json();
      if (res.ok) { status.textContent = 'Withdrawal saved. ID: ' + data.id; withForm.reset(); }
      else status.textContent = 'Error: ' + (data.error || JSON.stringify(data));
    } catch(err){ status.textContent = 'Network error'; }
  });
</script></body>
</html>`);
});// API: deposit app.post('/api/deposit', upload.single('screenshot'), async (req, res) => { try { const { username, amount, txnId, wallet } = req.body; if (!username || !amount || !txnId || !wallet) return res.status(400).json({ error: 'Missing fields' }); const screenshotPath = req.file ? /uploads/${path.basename(req.file.path)} : ''; const deposit = new Deposit({ username, amount: Number(amount), txnId, wallet, screenshotPath }); await deposit.save();

// send telegram message
const text = `<b>New Deposit</b>\nUsername: ${escapeHtml(username)}\nAmount: ${amount}\nWallet: ${escapeHtml(wallet)}\nTxnID: ${escapeHtml(txnId)}${screenshotPath ? '\nScreenshot: (on server)' : ''}`;
sendTelegramMessage(text);

res.json({ ok: true, id: deposit._id });

} catch (e) { console.error(e); res.status(500).json({ error: e.message }); } });

// API: withdraw app.post('/api/withdraw', async (req, res) => { try { const { username, walletAddress, amount } = req.body; if (!username || !walletAddress || !amount) return res.status(400).json({ error: 'Missing fields' }); const withdraw = new Withdraw({ username, walletAddress, amount: Number(amount) }); await withdraw.save();

const text = `<b>New Withdrawal</b>\nUsername: ${escapeHtml(username)}\nAmount: ${amount}\nTo: ${escapeHtml(walletAddress)}`;
sendTelegramMessage(text);

res.json({ ok: true, id: withdraw._id });

} catch (e) { console.error(e); res.status(500).json({ error: e.message }); } });

// serve uploads app.use('/uploads', express.static(UPLOAD_DIR));

// admin app.get('/admin', async (req, res) => { const pass = req.query.pass || ''; if (process.env.ADMIN_PASS && pass !== process.env.ADMIN_PASS) return res.status(401).send('Unauthorized'); const deposits = await Deposit.find().sort({ createdAt: -1 }).limit(50).lean(); const withdraws = await Withdraw.find().sort({ createdAt: -1 }).limit(50).lean(); res.setHeader('Content-Type', 'text/html'); res.send(<html><head><meta charset="utf-8"><title>Admin - Betwin</title><style>body{font-family:Inter,system-ui;padding:20px;background:#f7fafc}table{width:100%;border-collapse:collapse}th,td{padding:8px;border-bottom:1px solid #e2e8f0;text-align:left}</style></head><body><h2>Deposits</h2><table><tr><th>User</th><th>Amt</th><th>Wallet</th><th>Txn</th><th>Screenshot</th><th>At</th></tr>${deposits.map(d=><tr><td>${esc(d.username)}</td><td>${d.amount}</td><td>${esc(d.wallet)}</td><td>${esc(d.txnId)}</td><td>${d.screenshotPath?'<a href="'+d.screenshotPath+'" target="_blank">view</a>':''}</td><td>${new Date(d.createdAt).toLocaleString()}</td></tr>).join('')}</table><h2>Withdrawals</h2><table><tr><th>User</th><th>Amt</th><th>Address</th><th>At</th></tr>${withdraws.map(w=><tr><td>${esc(w.username)}</td><td>${w.amount}</td><td>${esc(w.walletAddress)}</td><td>${new Date(w.createdAt).toLocaleString()}</td></tr>).join('')}</table></body></html>); });

// helper small functions function escapeHtml(text){ if (!text) return ''; return String(text).replace(/&/g,'&').replace(/</g,'<').replace(/>/g,'>').replace(/"/g,'"'); } function esc(t){ return escapeHtml(t); }

// start const PORT = process.env.PORT || 3000; app.listen(PORT, ()=> console.log(Betwin single-file app running on port ${PORT}));

  
