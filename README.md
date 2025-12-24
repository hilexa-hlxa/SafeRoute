# SafeRoute - Geo-Safety PWA

A production-grade MVP for a mobile-first Progressive Web App where users report dangers and receive real-time SOS alerts.

## Tech Stack

- **Backend**: Python 3.13, FastAPI, SQLAlchemy 2.0 (Async), Socket.IO
- **Frontend**: React 18, Vite, Tailwind CSS, React-Leaflet, Socket.IO Client
- **Database**: SQLite
- **Auth**: JWT (OAuth2 Password Bearer)

## Quick Start (Without Docker)

### Prerequisites
- Python 3.13+ installed
- Node.js 18+ and npm installed
- Ports 5173 and 8000 available

### Quick Start (Automated)

**Easiest way - use the startup script:**
```bash
./start.sh
```

This will:
- Create `.env` files if they don't exist
- Set up virtual environment
- Install dependencies
- Run database migrations
- Start both backend and frontend servers

Then open Safari and go to: **http://localhost:5173**

To stop the servers:
```bash
./stop.sh
```

### Manual Step-by-Step Setup

#### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cat > .env << EOF
DATABASE_URL=sqlite+aiosqlite:///./saferoute.db
SECRET_KEY=your-secret-key-change-in-production-min-32-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
EOF

# Run database migrations
alembic upgrade head

# Start the backend server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The backend will be available at:
- **API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

#### 2. Frontend Setup

Open a **new terminal window** and run:

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Create .env file for frontend
cat > .env << EOF
VITE_API_URL=http://localhost:8000
EOF

# Start the frontend development server
npm run dev
```

The frontend will be available at:
- **Web App**: http://localhost:5173 (Vite default port)

### 3. Access the Application

1. **Open Safari** (or any browser)
2. Navigate to: **http://localhost:5173**
3. You'll see the login page
4. Click "Create one" to register a new account
5. Fill in the registration form:
   - Email
   - Password
   - Full Name (optional)
   - Phone (optional)
   - City (optional)
   - Role: Student (or Admin with code "hilexahlxa")
6. After registration, you'll be redirected to login
7. Login with your credentials
8. Allow location permissions when prompted
9. Start using the app!

### Safari-Specific Notes

- **Location Permissions**: Safari requires explicit permission for geolocation. Click "Allow" when prompted.
- **WebSocket**: Make sure both backend and frontend are running on the same network (localhost).
- **HTTPS**: For production, use HTTPS. Safari is stricter about security.

## Running Both Services

### Option 1: Two Terminal Windows

**Terminal 1 (Backend):**
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

### Option 2: Background Processes

**Backend (background):**
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 > backend.log 2>&1 &
```

**Frontend (background):**
```bash
cd frontend
npm run dev > frontend.log 2>&1 &
```

## First-Time Usage

1. **Register a new account:**
   - Go to http://localhost:5173
   - Click "Create one" link
   - Fill in the registration form
   - Submit

2. **Login:**
   - Use your email and password
   - Click "Sign In"

3. **Start using the app:**
   - Allow location permissions when prompted
   - The map will center on your location
   - Click anywhere on the map to report an incident
   - Hold the SOS button for 1.5 seconds to send an emergency alert

## Useful Commands

**Backend:**
```bash
# Activate virtual environment
cd backend && source venv/bin/activate

# Run migrations
alembic upgrade head

# Create new migration
alembic revision --autogenerate -m "description"

# Start server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend:**
```bash
# Install dependencies
cd frontend && npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Troubleshooting

### Nothing Appears in Browser

**1. Check Browser Console (IMPORTANT!)**
- Safari: Develop > Show Web Inspector > Console (or Cmd+Option+C)
- Look for red error messages
- Common errors:
  - "Failed to fetch" → Backend not running
  - "Module not found" → Run `cd frontend && npm install`
  - "Cannot read property" → JavaScript error

**2. Verify Servers Are Running**
```bash
# Check if ports are in use
lsof -i :8000  # Backend
lsof -i :5173  # Frontend

# Test backend
curl http://localhost:8000/health
# Should return: {"status":"healthy"}

# Test frontend
curl http://localhost:5173
# Should return HTML
```

**3. Clear Browser Cache**
- Safari: Safari > Preferences > Privacy > Manage Website Data
- Remove all localhost entries
- Hard refresh: Cmd+Shift+R

**4. Check Network Tab**
- Safari: Develop > Show Web Inspector > Network
- Refresh page
- Check if `main.jsx` loads (should be 200 OK)
- Check if API calls work

**5. Reinstall Dependencies**
```bash
# Frontend
cd frontend
rm -rf node_modules package-lock.json
npm install

# Backend
cd backend
source venv/bin/activate
pip install -r requirements.txt
```

**6. Check PostCSS Config**
- Make sure `frontend/postcss.config.js` exists
- If missing, it was just created - restart frontend server

**Backend won't start:**
- Make sure virtual environment is activated: `source venv/bin/activate`
- Check if port 8000 is available: `lsof -i :8000`
- Check backend logs for errors

**Frontend won't start:**
- Make sure Node.js is installed: `node --version`
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check if port 5173 is available: `lsof -i :5173`

**Database errors:**
- Make sure migrations are run: `alembic upgrade head`
- Check if database file exists: `ls -la backend/saferoute.db`

**CORS errors in Safari:**
- Make sure backend is running on `0.0.0.0` (not just `127.0.0.1`)
- Check that `VITE_API_URL` in frontend `.env` matches backend URL
- Clear Safari cache: Safari > Preferences > Privacy > Manage Website Data

**WebSocket connection fails:**
- Make sure backend is running
- Check browser console for errors
- Verify Socket.IO is properly configured

**Location not working:**
- Safari requires HTTPS for geolocation in production
- For development, make sure you allow location permissions
- Check browser console for geolocation errors

**"Loading..." Forever:**
- Check if backend is running: `curl http://localhost:8000/health`
- Check browser console for API errors
- Try clearing localStorage: In console, type `localStorage.clear()`

## Project Structure

```
SafeRoute/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── socket_manager.py
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── core/
│   │   └── routers/
│   ├── migrations/
│   ├── requirements.txt
│   ├── .env
│   └── saferoute.db (created after first run)
└── frontend/
    ├── src/
    │   ├── components/
    │   ├── contexts/
    │   ├── hooks/
    │   └── api/
    ├── package.json
    └── .env
```

## Features

- ✅ Real-time SOS alerts via WebSocket
- ✅ Incident reporting with geolocation
- ✅ Interactive map with incident markers
- ✅ JWT-based authentication
- ✅ PWA support for mobile installation
- ✅ Voting system (confirm/reject incidents)
- ✅ Incident resolution
- ✅ Admin panel for managing incidents and users
- ✅ User profile management
- ✅ SOS history tracking

## Environment Variables

**Backend (.env):**
```
DATABASE_URL=sqlite+aiosqlite:///./saferoute.db
SECRET_KEY=your-secret-key-change-in-production-min-32-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

**Frontend (.env):**
```
VITE_API_URL=http://localhost:8000
```

## API Endpoints

- `POST /auth/register` - Register new user
- `POST /auth/login` - Login
- `GET /auth/me` - Get current user
- `GET /incidents` - Get incidents near location
- `POST /incidents` - Report new incident
- `POST /incidents/{id}/vote` - Vote on incident
- `PATCH /incidents/{id}/resolve` - Resolve incident
- `POST /sos` - Send SOS signal
- `GET /sos/history` - Get SOS history
- `PATCH /users/me` - Update user profile
- `GET /admin/incidents` - Get all incidents (admin)
- `PATCH /admin/incidents/{id}/approve` - Approve incident (admin)
- `PATCH /admin/incidents/{id}/reject` - Reject incident (admin)
- `GET /admin/users` - Get all users (admin)
- `DELETE /admin/users/{id}` - Delete user (admin)

## Admin Access

To create an admin account:
1. Register with role "admin"
2. Enter admin code: **hilexahlxa**
3. After registration, you'll have admin access
4. Access admin panel at: http://localhost:5173/admin
# SafeRoute
