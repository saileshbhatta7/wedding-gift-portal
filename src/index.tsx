import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'

type Bindings = {
  DB: D1Database
  STORAGE: R2Bucket
  AI?: Ai
}

const app = new Hono<{ Bindings: Bindings }>()

// Enable CORS
app.use('/api/*', cors())

// Serve static files
app.use('/static/*', serveStatic({ root: './public' }))

// ==================== HOMEPAGE ====================
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Wedding Gift Contribution Portal</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-gradient-to-br from-pink-50 to-purple-50 min-h-screen">
        <div class="max-w-2xl mx-auto p-6">
            <!-- Header -->
            <div class="text-center mb-8 mt-12">
                <div class="text-6xl mb-4">💑</div>
                <h1 class="text-4xl font-bold text-purple-900 mb-2">Wedding Gift Contribution</h1>
                <p class="text-gray-600">Please upload your payment proof of Rs. 2000</p>
            </div>

            <!-- Submission Form -->
            <div class="bg-white rounded-2xl shadow-xl p-8 mb-6">
                <form id="submissionForm" class="space-y-6">
                    <!-- Name Selection -->
                    <div>
                        <label class="block text-gray-700 font-semibold mb-2">
                            <i class="fas fa-user mr-2"></i>Select Your Name
                        </label>
                        <select id="userName" required class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                            <option value="">-- Choose your name --</option>
                        </select>
                    </div>

                    <!-- Payment Method -->
                    <div>
                        <label class="block text-gray-700 font-semibold mb-2">
                            <i class="fas fa-credit-card mr-2"></i>Payment Method
                        </label>
                        <select id="paymentMethod" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                            <option value="eSewa">eSewa</option>
                            <option value="Khalti">Khalti</option>
                            <option value="Bank Transfer">Bank Transfer</option>
                            <option value="UPI">UPI</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <!-- File Upload -->
                    <div>
                        <label class="block text-gray-700 font-semibold mb-2">
                            <i class="fas fa-upload mr-2"></i>Upload Payment Screenshot
                        </label>
                        <div class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-500 transition cursor-pointer" id="dropZone">
                            <input type="file" id="screenshot" accept="image/*" required class="hidden">
                            <div id="uploadText">
                                <i class="fas fa-cloud-upload-alt text-5xl text-gray-400 mb-3"></i>
                                <p class="text-gray-600">Click to upload or drag and drop</p>
                                <p class="text-sm text-gray-500 mt-2">JPG, PNG (Max 5MB)</p>
                            </div>
                            <div id="previewArea" class="hidden">
                                <img id="previewImage" class="max-w-full h-48 mx-auto rounded-lg">
                                <p id="fileName" class="text-sm text-gray-600 mt-2"></p>
                            </div>
                        </div>
                    </div>

                    <!-- Submit Button -->
                    <button type="submit" id="submitBtn" class="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-lg font-bold text-lg hover:from-purple-700 hover:to-pink-700 transition shadow-lg">
                        <i class="fas fa-check-circle mr-2"></i>Submit Payment
                    </button>
                </form>

                <!-- Success Message -->
                <div id="successMessage" class="hidden mt-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
                    <i class="fas fa-check-circle mr-2"></i>
                    <strong>Thank you!</strong> Your payment is under verification.
                </div>

                <!-- Error Message -->
                <div id="errorMessage" class="hidden mt-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                    <i class="fas fa-exclamation-circle mr-2"></i>
                    <span id="errorText"></span>
                </div>
            </div>

            <!-- Admin Link -->
            <div class="text-center">
                <a href="/admin" class="text-purple-600 hover:text-purple-800 text-sm">
                    <i class="fas fa-lock mr-1"></i>Admin Dashboard
                </a>
            </div>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
            // Load users
            async function loadUsers() {
                try {
                    const response = await axios.get('/api/users');
                    const users = response.data;
                    const select = document.getElementById('userName');
                    users.forEach(user => {
                        const option = document.createElement('option');
                        option.value = user.user_id;
                        option.textContent = user.name + (user.roll_no ? ' (Roll: ' + user.roll_no + ')' : '');
                        if (user.has_paid) {
                            option.textContent += ' ✓ Paid';
                            option.disabled = true;
                        }
                        select.appendChild(option);
                    });
                } catch (error) {
                    console.error('Error loading users:', error);
                }
            }

            // File upload handling
            const dropZone = document.getElementById('dropZone');
            const fileInput = document.getElementById('screenshot');
            const uploadText = document.getElementById('uploadText');
            const previewArea = document.getElementById('previewArea');
            const previewImage = document.getElementById('previewImage');
            const fileName = document.getElementById('fileName');

            dropZone.addEventListener('click', () => fileInput.click());

            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    if (file.size > 5 * 1024 * 1024) {
                        alert('File size must be less than 5MB');
                        return;
                    }
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        previewImage.src = e.target.result;
                        fileName.textContent = file.name;
                        uploadText.classList.add('hidden');
                        previewArea.classList.remove('hidden');
                    };
                    reader.readAsDataURL(file);
                }
            });

            // Form submission
            document.getElementById('submissionForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const userId = document.getElementById('userName').value;
                const paymentMethod = document.getElementById('paymentMethod').value;
                const screenshot = fileInput.files[0];

                if (!userId || !screenshot) {
                    alert('Please fill all required fields');
                    return;
                }

                const submitBtn = document.getElementById('submitBtn');
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Submitting...';

                try {
                    const formData = new FormData();
                    formData.append('user_id', userId);
                    formData.append('payment_method', paymentMethod);
                    formData.append('screenshot', screenshot);

                    const response = await axios.post('/api/submit-payment', formData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });

                    document.getElementById('successMessage').classList.remove('hidden');
                    document.getElementById('submissionForm').reset();
                    uploadText.classList.remove('hidden');
                    previewArea.classList.add('hidden');
                    
                    setTimeout(() => {
                        location.reload();
                    }, 2000);
                } catch (error) {
                    document.getElementById('errorMessage').classList.remove('hidden');
                    document.getElementById('errorText').textContent = error.response?.data?.error || 'Submission failed. Please try again.';
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<i class="fas fa-check-circle mr-2"></i>Submit Payment';
                }
            });

            // Initialize
            loadUsers();
        </script>
    </body>
    </html>
  `)
})

// ==================== ADMIN DASHBOARD ====================
app.get('/admin', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Admin Dashboard - Wedding Gift Portal</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-gray-100">
        <!-- Login Modal -->
        <div id="loginModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white rounded-lg p-8 max-w-md w-full mx-4">
                <h2 class="text-2xl font-bold mb-4 text-center">
                    <i class="fas fa-lock text-purple-600 mr-2"></i>Admin Login
                </h2>
                <form id="loginForm">
                    <input type="password" id="adminPassword" placeholder="Enter admin password" 
                           class="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-purple-500">
                    <button type="submit" class="w-full bg-purple-600 text-white py-3 rounded-lg font-bold hover:bg-purple-700">
                        Login
                    </button>
                </form>
                <p id="loginError" class="hidden text-red-600 text-sm mt-2"></p>
            </div>
        </div>

        <!-- Dashboard Content -->
        <div id="dashboardContent" class="hidden">
            <nav class="bg-white shadow-lg">
                <div class="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
                    <h1 class="text-2xl font-bold text-purple-900">
                        <i class="fas fa-chart-line mr-2"></i>Admin Dashboard
                    </h1>
                    <button onclick="logout()" class="text-red-600 hover:text-red-800">
                        <i class="fas fa-sign-out-alt mr-1"></i>Logout
                    </button>
                </div>
            </nav>

            <div class="max-w-7xl mx-auto px-4 py-8">
                <!-- Statistics Cards -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div class="bg-white rounded-lg shadow-lg p-6">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-gray-600 text-sm">Total Collected</p>
                                <p class="text-3xl font-bold text-green-600" id="totalCollected">₹0</p>
                            </div>
                            <i class="fas fa-money-bill-wave text-4xl text-green-200"></i>
                        </div>
                    </div>
                    <div class="bg-white rounded-lg shadow-lg p-6">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-gray-600 text-sm">Paid</p>
                                <p class="text-3xl font-bold text-blue-600" id="paidCount">0</p>
                            </div>
                            <i class="fas fa-check-circle text-4xl text-blue-200"></i>
                        </div>
                    </div>
                    <div class="bg-white rounded-lg shadow-lg p-6">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-gray-600 text-sm">Pending</p>
                                <p class="text-3xl font-bold text-yellow-600" id="pendingCount">0</p>
                            </div>
                            <i class="fas fa-clock text-4xl text-yellow-200"></i>
                        </div>
                    </div>
                    <div class="bg-white rounded-lg shadow-lg p-6">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-gray-600 text-sm">Need Review</p>
                                <p class="text-3xl font-bold text-red-600" id="reviewCount">0</p>
                            </div>
                            <i class="fas fa-exclamation-circle text-4xl text-red-200"></i>
                        </div>
                    </div>
                </div>

                <!-- Progress Bar -->
                <div class="bg-white rounded-lg shadow-lg p-6 mb-8">
                    <div class="flex justify-between items-center mb-2">
                        <span class="text-gray-700 font-semibold">Overall Progress</span>
                        <span class="text-gray-600" id="progressText">0 / 102</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-4">
                        <div id="progressBar" class="bg-gradient-to-r from-purple-600 to-pink-600 h-4 rounded-full transition-all" style="width: 0%"></div>
                    </div>
                </div>

                <!-- Filters -->
                <div class="bg-white rounded-lg shadow-lg p-6 mb-8">
                    <div class="flex flex-wrap gap-3">
                        <button onclick="filterPayments('ALL')" class="filter-btn bg-purple-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-purple-700">
                            All
                        </button>
                        <button onclick="filterPayments('PAID')" class="filter-btn bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700">
                            Paid
                        </button>
                        <button onclick="filterPayments('PENDING')" class="filter-btn bg-yellow-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-yellow-700">
                            Pending
                        </button>
                        <button onclick="filterPayments('NEEDS_REVIEW')" class="filter-btn bg-red-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-red-700">
                            Need Review
                        </button>
                    </div>
                </div>

                <!-- Payments Table -->
                <div class="bg-white rounded-lg shadow-lg overflow-hidden">
                    <div class="overflow-x-auto">
                        <table class="w-full">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Roll No</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submitted</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody id="paymentsTable" class="divide-y divide-gray-200">
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>

        <!-- Review Modal -->
        <div id="reviewModal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div class="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                <div class="p-6">
                    <div class="flex justify-between items-center mb-4">
                        <h2 class="text-2xl font-bold" id="reviewName"></h2>
                        <button onclick="closeReviewModal()" class="text-gray-500 hover:text-gray-700">
                            <i class="fas fa-times text-2xl"></i>
                        </button>
                    </div>
                    
                    <div class="mb-4">
                        <img id="reviewImage" class="w-full rounded-lg border" alt="Payment Screenshot">
                    </div>

                    <div class="bg-gray-50 rounded-lg p-4 mb-4">
                        <h3 class="font-semibold mb-2">OCR Analysis Result:</h3>
                        <p class="text-sm text-gray-700">
                            <strong>Detected Amount:</strong> ₹<span id="reviewAmount">-</span><br>
                            <strong>Confidence:</strong> <span id="reviewConfidence">-</span>%<br>
                            <strong>Payment Method:</strong> <span id="reviewMethod">-</span><br>
                            <strong>Submitted:</strong> <span id="reviewTime">-</span>
                        </p>
                        <details class="mt-2">
                            <summary class="cursor-pointer text-sm text-purple-600">View OCR Raw Text</summary>
                            <pre id="reviewRawText" class="text-xs bg-white p-2 mt-2 rounded border overflow-auto"></pre>
                        </details>
                    </div>

                    <div class="mb-4">
                        <label class="block text-sm font-semibold mb-2">Admin Comment:</label>
                        <textarea id="adminComment" rows="3" class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"></textarea>
                    </div>

                    <div class="flex gap-3">
                        <button onclick="updatePaymentStatus('PAID')" class="flex-1 bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700">
                            <i class="fas fa-check mr-2"></i>Approve
                        </button>
                        <button onclick="updatePaymentStatus('REJECTED')" class="flex-1 bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-700">
                            <i class="fas fa-times mr-2"></i>Reject
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
            let currentFilter = 'ALL';
            let currentPaymentId = null;
            let adminToken = localStorage.getItem('adminToken');

            // Login
            document.getElementById('loginForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                const password = document.getElementById('adminPassword').value;
                
                try {
                    const response = await axios.post('/api/admin/login', { password });
                    adminToken = response.data.token;
                    localStorage.setItem('adminToken', adminToken);
                    document.getElementById('loginModal').classList.add('hidden');
                    document.getElementById('dashboardContent').classList.remove('hidden');
                    loadDashboard();
                } catch (error) {
                    document.getElementById('loginError').classList.remove('hidden');
                    document.getElementById('loginError').textContent = 'Invalid password';
                }
            });

            // Logout
            function logout() {
                localStorage.removeItem('adminToken');
                location.reload();
            }

            // Check if already logged in
            if (adminToken) {
                document.getElementById('loginModal').classList.add('hidden');
                document.getElementById('dashboardContent').classList.remove('hidden');
                loadDashboard();
            }

            // Load dashboard data
            async function loadDashboard() {
                try {
                    const response = await axios.get('/api/admin/dashboard', {
                        headers: { 'Authorization': 'Bearer ' + adminToken }
                    });
                    
                    const data = response.data;
                    
                    // Update statistics
                    document.getElementById('totalCollected').textContent = '₹' + (data.stats.paid * 2000).toLocaleString();
                    document.getElementById('paidCount').textContent = data.stats.paid;
                    document.getElementById('pendingCount').textContent = data.stats.pending;
                    document.getElementById('reviewCount').textContent = data.stats.needs_review;
                    
                    // Update progress
                    const progress = (data.stats.paid / data.stats.total) * 100;
                    document.getElementById('progressBar').style.width = progress + '%';
                    document.getElementById('progressText').textContent = data.stats.paid + ' / ' + data.stats.total;
                    
                    // Load payments
                    renderPayments(data.payments);
                } catch (error) {
                    console.error('Error loading dashboard:', error);
                    if (error.response?.status === 401) {
                        logout();
                    }
                }
            }

            // Render payments table
            function renderPayments(payments) {
                const tbody = document.getElementById('paymentsTable');
                tbody.innerHTML = '';
                
                const filtered = currentFilter === 'ALL' 
                    ? payments 
                    : payments.filter(p => p.status === currentFilter);
                
                filtered.forEach(payment => {
                    const statusColors = {
                        'PAID': 'bg-green-100 text-green-800',
                        'PENDING': 'bg-yellow-100 text-yellow-800',
                        'NEEDS_REVIEW': 'bg-red-100 text-red-800',
                        'REJECTED': 'bg-gray-100 text-gray-800'
                    };
                    
                    const row = document.createElement('tr');
                    row.className = 'hover:bg-gray-50';
                    row.innerHTML = \`
                        <td class="px-6 py-4 text-sm font-medium text-gray-900">\${payment.name}</td>
                        <td class="px-6 py-4 text-sm text-gray-500">\${payment.roll_no || '-'}</td>
                        <td class="px-6 py-4">
                            <span class="px-2 py-1 text-xs font-semibold rounded-full \${statusColors[payment.status] || 'bg-gray-100'}">
                                \${payment.status}
                            </span>
                        </td>
                        <td class="px-6 py-4 text-sm text-gray-900">
                            \${payment.ocr_detected_amount ? '₹' + payment.ocr_detected_amount : '-'}
                        </td>
                        <td class="px-6 py-4 text-sm text-gray-500">\${payment.payment_method || '-'}</td>
                        <td class="px-6 py-4 text-sm text-gray-500">
                            \${payment.submitted_at ? new Date(payment.submitted_at).toLocaleString() : '-'}
                        </td>
                        <td class="px-6 py-4 text-sm">
                            \${payment.payment_id ? \`
                                <button onclick="openReviewModal('\${payment.payment_id}')" 
                                        class="text-purple-600 hover:text-purple-800 font-semibold">
                                    <i class="fas fa-eye mr-1"></i>Review
                                </button>
                            \` : '<span class="text-gray-400">Not submitted</span>'}
                        </td>
                    \`;
                    tbody.appendChild(row);
                });
            }

            // Filter payments
            function filterPayments(status) {
                currentFilter = status;
                loadDashboard();
            }

            // Open review modal
            async function openReviewModal(paymentId) {
                currentPaymentId = paymentId;
                
                try {
                    const response = await axios.get('/api/admin/payment/' + paymentId, {
                        headers: { 'Authorization': 'Bearer ' + adminToken }
                    });
                    
                    const payment = response.data;
                    
                    document.getElementById('reviewName').textContent = payment.name;
                    document.getElementById('reviewImage').src = payment.uploaded_image_url;
                    document.getElementById('reviewAmount').textContent = payment.ocr_detected_amount || '-';
                    document.getElementById('reviewConfidence').textContent = payment.ocr_confidence ? (payment.ocr_confidence * 100).toFixed(1) : '-';
                    document.getElementById('reviewMethod').textContent = payment.payment_method || '-';
                    document.getElementById('reviewTime').textContent = new Date(payment.submitted_at).toLocaleString();
                    document.getElementById('reviewRawText').textContent = payment.ocr_raw_text || 'No OCR data';
                    document.getElementById('adminComment').value = payment.admin_comment || '';
                    
                    document.getElementById('reviewModal').classList.remove('hidden');
                } catch (error) {
                    console.error('Error loading payment:', error);
                }
            }

            // Close review modal
            function closeReviewModal() {
                document.getElementById('reviewModal').classList.add('hidden');
                currentPaymentId = null;
            }

            // Update payment status
            async function updatePaymentStatus(status) {
                const comment = document.getElementById('adminComment').value;
                
                try {
                    await axios.post('/api/admin/update-payment', {
                        payment_id: currentPaymentId,
                        status: status,
                        admin_comment: comment
                    }, {
                        headers: { 'Authorization': 'Bearer ' + adminToken }
                    });
                    
                    closeReviewModal();
                    loadDashboard();
                } catch (error) {
                    console.error('Error updating payment:', error);
                    alert('Failed to update payment status');
                }
            }
        </script>
    </body>
    </html>
  `)
})

// ==================== API ROUTES ====================

// Get all users
app.get('/api/users', async (c) => {
  const { DB } = c.env
  
  try {
    const { results } = await DB.prepare(`
      SELECT user_id, name, roll_no, has_paid 
      FROM users 
      ORDER BY name
    `).all()
    
    return c.json(results)
  } catch (error) {
    return c.json({ error: 'Failed to fetch users' }, 500)
  }
})

// Submit payment
app.post('/api/submit-payment', async (c) => {
  const { DB, STORAGE, AI } = c.env
  
  try {
    const formData = await c.req.formData()
    const userId = formData.get('user_id')
    const paymentMethod = formData.get('payment_method')
    const screenshot = formData.get('screenshot')
    
    if (!userId || !screenshot) {
      return c.json({ error: 'Missing required fields' }, 400)
    }
    
    // Check if user already paid
    const { results: existingPayments } = await DB.prepare(`
      SELECT payment_id FROM payments WHERE user_id = ? AND status != 'REJECTED'
    `).bind(userId).all()
    
    if (existingPayments.length > 0) {
      return c.json({ error: 'You have already submitted a payment' }, 400)
    }
    
    // Generate payment ID
    const paymentId = 'P' + Date.now() + Math.random().toString(36).substr(2, 9)
    
    // Upload to R2
    const imageKey = `payments/${paymentId}_${screenshot.name}`
    await STORAGE.put(imageKey, screenshot)
    const imageUrl = `/api/image/${imageKey}`
    
    // Convert image to base64 for OCR
    const arrayBuffer = await screenshot.arrayBuffer()
    const base64Image = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))
    
    // Perform OCR using Cloudflare AI or simple text detection
    let ocrAmount = null
    let ocrConfidence = null
    let ocrRawText = ''
    
    try {
      if (AI) {
        const aiResponse = await AI.run('@cf/meta/llama-3.2-11b-vision-instruct', {
          image: Array.from(new Uint8Array(arrayBuffer)),
          prompt: "Extract the payment amount from this payment screenshot. Look for amounts like '2000', 'Rs. 2000', 'NPR 2000', '₹2000'. Return only the numeric amount.",
          max_tokens: 50
        })
        
        ocrRawText = aiResponse.response || ''
        
        // Extract amount from OCR text
        const amountMatch = ocrRawText.match(/\b2000\b|\b2,000\b/)
        if (amountMatch) {
          ocrAmount = 2000
          ocrConfidence = 0.85
        } else {
          ocrConfidence = 0.5
        }
      } else {
        // Fallback: mark for manual review
        ocrRawText = 'Manual verification required (AI not available)'
        ocrConfidence = 0.0
      }
    } catch (error) {
      console.error('OCR failed:', error)
      ocrRawText = 'OCR processing failed'
    }
    
    // Determine status
    let status = 'PENDING'
    if (ocrAmount === 2000 && ocrConfidence >= 0.8) {
      status = 'PAID'
    } else if (ocrConfidence < 0.8) {
      status = 'NEEDS_REVIEW'
    }
    
    // Insert payment record
    await DB.prepare(`
      INSERT INTO payments (payment_id, user_id, uploaded_image_url, ocr_detected_amount, 
                          ocr_confidence, ocr_raw_text, status, payment_method)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      paymentId, userId, imageUrl, ocrAmount, ocrConfidence, 
      ocrRawText, status, paymentMethod
    ).run()
    
    // Update user record
    if (status === 'PAID') {
      await DB.prepare(`
        UPDATE users SET has_paid = 1, last_submission_id = ? WHERE user_id = ?
      `).bind(paymentId, userId).run()
    } else {
      await DB.prepare(`
        UPDATE users SET last_submission_id = ? WHERE user_id = ?
      `).bind(paymentId, userId).run()
    }
    
    return c.json({ 
      success: true, 
      payment_id: paymentId,
      status: status,
      ocr_detected_amount: ocrAmount
    })
  } catch (error) {
    console.error('Submission error:', error)
    return c.json({ error: 'Submission failed: ' + error.message }, 500)
  }
})

// Get image from R2
app.get('/api/image/:key{.+}', async (c) => {
  const { STORAGE } = c.env
  const key = c.req.param('key')
  
  try {
    const object = await STORAGE.get(key)
    if (!object) {
      return c.notFound()
    }
    
    return new Response(object.body, {
      headers: {
        'Content-Type': object.httpMetadata?.contentType || 'image/jpeg',
        'Cache-Control': 'public, max-age=3600'
      }
    })
  } catch (error) {
    return c.json({ error: 'Image not found' }, 404)
  }
})

// Admin login
app.post('/api/admin/login', async (c) => {
  const { DB } = c.env
  const { password } = await c.req.json()
  
  try {
    const { results } = await DB.prepare(`
      SELECT admin_password_hash FROM settings LIMIT 1
    `).all()
    
    if (results.length === 0 || results[0].admin_password_hash !== password) {
      return c.json({ error: 'Invalid password' }, 401)
    }
    
    // In production, use proper JWT tokens
    const token = 'admin_' + Date.now()
    return c.json({ token })
  } catch (error) {
    return c.json({ error: 'Login failed' }, 500)
  }
})

// Admin dashboard data
app.get('/api/admin/dashboard', async (c) => {
  const { DB } = c.env
  const auth = c.req.header('Authorization')
  
  if (!auth || !auth.startsWith('Bearer admin_')) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  
  try {
    // Get statistics
    const { results: stats } = await DB.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN has_paid = 1 THEN 1 ELSE 0 END) as paid,
        SUM(CASE WHEN has_paid = 0 AND last_submission_id IS NULL THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN has_paid = 0 AND last_submission_id IS NOT NULL THEN 1 ELSE 0 END) as needs_review
      FROM users
    `).all()
    
    // Get all payments with user details
    const { results: payments } = await DB.prepare(`
      SELECT 
        u.user_id, u.name, u.roll_no, u.has_paid,
        p.payment_id, p.uploaded_image_url, p.ocr_detected_amount, 
        p.ocr_confidence, p.status, p.payment_method, p.submitted_at
      FROM users u
      LEFT JOIN payments p ON u.last_submission_id = p.payment_id
      ORDER BY p.submitted_at DESC NULLS LAST, u.name
    `).all()
    
    return c.json({
      stats: stats[0],
      payments: payments
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    return c.json({ error: 'Failed to load dashboard' }, 500)
  }
})

// Get payment details
app.get('/api/admin/payment/:id', async (c) => {
  const { DB } = c.env
  const auth = c.req.header('Authorization')
  const paymentId = c.req.param('id')
  
  if (!auth || !auth.startsWith('Bearer admin_')) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  
  try {
    const { results } = await DB.prepare(`
      SELECT 
        p.*, u.name, u.roll_no
      FROM payments p
      JOIN users u ON p.user_id = u.user_id
      WHERE p.payment_id = ?
    `).bind(paymentId).all()
    
    if (results.length === 0) {
      return c.json({ error: 'Payment not found' }, 404)
    }
    
    return c.json(results[0])
  } catch (error) {
    return c.json({ error: 'Failed to load payment' }, 500)
  }
})

// Update payment status
app.post('/api/admin/update-payment', async (c) => {
  const { DB } = c.env
  const auth = c.req.header('Authorization')
  
  if (!auth || !auth.startsWith('Bearer admin_')) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  
  try {
    const { payment_id, status, admin_comment } = await c.req.json()
    
    // Update payment
    await DB.prepare(`
      UPDATE payments 
      SET status = ?, admin_comment = ?, reviewed_by_admin = 1
      WHERE payment_id = ?
    `).bind(status, admin_comment, payment_id).run()
    
    // Update user if payment is approved
    if (status === 'PAID') {
      const { results } = await DB.prepare(`
        SELECT user_id FROM payments WHERE payment_id = ?
      `).bind(payment_id).all()
      
      if (results.length > 0) {
        await DB.prepare(`
          UPDATE users SET has_paid = 1 WHERE user_id = ?
        `).bind(results[0].user_id).run()
      }
    }
    
    return c.json({ success: true })
  } catch (error) {
    console.error('Update error:', error)
    return c.json({ error: 'Failed to update payment' }, 500)
  }
})

export default app
