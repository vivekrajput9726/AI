from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from app.middleware.auth_middleware import get_current_user
from app.config.settings import settings
from app.database.connection import get_db
from app.utils.helpers import serialize_doc
from datetime import datetime
import hmac, hashlib

router = APIRouter()


class CreateOrderRequest(BaseModel):
    amount: float          # in INR (e.g. 500.0)
    currency: str = "INR"
    doctor_id: str = ""
    appointment_type: str = ""
    notes: dict = {}


class VerifyPaymentRequest(BaseModel):
    razorpay_order_id:   str
    razorpay_payment_id: str
    razorpay_signature:  str
    appointment_data:    dict = {}  # full appointment payload to book after payment


@router.get("/key")
async def get_razorpay_key(current_user: dict = Depends(get_current_user)):
    """Return the Razorpay public key to the frontend."""
    if not settings.RAZORPAY_KEY_ID:
        raise HTTPException(status_code=503, detail="Payment gateway not configured")
    return {"key_id": settings.RAZORPAY_KEY_ID}


@router.post("/create-order")
async def create_order(data: CreateOrderRequest, current_user: dict = Depends(get_current_user)):
    """Create a Razorpay order and return order_id to the frontend."""
    if not settings.RAZORPAY_KEY_ID or not settings.RAZORPAY_KEY_SECRET:
        raise HTTPException(status_code=503, detail="Payment gateway not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env")

    import razorpay
    client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))

    amount_paise = int(data.amount * 100)  # Razorpay needs amount in paise
    order = client.order.create({
        "amount":   amount_paise,
        "currency": data.currency,
        "receipt":  f"rcpt_{current_user['id'][:8]}_{int(datetime.utcnow().timestamp())}",
        "notes": {
            "patient_id":   current_user["id"],
            "patient_name": current_user.get("full_name", ""),
            "doctor_id":    data.doctor_id,
            **data.notes,
        }
    })

    # Persist pending payment record
    db = get_db()
    await db.payments.insert_one({
        "order_id":    order["id"],
        "patient_id":  current_user["id"],
        "amount":      data.amount,
        "currency":    data.currency,
        "status":      "pending",
        "doctor_id":   data.doctor_id,
        "created_at":  datetime.utcnow(),
    })

    return {
        "order_id":  order["id"],
        "amount":    amount_paise,
        "currency":  data.currency,
        "key_id":    settings.RAZORPAY_KEY_ID,
    }


@router.post("/verify")
async def verify_payment(data: VerifyPaymentRequest, current_user: dict = Depends(get_current_user)):
    """
    Verify Razorpay HMAC signature, mark payment as captured,
    then book the appointment automatically.
    """
    if not settings.RAZORPAY_KEY_SECRET:
        raise HTTPException(status_code=503, detail="Payment gateway not configured")

    # ── 1. Verify HMAC signature ──────────────────────────────────────────────
    expected = hmac.new(
        settings.RAZORPAY_KEY_SECRET.encode(),
        f"{data.razorpay_order_id}|{data.razorpay_payment_id}".encode(),
        hashlib.sha256,
    ).hexdigest()

    if not hmac.compare_digest(expected, data.razorpay_signature):
        raise HTTPException(status_code=400, detail="Payment verification failed — invalid signature")

    db = get_db()

    # ── 2. Mark payment as captured ──────────────────────────────────────────
    await db.payments.update_one(
        {"order_id": data.razorpay_order_id},
        {"$set": {
            "status":     "captured",
            "payment_id": data.razorpay_payment_id,
            "signature":  data.razorpay_signature,
            "captured_at": datetime.utcnow(),
        }}
    )

    # ── 3. Book the appointment ───────────────────────────────────────────────
    apt = data.appointment_data
    if apt:
        from app.services.appointment_service import create_appointment
        from app.schemas.appointment_schema import AppointmentCreateRequest
        try:
            req = AppointmentCreateRequest(**apt)
            appointment = await create_appointment(current_user, req)
            # Store payment_id on the appointment
            if appointment.get("id") or appointment.get("_id"):
                apt_id = appointment.get("id") or str(appointment.get("_id"))
                from app.utils.helpers import str_to_objectid
                await db.appointments.update_one(
                    {"_id": str_to_objectid(apt_id)},
                    {"$set": {"payment_id": data.razorpay_payment_id, "payment_status": "paid"}}
                )
            return {"success": True, "appointment": appointment, "payment_id": data.razorpay_payment_id}
        except Exception as e:
            return {"success": True, "payment_captured": True, "booking_error": str(e), "payment_id": data.razorpay_payment_id}

    return {"success": True, "payment_id": data.razorpay_payment_id}


@router.get("/history")
async def payment_history(current_user: dict = Depends(get_current_user)):
    """Patient's payment history."""
    db = get_db()
    cursor = db.payments.find({"patient_id": current_user["id"]}).sort("created_at", -1).limit(20)
    return [serialize_doc(p) async for p in cursor]
