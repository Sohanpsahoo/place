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

@router.get("/expenses/{group_id}", response_model=List[schemas.Expense])
def get_expenses(group_id: int, db: Session = Depends(get_db)):
    return db.query(models.Expense).filter(models.Expense.group_id == group_id).order_by(models.Expense.date.desc()).all()

@router.post("/expenses")
def create_expense(expense: schemas.ExpenseCreate, db: Session = Depends(get_db)):
    # Create the expense
    new_expense = models.Expense(
        group_id=1, # Defaulting to 1 for hackathon scope if not provided
        paid_by_id=expense.paid_by_id,
        amount=expense.amount,
        currency=expense.currency,
        converted_amount_inr=expense.converted_amount_inr,
        date=expense.date,
        description=expense.description,
        is_settlement=expense.is_settlement
    )
    db.add(new_expense)
    db.commit()
    db.refresh(new_expense)
    
    # Create the splits
    for split in expense.splits:
        new_split = models.ExpenseSplit(
            expense_id=new_expense.id,
            user_id=split.user_id,
            amount_owed=split.amount_owed
        )
        db.add(new_split)
    db.commit()
    
    return {"message": "Expense created successfully", "id": new_expense.id}

@router.post("/settle")
def create_settlement(payer_id: int, payee_id: int, amount: float, db: Session = Depends(get_db)):
    import datetime
    new_expense = models.Expense(
        group_id=1,
        paid_by_id=payer_id,
        amount=amount,
        currency="INR",
        converted_amount_inr=amount,
        date=datetime.datetime.utcnow(),
        description=f"Settlement payment",
        is_settlement=True
    )
    db.add(new_expense)
    db.commit()
    db.refresh(new_expense)
    
    # Target owes negative amount (reduces target debt)
    db.add(models.ExpenseSplit(expense_id=new_expense.id, user_id=payee_id, amount_owed=amount))
    db.commit()
    return {"message": "Settlement recorded successfully"}

@router.get("/users")
def get_users(db: Session = Depends(get_db)):
    return db.query(models.User).all()

@router.post("/users")
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    new_user = models.User(name=user.name, email=user.email, password_hash=user.password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user
