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
