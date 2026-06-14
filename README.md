# FairSplit - Shared Expenses App

FairSplit is a robust shared expenses application designed to handle complex edge cases, variable group memberships, and imperfect data imports. It was built to solve the messy spreadsheet problem for Aisha, Rohan, Priya, Meera, and Sam.

## Features
- **Smart CSV Import**: Ingests `expenses_export.csv`, detects anomalies, and automatically applies smart resolution policies.
- **Dynamic Group Membership**: Handles members moving in and out, adjusting split calculations accordingly.
- **Multiple Currency Support**: Converts USD to INR on the fly.
- **Multiple Split Types**: Supports equal, unequal, exact, percentage, and shares.
- **Premium Aesthetics**: Built with a sleek, modern, glassmorphic UI.

## Tech Stack
- **Backend**: Python 3, FastAPI, SQLAlchemy, SQLite (relational DB ready for PostgreSQL).
- **Frontend**: React, Vite, Vanilla CSS.

## Setup Instructions

### Backend
1. `cd backend`
2. `python -m venv venv`
3. Activate the virtual environment (`.\venv\Scripts\activate` on Windows, `source venv/bin/activate` on Mac/Linux)
4. `pip install -r requirements.txt` (or manually install `fastapi uvicorn sqlalchemy pydantic python-multipart passlib[bcrypt] python-jose[cryptography] pandas`)
5. Run the server: `python -m uvicorn app.main:app --reload --port 8000`

### Frontend
1. `cd frontend`
2. `npm install`
3. Run the development server: `npm run dev`

## Usage
1. Open the frontend in your browser.
2. Navigate to **Import CSV**.
3. Upload the `expenses_export.csv` file. The backend will parse the file, detect the 12 anomalies, and save the data to the SQLite database.
4. Go to **Balances** to see who owes whom.
5. Go to **Expenses** to see the detailed breakdown.

## AI Used
Developed using Gemini 3.1 Pro via the Antigravity IDE agent. See `AI_USAGE.md` for details.
