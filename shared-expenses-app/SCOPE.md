# Shared Expenses App - Scope & Decisions

## Anomaly Log and Handling Policies

The `expenses_export.csv` contains numerous deliberate data quality issues. Below is the log of the 12 detected anomalies and the policy our application will enforce when importing the data.

| # | Anomaly Type | Example Row(s) | Our Handling Policy |
|---|---|---|---|
| 1 | **Inconsistent Date Formats** | `2026-02-01`, `01/03/2026`, `Mar 14`, `04/05/2026` | Use a robust date parser (e.g., `dateutil.parser`) that attempts multiple formats. For ambiguous dates like `04/05/2026`, we default to `DD/MM/YYYY` (May 4th) unless contextual clues suggest otherwise. |
| 2 | **Duplicate/Conflicting Entries** | `Dinner at Marina Bites` vs `dinner - marina bites` AND `Dinner at Thalassa` vs `Thalassa dinner` (with conflicting amounts/payers) | Exact duplicates on date, amount, and payer are merged automatically. For conflicts (same date, similar description, different payer/amount), the system flags it in the Import Report. The user must resolve the conflict in the UI, but by default, we keep the entry with the highest amount or explicit notes. For the Thalassa dinner, we will keep Rohan's entry based on notes. |
| 3 | **Number Formatting with Commas** | `"1,200"` | Strip commas from the amount string before parsing as a float. |
| 4 | **Settlement Logged as Expense** | `Rohan paid Aisha back` (5000) | Detect if `split_type` is empty or notes indicate settlement. Treat this row as a Payment (reduces Rohan's debt to Aisha) rather than an Expense split among others. |
| 5 | **Percentage Not Adding Up** | `Pizza Friday` (30% + 30% + 30% + 20% = 110%) | Recalculate percentages dynamically by dividing each share by the sum of all shares (i.e., normalize to 100%). For instance, 30% becomes 30/110. |
| 6 | **USD vs INR (Currency Mixture)** | `Goa villa booking` (540 USD) | Use a fixed exchange rate (e.g., 1 USD = 83 INR) for processing. The system stores the original currency but calculates balances in INR. |
| 7 | **Missing Paid By** | `House cleaning supplies` (780) | If `paid_by` is blank, flag it as a critical anomaly. Default to the user who uploaded the CSV or prompt the user. For automated processing, we will skip/flag the row as invalid. |
| 8 | **Negative Amounts** | `Parasailing refund` (-30 USD) | Treat negative amounts as a refund/income. The splits apply in reverse (the payer "owes" the group or reduces the group's debt to the payer). |
| 9 | **Missing Currency** | `Groceries DMart` (2105) | Default missing currency to `INR`. |
| 10 | **Zero Amount Expense** | `Dinner order Swiggy` (0 INR) | Ignore/Drop the row entirely. It has no effect on balances. |
| 11 | **Moved Out Member Included** | `Groceries BigBasket` includes Meera in April | Remove Meera from the split calculation for any dates after her `leave_date`. The amount is split equally among the remaining valid members. |
| 12 | **Conflicting Split Type and Details** | `Furniture for common room` (type is equal but details have shares) | If `split_details` are explicitly provided, they override the `split_type`. Treat as `share` split type. |
| * | **Unregistered Guest** | `Dev's friend Kabir` | Treat unregistered names in the split list as "guest of the payer" or "guest of whoever added them". In this case, we assign Kabir's split cost directly to Dev (the payer). |

## Database Schema

We use a relational database (SQLite for development, PostgreSQL-ready) using SQLAlchemy.

- **Users**: `id`, `name`, `email`, `password_hash`
- **Groups**: `id`, `name`, `created_at`
- **GroupMembers**: `id`, `group_id`, `user_id`, `join_date`, `leave_date` (Tracks when Meera left and Sam joined).
- **Expenses**: `id`, `group_id`, `paid_by_id`, `amount`, `currency`, `converted_amount_inr`, `date`, `description`, `is_settlement`
- **ExpenseSplits**: `id`, `expense_id`, `user_id`, `amount_owed`
- **ImportAnomalies**: `id`, `filename`, `row_number`, `anomaly_type`, `description`, `resolution_applied`, `user_approved`
