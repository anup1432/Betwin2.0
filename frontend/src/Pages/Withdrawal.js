import { useState } from 'react';
import axios from 'axios';

export default function Withdraw() {
    const [form, setForm] = useState({ username:'', amount:'', wallet:'' });
    const [message, setMessage] = useState('');

    const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async e => {
        e.preventDefault();
        try {
            const res = await axios.post('http://localhost:5000/api/withdrawal', form);
            setMessage(res.data.message);
            setForm({ username:'', amount:'', wallet:'' });
        } catch (err) {
            setMessage(err.response?.data?.error || 'Error submitting withdrawal');
        }
    };

    return (
        <div className="max-w-md mx-auto bg-white p-6 rounded shadow">
            <h2 className="text-xl font-bold mb-4">Withdraw</h2>
            {message && <p className="mb-4">{message}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
                <input type="text" name="username" placeholder="Username" value={form.username} onChange={handleChange} className="w-full p-2 border rounded" required />
                <input type="number" name="amount" placeholder="Amount" value={form.amount} onChange={handleChange} className="w-full p-2 border rounded" required />
                <input type="text" name="wallet" placeholder="Wallet Address" value={form.wallet} onChange={handleChange} className="w-full p-2 border rounded" required />
                <button type="submit" className="w-full bg-green-600 text-white p-2 rounded">Submit</button>
            </form>
        </div>
    );
            }
