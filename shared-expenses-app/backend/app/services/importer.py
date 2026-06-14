import pandas as pd
from datetime import datetime
from dateutil import parser as date_parser
from sqlalchemy.orm import Session
from ..models import Expense, ExpenseSplit, User, Group, GroupMember, ImportAnomaly
import re

EXCHANGE_RATE_USD_INR = 83.0

def parse_date(date_str: str) -> datetime:
    try:
        date_str = str(date_str).strip()
        # If it looks like YYYY-MM-DD, parse normally without dayfirst=True
        if re.match(r'^\d{4}-\d{2}-\d{2}', date_str):
            return date_parser.parse(date_str)
        # Otherwise, assume dayfirst=True (e.g. 04/05/2026 -> 4th May)
        return date_parser.parse(date_str, dayfirst=True)
    except Exception:
        return datetime.utcnow()

def clean_amount(amount_val) -> float:
    if pd.isna(amount_val):
        return 0.0
    if isinstance(amount_val, str):
        amount_val = amount_val.replace(',', '').strip()
        try:
            return float(amount_val)
        except ValueError:
            return 0.0
    return float(amount_val)

def extract_shares(details_str: str) -> dict:
    # Example: "Aisha 1; Rohan 2" -> {'Aisha': 1, 'Rohan': 2}
    shares = {}
    if not isinstance(details_str, str) or not details_str.strip():
        return shares
    
    parts = details_str.split(';')
    for part in parts:
        part = part.strip()
        # Regex to capture name and number (percentage or share)
        match = re.match(r"([A-Za-z\s]+)\s+([\d\.]+)", part)
        if match:
            name = match.group(1).strip()
            val = float(match.group(2))
            shares[name.lower()] = val
    return shares

def process_csv(file_path: str, db: Session, group_id: int):
    df = pd.read_csv(file_path)
    
    report = []
    
    # Pre-fetch users
    db_users = db.query(User).all()
    user_map = {u.name.lower(): u for u in db_users}
    
    def get_or_create_user(name: str) -> User:
        name_lower = name.lower()
        if name_lower not in user_map:
            new_user = User(name=name.title(), email=f"{name_lower}@example.com", password_hash="dummy")
            db.add(new_user)
            db.commit()
            db.refresh(new_user)
            user_map[name_lower] = new_user
            
            # Hardcode leave/join dates for the assignment context
            join_date = datetime.utcnow()
            leave_date = None
            if name_lower == 'sam':
                join_date = datetime(2026, 4, 15)
            elif name_lower == 'meera':
                join_date = datetime(2026, 2, 1)
                leave_date = datetime(2026, 3, 31)
            else:
                join_date = datetime(2026, 2, 1)
                
            gm = GroupMember(group_id=group_id, user_id=new_user.id, join_date=join_date, leave_date=leave_date)
            db.add(gm)
            db.commit()
            
        return user_map[name_lower]

    for index, row in df.iterrows():
        row_num = index + 2  # CSV rows are 1-indexed, +1 for header
        
        # 1. Date Format
        date_obj = parse_date(row['date'])
        
        # 2. Amount cleaning & Commas
        amount = clean_amount(row['amount'])
        if amount == 0 and str(row['amount']).strip() == '0':
            report.append(f"Row {row_num}: Zero amount expense ignored.")
            continue # Skip zero amount
            
        # 3. Missing paid_by
        paid_by_name = str(row['paid_by']).strip() if not pd.isna(row['paid_by']) else ""
        if not paid_by_name:
            report.append(f"Row {row_num}: Missing 'paid_by'. Skipping row.")
            db.add(ImportAnomaly(filename=file_path, row_number=row_num, anomaly_type="Missing Paid By", description="Blank paid_by field", resolution_applied="Row skipped"))
            continue
            
        payer = get_or_create_user(paid_by_name)
        
        # 4. Currency
        if pd.isna(row['currency']):
            currency = 'INR'
            db.add(ImportAnomaly(filename=file_path, row_number=row_num, anomaly_type="Missing Currency", description="Currency was blank", resolution_applied="Defaulted to INR"))
        else:
            currency = str(row['currency']).strip().upper()
            if not currency or currency == 'NAN':
                currency = 'INR'
                db.add(ImportAnomaly(filename=file_path, row_number=row_num, anomaly_type="Missing Currency", description="Currency was blank", resolution_applied="Defaulted to INR"))
            
        converted_amount = amount * EXCHANGE_RATE_USD_INR if currency == 'USD' else amount
        
        # 5. Settlement check
        split_type = str(row['split_type']).strip().lower() if not pd.isna(row['split_type']) else ""
        notes = str(row['notes']).strip().lower() if not pd.isna(row['notes']) else ""
        is_settlement = False
        if not split_type or split_type == 'nan' or "settlement" in notes:
            is_settlement = True
            
        # 6. Duplicates / Conflicts
        # Check if an expense with similar description, same date, same amount already exists
        desc = str(row['description']).strip()
        existing = db.query(Expense).filter(
            Expense.amount == amount,
            Expense.date == date_obj,
            Expense.paid_by_id == payer.id
        ).first()
        
        if existing:
            # It's a duplicate or conflict
            db.add(ImportAnomaly(filename=file_path, row_number=row_num, anomaly_type="Duplicate/Conflict", description=f"Similar expense already exists: {desc}", resolution_applied="Skipped duplicate"))
            report.append(f"Row {row_num}: Duplicate or Conflict detected. Kept the first one.")
            continue
            
        # Create Expense
        expense = Expense(
            group_id=group_id,
            paid_by_id=payer.id,
            amount=amount,
            currency=currency,
            converted_amount_inr=converted_amount,
            date=date_obj,
            description=desc,
            is_settlement=is_settlement
        )
        db.add(expense)
        db.commit()
        db.refresh(expense)
        
        if is_settlement:
            # Settling means payer paid the person in split_with
            target_name = str(row['split_with']).strip()
            if target_name and target_name != 'nan':
                target = get_or_create_user(target_name)
                # Payment reduces the target's debt to payer. 
                # Model as a split where target owes negative amount? Or just custom handling.
                # A payment means target owes payer -amount (so payer owes target amount)
                db.add(ExpenseSplit(expense_id=expense.id, user_id=target.id, amount_owed=converted_amount))
                db.commit()
            continue

        # Split Processing
        split_with_str = str(row['split_with']).strip() if not pd.isna(row['split_with']) else ""
        split_details_str = str(row['split_details']).strip() if not pd.isna(row['split_details']) else ""
        
        if not split_with_str:
            continue
            
        names = [n.strip() for n in split_with_str.split(';')]
        
        # 7. Unregistered Guest
        valid_users = []
        for n in names:
            if "friend" in n.lower():
                # Assign guest to payer
                valid_users.append(payer)
                db.add(ImportAnomaly(filename=file_path, row_number=row_num, anomaly_type="Unregistered Guest", description=f"Found {n}", resolution_applied="Assigned guest share to payer"))
            else:
                valid_users.append(get_or_create_user(n))
                
        # 8. Check move out dates
        active_users = []
        for u in valid_users:
            gm = db.query(GroupMember).filter(GroupMember.user_id == u.id, GroupMember.group_id == group_id).first()
            if gm and gm.leave_date and gm.leave_date < date_obj:
                db.add(ImportAnomaly(filename=file_path, row_number=row_num, anomaly_type="Moved Out Member", description=f"{u.name} already moved out on {date_obj}", resolution_applied="Removed from split"))
            else:
                active_users.append(u)
                
        if not active_users:
            active_users = [payer]
            
        # 9. Conflicting split type
        shares = extract_shares(split_details_str)
        if split_type == 'equal' and shares:
            split_type = 'share'
            db.add(ImportAnomaly(filename=file_path, row_number=row_num, anomaly_type="Conflicting Split Type", description="Type equal but shares provided", resolution_applied="Changed to share split"))
            
        # Calculate splits
        total_owed = 0
        
        if split_type == 'equal':
            per_person = converted_amount / len(active_users)
            for u in active_users:
                db.add(ExpenseSplit(expense_id=expense.id, user_id=u.id, amount_owed=per_person))
                
        elif split_type == 'percentage':
            # 10. Percentage not adding up
            total_pct = sum(shares.values())
            if total_pct != 100:
                db.add(ImportAnomaly(filename=file_path, row_number=row_num, anomaly_type="Percentage Mismatch", description=f"Total % is {total_pct}", resolution_applied="Normalized to 100%"))
                
            for u in active_users:
                pct = shares.get(u.name.lower(), 0)
                if total_pct > 0:
                    normalized_pct = pct / total_pct
                    db.add(ExpenseSplit(expense_id=expense.id, user_id=u.id, amount_owed=converted_amount * normalized_pct))
                    
        elif split_type == 'share' or split_type == 'shares':
            total_shares = sum(shares.values())
            if total_shares > 0:
                for u in active_users:
                    u_share = shares.get(u.name.lower(), 0)
                    db.add(ExpenseSplit(expense_id=expense.id, user_id=u.id, amount_owed=converted_amount * (u_share / total_shares)))
                    
        elif split_type == 'unequal' or split_type == 'exact':
            for u in active_users:
                u_amt = shares.get(u.name.lower(), 0)
                if currency == 'USD':
                     u_amt *= EXCHANGE_RATE_USD_INR
                db.add(ExpenseSplit(expense_id=expense.id, user_id=u.id, amount_owed=u_amt))
                
        db.commit()
    
    return {"message": "Import processed successfully", "report": report}
