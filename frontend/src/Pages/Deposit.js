import { useState } from 'react';
import axios from 'axios';

export default function Deposit() {
    const [form, setForm] = useState({ username:'', amount:'', txn_id:'', wallet:'', screenshot_url:'' });
    const [message, setMessage] = useState('');

    const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async e => {
        e.preventDefault();
        try {
            const res = await axios.post('http://localhost:5000/api/deposit', form);
            setMessage(res.data.message);
            setForm({ username:'', amount:'', txn_id:'', wallet:'', screenshot_url:'' });
        } catch (err) {
            setMessage(err.response?.data?.error || 'Error submitting deposit');
        }
    };

    return (
        <div className="max-w-md mx-auto bg-white p-6 rounded shadow">
            <h2 className="text-xl font-bold mb-4">Deposit</h2>
            {message && <p className="mb-4">{message}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
                <input type="text" name="username" placeholder="Username" value={form.username} onChange={handleChange} className="w-full p-2 border rounded" required />
                <input type="number" name="amount" placeholder="Amount" value={form.amount} onChange={handleChange} className="w-full p-2 border rounded" required />
                <input type="text" name="txn_id" placeholder="Transaction ID" value={form.txn_id} onChange={handleChange} className="w-full p-2 border rounded" required />
                <select name="wallet" value={form.wallet} onChange={handleChange} className="w-full p-2 border rounded" required>
                    <option value="">Select Wallet</option>
                    <option value="BTC">BTC</option>
                    <option value="ETH">ETH</option>
                    <option value="USDT">USDT</option>
                    <option value="BNB">BNB</option>
                </select>
                <input type="text" name="screenshot_url" placeholder="Screenshot URL" value={form.screenshot_url} onChange={handleChange} className="w-full p-2 border rounded" required />
                <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded">Submit</button>
            </form>
        </div>
    );
              }
