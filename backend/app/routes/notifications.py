from fastapi import APIRouter, Depends
from app.middleware.auth_middleware import get_current_user
from app.database.connection import get_db
from app.utils.helpers import str_to_objectid
from datetime import datetime

router = APIRouter()


@router.get("/", summary="Get real-time notifications for current user")
async def get_notifications(current_user: dict = Depends(get_current_user)):
    try:
        db = get_db()
        user_id = current_user["id"]
        role = current_user.get("role", "patient")
        notifications = []
        today = datetime.utcnow().strftime("%Y-%m-%d")

        def ts(doc):
            v = doc.get("created_at") or doc.get("updated_at")
            if isinstance(v, datetime):
                return v.isoformat()
            return str(v) if v else today

        if role == "patient":
            # ── Appointments ──
            apts = await db.appointments.find(
                {"patient_id": user_id, "status": {"$in": ["confirmed", "pending", "cancelled"]}}
            ).sort("created_at", -1).limit(10).to_list(10)

            for apt in apts:
                apt_id = str(apt["_id"])
                s = apt.get("status", "pending")
                dr = apt.get("doctor_name", "Doctor")
                apt_date = apt.get("appointment_date", today)
                apt_time = apt.get("appointment_time", "")
                if s == "confirmed":
                    notifications.append({
                        "id": f"apt-conf-{apt_id}", "type": "appointment_confirmed",
                        "title": "Appointment Confirmed",
                        "sub": f"Dr. {dr} · {apt_time or apt_date}",
                        "time": apt_date, "created_at": ts(apt),
                    })
                elif s == "pending":
                    notifications.append({
                        "id": f"apt-pend-{apt_id}", "type": "appointment_pending",
                        "title": "Appointment Awaiting Confirmation",
                        "sub": f"Dr. {dr} · {apt_date}",
                        "time": apt_date, "created_at": ts(apt),
                    })
                elif s == "cancelled":
                    notifications.append({
                        "id": f"apt-cancel-{apt_id}", "type": "appointment_cancelled",
                        "title": "Appointment Cancelled",
                        "sub": f"Dr. {dr} · {apt_date}",
                        "time": apt_date, "created_at": ts(apt),
                    })

            # ── Medicine reminders (active) ──
            try:
                meds = await db.medicines.find(
                    {"patient_id": user_id, "active": True}
                ).sort("created_at", -1).limit(5).to_list(5)
                for med in meds:
                    notifications.append({
                        "id": f"med-{med['_id']}", "type": "medicine_reminder",
                        "title": "Medicine Reminder",
                        "sub": f"{med.get('name', 'Medicine')} — {med.get('time', 'As prescribed')}",
                        "time": "Today", "created_at": ts(med),
                    })
            except Exception:
                pass

            # ── Recent health records ──
            try:
                records = await db.health_records.find(
                    {"patient_id": user_id}
                ).sort("created_at", -1).limit(3).to_list(3)
                for rec in records:
                    rtype = rec.get("record_type", "record").replace("_", " ").title()
                    notifications.append({
                        "id": f"rec-{rec['_id']}", "type": "health_record",
                        "title": f"Health Record Added: {rtype}",
                        "sub": rec.get("title", "View your health record"),
                        "time": rec.get("date", today), "created_at": ts(rec),
                    })
            except Exception:
                pass

            # ── Unread doctor messages ──
            try:
                apt_list = await db.appointments.find({"patient_id": user_id}).to_list(length=None)
                for apt in apt_list:
                    room_id = f"appointment_{str(apt['_id'])}"
                    last_dr = await db.chat_messages.find_one(
                        {"room_id": room_id, "sender_id": {"$ne": user_id}},
                        sort=[("timestamp", -1)]
                    )
                    if not last_dr:
                        continue
                    patient_reply = await db.chat_messages.find_one({
                        "room_id": room_id, "sender_id": user_id,
                        "timestamp": {"$gt": last_dr["timestamp"]},
                    })
                    if patient_reply is None:
                        notifications.append({
                            "id": f"chat-{room_id}", "type": "unread_message",
                            "title": "New Message from Doctor",
                            "sub": f"Dr. {apt.get('doctor_name', 'Doctor')}: {last_dr['message'][:50]}",
                            "time": str(last_dr.get("timestamp", today))[:10],
                            "created_at": str(last_dr.get("timestamp", today)),
                        })
            except Exception:
                pass

        elif role == "doctor":
            # Resolve the actual doctor profile _id (appointments use doctors._id, not users._id)
            actual_doctor_id = None
            try:
                doctor = await db.doctors.find_one({"user_id": user_id})
                if not doctor:
                    user_doc = await db.users.find_one({"_id": str_to_objectid(user_id)})
                    if user_doc and user_doc.get("email"):
                        doctor = await db.doctors.find_one({"email": user_doc["email"]})
                        if doctor:
                            await db.doctors.update_one(
                                {"_id": doctor["_id"]}, {"$set": {"user_id": user_id}}
                            )
                if doctor:
                    actual_doctor_id = str(doctor["_id"])
            except Exception:
                pass

            # ── Pending appointment requests ──
            if actual_doctor_id:
                try:
                    apts = await db.appointments.find(
                        {"doctor_id": actual_doctor_id, "status": "pending"}
                    ).sort("created_at", -1).limit(10).to_list(10)
                    for apt in apts:
                        apt_id = str(apt["_id"])
                        notifications.append({
                            "id": f"apt-new-{apt_id}", "type": "new_appointment",
                            "title": "New Appointment Request",
                            "sub": f"{apt.get('patient_name', 'Patient')} · {apt.get('appointment_date', today)}",
                            "time": apt.get("appointment_date", today),
                            "created_at": ts(apt),
                        })
                except Exception:
                    pass

            # ── Unread patient replies ──
            try:
                sent_rooms = await db.chat_messages.distinct("room_id", {"sender_id": user_id})
                for room_id in sent_rooms[:15]:
                    last_dr = await db.chat_messages.find_one(
                        {"room_id": room_id, "sender_id": user_id},
                        sort=[("timestamp", -1)]
                    )
                    last_pt = await db.chat_messages.find_one(
                        {"room_id": room_id, "sender_id": {"$ne": user_id}},
                        sort=[("timestamp", -1)]
                    )
                    if not last_pt or not last_dr:
                        continue
                    if str(last_pt["timestamp"]) <= str(last_dr["timestamp"]):
                        continue
                    patient_name = "Patient"
                    if room_id.startswith("appointment_"):
                        try:
                            apt = await db.appointments.find_one(
                                {"_id": str_to_objectid(room_id.replace("appointment_", ""))}
                            )
                            if apt:
                                patient_name = apt.get("patient_name", "Patient")
                        except Exception:
                            pass
                    notifications.append({
                        "id": f"chat-{room_id}", "type": "unread_message",
                        "title": f"Reply from {patient_name}",
                        "sub": str(last_pt["message"])[:60],
                        "time": str(last_pt.get("timestamp", today))[:10],
                        "created_at": str(last_pt.get("timestamp", today)),
                    })
            except Exception:
                pass

        notifications.sort(key=lambda n: n.get("created_at", ""), reverse=True)
        return notifications[:20]

    except Exception:
        return []
