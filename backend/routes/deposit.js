const express = require('express');
const router = express.Router();
const Deposit = require('../models/Deposit');
const axios = require('axios');

router.post('/', async (req, res) => {
    try {
        const { username, amount, txn_id, wallet, screenshot_url } = req.body;
        const deposit = new Deposit({ username, amount, txn_id, wallet, screenshot_url });
        await deposit.save();

        // Send message to Telegram
        const message = `New Deposit:\nUsername: ${username}\nAmount: ${amount}\nTxn ID: ${txn_id}\nWallet: ${wallet}`;
        await axios.post(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`, {
            chat_id: process.env.CHANNEL_ID,
            text: message
        });

        res.status(201).json({ success: true, message: 'Deposit submitted!' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
