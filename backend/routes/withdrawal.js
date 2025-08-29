const express = require('express');
const router = express.Router();
const Withdrawal = require('../models/Withdrawal');
const axios = require('axios');

router.post('/', async (req, res) => {
    try {
        const { username, amount, wallet } = req.body;
        const withdrawal = new Withdrawal({ username, amount, wallet });
        await withdrawal.save();

        // Send message to Telegram
        const message = `New Withdrawal Request:\nUsername: ${username}\nAmount: ${amount}\nWallet: ${wallet}`;
        await axios.post(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`, {
            chat_id: process.env.CHANNEL_ID,
            text: message
        });

        res.status(201).json({ success: true, message: 'Withdrawal request submitted!' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
