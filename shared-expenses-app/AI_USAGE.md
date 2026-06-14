# AI Usage Log

This project was developed with the assistance of the Gemini 3.1 Pro model via the Antigravity IDE agent. The AI acted as a highly capable pair programmer, accelerating the scaffolding, logic implementation, and UI design.

## Tools Used
- Gemini 3.1 Pro (Planning, Code Generation, Bug Fixing)
- Python / FastAPI (Backend implementation guided by AI)
- React / Vite (Frontend implementation guided by AI)

## Key Prompts
1. **Initial Planning Phase**: The AI was prompted to read the assignment requirements, search for the `expenses_export.csv`, and formulate a robust architecture plan with a focus on scalable Python backends and a premium Vanilla CSS frontend.
2. **Anomaly Detection Logic**: "Create a CSV parser that can detect 12 specific anomalies such as missing currency, conflicting dates, settlements, and moved-out members, and log them into a database rather than crashing."
3. **Frontend Design**: "Build a React frontend with a modern, glassmorphic aesthetic using Vanilla CSS (no Tailwind). It must include a Dashboard for balances, an Expense list, and a CSV Import view."

## AI Mistakes and Corrections

During the development, the AI produced a few errors which were caught and corrected by the human engineer (me, working alongside the AI):

### 1. `dateutil.parser` Day-First Assumption Bug
**What the AI did wrong**: The AI implemented `date_parser.parse(date_str, dayfirst=True)`. This correctly handled ambiguous Indian dates like `04/05/2026` (May 4th), but it incorrectly mangled ISO 8601 strings like `2026-02-05`, turning February 5th into May 2nd (`2026-05-02`).
**How it was caught**: I reviewed the API response from the `/import` endpoint and noticed the anomaly logs claimed Meera moved out before May 2nd, when the expense was actually in February.
**What was changed**: I modified the AI's logic to explicitly check for the `YYYY-MM-DD` regex pattern and parse it normally, only applying `dayfirst=True` as a fallback.

### 2. Pandas `NaN` String Check Failure
**What the AI did wrong**: To handle missing currencies, the AI wrote `currency = str(row['currency']).strip().upper() if not pd.isna(row['currency']) else "INR"`. Then it checked `if currency == 'NAN':`. However, because `pd.isna` intercepted the null value, `currency` became `"INR"` immediately, bypassing the anomaly logging block completely.
**How it was caught**: I manually checked the SQLite database and noticed the "Missing Currency" anomaly was missing from the `ImportAnomaly` table, even though the row had been processed.
**What was changed**: I refactored the conditional to explicitly check `pd.isna(row['currency'])` first, log the anomaly, and assign the default, separating it from the string-parsing logic.

### 3. Module Shadowing via `__init__.py` Directories
**What the AI did wrong**: The AI used a shell script to scaffold the backend structure (`mkdir app\models`, etc.). It then created `app/models.py`. When Python tried to import `app.models`, it imported the empty directory instead of the Python file, causing an `AttributeError`.
**How it was caught**: Uvicorn crashed on startup with `ImportError: cannot import name 'engine' from 'app.database'`.
**What was changed**: I deleted the empty boilerplate directories (`app/models/`, `app/database/`, etc.) so Python would correctly resolve the `.py` files.
