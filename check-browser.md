# Troubleshooting: Nothing Appears in Browser

## Quick Checks

1. **Open Browser Console** (Safari: Develop > Show Web Inspector > Console)
   - Look for any red error messages
   - Common errors:
     - "Failed to fetch" - Backend not running
     - "Module not found" - Missing dependencies
     - "Cannot read property" - JavaScript error

2. **Check Network Tab**
   - Open Safari Developer Tools (Develop > Show Web Inspector > Network)
   - Refresh the page
   - Check if main.jsx loads (should be 200 OK)
   - Check if API calls work

3. **Verify URLs**
   - Frontend: http://localhost:5173
   - Backend: http://localhost:8000
   - Make sure you're using the correct port (5173, not 3000)

4. **Clear Browser Cache**
   - Safari: Safari > Preferences > Privacy > Manage Website Data
   - Remove localhost entries
   - Hard refresh: Cmd+Shift+R

5. **Check Terminal Output**
   - Backend should show: "Uvicorn running on http://0.0.0.0:8000"
   - Frontend should show: "Local: http://localhost:5173"

## Common Issues

### White Screen / Blank Page
- **Cause**: JavaScript error preventing React from rendering
- **Fix**: Check browser console for errors
- **Fix**: Make sure all dependencies are installed: `cd frontend && npm install`

### "Loading..." Forever
- **Cause**: AuthContext stuck in loading state
- **Fix**: Check if backend is running: `curl http://localhost:8000/health`
- **Fix**: Check browser console for API errors

### Redirect Loop
- **Cause**: Token validation failing
- **Fix**: Clear localStorage: In console, type `localStorage.clear()`
- **Fix**: Check backend logs for authentication errors

### Map Not Loading
- **Cause**: Leaflet CSS not loading
- **Fix**: Check network tab for leaflet.css (should be 200 OK)
- **Fix**: Make sure internet connection is active (Leaflet CSS loads from CDN)

## Debug Steps

1. **Open Browser Console** (Cmd+Option+I in Safari)
2. **Check for errors** - Look for red messages
3. **Check Network tab** - See if files are loading
4. **Try direct URL**: http://localhost:5173/login
5. **Check React DevTools** (if installed)

## Manual Test

Open browser console and type:
```javascript
// Check if React is loaded
console.log(window.React)

// Check if root element exists
console.log(document.getElementById('root'))

// Check localStorage
console.log(localStorage.getItem('token'))
```


