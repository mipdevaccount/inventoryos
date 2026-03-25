# Inventory Request System (React + FastAPI)

This is a modern rewrite of the Inventory Request System using React (Vite) for the frontend and FastAPI for the backend.

## Prerequisites

- Node.js (v18+)
- Python (v3.8+)

## Setup & Running

### 1. Backend (FastAPI)

The backend handles data persistence using the existing CSV files.

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`.

### 2. Frontend (React)

The frontend provides the "CommanderOS" user interface.

```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

## Features

- **Shop Floor View**: Search products, view details, and submit requests.
- **Office Dashboard**: View stats, manage request statuses, and filter requests.
- **Product Catalog**: View all products and add new ones.
- **Responsive Design**: Works on desktop and mobile.
