from flask import Flask, render_template, request, redirect
import telebot, json, os

app = Flask(__name__)

# Load environment variables
DEPOSIT_TOKEN = os.environ.get("DEPOSIT_TOKEN")
DEPOSIT_CHANNEL = os.environ.get("DEPOSIT_CHANNEL")

WITHDRAW_TOKEN = os.environ.get("WITHDRAW_TOKEN")
WITHDRAW_CHANNEL = os.environ.get("WITHDRAW_CHANNEL")

NEWUSER_TOKEN = os.environ.get("NEWUSER_TOKEN")
NEWUSER_CHANNEL = os.environ.get("NEWUSER_CHANNEL")

# Initialize bots
deposit_bot = telebot.TeleBot(DEPOSIT_TOKEN)
withdraw_bot = telebot.TeleBot(WITHDRAW_TOKEN)
newuser_bot = telebot.TeleBot(NEWUSER_TOKEN)

# Wallets
wallets = {
    "USDT": "TRC20/1234...",
    "BTC": "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
    "ETH": "0x1234567890abcdef1234567890abcdef12345678",
    "BUSD": "0xabcdef1234567890abcdef1234567890abcdef12"
}

# Load pending deposits
def load_deposits():
    try:
        with open("deposits.json", "r") as f:
            return json.load(f)
    except:
        return []

def save_deposits(data):
    with open("deposits.json", "w") as f:
        json.dump(data, f)

# Home Page
@app.route("/")
def home():
    return render_template("index.html", wallets=wallets)

# Deposit submission
@app.route("/deposit", methods=["POST"])
def deposit():
    user = request.form.get("username")
    wallet = request.form.get("wallet")
    amount = request.form.get("amount")
    txn = request.form.get("txn_id")
    screenshot = request.files.get("screenshot")
    
    # Save screenshot temporarily
    path = f"static/{screenshot.filename}"
    screenshot.save(path)
    
    # Save deposit request
    deposits = load_deposits()
    deposits.append({
        "user": user,
        "wallet": wallet,
        "amount": amount,
        "txn": txn,
        "screenshot": path,
        "status": "pending"
    })
    save_deposits(deposits)
    
    # Send to Deposit Telegram channel
    with open(path, "rb") as file:
        deposit_bot.send_photo(DEPOSIT_CHANNEL, file, caption=f"Deposit Request\nUser: {user}\nWallet: {wallet}\nAmount: {amount}\nTxnID: {txn}")
    
    return redirect("/?success=1")

# Withdraw button redirect
@app.route("/withdraw")
def withdraw():
    return render_template("withdraw.html", wallets=wallets)

# New user notification
@app.route("/newuser", methods=["POST"])
def new_user():
    user = request.form.get("username")
    newuser_bot.send_message(NEWUSER_CHANNEL, f"New User Joined: {user}")
    return redirect("/?success=1")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=3000, debug=True)
