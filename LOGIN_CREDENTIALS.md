# 🔐 Login Credentials

## Working Demo Accounts

All the following credentials are configured and working in the system:

### 📊 Administrator Account
**Full access to all features**
- Email: `admin@trends.com`
- Password: `admin123`
- Alternative: `admin@reliancetrends.com` / `admin123`

**Permissions:**
- ✅ Upload CSV data
- ✅ Access all pages
- ✅ Configure settings
- ✅ Export all formats (CSV, JSON)
- ✅ Delete data
- ✅ View all analytics

---

### 👔 Store Manager Account
**Read access with limited management capabilities**
- Email: `manager@trends.com`
- Password: `manager123`
- Alternative: `manager@reliancetrends.com` / `manager123`

**Permissions:**
- ✅ View all reports
- ✅ Access alerts
- ✅ Export CSV data
- ✅ Apply filters
- ❌ Upload data
- ❌ Access settings

---

### 👁️ Viewer Account
**Read-only access**
- Email: `viewer@trends.com`
- Password: `viewer123`
- Alternative: `user@trends.com` / `user123`
- Alternative: `user@reliancetrends.com` / `user123`

**Permissions:**
- ✅ View all reports
- ✅ Export filtered CSV data
- ✅ Apply filters
- ❌ Upload data
- ❌ Access settings
- ❌ View alerts

---

## Quick Login

The login page provides **Quick Access buttons** for each role:
1. Click the **Admin**, **Manager**, or **Viewer** button
2. Credentials will auto-fill
3. Click **Sign in** to login

## Testing Different Roles

To test role-based access control:

1. **Admin Role**: Login as admin to see full functionality
2. **Manager Role**: Login as manager to see limited upload/settings access
3. **Viewer Role**: Login as viewer to see read-only access

## Troubleshooting

If login fails:
- Ensure backend is running on port 3001
- Check browser console for errors
- Clear browser cache/localStorage
- Try the alternative email addresses listed above

## Security Note

These are demo credentials for testing purposes only. In production:
- Use secure passwords
- Implement proper authentication backend
- Use environment variables for sensitive data
- Enable two-factor authentication 