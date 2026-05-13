from fastapi import APIRouter, Form, Response
from app.database.connection import get_db
from app.utils.sms_utils import send_sms
from app.config.settings import settings
from loguru import logger
from datetime import datetime

router = APIRouter()


def twiml_response(message: str) -> Response:
    xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response><Message>{message}</Message></Response>"""
    return Response(content=xml, media_type="application/xml")


@router.post("/webhook", summary="Twilio WhatsApp/SMS webhook")
async def whatsapp_webhook(
    Body: str = Form(default=""),
    From: str = Form(default=""),
    To: str = Form(default=""),
):
    msg = Body.strip().lower()
    logger.info(f"WhatsApp message from {From}: {Body}")

    db = get_db()

    # Help menu
    if any(w in msg for w in ["hi", "hello", "help", "start", "menu"]):
        return twiml_response(
            "👋 Welcome to AI Healthcare!\n\n"
            "Reply with:\n"
            "1️⃣ *appointments* — View your appointments\n"
            "2️⃣ *book* — How to book an appointment\n"
            "3️⃣ *cancel* — Cancel an appointment\n"
            "4️⃣ *help* — Show this menu"
        )

    # View appointments
    if "appointment" in msg or msg.strip() == "1":
        phone = From.replace("whatsapp:", "").replace("+", "").strip()
        user = await db.users.find_one({"phone": {"$regex": phone[-10:]}})
        if not user:
            return twiml_response("❌ No account found for this number. Please register at our app first.")
        from app.utils.helpers import serialize_doc
        cursor = db.appointments.find({"patient_id": str(user["_id"])}).sort("appointment_date", -1).limit(3)
        apts = [serialize_doc(a) async for a in cursor]
        if not apts:
            return twiml_response("📅 You have no appointments yet.\nVisit our app to book one!")
        lines = ["📋 *Your Recent Appointments:*\n"]
        for a in apts:
            lines.append(f"👨‍⚕️ {a['doctor_name']}\n📅 {a['appointment_date']} at {a['appointment_time']}\nStatus: {a['status'].upper()}\n")
        return twiml_response("\n".join(lines))

    # Book guidance
    if "book" in msg or msg.strip() == "2":
        return twiml_response(
            "📱 To book an appointment:\n\n"
            "1. Open the AI Healthcare app\n"
            "2. Go to *Find Doctors*\n"
            "3. Select a doctor and tap *Book Now*\n"
            "4. Choose your date, time & consultation type\n"
            "5. Complete payment\n\n"
            "You'll receive a confirmation SMS once booked! ✅"
        )

    # Cancel guidance
    if "cancel" in msg or msg.strip() == "3":
        return twiml_response(
            "❌ To cancel an appointment:\n\n"
            "1. Open the AI Healthcare app\n"
            "2. Go to your Dashboard\n"
            "3. Find the appointment and tap *Cancel*\n\n"
            "Need help? Reply *help* for menu."
        )

    # Default fallback
    return twiml_response(
        "🤖 I didn't understand that.\nReply *help* to see what I can do for you!"
    )
