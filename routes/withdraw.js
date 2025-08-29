const express = require('express');
const router = express.Router();
const Withdraw = require('../models/Withdraw');
const TelegramBot = require('node-telegram-bot-api');

const bot = new TelegramBot(process.env.BOT_TOKEN);
const chatId = process.env.CHAT_ID;

// Withdraw route
router.post('/', async (req, res) => {
  try {
    const { username, wallet, amount } = req.body;

    const newWithdraw = new Withdraw({ username, wallet, amount });
    await newWithdraw.save();

    // Send to Telegram
    let message = `📤 *New Withdrawal*\nUsername: ${username}\nAmount: ${amount}\nWallet: ${wallet}`;
    bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });

    res.status(201).json({ success: true, message: "Withdrawal request submitted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

module.exports = router;
