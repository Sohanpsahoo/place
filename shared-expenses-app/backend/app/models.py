from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from .database import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)

class Group(Base):
    __tablename__ = "groups"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    members = relationship("GroupMember", back_populates="group")
    expenses = relationship("Expense", back_populates="group")

class GroupMember(Base):
    __tablename__ = "group_members"

    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey("groups.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    join_date = Column(DateTime, default=datetime.utcnow)
    leave_date = Column(DateTime, nullable=True)

    group = relationship("Group", back_populates="members")
    user = relationship("User")

class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey("groups.id"))
    paid_by_id = Column(Integer, ForeignKey("users.id"))
    amount = Column(Float)
    currency = Column(String, default="INR")
    converted_amount_inr = Column(Float)
    date = Column(DateTime, default=datetime.utcnow)
    description = Column(String)
    is_settlement = Column(Boolean, default=False)

    group = relationship("Group", back_populates="expenses")
    paid_by = relationship("User")
    splits = relationship("ExpenseSplit", back_populates="expense", cascade="all, delete-orphan")

class ExpenseSplit(Base):
    __tablename__ = "expense_splits"

    id = Column(Integer, primary_key=True, index=True)
    expense_id = Column(Integer, ForeignKey("expenses.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    amount_owed = Column(Float)

    expense = relationship("Expense", back_populates="splits")
    user = relationship("User")

class ImportAnomaly(Base):
    __tablename__ = "import_anomalies"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String)
    row_number = Column(Integer)
    anomaly_type = Column(String)
    description = Column(String)
    resolution_applied = Column(String)
    user_approved = Column(Boolean, default=False)
