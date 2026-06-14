from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
import shutil
import os

from ..database import get_db
from .. import models, schemas
from ..services.importer import process_csv

router = APIRouter()

@router.post("/import/{group_id}")
async def upload_csv(group_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    # Ensure group exists
    group = db.query(models.Group).filter(models.Group.id == group_id).first()
    if not group:
        # Auto-create group for hackathon convenience
        group = models.Group(id=group_id, name="Shared Flat")
        db.add(group)
        db.commit()

    # Save file temporarily
    file_location = f"temp_{file.filename}"
    with open(file_location, "wb+") as file_object:
        shutil.copyfileobj(file.file, file_object)

    try:
        result = process_csv(file_location, db, group_id)
        
        # Get anomalies
        anomalies = db.query(models.ImportAnomaly).filter(models.ImportAnomaly.filename == file_location).all()
        return {"message": result["message"], "report": result["report"], "anomalies": anomalies}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(file_location):
            os.remove(file_location)

@router.get("/balances/{group_id}")
def get_balances(group_id: int, db: Session = Depends(get_db)):
    """
    Calculate who owes whom.
    Simplified version: calculate net balance for each user.
    """
    users = db.query(models.User).all()
    balances = {u.id: {"name": u.name, "paid": 0.0, "owed": 0.0, "net": 0.0} for u in users}
    
    # Total paid by each user in this group
    expenses = db.query(models.Expense).filter(models.Expense.group_id == group_id).all()
    for exp in expenses:
        # If it's a settlement, the payer gave money to someone.
        # But wait, settlement logic in importer.py creates an ExpenseSplit where target owes payer.
        # Let's just use the splits.
        balances[exp.paid_by_id]["paid"] += exp.converted_amount_inr
        
        for split in exp.splits:
            balances[split.user_id]["owed"] += split.amount_owed

    for uid, bal in balances.items():
        bal["net"] = bal["paid"] - bal["owed"]
        # If net > 0, they are owed money. If net < 0, they owe money.
        
    return balances

@router.get("/expenses/{group_id}")
def get_expenses(group_id: int, db: Session = Depends(get_db)):
    return db.query(models.Expense).filter(models.Expense.group_id == group_id).order_by(models.Expense.date.desc()).all()

@router.get("/users")
def get_users(db: Session = Depends(get_db)):
    return db.query(models.User).all()
