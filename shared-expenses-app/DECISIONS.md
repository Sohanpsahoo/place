# Decision Log

This document records the significant technical and product decisions made during the development of FairSplit.

## 1. Backend Framework
**Decision**: Use Python and FastAPI instead of Node.js.
**Options Considered**: Node.js/Express, Python/FastAPI, Python/Django.
**Rationale**: The prompt explicitly requested "use python at processing and make it scaleable million dollor app". FastAPI provides async support, high performance (Pydantic validation), and an excellent foundation for scalable microservices.

## 2. Database
**Decision**: SQLite via SQLAlchemy ORM.
**Options Considered**: PostgreSQL, MySQL, SQLite.
**Rationale**: The requirement was "Use relational DBs only". While PostgreSQL is the target for a "million dollar app", SQLite is used for the initial 2-day hackathon delivery to ensure the evaluator can run the app locally without setting up a database server. Using SQLAlchemy means switching to PostgreSQL in production requires exactly one line of code change (the connection string).

## 3. Anomaly Resolution Automation
**Decision**: The app attempts to auto-resolve anomalies with a defined policy, rather than blocking the import.
**Options Considered**: 
1. Block import entirely upon detecting any error.
2. Silently ignore errors.
3. Apply a smart policy, import the data, and generate a report for the user to review.
**Rationale**: Blocking the import on 12 errors would cause immense user frustration. Silently ignoring them fails the assignment criteria. We chose option 3: the system applies best-effort policies (e.g., defaulting missing currency to INR, converting percentages to 100%) and flags them in the UI. Meera requested to "approve anything the app deletes or changes," so the UI marks anomalies as unapproved until the user clicks "Approve".

## 4. Modeling Settlements
**Decision**: Treat settlements as a negative balance transfer rather than a split expense.
**Options Considered**: 
1. Model them exactly like an expense where one person owes 100%.
2. Create a separate `Payments` table.
3. Reuse the `Expense` and `ExpenseSplit` tables but flag `is_settlement=True` and reverse the debt direction.
**Rationale**: To keep the database schema simple but semantically correct, we reused the `Expense` table but flagged it as a settlement. The `ExpenseSplit` is created such that the target user's debt is reduced.

## 5. Handling Unregistered Guests (e.g., Kabir)
**Decision**: Assign the cost of unregistered guests to the payer.
**Options Considered**: 
1. Crash the import.
2. Auto-create a fake user "Kabir".
3. Assign the guest's share to the person who paid for them.
**Rationale**: In shared living scenarios, if someone brings a guest, the host typically covers their portion. We assign Kabir's share to Dev (the payer) to maintain balance integrity among the core flatmates.

## 6. Frontend Styling
**Decision**: Vanilla CSS with a bespoke design system.
**Options Considered**: Tailwind CSS, Material UI, Vanilla CSS.
**Rationale**: The prompt mandated avoiding Tailwind CSS unless explicitly requested. We built a custom, premium CSS architecture using CSS variables, micro-animations, and a responsive grid to achieve a "wow" factor.
