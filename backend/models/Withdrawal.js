const mongoose = require('mongoose');

const withdrawalSchema = new mongoose.Schema({
    username: { type: String, required: true },
    amount: { type: Number, required: true },
    wallet: { type: String, required: true },
    status: { type: String, default: 'pending' }
}, { timestamps: true });

module.exports = mongoose.model('Withdrawal', withdrawalSchema);
