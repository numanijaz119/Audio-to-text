# 🚀 Audio-to-Text Project - Complete Setup & Deployment Guide

A comprehensive guide for setting up a Django REST API backend with a React/TypeScript frontend, including environment configuration, API integration, and deployment considerations.

---

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites &amp; System Requirements](#prerequisites--system-requirements)
3. [Backend Setup](#backend-setup)
4. [Frontend Setup](#frontend-setup)
5. [Environment Configuration](#environment-configuration)
6. [API Integration &amp; Testing](#api-integration--testing)
7. [Running the Project](#running-the-project)
8. [Database Management](#database-management)
9. [Security Considerations](#security-considerations)
10. [Deployment Checklist](#deployment-checklist)
11. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

### Tech Stack

**Backend:**

- Django 4.x (Python Web Framework)
- Django REST Framework (API Development)
- SQLite/PostgreSQL (Database)
- Razorpay (Payment Gateway)
- AssemblyAI (Audio Transcription)
- OpenAI (Text Processing)

**Frontend:**

- React 18+ with TypeScript
- Vite (Build Tool & Dev Server)
- Tailwind CSS (Styling)
- Axios (HTTP Client)

### Project Structure

```
Audio-to-Text/
├── Backend/
│   ├── api/
│   │   ├── models.py          # Database models
│   │   ├── views.py           # API endpoints
│   │   ├── serializers.py     # Data serialization
│   │   ├── urls.py            # URL routing
│   │   ├── services/          # Business logic
│   │   └── tests/             # Unit tests
│   ├── AudioText/             # Django project settings
│   ├── manage.py              # Django CLI
│   ├── requirements.txt       # Python dependencies
│   ├── .env                   # Environment variables
│   └── db.sqlite3             # SQLite database
├── Frontend/
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── pages/             # Page components
│   │   ├── services/          # API services
│   │   ├── types/             # TypeScript types
│   │   └── App.tsx            # Root component
│   ├── package.json           # Node dependencies
│   ├── vite.config.ts         # Vite configuration
│   ├── tsconfig.json          # TypeScript config
│   ├── .env                   # Environment variables
│   └── index.html             # Entry HTML
└── docs/                      # Documentation
```

---

## Prerequisites 

### Required Software

#### 1. **Python 3.11+** (Backend Runtime)

- Download: https://www.python.org/downloads/
- **Critical**: During installation, enable "Add Python to PATH"
- Verify: `python --version` (should show 3.11 or higher)
- Package Manager: pip (included with Python)

```bash
# Verify Python installation
python --version
pip --version
```

#### 2. **Node.js 18+ LTS** (Frontend Runtime)

- Download: https://nodejs.org/
- Includes npm (Node Package Manager)
- Verify: `node --version` and `npm --version`

```bash
# Verify Node installation
node --version
npm --version
```

#### 3. **Git** (Version Control - Recommended)

- Download: https://git-scm.com/
- Verify: `git --version`

#### 4. **IDE/Editor**

- **VS Code** (Recommended): https://code.visualstudio.com/
  - Extensions: Python, REST Client, Thunder Client
- **PyCharm** (Alternative for Backend)
- **WebStorm** (Alternative for Frontend)

---

## Backend Setup

### Step 1: Open Command Prompt

1. Press `Windows Key + R`
2. Type `cmd` and press Enter
3. Navigate to your project folder:
   ```
   cd "C:\Users\YourUsername\Desktop\Working Dir\Audio-to-Text"
   ```

### Step 2: Create Virtual Environment

A virtual environment keeps your project dependencies separate from your system.

```
python -m venv Backend/env
```

Wait for it to complete (this may take a minute).

### Step 3: Activate Virtual Environment

```
Backend\env\Scripts\activate
```

You should see `(env)` appear at the beginning of your command line. This means the virtual environment is active.

### Step 4: Install Backend Dependencies

```
cd Backend
pip install -r requirements.txt
```

This will download and install all necessary packages. Wait for it to complete.

### Step 5: Configure Environment Variables

1. Open the file: `Backend/.env` in your text editor
2. You'll see something like this:

```
SECRET_KEY=django-insecure-dev-key-change-in-production
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=

ASSEMBLY_AI_KEYS=
OPENAI_API_KEY=

RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

FRONTEND_URL=http://localhost:5173
```

### Step 6: Get Your API Keys

You need to fill in the empty fields with API keys. Here's how:

#### **A. Google OAuth (Optional)**

1. Go to: https://console.cloud.google.com/
2. Create a new project
3. Enable "Google+ API"
4. Create OAuth 2.0 credentials
5. Copy the Client ID and Secret into `.env`

#### **B. Assembly AI (For Audio Transcription)**

1. Go to: https://www.assemblyai.com/
2. Sign up for free account
3. Go to your dashboard and copy your API key
4. Paste it in `ASSEMBLY_AI_KEYS=`

#### **C. OpenAI (For Text Processing)**

1. Go to: https://platform.openai.com/
2. Sign up and create an API key
3. Paste it in `OPENAI_API_KEY=`

#### **D. Razorpay (For Payments)**

1. Go to: https://dashboard.razorpay.com/app/keys
2. Make sure you're in **Test Mode**
3. Click "Generate Test Keys"
4. Copy both keys:
   - Paste Key ID in `RAZORPAY_KEY_ID=`
   - Paste Key Secret in `RAZORPAY_KEY_SECRET=`

### Step 7: Initialize Database

```
python manage.py migrate
```

This creates the database tables.

### Step 8: Create Admin User (Optional)

```
python manage.py createsuperuser
```

Follow the prompts to create an admin account.

---

## Frontend Setup

### Step 1: Open New Command Prompt

1. Press `Windows Key + R`
2. Type `cmd` and press Enter
3. Navigate to Frontend folder:
   ```
   cd "C:\Users\YourUsername\Desktop\Working Dir\Audio-to-Text\Frontend"
   ```

### Step 2: Install Dependencies

```
npm install
```

This downloads all frontend packages. Wait for it to complete.

### Step 3: Configure Environment Variables

1. Open the file: `Frontend/.env` in your text editor
2. Make sure it contains:

```
VITE_API_URL=http://localhost:8000
```

This tells the frontend where to find the backend.

---

## Environment Configuration

### Summary of What Goes Where

| File              | What to Add          | Where to Get It                          |
| ----------------- | -------------------- | ---------------------------------------- |
| `Backend/.env`  | GOOGLE_CLIENT_ID     | Google Cloud Console                     |
| `Backend/.env`  | GOOGLE_CLIENT_SECRET | Google Cloud Console                     |
| `Backend/.env`  | ASSEMBLY_AI_KEYS     | AssemblyAI Dashboard                     |
| `Backend/.env`  | OPENAI_API_KEY       | OpenAI Platform                          |
| `Backend/.env`  | RAZORPAY_KEY_ID      | Razorpay Dashboard (Test Mode)           |
| `Backend/.env`  | RAZORPAY_KEY_SECRET  | Razorpay Dashboard (Test Mode)           |
| `Frontend/.env` | VITE_API_URL         | Already set to `http://localhost:8000` |

---

## Running the Project

### Terminal 1: Start Backend

1. Open Command Prompt
2. Navigate to project folder:
   ```
   cd "C:\Users\YourUsername\Desktop\Working Dir\Audio-to-Text"
   ```
3. Activate virtual environment:
   ```
   Backend\env\Scripts\activate
   ```
4. Start Django server:
   ```
   cd Backend
   python manage.py runserver
   ```
5. You should see:
   ```
   Starting development server at http://127.0.0.1:8000/
   ```

### Terminal 2: Start Frontend

1. Open **another** Command Prompt
2. Navigate to Frontend folder:
   ```
   cd "C:\Users\YourUsername\Desktop\Working Dir\Audio-to-Text\Frontend"
   ```
3. Start development server:
   ```
   npm run dev
   ```
4. You should see:
   ```
   Local: http://localhost:5173/
   ```

### Access the Application

Open your web browser and go to: **http://localhost:5173/**

---

## Troubleshooting

### Problem: "Python is not recognized"

**Solution**:

- Python wasn't added to PATH during installation
- Reinstall Python and **CHECK** "Add Python to PATH"

### Problem: "npm is not recognized"

**Solution**:

- Node.js wasn't installed properly
- Reinstall Node.js from https://nodejs.org/

### Problem: Backend won't start

**Solution**:

- Make sure virtual environment is activated (you should see `(env)` in command line)
- Check that all dependencies installed: `pip install -r requirements.txt`

### Problem: Frontend won't start

**Solution**:

- Make sure you're in the `Frontend` folder
- Run `npm install` again
- Check that port 5173 is not in use

### Problem: "Module not found" error

**Solution**:

- Backend: Run `pip install -r requirements.txt` again
- Frontend: Run `npm install` again

### Problem: API keys not working

**Solution**:

- Make sure you copied the **entire** key (not partial)
- For Razorpay, make sure you're in **Test Mode**
- Restart both backend and frontend after updating `.env`

### Problem: Can't connect Frontend to Backend

**Solution**:

- Make sure Backend is running on `http://localhost:8000`
- Make sure Frontend `.env` has `VITE_API_URL=http://localhost:8000`
- Check that both are running in separate terminals

---

## Quick Reference Commands

### Backend Commands

```
# Activate virtual environment
Backend\env\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Start server
python manage.py runserver

# Create admin user
python manage.py createsuperuser
```

### Frontend Commands

```
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

---

## Need Help?

If you encounter issues:

1. **Check the error message** - it usually tells you what's wrong
2. **Google the error** - most common errors have solutions online
3. **Check the Troubleshooting section** above
4. **Contact the development team** with the error message

---

## Next Steps

Once everything is running:

1. Create an account on the frontend
2. Test the audio transcription feature
3. Test the payment system (use Razorpay test cards)
4. Explore the admin panel at `http://localhost:8000/admin`

---

**Congratulations! Your project is now set up and ready to use! 🎉**
