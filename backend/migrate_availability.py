"""
Migration: Convert all doctor availability from old {start_time, end_time} format
to new {slots: [...]} format, and ensure every doctor has at least one day set.

Run: python migrate_availability.py
"""
import asyncio
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGODB_URL   = os.getenv("MONGODB_URL",   "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "aihealthcare")

DEFAULT_AVAILABILITY = [
    {"day": "Monday",    "slots": ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"]},
    {"day": "Wednesday", "slots": ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"]},
    {"day": "Friday",    "slots": ["09:00", "10:00", "11:00", "14:00", "15:00"]},
]


def time_to_minutes(t: str) -> int:
    h, m = map(int, t.split(":"))
    return h * 60 + m


def generate_slots(start_time: str, end_time: str) -> list[str]:
    """Generate hourly slots from start_time up to (but not including) end_time."""
    start = time_to_minutes(start_time)
    end   = time_to_minutes(end_time)
    slots = []
    current = start
    while current < end:
        h = current // 60
        m = current % 60
        slots.append(f"{h:02d}:{m:02d}")
        current += 60
    return slots


def convert_availability(old_avail: list) -> list:
    """Convert old-format entries to new slot format, skipping already-converted ones."""
    new_avail = []
    for entry in old_avail:
        if "slots" in entry:
            # Already new format — keep as-is
            new_avail.append({"day": entry["day"], "slots": entry["slots"]})
        elif "start_time" in entry and "end_time" in entry:
            if not entry.get("is_available", True):
                continue  # skip days marked unavailable
            slots = generate_slots(entry["start_time"], entry["end_time"])
            if slots:
                new_avail.append({"day": entry["day"], "slots": slots})
    return new_avail


async def migrate():
    client = AsyncIOMotorClient(MONGODB_URL)
    db     = client[DATABASE_NAME]

    doctors = await db.doctors.find({}).to_list(length=None)
    print(f"Found {len(doctors)} doctors\n")

    updated = 0
    skipped = 0
    defaulted = 0

    for doc in doctors:
        name  = doc.get("name", "Unknown")
        old   = doc.get("availability", [])

        new_avail = convert_availability(old)

        # Enforce at least one day rule
        if not new_avail:
            new_avail = DEFAULT_AVAILABILITY
            defaulted += 1
            print(f"  [DEFAULT] {name} — had no valid availability, applied default schedule")

        # Check if anything actually changed
        already_new = all("slots" in e for e in old) and len(old) > 0
        if already_new and len(new_avail) == len(old):
            skipped += 1
            print(f"  [SKIP]    {name} — already in new format ({len(old)} days)")
            continue

        await db.doctors.update_one(
            {"_id": doc["_id"]},
            {"$set": {"availability": new_avail, "updated_at": datetime.utcnow()}}
        )
        updated += 1
        days = [e["day"] for e in new_avail]
        print(f"  [UPDATED] {name} — {len(new_avail)} days: {', '.join(days)}")

    print(f"\n{'='*50}")
    print(f"Migration complete:")
    print(f"  Updated  : {updated}")
    print(f"  Defaulted: {defaulted}")
    print(f"  Skipped  : {skipped}")
    client.close()


if __name__ == "__main__":
    asyncio.run(migrate())
