# AudioScribe User Flow Analysis

## Overview
AudioScribe is an audio transcription application with OAuth authentication, file upload, AI-powered transcription, wallet-based payment system, and transaction history tracking.

---

## 1. AUTHENTICATION FLOW (Login/Signup)

### Entry Point
- **Frontend**: `LandingPage.tsx` → `LoginModal.tsx`
- **Backend**: `views.py` → `google_login()` / `facebook_login()`

### Flow Diagram
```
User clicks "Sign In" 
    ↓
LoginModal opens with OAuth options
    ↓
User selects Google or Facebook
    ↓
OAuth provider redirects with auth code
    ↓
Frontend sends to backend: {email, name, provider_id}
    ↓
Backend: AuthService.authenticate_oauth_user()
    ├─ User.objects.get_or_create(provider, provider_id)
    ├─ If new user: Create Wallet with 10 demo minutes
    └─ Generate JWT tokens (access + refresh)
    ↓
Frontend stores tokens in localStorage
    ↓
User redirected to TranscribePage
```

### Key Components

**Frontend (useAuth.tsx)**
- `AuthProvider`: Context wrapper for auth state
- `loginWithGoogle()`: Uses @react-oauth/google
- `loginWithFacebook()`: Uses Facebook SDK
- Token storage: localStorage (access_token, refresh_token)
- Auto-refresh: Interceptor handles 401 responses

**Backend (AuthService)**
- `authenticate_oauth_user()`: Handles OAuth user creation
- `get_or_create_user()`: Creates user + wallet atomically
- `generate_tokens()`: Creates JWT access/refresh tokens
- Database: User model with provider + provider_id unique constraint

### Data Models
```python
User:
  - id (UUID)
  - email (unique)
  - name
  - provider ('google' or 'facebook')
  - provider_id (OAuth ID)
  - is_active, is_staff
  - created_at, updated_at

Wallet (created on signup):
  - balance: ₹0.00
  - demo_minutes_remaining: 10.00
  - total_spent: ₹0.00
  - total_minutes_used: 0.00
```

### API Endpoints
- `POST /api/auth/google/login/` → LoginResponse
- `POST /api/auth/facebook/login/` → LoginResponse
- `GET /api/auth/user/` → User (requires auth)

---

## 2. FILE UPLOAD PROCESS

### Entry Point
- **Frontend**: `TranscribePage.tsx` → Dropzone component
- **Backend**: `views.py` → `AudioFileViewSet.create()`

### Flow Diagram
```
User drags/selects audio file
    ↓
Frontend validates:
  - Format (MP3, WAV, M4A, FLAC, OGG)
  - Size (max 100MB)
    ↓
File upload with progress tracking
    ↓
Backend: AudioService.store_audio_file()
    ├─ Save file to media storage
    ├─ Extract duration using ffmpeg
    └─ Create AudioFile record
    ↓
Backend calculates estimated cost:
  - WalletService.check_sufficient_balance()
  - Cost = (duration - demo_minutes) * ₹1/min
    ↓
Response includes:
  - audio_file (id, filename, duration, size, format)
  - estimated_cost
  - has_sufficient_balance
    ↓
Frontend displays file info + cost estimate
```

### Key Components

**Frontend (TranscribePage.tsx)**
- `useDropzone()`: Drag-drop file handling
- `validateFile()`: Format + size validation
- `handleFileSelect()`: Upload with progress
- State: selectedFile, audioFile, uploadProgress, estimatedCost

**Backend (AudioService)**
- `store_audio_file()`: Saves file + extracts metadata
- File storage: Django media folder
- Duration extraction: ffmpeg integration

### Data Models
```python
AudioFile:
  - id (UUID)
  - user (ForeignKey)
  - filename
  - file_path
  - duration (decimal minutes)
  - size (bytes)
  - format (mp3, wav, etc.)
  - uploaded_at
```

### API Endpoints
- `POST /api/audio/` → AudioUploadResponse (multipart/form-data)
- `GET /api/audio/` → List[AudioFile]
- `DELETE /api/audio/{id}/` → 204 No Content

---

## 3. TRANSCRIPTION WORKFLOW

### Entry Point
- **Frontend**: `TranscribePage.tsx` → "Start Transcription" button
- **Backend**: `views.py` → `TranscriptionViewSet.create()`

### Flow Diagram
```
User selects language + clicks "Start Transcription"
    ↓
Frontend checks balance:
  - If insufficient: Show WalletModal
  - If sufficient: Proceed
    ↓
Backend: TranscriptionService.create_transcription()
    ├─ Check balance (WalletService.check_sufficient_balance())
    ├─ Create Transcription record (status='pending')
    └─ Deduct cost (WalletService.deduct_transcription_cost())
       ├─ Use demo minutes first
       ├─ Then use wallet balance
       └─ Create Transaction record
    ↓
Async processing (Celery or sync fallback):
    ├─ Download audio file
    ├─ Call OpenAI Whisper API
    ├─ Update Transcription (status='completed', text=result)
    └─ Handle errors (status='failed', error_message)
    ↓
Frontend polls for status (every 5 seconds, max 5 minutes)
    ↓
When completed:
  - Display transcription text
  - Show copy + download buttons
  - Refresh wallet balance
```

### Key Components

**Frontend (TranscribePage.tsx)**
- `handleTranscribe()`: Initiates transcription
- `pollTranscriptionStatus()`: Polls every 5s for completion
- States: idle → uploaded → processing → completed/error
- Display: Waveform animation during processing

**Backend (TranscriptionService)**
- `create_transcription()`: Creates record + deducts cost
- `process_transcription()`: Calls OpenAI Whisper
- `generate_download_file()`: Formats text for download
- Celery task: `process_transcription_task.delay()`

### Cost Calculation Logic
```python
# Example: 15.3 minute audio, 8.5 demo minutes available
duration_rounded = ceil(15.3) = 16 minutes
demo_used = min(8.5, 16) = 8.5 minutes
billable_minutes = 16 - 8.5 = 7.5 minutes
cost = 7.5 * ₹1 = ₹7.50

# Wallet deduction:
balance_before = ₹100.00
balance_after = ₹100.00 - ₹7.50 = ₹92.50
demo_remaining = 8.5 - 8.5 = 0.00
```

### Data Models
```python
Transcription:
  - id (UUID)
  - user (ForeignKey)
  - audio_file (ForeignKey)
  - language ('english' or 'hindi')
  - text (transcribed content)
  - duration (decimal minutes)
  - cost (decimal ₹)
  - status ('pending', 'processing', 'completed', 'failed')
  - error_message (if failed)
  - created_at, completed_at
```

### API Endpoints
- `POST /api/transcriptions/` → Transcription (rate limited: 20/hour)
- `GET /api/transcriptions/` → List[Transcription] (with filters)
- `GET /api/transcriptions/{id}/` → Transcription
- `GET /api/transcriptions/{id}/download/` → Blob (text file)
- `GET /api/transcriptions/export_csv/` → CSV file

---

## 4. WALLET & PAYMENT FLOW

### Entry Point
- **Frontend**: `WalletModal.tsx` → "Add Funds" button
- **Backend**: `views.py` → `WalletViewSet.create_order()` / `verify_payment()`

### Flow Diagram
```
User clicks "Add Funds"
    ↓
WalletModal opens with preset amounts (₹100, 250, 500, 1000)
    ↓
User selects amount or enters custom amount (min ₹10)
    ↓
Frontend: walletApi.createOrder(amount)
    ↓
Backend: PaymentService.create_order()
    ├─ Call Razorpay API
    ├─ Create order with amount in paise
    └─ Return order_id + key_id
    ↓
Frontend opens Razorpay checkout modal
    ↓
User enters payment details (card/UPI/etc)
    ↓
Razorpay processes payment
    ↓
On success: Frontend gets payment_id + signature
    ↓
Frontend: walletApi.verifyPayment()
    ├─ order_id
    ├─ payment_id
    ├─ signature
    └─ amount
    ↓
Backend: PaymentService.verify_payment_signature()
    ├─ Verify HMAC signature (prevents fraud)
    ├─ If valid: WalletService.process_recharge()
    │   ├─ Lock wallet row
    │   ├─ Add amount to balance
    │   ├─ Create Transaction record
    │   └─ Commit atomically
    └─ If invalid: Return 400 error
    ↓
Frontend shows success toast
    ↓
Wallet balance updated
```

### Key Components

**Frontend (WalletModal.tsx)**
- Tabs: Balance, Add Funds, History
- Preset amounts + custom input
- Razorpay integration (loads script dynamically)
- Transaction history display

**Backend (PaymentService)**
- `create_order()`: Razorpay API integration
- `verify_payment_signature()`: HMAC-SHA256 verification
- `process_recharge()`: Atomic wallet update + transaction

### Data Models
```python
Wallet:
  - balance (decimal ₹)
  - demo_minutes_remaining (decimal)
  - total_spent (decimal ₹)
  - total_minutes_used (decimal)

Transaction:
  - id (UUID)
  - wallet (ForeignKey)
  - type ('recharge', 'debit', 'demo_credit')
  - amount (decimal ₹)
  - balance_before, balance_after
  - description
  - payment_id (Razorpay)
  - razorpay_order_id
  - created_at
```

### API Endpoints
- `GET /api/wallet/details/` → WalletDetails
- `POST /api/wallet/create_order/` → PaymentOrder (rate limited: 10/hour)
- `POST /api/wallet/verify_payment/` → Transaction
- `GET /api/transactions/` → List[Transaction]

### Razorpay Integration
```javascript
// Frontend
const options = {
  key: order.key_id,
  amount: order.amount * 100,  // Convert to paise
  currency: 'INR',
  order_id: order.order_id,
  handler: async (response) => {
    // Verify on backend
    await walletApi.verifyPayment({
      order_id: response.razorpay_order_id,
      payment_id: response.razorpay_payment_id,
      signature: response.razorpay_signature,
      amount: amount
    });
  }
};
```

---

## 5. HISTORY & DOWNLOAD FEATURES

### Entry Point
- **Frontend**: `HistoryModal.tsx` (accessed from header or dropdown)
- **Backend**: `views.py` → `TranscriptionViewSet.get_queryset()` / `download()`

### Flow Diagram
```
User clicks "History" button
    ↓
HistoryModal opens
    ↓
Frontend: transcriptionApi.getAll()
    ↓
Backend returns filtered transcriptions:
  - Only user's own transcriptions
  - Optimized with select_related (no N+1 queries)
  - Ordered by created_at DESC
    ↓
Frontend displays list with:
  - Filename, duration, language, status
  - Created date, cost
  - Status badge (completed/processing/failed)
    ↓
User can:
  1. Search by filename or content
  2. Filter by status
  3. Click to view full transcription
  4. Download as text file
    ↓
Download flow:
  - User clicks download button
  - Frontend: transcriptionApi.download(id)
  - Backend: TranscriptionService.generate_download_file()
  - Returns text file blob
  - Browser downloads as transcription_{id}.txt
    ↓
Export CSV:
  - User clicks export
  - Frontend: transcriptionApi.exportCSV()
  - Backend generates CSV with all transcriptions
  - Columns: ID, Filename, Language, Duration, Cost, Status, Dates
```

### Key Components

**Frontend (HistoryModal.tsx)**
- Tabs: List view, Detail view
- Search + filter functionality
- Status icons (completed ✓, processing ⏳, failed ✗)
- Download button for completed transcriptions
- Responsive table/card layout

**Backend (TranscriptionViewSet)**
- `get_queryset()`: Optimized with select_related
- `download()`: Returns text file
- `export_csv()`: Returns CSV file
- Filters: language, status, date_from, date_to

### Query Optimization
```python
# Optimized query (no N+1 problem)
queryset = Transcription.objects.filter(
    user=self.request.user
).select_related(
    'audio_file'  # Join in single query
).only(
    'id', 'language', 'status', 'duration', 'cost',
    'created_at', 'completed_at', 'error_message',
    'audio_file__id', 'audio_file__filename'
).order_by('-created_at')
```

### API Endpoints
- `GET /api/transcriptions/` → List[Transcription]
- `GET /api/transcriptions/{id}/` → Transcription
- `GET /api/transcriptions/{id}/download/` → Blob (text file)
- `GET /api/transcriptions/export_csv/` → Blob (CSV file)

---

## COMPONENT INTERACTION MAP

```
App.tsx (Root)
├─ AuthProvider (useAuth context)
│  ├─ LandingPage (unauthenticated)
│  │  └─ LoginModal
│  │     ├─ Google OAuth
│  │     └─ Facebook OAuth
│  │
│  └─ TranscribePage (authenticated)
│     ├─ Header
│     │  ├─ Wallet Balance Display
│     │  ├─ History Button
│     │  └─ User Dropdown
│     │
│     ├─ Main Content
│     │  ├─ Dropzone (file upload)
│     │  ├─ Language Selector
│     │  ├─ Cost Estimate
│     │  ├─ Transcription Display
│     │  └─ Download/Copy Buttons
│     │
│     ├─ WalletModal
│     │  ├─ Balance Tab
│     │  ├─ Add Funds Tab (Razorpay)
│     │  └─ History Tab (Transactions)
│     │
│     └─ HistoryModal
│        ├─ Search + Filter
│        ├─ Transcription List
│        ├─ Detail View
│        └─ Download Button
```

---

## API SERVICE LAYER (Frontend)

```typescript
// api.ts - Centralized API client
- authApi: googleLogin, facebookLogin, getCurrentUser, logout
- walletApi: getDetails, createOrder, verifyPayment
- transactionApi: getAll
- audioApi: upload, getAll, delete
- transcriptionApi: create, getAll, get, download, exportCSV

// Features:
- Axios interceptors for auth token injection
- Auto token refresh on 401
- Upload progress tracking
- Error handling with toast notifications
```

---

## STATE MANAGEMENT

### Frontend (React Hooks)
- **useAuth**: User, tokens, login/logout
- **useState**: Local component state (file, transcription, modals)
- **useEffect**: Data fetching, polling
- **localStorage**: Token persistence

### Backend (Django ORM)
- **Database transactions**: Atomic operations for payments
- **select_for_update()**: Row locking for concurrent access
- **Serializers**: Data validation + transformation

---

## SECURITY FEATURES

1. **Authentication**
   - OAuth 2.0 (Google, Facebook)
   - JWT tokens (access + refresh)
   - Token refresh on 401

2. **Payment**
   - Razorpay signature verification (HMAC-SHA256)
   - Prevents fake payment confirmations

3. **Database**
   - Atomic transactions for financial operations
   - Row locking (select_for_update) for race conditions
   - Decimal fields for accurate money calculations

4. **API**
   - Rate limiting (10/hour for payments, 20/hour for transcriptions)
   - User isolation (filter by request.user)
   - CORS + CSRF protection

---

## ERROR HANDLING

### Frontend
- Toast notifications for errors
- Fallback states (error, loading)
- Validation before API calls
- Graceful degradation (sync fallback if Celery unavailable)

### Backend
- Try-catch blocks with meaningful error messages
- HTTP status codes (400, 401, 403, 500)
- Logging for debugging
- Health check endpoint

---

## PERFORMANCE OPTIMIZATIONS

1. **Database**
   - Indexes on frequently queried fields
   - select_related for foreign keys
   - only() to fetch specific fields

2. **Frontend**
   - Lazy loading of modals
   - Debounced search
   - Progress tracking for uploads

3. **API**
   - Rate limiting to prevent abuse
   - Pagination (implicit in list endpoints)
   - CSV export for bulk data

---

## FUTURE ENHANCEMENTS

1. Batch transcription processing
2. Webhook support for async notifications
3. Advanced analytics dashboard
4. Team/organization support
5. API key authentication for programmatic access
6. Scheduled transcription jobs
7. Custom vocabulary/terminology support
