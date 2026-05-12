import asyncio
from app.database.connection import connect_db, get_db
from bson import ObjectId

async def fix():
    await connect_db()
    db = get_db()

    # Get registered doctor _id
    doctor = await db.doctors.find_one({"user_id": "6a0306935da7320b66535f0a"})
    registered_id = str(doctor["_id"])
    print("Registered doctor _id:", registered_id)

    # Update ALL appointments to point to registered doctor
    result = await db.appointments.update_many(
        {},
        {"$set": {"doctor_id": registered_id, "doctor_name": "Dr. Sobha Jain"}}
    )
    print("Appointments updated:", result.modified_count)

    # Verify
    appointments = await db.appointments.find({}).to_list(length=20)
    print("All appointments now:")
    for a in appointments:
        print(" doctor_id:", a.get("doctor_id"), "| patient:", a.get("patient_name"), "| status:", a.get("status"))

asyncio.run(fix())
