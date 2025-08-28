import os, requests
from datetime import datetime
from flask import Flask, render_template, request, redirect, url_for
from pymongo import MongoClient
from bson.objectid import ObjectId

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 10 * 1024 * 1024  # 10MB uploads

# --- ENV VARS (Render dashboard me set karna) ---
MONGO_URL   = os.environ.get("MONGO_URL")         # e.g. mongodb+srv://user:pass@cluster/db?...
BOT_TOKEN   = os.environ.get("BOT_TOKEN")         # Telegram bot token
CHANNEL_ID  = os.environ.get("CHANNEL_ID")        # e.g. -1003048722871 OR @your_channel
PUBLIC_URL  = os.environ.get("PUBLIC_URL")        # e.g. https://betwin2-0.onrender.com

# --- Mongo ---
mongo = MongoClient(MONGO_URL)
db = mongo["betwin"]
col_deposits = db["deposits"]
col_withdraws = db["withdraws"]

# --- Telegram helpers ---
TG_BASE = f"https://api.telegram.org/bot{BOT_TOKEN}"

def tg_send_message(chat_id, text, reply_markup=None):
    data = {"chat_id": chat_id, "text": text, "parse_mode": "HTML"}
    if reply_markup:
        data["reply_markup"] = reply_markup
    return requests.post(f"{TG_BASE}/sendMessage", json=data, timeout=20)

def tg_edit_message(chat_id, message_id, text, reply_markup=None):
    data = {"chat_id": chat_id, "message_id": message_id, "text": text, "parse_mode": "HTML"}
    if reply_markup is not None:
        data["reply_markup"] = reply_markup
    return requests.post(f"{TG_BASE}/editMessageText", json=data, timeout=20)

def tg_send_photo(chat_id, caption, fileobj=None, reply_markup=None):
    url = f"{TG_BASE}/sendPhoto"
    data = {"chat_id": chat_id, "caption": caption, "parse_mode": "HTML"}
    if reply_markup:
        data["reply_markup"] = reply_markup
    files = {"photo": fileobj} if fileobj else None
    return requests.post(url, data=data, files=files, timeout=60)

def admin_keyboard(prefix, oid):
    # callback_data format: <TYPE>|<OID>|<ACTION>
    return {
        "inline_keyboard": [[
            {"text": "✅ Approve", "callback_data": f"{prefix}|{oid}|APPROVE"},
            {"text": "❌ Reject",  "callback_data": f"{prefix}|{oid}|REJECT"},
        ]]
    }

# --- Pages ---
@app.route("/")
def home():
    return render_template("index.html")

@app.route("/deposit", methods=["GET", "POST"])
def deposit():
    if request.method == "POST":
        username = request.form.get("username", "").strip()
        wallet   = request.form.get("wallet", "").strip()
        amount   = float(request.form.get("amount", "0") or 0)
        txn_id   = request.form.get("txn_id", "").strip()
        shot     = request.files.get("screenshot")

        doc = {
            "type": "deposit",
            "username": username,
            "wallet": wallet,
            "amount": amount,
            "txn_id": txn_id,
            "status": "pending",
            "created_at": datetime.utcnow()
        }
        _id = col_deposits.insert_one(doc).inserted_id
        oid = str(_id)

        caption = (
            f"📥 <b>Deposit Request</b>\n"
            f"👤 <b>Username:</b> {username}\n"
            f"💳 <b>Wallet:</b> {wallet}\n"
            f"💵 <b>Amount:</b> ${amount}\n"
            f"🆔 <b>Txn ID:</b> {txn_id}\n"
            f"🗂 <b>ID:</b> {oid}\n"
            f"⏳ <i>Status:</i> pending"
        )

        kb = admin_keyboard("DEP", oid)

        if shot and shot.filename:
            tg_send_photo(CHANNEL_ID, caption, fileobj=shot.stream, reply_markup=kb)
        else:
            tg_send_message(CHANNEL_ID, caption, reply_markup=kb)

        return redirect(url_for("home"))
    return render_template("deposit.html")

@app.route("/withdraw", methods=["GET", "POST"])
def withdraw():
    if request.method == "POST":
        username = request.form.get("username", "").strip()
        wallet   = request.form.get("wallet", "").strip()
        amount   = float(request.form.get("amount", "0") or 0)

        doc = {
            "type": "withdraw",
            "username": username,
            "wallet": wallet,
            "amount": amount,
            "status": "pending",
            "created_at": datetime.utcnow()
        }
        _id = col_withdraws.insert_one(doc).inserted_id
        oid = str(_id)

        text = (
            f"📤 <b>Withdraw Request</b>\n"
            f"👤 <b>Username:</b> {username}\n"
            f"💳 <b>Wallet:</b> {wallet}\n"
            f"💵 <b>Amount:</b> ${amount}\n"
            f"🗂 <b>ID:</b> {oid}\n"
            f"⏳ <i>Status:</i> pending"
        )
        kb = admin_keyboard("WDR", oid)
        tg_send_message(CHANNEL_ID, text, reply_markup=kb)

        return redirect(url_for("home"))
    return render_template("withdraw.html")

# --- Telegram webhook (inline Approve/Reject) ---
@app.route("/telegram/webhook", methods=["POST"])
def telegram_webhook():
    upd = request.get_json(silent=True) or {}
    cb  = upd.get("callback_query")
    if not cb:
        return {"ok": True}

    data = cb.get("data", "")
    msg  = cb.get("message") or {}
    message_id = msg.get("message_id")
    chat_id    = msg.get("chat", {}).get("id")

    try:
        kind, oid, action = data.split("|")
        action = action.upper()
    except Exception:
        return {"ok": True}

    status = "approved" if action == "APPROVE" else "rejected"

    if kind == "DEP":
        col = col_deposits
        header = "📥 <b>Deposit Request</b>"
    else:
        col = col_withdraws
        header = "📤 <b>Withdraw Request</b>"

    doc = col.find_one({"_id": ObjectId(oid)})
    if not doc:
        # show not found
        tg_edit_message(chat_id, message_id, f"{header}\n\n❗ Request not found (ID {oid}).")
        return {"ok": True}

    # Update DB
    col.update_one({"_id": ObjectId(oid)}, {"$set": {"status": status, "updated_at": datetime.utcnow()}})

    # Re-compose message (no buttons after action)
    if doc["type"] == "deposit":
        text = (
            f"{header}\n"
            f"👤 <b>Username:</b> {doc.get('username')}\n"
            f"💳 <b>Wallet:</b> {doc.get('wallet')}\n"
            f"💵 <b>Amount:</b> ${doc.get('amount')}\n"
            f"🆔 <b>Txn ID:</b> {doc.get('txn_id')}\n"
            f"🗂 <b>ID:</b> {oid}\n"
            f"🟢 <b>Status:</b> {status}"
        )
    else:
        text = (
            f"{header}\n"
            f"👤 <b>Username:</b> {doc.get('username')}\n"
            f"💳 <b>Wallet:</b> {doc.get('wallet')}\n"
            f"💵 <b>Amount:</b> ${doc.get('amount')}\n"
            f"🗂 <b>ID:</b> {oid}\n"
            f"🟢 <b>Status:</b> {status}"
        )

    tg_edit_message(chat_id, message_id, text)  # remove keyboard by not passing reply_markup
    return {"ok": True}

@app.route("/healthz")
def health():
    return "ok", 200

if __name__ == "__main__":
    port = int(os.environ.get("PORT", "5000"))
    app.run(host="0.0.0.0", port=port)
