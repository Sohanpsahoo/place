# AI Usage Log

This project was developed with the assistance of the Gemini 3.1 Pro model via the Antigravity IDE agent. The AI acted as a highly capable pair programmer, accelerating the scaffolding, logic implementation, and UI design.

## Tools Used
- Gemini 3.1 Pro (Planning, Code Generation, Bug Fixing)
- Python / FastAPI (Backend implementation guided by AI)
- React / Vite (Frontend implementation guided by AI)

## Key Prompts
1. **Diagnosing Backend Stack**: I attempted to run `npm run dev` in the backend folder and provided the resulting error output. The AI analyzed the directory contents, identified the backend as a Python FastAPI application based on the `requirements.txt` file, and provided the correct startup instructions (`uvicorn app.main:app --reload`).
2. **Troubleshooting Execution Path Issues**: The user provided an error where the `uvicorn` command was not recognized in Windows PowerShell despite successfully installing `requirements.txt` in a virtual environment. The AI correctly diagnosed that `pip` had defaulted to a user installation outside the virtual environment, and instructed the user to bypass the PATH issue by running the server via `python -m uvicorn app.main:app --reload`.

## AI Mistakes and Corrections

During the setup process, the following challenges were encountered and resolved collaboratively:

### 1. Initial Attempt to use Node.js Commands for Python Backend
**What happened**: The user initially tried to start the backend server using Node.js commands (`npm run dev`), assuming it was a JavaScript project, which resulted in a missing `package.json` error.
**How it was caught**: The AI read the directory contents and `requirements.txt` using its file viewing tools.
**What was changed**: The AI redirected the user to create a Python virtual environment (`python -m venv venv`) and use `pip` to install dependencies instead of `npm`.

### 2. Windows Virtual Environment Pathing Issues
**What happened**: After creating the virtual environment and installing packages, the `uvicorn` command was not recognized. The Windows Store Python installation caused `pip` to default to the global user site-packages instead of the active virtual environment's `Scripts` directory.
**How it was caught**: The AI analyzed the pip installation output, noting the warning: `Defaulting to user installation because normal site-packages is not writeable`.
**What was changed**: The AI provided an alternative command (`python -m uvicorn app.main:app --reload`) to execute the module directly, bypassing the need for the executable to be explicitly added to the PowerShell PATH.
