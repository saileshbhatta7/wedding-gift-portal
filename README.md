# Wedding Gift Confirmation Portal 💑

A comprehensive web application for managing wedding gift contributions with payment verification and admin dashboard.

## 🎯 Project Overview

**Name**: Wedding Gift Confirmation Portal  
**Goal**: Streamline the collection and verification of Rs. 2000 wedding gift contributions from 102 coursemates  
**Tech Stack**: Hono + Cloudflare Pages + D1 Database + R2 Storage + TailwindCSS

## 🌐 URLs

- **Development (Sandbox)**: https://3000-impxy1y0ug8i5hk4jfk6q-8f57ffe2.sandbox.novita.ai
- **Production**: (Deploy with `npm run deploy:prod`)
- **GitHub**: (Push to GitHub repository)

## ✨ Features

### User Side ✅
- [x] Name selection dropdown (pre-populated with 102 coursemates)
- [x] Payment method selection (eSewa, Khalti, Bank Transfer, UPI)
- [x] Payment screenshot upload with preview
- [x] File validation (max 5MB, JPG/PNG)
- [x] Duplicate submission prevention
- [x] Success/error notifications
- [x] Mobile-responsive design

### Admin Dashboard ✅
- [x] Secure admin login (password: `admin123`)
- [x] Real-time statistics dashboard
  - Total collected amount
  - Paid/Pending/Review counts
  - Progress bar visualization
- [x] Payment filtering (All/Paid/Pending/Need Review)
- [x] Detailed payment review modal
- [x] OCR detection results display
- [x] Manual approve/reject functionality
- [x] Admin comments system

### Backend Features ✅
- [x] Cloudflare D1 database integration
- [x] R2 bucket for image storage
- [x] Payment status tracking
- [x] OCR integration (Cloudflare AI - optional)
- [x] Automatic payment verification
- [x] RESTful API endpoints

## 📊 Data Architecture

### Database Schema

**users** table:
- `user_id` (TEXT, PRIMARY KEY) - Unique user identifier
- `name` (TEXT) - Full name
- `roll_no` (TEXT) - Roll number
- `phone` (TEXT) - Phone number
- `has_paid` (INTEGER) - Payment status (0/1)
- `last_submission_id` (TEXT) - Reference to last payment
- `created_at` (DATETIME) - Record creation time

**payments** table:
- `payment_id` (TEXT, PRIMARY KEY) - Unique payment identifier
- `user_id` (TEXT, FOREIGN KEY) - User reference
- `uploaded_image_url` (TEXT) - R2 storage URL
- `ocr_detected_amount` (INTEGER) - Amount detected by OCR
- `ocr_confidence` (REAL) - OCR confidence score
- `ocr_raw_text` (TEXT) - Raw OCR output
- `status` (TEXT) - PAID/PENDING/NEEDS_REVIEW/REJECTED
- `payment_method` (TEXT) - Payment method used
- `submitted_at` (DATETIME) - Submission timestamp
- `reviewed_by_admin` (INTEGER) - Admin review flag
- `admin_comment` (TEXT) - Admin notes

**settings** table:
- `id` (INTEGER, PRIMARY KEY)
- `required_amount` (INTEGER) - Target amount (default: 2000)
- `event_name` (TEXT) - Event name
- `deadline` (TEXT) - Submission deadline
- `admin_password_hash` (TEXT) - Admin password

### Storage Services
- **Cloudflare D1**: SQLite database for relational data
- **Cloudflare R2**: Object storage for payment screenshots
- **Cloudflare AI**: Optional OCR for automatic verification

## 🚀 User Guide

### For Coursemates (Submitting Payment)

1. **Open the portal** at the provided URL
2. **Select your name** from the dropdown (includes roll number)
3. **Choose payment method** (eSewa, Khalti, Bank, UPI)
4. **Upload payment screenshot**:
   - Click the upload area or drag & drop
   - Supported formats: JPG, PNG
   - Maximum size: 5MB
5. **Submit** and wait for confirmation
6. You'll see: "Thank you! Your payment is under verification."

**Note**: Each person can only submit once. If you've already paid, your name will be disabled.

### For Admin (Managing Payments)

1. **Access admin dashboard** at `/admin`
2. **Login** with password: `admin123`
3. **View statistics**:
   - Total collected amount
   - Number paid/pending/need review
   - Overall progress bar
4. **Filter payments** using buttons (All/Paid/Pending/Review)
5. **Review individual payments**:
   - Click "Review" on any submission
   - View payment screenshot
   - Check OCR detection results
   - Read raw OCR text
   - Add admin comments
   - Approve or Reject
6. **Logout** when done

## 🛠️ Development

### Local Setup

```bash
# Install dependencies
npm install

# Apply database migrations
npm run db:migrate:local

# Build the project
npm run build

# Start development server
pm2 start ecosystem.config.cjs

# Check logs
pm2 logs wedding-gift --nostream

# Stop server
pm2 delete wedding-gift
```

### Available Scripts

```bash
npm run dev                 # Vite dev server
npm run dev:sandbox         # Wrangler dev (local D1)
npm run build               # Build for production
npm run deploy              # Deploy to Cloudflare Pages
npm run deploy:prod         # Deploy with project name
npm run db:migrate:local    # Apply migrations locally
npm run db:migrate:prod     # Apply migrations to production
npm run db:console:local    # SQLite console (local)
npm run db:console:prod     # D1 console (production)
npm run clean-port          # Kill process on port 3000
```

### API Endpoints

**Public Endpoints:**
- `GET /` - User submission page
- `GET /admin` - Admin dashboard
- `GET /api/users` - Get all users
- `POST /api/submit-payment` - Submit payment (multipart/form-data)
- `GET /api/image/:key` - Get uploaded image

**Admin Endpoints (require Bearer token):**
- `POST /api/admin/login` - Admin login
- `GET /api/admin/dashboard` - Dashboard data
- `GET /api/admin/payment/:id` - Payment details
- `POST /api/admin/update-payment` - Update payment status

## 📦 Deployment

### Deploy to Cloudflare Pages

1. **Setup Cloudflare API key**:
   ```bash
   # Go to Deploy tab and configure API key
   # Or run: npx wrangler login
   ```

2. **Create production database**:
   ```bash
   npx wrangler d1 create wedding-gift-production
   # Copy database_id to wrangler.jsonc
   ```

3. **Create R2 bucket**:
   ```bash
   npx wrangler r2 bucket create wedding-gift-uploads
   ```

4. **Apply migrations**:
   ```bash
   npm run db:migrate:prod
   ```

5. **Create Cloudflare Pages project**:
   ```bash
   npx wrangler pages project create wedding-gift \
     --production-branch main \
     --compatibility-date 2026-02-07
   ```

6. **Deploy**:
   ```bash
   npm run deploy:prod
   ```

7. **Access your site**:
   - Production: `https://wedding-gift.pages.dev`
   - Branch: `https://main.wedding-gift.pages.dev`

### Enable Cloudflare AI (Optional)

To enable automatic OCR verification:

1. Uncomment AI binding in `wrangler.jsonc`:
   ```jsonc
   "ai": {
     "binding": "AI"
   }
   ```

2. Update `src/index.tsx` type:
   ```typescript
   type Bindings = {
     AI: Ai  // Remove the ?
   }
   ```

3. Rebuild and redeploy

## 🎨 Customization

### Update Sample Users

Edit `migrations/0001_initial_schema.sql` to add your actual 102 coursemates:

```sql
INSERT INTO users (user_id, name, roll_no, phone) VALUES
('U001', 'Full Name', 'Roll No', 'Phone Number'),
('U002', 'Another Name', 'Roll No', 'Phone Number'),
-- Add all 102 users...
```

Then re-run migrations:
```bash
npm run db:migrate:local
```

### Change Admin Password

Update the password in `migrations/0001_initial_schema.sql`:
```sql
INSERT INTO settings (admin_password_hash, event_name, deadline) 
VALUES ('your_secure_password', 'Wedding Gift Contribution', '2026-02-15');
```

**Note**: In production, implement proper password hashing (bcrypt).

### Customize Required Amount

Update in settings table:
```sql
UPDATE settings SET required_amount = 5000 WHERE id = 1;
```

## 🔒 Security Notes

⚠️ **Current Implementation**:
- Admin password stored in plain text (development only)
- Simple token-based authentication
- No rate limiting

✅ **Production Recommendations**:
1. Implement bcrypt password hashing
2. Use JWT tokens with expiration
3. Add rate limiting on login endpoint
4. Enable HTTPS only
5. Add CSRF protection
6. Implement session management
7. Add audit logging

## 📝 Testing

### Manual Testing Checklist

**User Flow:**
- [ ] Can view homepage with form
- [ ] Dropdown shows all users
- [ ] Can upload image (preview works)
- [ ] Submit shows success message
- [ ] Duplicate submission is prevented
- [ ] Paid users are marked in dropdown

**Admin Flow:**
- [ ] Can login to admin dashboard
- [ ] Statistics display correctly
- [ ] Can filter by status
- [ ] Can review individual payments
- [ ] Can approve/reject payments
- [ ] Approved payments update user status
- [ ] Can logout

## 🐛 Troubleshooting

**Server won't start:**
```bash
# Clean port and restart
npm run clean-port
pm2 delete all
npm run build
pm2 start ecosystem.config.cjs
```

**Database errors:**
```bash
# Reset local database
rm -rf .wrangler/state/v3/d1
npm run db:migrate:local
```

**Build errors:**
```bash
# Clear cache and rebuild
rm -rf dist node_modules
npm install
npm run build
```

## 📈 Future Enhancements

- [ ] Email notifications to pending users
- [ ] WhatsApp integration for reminders
- [ ] Export payment data to Excel/PDF
- [ ] QR code generation for easy access
- [ ] Multi-language support
- [ ] Payment gateway integration
- [ ] Automated deadline enforcement
- [ ] Real-time WebSocket updates
- [ ] Mobile app version

## 📄 License

This project is created for educational purposes.

## 🤝 Support

For issues or questions, contact the admin at [your-email@example.com]

---

**Built with ❤️ using Hono + Cloudflare Workers**

Last Updated: 2026-02-07
