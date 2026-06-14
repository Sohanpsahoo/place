from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class UserBase(BaseModel):
    name: str
    email: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int

    class Config:
        from_attributes = True

class GroupBase(BaseModel):
    name: str

class GroupCreate(GroupBase):
    pass

class Group(GroupBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class ExpenseSplitBase(BaseModel):
    user_id: int
    amount_owed: float

class ExpenseBase(BaseModel):
    paid_by_id: int
    amount: float
    currency: str = "INR"
    converted_amount_inr: float
    date: datetime
    description: str
    is_settlement: bool = False

class ExpenseCreate(ExpenseBase):
    splits: List[ExpenseSplitBase]

class ExpenseSplit(ExpenseSplitBase):
    id: int
    expense_id: int

    class Config:
        from_attributes = True

class Expense(ExpenseBase):
    id: int
    group_id: int
    splits: List[ExpenseSplit] = []

    class Config:
        from_attributes = True
