import asyncio
from app.database.connection import connect_db, get_db
from bson import ObjectId

async def fix():
    await connect_db()
    db = get_db()

    # Deactivate the seeded Shobha Jain (no user_id)
    result = await db.doctors.update_one(
        {"_id": ObjectId("6a02f28c992f9ae8656b2dcf")},
        {"$set": {"is_active": False}}
    )
    print("Deactivated seeded Shobha Jain:", result.modified_count)

    # Confirm registered doctor is active
    doctor = await db.doctors.find_one({"user_id": "6a0306935da7320b66535f0a"})
    print("Registered doctor:", doctor.get("name"), "| _id:", doctor["_id"], "| active:", doctor.get("is_active"))

asyncio.run(fix())
