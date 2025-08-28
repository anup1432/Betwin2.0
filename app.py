from flask import Flask, render_template, request
import requests, os
from pymongo import MongoClient
from datetime import datetime

app = Flask(__name__)

# 🔹 Telegram setup
BOT_TOKEN = "YOUR_BOT_TOKEN"
CHANNEL_ID = "@YOUR_CHANNEL_USERNAME_OR_ID"

def send_to_telegram(message):
    url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
    data = {"chat_id": CHANNEL_ID, "text": message, "parse_mode": "HTML"}
    requests.post(url, data=data)

# 🔹 MongoDB setup (tu apna MongoDB Atlas URL dal)
MONGO_URL = os.environ.get("MONGO_URL", "YOUR_MONGO_ATLAS_URL")
client = MongoClient(MONGO_URL)
db = client["betwin_db"]
deposits = db["deposits"]
withdrawals = db["withdrawals"]

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/deposit", methods=["GET", "POST"])
def deposit():
    if request.method == "POST":
        user_id = request.form["user_id"]
        amount = request.form["amount"]
        screenshot = request.form["screenshot"]

        # Save to DB
        deposit_data = {
            "user_id": user_id,
            "amount": amount,
            "screenshot": screenshot,
            "status": "pending",
            "timestamp": datetime.utcnow()
        }
        deposits.insert_one(deposit_data)

        # Send to Telegram
        message = f"💰 <b>New Deposit Request</b>\n\n👤 User: {user_id}\n💵 Amount: ${amount}\n🖼 Screenshot: {screenshot}\n⏳ Status: Pending"
        send_to_telegram(message)

        return "✅ Deposit request sent!"
    return render_template("deposit.html")

@app.route("/withdraw", methods=["GET", "POST"])
def withdraw():
    if request.method == "POST":
        user_id = request.form["user_id"]
        amount = request.form["amount"]
        wallet = request.form["wallet"]

        # Save to DB
        withdraw_data = {
            "user_id": user_id,
            "amount": amount,
            "wallet": wallet,
            "status": "pending",
            "timestamp": datetime.utcnow()
        }
        withdrawals.insert_one(withdraw_data)

        # Send to Telegram
        message = f"🏧 <b>New Withdraw Request</b>\n\n👤 User: {user_id}\n💵 Amount: ${amount}\n💳 Wallet: {wallet}\n⏳ Status: Pending"
        send_to_telegram(message)

        return "✅ Withdraw request sent!"
    return render_template("withdraw.html")

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
