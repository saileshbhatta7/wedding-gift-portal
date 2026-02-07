# Quick Start Guide - Wedding Gift Portal

## 🎯 What You Have Now

✅ **Fully functional wedding gift contribution portal**
✅ **Admin dashboard for payment management**
✅ **Database with 10 sample users** (expandable to 102)
✅ **Payment screenshot upload & storage**
✅ **OCR verification system** (manual review fallback)
✅ **Mobile-responsive design**

---

## 🌐 Access Your Application

### Development URL (Active Now)
**Homepage**: https://3000-impxy1y0ug8i5hk4jfk6q-8f57ffe2.sandbox.novita.ai

**Admin Dashboard**: https://3000-impxy1y0ug8i5hk4jfk6q-8f57ffe2.sandbox.novita.ai/admin

**Admin Password**: `admin123`

---

## 👥 Test with Sample Users

The database includes 10 sample users:
1. Ram Bahadur Thapa (Roll: 23)
2. Shyam Kumar Rana (Roll: 45)
3. Sita Kumari Sharma (Roll: 12)
4. Gita Devi Poudel (Roll: 67)
5. Krishna Prasad Bhatta (Roll: 34)
6. Radha Kumari Karki (Roll: 56)
7. Hari Bahadur Magar (Roll: 78)
8. Laxmi Devi Gurung (Roll: 89)
9. Narayan Prasad Koirala (Roll: 90)
10. Saraswati Kumari Ghimire (Roll: 11)

---

## 🧪 How to Test

### Test User Submission:

1. **Open homepage** → Select a name from dropdown
2. **Choose payment method** → eSewa/Khalti/Bank/UPI
3. **Upload a screenshot** → Any image (JPG/PNG, max 5MB)
4. **Click Submit** → See success message

### Test Admin Dashboard:

1. **Go to `/admin`** → Login with password `admin123`
2. **View statistics** → See total collected, paid count, pending, etc.
3. **Click "Review"** → View any submitted payment
4. **Approve/Reject** → Update payment status
5. **Check filters** → Filter by All/Paid/Pending/Review

---

## 📋 Add Your 102 Coursemates

### Option 1: Manual SQL (Recommended for Small Batches)

Edit `migrations/0001_initial_schema.sql`:

```sql
-- Add more users
INSERT INTO users (user_id, name, roll_no, phone) VALUES
('U011', 'Your Friend Name', '100', '9801234567'),
('U012', 'Another Friend', '101', '9802345678'),
-- Add all 102...
('U102', 'Last Friend', '102', '9809999999');
```

Then reset database:
```bash
cd /home/user/webapp
rm -rf .wrangler/state/v3/d1
npm run db:migrate:local
pm2 restart wedding-gift
```

### Option 2: Bulk Import via SQL

1. Create a CSV file: `users.csv`
```csv
user_id,name,roll_no,phone
U011,Friend Name 1,11,9801111111
U012,Friend Name 2,12,9801111112
```

2. Convert to SQL insert statements
3. Execute via wrangler console

### Option 3: API Endpoint (Future Enhancement)

Add an admin API endpoint to bulk import users from CSV/Excel.

---

## 🚀 Deploy to Production

When ready to go live:

### 1. Setup Cloudflare (One-time)

```bash
# Setup Cloudflare API key first
# Go to Deploy tab in sidebar and configure

# Create production database
npx wrangler d1 create wedding-gift-production

# Copy the database_id output to wrangler.jsonc
```

### 2. Create R2 Bucket

```bash
npx wrangler r2 bucket create wedding-gift-uploads
```

### 3. Apply Migrations to Production

```bash
npm run db:migrate:prod
```

### 4. Create Cloudflare Pages Project

```bash
npx wrangler pages project create wedding-gift \
  --production-branch main \
  --compatibility-date 2026-02-07
```

### 5. Deploy

```bash
npm run deploy:prod
```

You'll get a production URL like:
- `https://wedding-gift.pages.dev`
- `https://main.wedding-gift.pages.dev`

---

## 🔧 Common Tasks

### Change Admin Password

Edit `migrations/0001_initial_schema.sql`:
```sql
INSERT INTO settings (admin_password_hash, event_name, deadline) 
VALUES ('your_new_password', 'Wedding Gift Contribution', '2026-02-15');
```

Then reset database.

### View Database Content

```bash
cd /home/user/webapp

# Check users
npx wrangler d1 execute wedding-gift-production --local \
  --command="SELECT * FROM users"

# Check payments
npx wrangler d1 execute wedding-gift-production --local \
  --command="SELECT * FROM payments"

# Check settings
npx wrangler d1 execute wedding-gift-production --local \
  --command="SELECT * FROM settings"
```

### Export Payment Data

```bash
# Export to JSON (via API)
curl http://localhost:3000/api/admin/dashboard \
  -H "Authorization: Bearer admin_123456" > payments.json
```

### Restart Server

```bash
cd /home/user/webapp
pm2 restart wedding-gift

# Or full restart
pm2 delete wedding-gift
npm run build
pm2 start ecosystem.config.cjs
```

---

## 📊 Understanding the Payment Flow

1. **User submits** → Payment record created with status `PENDING`
2. **OCR runs** (optional) → Detects amount, sets confidence score
3. **Auto-decision**:
   - If amount = 2000 & confidence ≥ 80% → Status = `PAID`
   - If confidence < 80% → Status = `NEEDS_REVIEW`
   - If OCR unavailable → Status = `NEEDS_REVIEW`
4. **Admin reviews** → Can manually approve/reject
5. **Status updated** → User's `has_paid` flag updated

---

## 🎨 Customization Ideas

### Change Theme Colors

Edit `src/index.tsx`, replace color classes:
- `purple-600` → `blue-600` (change primary color)
- `pink-600` → `green-600` (change accent color)

### Update Event Name

Edit `migrations/0001_initial_schema.sql`:
```sql
INSERT INTO settings (admin_password_hash, event_name, deadline) 
VALUES ('admin123', 'Your Custom Event Name', '2026-03-01');
```

### Add More Payment Methods

Edit dropdown in `src/index.tsx`:
```html
<option value="PhonePe">PhonePe</option>
<option value="Paytm">Paytm</option>
```

---

## 🐛 Troubleshooting

**Problem**: Server not responding
```bash
pm2 logs wedding-gift --nostream  # Check logs
pm2 restart wedding-gift           # Restart
```

**Problem**: Database is empty
```bash
npm run db:migrate:local  # Reapply migrations
```

**Problem**: Upload not working
- Check file size < 5MB
- Check file format (JPG/PNG only)
- Check PM2 logs for errors

**Problem**: Admin login fails
- Default password is `admin123`
- Check settings table in database

---

## 📞 Next Steps

1. ✅ **Test thoroughly** with sample users
2. ✅ **Add your 102 coursemates** to database
3. ✅ **Change admin password** to something secure
4. ✅ **Customize event name** and deadline
5. ⏳ **Deploy to production** when ready
6. ⏳ **Share URL** with your coursemates
7. ⏳ **Monitor submissions** via admin dashboard

---

## 💡 Pro Tips

- **Backup database** before major changes:
  ```bash
  cp -r .wrangler/state/v3/d1 .wrangler/state/v3/d1.backup
  ```

- **Test locally first** before production deployment

- **Set deadline** in settings to auto-lock submissions

- **Export payment data** regularly for records

- **Use mobile** to test user experience (most users will use phones)

---

**Need help?** Check the main README.md for detailed documentation.

**Ready to deploy?** Follow the production deployment steps above.

**Want to customize?** The entire codebase is in `/home/user/webapp/`

---

**Built with ❤️ for your wedding celebration! 💑**
