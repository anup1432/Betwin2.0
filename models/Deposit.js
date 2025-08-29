const mongoose = require('mongoose');

const DepositSchema = new mongoose.Schema({
  username: { type: String, required: true },
  amount: { type: Number, required: true },
  txnId: { type: String, required: true },
  wallet: { type: String, required: true },
  screenshot: { type: String, required: true },
  status: { type: String, default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Deposit', DepositSchema);
