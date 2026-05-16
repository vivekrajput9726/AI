from fastapi import APIRouter, Depends, HTTPException
from app.middleware.auth_middleware import get_current_user
from app.database.connection import get_db
from app.utils.helpers import serialize_doc, str_to_objectid
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class DocumentIn(BaseModel):
    policy_id: str
    doc_name: str
    doc_type: str = "Policy Document"   # Policy Document | ID Proof | Hospital Bill | Other
    doc_data: Optional[str] = ""        # base64 or URL

router = APIRouter()

# ── Insurance Policy ──────────────────────────────────────────────────────────
class PolicyIn(BaseModel):
    provider: str
    policy_number: str
    policy_type: str = "Health Insurance"  # Health | Life | Accident
    valid_from: Optional[str] = ""
    valid_till: Optional[str] = ""
    coverage_amount: Optional[float] = 0
    premium_amount: Optional[float] = 0
    nominee: Optional[str] = ""
    notes: Optional[str] = ""

@router.get("/policies", summary="Get my insurance policies")
async def get_policies(current_user: dict = Depends(get_current_user)):
    db = get_db()
    cursor = db.insurance_policies.find({"patient_id": current_user["id"]}).sort("created_at", -1)
    return [serialize_doc(p) async for p in cursor]

@router.post("/policies", summary="Add insurance policy")
async def add_policy(data: PolicyIn, current_user: dict = Depends(get_current_user)):
    db = get_db()
    doc = {**data.dict(), "patient_id": current_user["id"], "status": "active", "documents": [], "created_at": datetime.utcnow()}
    result = await db.insurance_policies.insert_one(doc)
    doc["_id"] = result.inserted_id
    return serialize_doc(doc)

@router.put("/policies/{policy_id}", summary="Update insurance policy")
async def update_policy(policy_id: str, data: PolicyIn, current_user: dict = Depends(get_current_user)):
    db = get_db()
    await db.insurance_policies.update_one(
        {"_id": str_to_objectid(policy_id), "patient_id": current_user["id"]},
        {"$set": {**data.dict(), "updated_at": datetime.utcnow()}}
    )
    return {"message": "Updated"}

@router.delete("/policies/{policy_id}", summary="Delete insurance policy")
async def delete_policy(policy_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    await db.insurance_policies.delete_one({"_id": str_to_objectid(policy_id), "patient_id": current_user["id"]})
    return {"message": "Deleted"}

# ── Documents ────────────────────────────────────────────────────────────────
@router.get("/documents/{policy_id}", summary="Get documents for a policy")
async def get_documents(policy_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    cursor = db.insurance_documents.find({"policy_id": policy_id, "patient_id": current_user["id"]}).sort("created_at", -1)
    return [serialize_doc(d) async for d in cursor]

@router.post("/documents", summary="Upload document for a policy")
async def upload_document(data: DocumentIn, current_user: dict = Depends(get_current_user)):
    db = get_db()
    policy = await db.insurance_policies.find_one({"_id": str_to_objectid(data.policy_id), "patient_id": current_user["id"]})
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    doc = {**data.dict(), "patient_id": current_user["id"], "created_at": datetime.utcnow()}
    result = await db.insurance_documents.insert_one(doc)
    doc["_id"] = result.inserted_id
    return serialize_doc(doc)

@router.delete("/documents/{doc_id}", summary="Delete document")
async def delete_document(doc_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    await db.insurance_documents.delete_one({"_id": str_to_objectid(doc_id), "patient_id": current_user["id"]})
    return {"message": "Deleted"}

# ── Claims ────────────────────────────────────────────────────────────────────
class ClaimIn(BaseModel):
    policy_id: str
    hospital_name: str
    treatment: str
    claim_date: str
    bill_amount: float
    claimed_amount: float
    document_url: Optional[str] = ""
    notes: Optional[str] = ""

@router.get("/claims", summary="Get my claims")
async def get_claims(current_user: dict = Depends(get_current_user)):
    db = get_db()
    cursor = db.insurance_claims.find({"patient_id": current_user["id"]}).sort("created_at", -1)
    return [serialize_doc(c) async for c in cursor]

@router.post("/claims", summary="Submit a claim")
async def submit_claim(data: ClaimIn, current_user: dict = Depends(get_current_user)):
    db = get_db()
    # Verify policy belongs to user
    policy = await db.insurance_policies.find_one({"_id": str_to_objectid(data.policy_id), "patient_id": current_user["id"]})
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    doc = {
        **data.dict(),
        "patient_id": current_user["id"],
        "status": "pending",   # pending | approved | rejected
        "created_at": datetime.utcnow()
    }
    result = await db.insurance_claims.insert_one(doc)
    doc["_id"] = result.inserted_id
    return serialize_doc(doc)

def _patient_id_query(patient_id: str) -> dict:
    """Build a query that matches patient_id stored as either string or ObjectId."""
    from bson import ObjectId as BsonObjectId
    candidates = [patient_id]
    try:
        candidates.append(BsonObjectId(patient_id))
    except Exception:
        pass
    return {"patient_id": {"$in": candidates}}


@router.get("/patient/{patient_id}/policies", summary="Get insurance policies of a patient (doctor access)")
async def get_patient_policies(patient_id: str, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") not in ["doctor", "admin"]:
        raise HTTPException(status_code=403, detail="Doctors only")
    db = get_db()

    # First try exact match (handles both string and ObjectId stored formats)
    query = _patient_id_query(patient_id)
    cursor = db.insurance_policies.find(query).sort("created_at", -1)
    results = [serialize_doc(p) async for p in cursor]

    # Fallback: look up by user email if the patient exists and results are empty
    if not results:
        try:
            user = await db.users.find_one({"_id": str_to_objectid(patient_id)})
            if user and user.get("email"):
                # Try matching by email-linked policies (edge case: policy stored under email key)
                alt_id = str(user["_id"])
                if alt_id != patient_id:
                    cursor2 = db.insurance_policies.find(_patient_id_query(alt_id)).sort("created_at", -1)
                    results = [serialize_doc(p) async for p in cursor2]
        except Exception:
            pass

    return results


@router.get("/patient/{patient_id}/claims", summary="Get insurance claims of a patient (doctor access)")
async def get_patient_claims(patient_id: str, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") not in ["doctor", "admin"]:
        raise HTTPException(status_code=403, detail="Doctors only")
    db = get_db()

    query = _patient_id_query(patient_id)
    cursor = db.insurance_claims.find(query).sort("created_at", -1)
    results = [serialize_doc(c) async for c in cursor]

    if not results:
        try:
            user = await db.users.find_one({"_id": str_to_objectid(patient_id)})
            if user:
                alt_id = str(user["_id"])
                if alt_id != patient_id:
                    cursor2 = db.insurance_claims.find(_patient_id_query(alt_id)).sort("created_at", -1)
                    results = [serialize_doc(c) async for c in cursor2]
        except Exception:
            pass

    return results


@router.get("/patient/{patient_id}/debug", summary="Debug: check what patient_id values exist in insurance_policies")
async def debug_patient_insurance(patient_id: str, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") not in ["doctor", "admin"]:
        raise HTTPException(status_code=403, detail="Doctors only")
    db = get_db()
    # Sample the first 5 docs to see what patient_id values are stored
    sample = await db.insurance_policies.find({}).limit(5).to_list(length=5)
    stored_ids = [str(doc.get("patient_id", "MISSING")) for doc in sample]
    return {
        "queried_patient_id": patient_id,
        "sample_stored_patient_ids": stored_ids,
        "match_found": patient_id in stored_ids,
    }


@router.patch("/claims/{claim_id}/status", summary="Update claim status")
async def update_claim_status(claim_id: str, status: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    if status not in ["pending", "approved", "rejected"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    await db.insurance_claims.update_one(
        {"_id": str_to_objectid(claim_id), "patient_id": current_user["id"]},
        {"$set": {"status": status, "updated_at": datetime.utcnow()}}
    )
    return {"message": "Status updated"}
