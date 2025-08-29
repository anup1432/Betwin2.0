const mongoose = require('mongoose');

const depositSchema = new mongoose.Schema({
    username: { type: String, required: true },
    amount: { type: Number, required: true },
    txn_id: { type: String, required: true },
    wallet: { type: String, required: true },
    screenshot_url: { type: String },
    status: { type: String, default: 'pending' }
}, { timestamps: true });

module.exports = mongoose.model('Deposit', depositSchema);
