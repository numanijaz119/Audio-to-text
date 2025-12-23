# Complete Flow Diagrams

## 1. User Registration & Login Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    NEW USER REGISTRATION                         │
└─────────────────────────────────────────────────────────────────┘

User clicks "Login with Google"
         │
         ▼
Frontend redirects to Google OAuth
         │
         ▼
User authorizes app on Google
         │
         ▼
Google returns: { email, name, provider_id }
         │
         ▼
Frontend sends to: POST /api/auth/google/login/
         │
         ▼
Backend: views.google_login()
         │
         ├─ Validate input (email, name, provider_id)
         │
         ▼
Backend: AuthService.authenticate_oauth_user()
         │
         ├─ AuthService.get_or_create_user()
         │  │
         │  ├─ User.objects.get_or_create()
         │  │  └─ SQL: SELECT * FROM users WHERE provider='google' AND provider_id='123'
         │  │
         │  ├─ User NOT found → Create new user
         │  │  └─ SQL: INSERT INTO users (id, email, name, provider, provider_id)
         │  │
         │  ├─ Initialize wallet with 10 demo minutes
         │  │  └─ SQL: INSERT INTO wallets (user_id, balance=0, demo_minutes=10)
         │  │
         │  └─ Return (user, created=True)
         │
         ├─ AuthService.generate_tokens(user)
         │  │
         │  ├─ Create refresh token (expires 30 days)
         │  ├─ Create access token (expires 7 days)
         │  └─ Return { access, refresh }
         │
         └─ Return { user, tokens, is_new_user=True }
         │
         ▼
Backend: UserSerializer(user).data
         │
         ▼
Response: {
  user: { id, email, name, demo_minutes: 10, balance: 0 },
  tokens: { access: "eyJ...", refresh: "eyJ..." },
  is_new_user: true
}
         │
         ▼
Frontend: Store tokens in localStorage
         │
         ▼
Frontend: Redirect to Dashboard
```

---

## 2. Audio Upload & Transcription Flow

```
┌─────────────────────────────────────────────────────────────────┐
│              COMPLETE TRANSCRIPTION WORKFLOW                     │
└─────────────────────────────────────────────────────────────────┘

User drags audio file to upload area
         │
         ▼
Frontend: Validate file (client-side)
         │
         ├─ Check file type (mp3, wav, m4a, flac, ogg)
         ├─ Check file size (< 100MB)
         └─ Show preview
         │
         ▼
User clicks "Upload"
         │
         ▼
Frontend: POST /api/audio/ (multipart/form-data)
         │
         ▼
Backend: AudioFileViewSet.create()
         │
         ├─ Extract file from request.FILES
         │
         ▼
Backend: AudioService.store_audio_file(file, user)
         │
         ├─ Step 1: Validate format
         │  └─ Check extension in ALLOWED_FORMATS
         │
         ├─ Step 2: Generate unique filename
         │  └─ filename = f"{uuid.uuid4()}.{ext}"
         │
         ├─ Step 3: Save to disk
         │  └─ path = media/audio_files/{user_id}/{filename}
         │  └─ default_storage.save(path, file)
         │
         ├─ Step 4: Extract duration
         │  ├─ Try mutagen (read metadata)
         │  └─ Fallback to pydub (decode audio)
         │  └─ duration = 15.5 minutes
         │
         ├─ Step 5: Validate duration
         │  └─ if duration > 60: raise ValueError
         │
         ├─ Step 6: Create database record
         │  └─ SQL: INSERT INTO audio_files (id, user_id, filename, duration, size, format)
         │
         └─ Return AudioFile object
         │
         ▼
Backend: Calculate estimated cost
         │
         ├─ WalletService.check_sufficient_balance(user, 15.5)
         │  │
         │  ├─ Get wallet: user.wallet
         │  ├─ demo_minutes = 10.0
         │  ├─ duration_rounded = 16 minutes (ceil)
         │  ├─ demo_covers = 10 minutes
         │  ├─ billable = 16 - 10 = 6 minutes
         │  ├─ cost = 6 * ₹1 = ₹6.00
         │  └─ has_balance = (wallet.balance >= ₹6.00)
         │
         └─ Return { audio_file, estimated_cost: 6.00, has_sufficient_balance: true }
         │
         ▼
Frontend: Display success + estimated cost
         │
         ▼
User selects language (English/Hindi)
         │
         ▼
User clicks "Start Transcription"
         │
         ▼
Frontend: POST /api/transcriptions/
Body: { audio_file_id, language: "english" }
         │
         ▼
Backend: TranscriptionViewSet.create()
         │
         ├─ Validate input (TranscriptionCreateSerializer)
         │
         ▼
Backend: TranscriptionService.create_transcription()
         │
         ├─ Get audio file
         │  └─ SQL: SELECT * FROM audio_files WHERE id=? AND user_id=?
         │
         ├─ Check balance
         │  └─ WalletService.check_sufficient_balance(user, 15.5)
         │  └─ If insufficient: raise ValueError
         │
         ├─ Create transcription record
         │  └─ SQL: INSERT INTO transcriptions (
         │       id, user_id, audio_file_id, language,
         │       duration=15.5, cost=6.00, status='pending'
         │     )
         │
         └─ Return Transcription object (status='pending')
         │
         ▼
Backend: TranscriptionService.process_transcription()
         │
         ├─ Update status to 'processing'
         │  └─ SQL: UPDATE transcriptions SET status='processing' WHERE id=?
         │
         ├─ Get audio file path
         │  └─ path = media/audio_files/{user_id}/{filename}
         │
         ├─ Call OpenAI Whisper API
         │  │
         │  ├─ Open file: with open(path, 'rb') as f
         │  │
         │  ├─ API call: client.audio.transcriptions.create(
         │  │     model="whisper-1",
         │  │     file=f,
         │  │     language="en"
         │  │   )
         │  │
         │  └─ Response: "This is the transcribed text..."
         │
         ├─ Deduct cost from wallet
         │  │
         │  ├─ WalletService.deduct_transcription_cost(user, 15.5)
         │  │  │
         │  │  ├─ BEGIN TRANSACTION
         │  │  │
         │  │  ├─ Lock wallet: SELECT * FROM wallets WHERE user_id=? FOR UPDATE
         │  │  │
         │  │  ├─ Deduct demo minutes first:
         │  │  │  └─ demo_used = min(10, 16) = 10
         │  │  │  └─ demo_remaining = 10 - 10 = 0
         │  │  │  └─ duration_remaining = 16 - 10 = 6
         │  │  │
         │  │  ├─ Deduct from balance:
         │  │  │  └─ cost = 6 * ₹1 = ₹6.00
         │  │  │  └─ balance = ₹100.00 - ₹6.00 = ₹94.00
         │  │  │
         │  │  ├─ Update wallet:
         │  │  │  └─ SQL: UPDATE wallets SET
         │  │  │       balance=94.00,
         │  │  │       demo_minutes_remaining=0,
         │  │  │       total_spent=total_spent+6.00,
         │  │  │       total_minutes_used=total_minutes_used+15.5
         │  │  │
         │  │  ├─ Create transaction record:
         │  │  │  └─ SQL: INSERT INTO transactions (
         │  │  │       wallet_id, type='debit', amount=6.00,
         │  │  │       balance_before=100.00, balance_after=94.00
         │  │  │     )
         │  │  │
         │  │  └─ COMMIT TRANSACTION
         │  │
         │  └─ Return (transaction, cost=6.00)
         │
         ├─ Update transcription with result
         │  └─ SQL: UPDATE transcriptions SET
         │       text="This is the transcribed text...",
         │       cost=6.00,
         │       status='completed',
         │       completed_at=NOW()
         │
         └─ Return Transcription object (status='completed')
         │
         ▼
Response: {
  id, audio_file_id, audio_filename,
  language: "english",
  text: "This is the transcribed text...",
  duration: 15.5,
  cost: 6.00,
  status: "completed",
  created_at, completed_at
}
         │
         ▼
Frontend: Display transcription result
         │
         ├─ Show text in textarea
         ├─ Enable "Copy" button
         └─ Enable "Download" button
```

---


## 3. Wallet Recharge Flow (Razorpay)

```
┌─────────────────────────────────────────────────────────────────┐
│                    WALLET RECHARGE FLOW                          │
└─────────────────────────────────────────────────────────────────┘

User clicks "Recharge ₹500"
         │
         ▼
Frontend: POST /api/wallet/create_order/
Body: { amount: 500 }
         │
         ▼
Backend: WalletViewSet.create_order()
         │
         ├─ Validate amount > 0
         │
         ▼
Backend: PaymentService.create_order(500, user)
         │
         ├─ Initialize Razorpay client
         │  └─ client = razorpay.Client(auth=(KEY_ID, KEY_SECRET))
         │
         ├─ Convert to paise
         │  └─ amount_paise = 500 * 100 = 50000
         │
         ├─ Create order data
         │  └─ {
         │       amount: 50000,
         │       currency: "INR",
         │       receipt: "order_{user_id}",
         │       notes: { user_id, user_email }
         │     }
         │
         ├─ Call Razorpay API
         │  │
         │  ├─ POST https://api.razorpay.com/v1/orders
         │  │  Authorization: Basic base64(key_id:key_secret)
         │  │  Body: { amount: 50000, currency: "INR", ... }
         │  │
         │  └─ Response: {
         │       id: "order_EKwxwAgItmmXdp",
         │       amount: 50000,
         │       currency: "INR",
         │       status: "created"
         │     }
         │
         └─ Return {
              order_id: "order_EKwxwAgItmmXdp",
              amount: 500,
              currency: "INR",
              key_id: RAZORPAY_KEY_ID
            }
         │
         ▼
Frontend: Initialize Razorpay checkout
         │
         ├─ const razorpay = new Razorpay({
         │    key: order.key_id,
         │    amount: order.amount * 100,
         │    order_id: order.order_id,
         │    handler: (response) => { ... }
         │  })
         │
         └─ razorpay.open()  // Opens payment modal
         │
         ▼
User enters card details in Razorpay modal
         │
         ▼
User clicks "Pay"
         │
         ▼
Razorpay processes payment
         │
         ├─ Validates card
         ├─ Charges card
         └─ Generates payment_id and signature
         │
         ▼
Razorpay calls handler with:
{
  razorpay_order_id: "order_EKwxwAgItmmXdp",
  razorpay_payment_id: "pay_EKwxwAgItmmXdp",
  razorpay_signature: "abc123..."
}
         │
         ▼
Frontend: POST /api/wallet/verify_payment/
Body: {
  order_id: "order_EKwxwAgItmmXdp",
  payment_id: "pay_EKwxwAgItmmXdp",
  signature: "abc123...",
  amount: 500
}
         │
         ▼
Backend: WalletViewSet.verify_payment()
         │
         ├─ Extract data from request
         │
         ▼
Backend: PaymentService.verify_payment_signature()
         │
         ├─ Generate expected signature
         │  │
         │  ├─ message = "order_EKwxwAgItmmXdp|pay_EKwxwAgItmmXdp"
         │  │
         │  ├─ expected_signature = HMAC-SHA256(
         │  │    message,
         │  │    RAZORPAY_KEY_SECRET
         │  │  )
         │  │
         │  └─ Compare: hmac.compare_digest(expected, provided)
         │
         ├─ If invalid: return 400 Bad Request
         │
         ▼
Backend: WalletService.process_recharge(user, 500, payment_id, order_id)
         │
         ├─ BEGIN TRANSACTION
         │
         ├─ Lock wallet
         │  └─ SQL: SELECT * FROM wallets WHERE user_id=? FOR UPDATE
         │
         ├─ Read current balance
         │  └─ balance_before = ₹94.00
         │
         ├─ Credit wallet
         │  └─ balance_after = ₹94.00 + ₹500.00 = ₹594.00
         │
         ├─ Update wallet
         │  └─ SQL: UPDATE wallets SET balance=594.00 WHERE id=?
         │
         ├─ Create transaction record
         │  └─ SQL: INSERT INTO transactions (
         │       wallet_id, type='recharge', amount=500.00,
         │       balance_before=94.00, balance_after=594.00,
         │       payment_id="pay_EKwxwAgItmmXdp",
         │       razorpay_order_id="order_EKwxwAgItmmXdp",
         │       description="Wallet recharge via Razorpay"
         │     )
         │
         └─ COMMIT TRANSACTION
         │
         ▼
Response: {
  message: "Payment verified and wallet credited",
  transaction: {
    id, type: "recharge", amount: 500.00,
    balance_before: 94.00, balance_after: 594.00,
    created_at
  }
}
         │
         ▼
Frontend: Show success message
         │
         ├─ "Payment successful! ₹500 added to wallet"
         ├─ Refresh wallet balance
         └─ Refresh transaction history
```

---

## 4. Error Handling Flow

```
┌─────────────────────────────────────────────────────────────────┐
│              ERROR HANDLING IN TRANSCRIPTION                     │
└─────────────────────────────────────────────────────────────────┘

User uploads 70-minute audio file
         │
         ▼
Frontend: POST /api/audio/
         │
         ▼
Backend: AudioService.store_audio_file()
         │
         ├─ Validate format ✓
         ├─ Save file ✓
         ├─ Extract duration = 70 minutes
         │
         ├─ Validate duration
         │  └─ if duration > 60: raise ValueError
         │
         ├─ Delete uploaded file
         │  └─ default_storage.delete(file_path)
         │
         └─ raise ValueError("Audio exceeds 1 hour limit")
         │
         ▼
Backend: AudioFileViewSet.create() catches ValueError
         │
         └─ return Response(
              {'error': 'Audio exceeds 1 hour limit'},
              status=400
            )
         │
         ▼
Frontend: Display error message
         │
         └─ "Error: Audio exceeds 1 hour limit"


┌─────────────────────────────────────────────────────────────────┐
│           INSUFFICIENT BALANCE ERROR                             │
└─────────────────────────────────────────────────────────────────┘

User has ₹5 balance, 0 demo minutes
User tries to transcribe 10-minute audio
         │
         ▼
Frontend: POST /api/transcriptions/
         │
         ▼
Backend: TranscriptionService.create_transcription()
         │
         ├─ Get audio file (10 minutes)
         │
         ├─ Check balance
         │  │
         │  ├─ WalletService.check_sufficient_balance(user, 10)
         │  │  │
         │  │  ├─ demo_minutes = 0
         │  │  ├─ duration_rounded = 10
         │  │  ├─ cost = 10 * ₹1 = ₹10.00
         │  │  ├─ wallet.balance = ₹5.00
         │  │  └─ has_balance = (₹5.00 >= ₹10.00) = False
         │  │
         │  └─ Return (False, ₹10.00)
         │
         └─ raise ValueError("Insufficient balance. Please recharge your wallet.")
         │
         ▼
Backend: TranscriptionViewSet.create() catches ValueError
         │
         └─ return Response(
              {'error': 'Insufficient balance. Please recharge your wallet.'},
              status=400
            )
         │
         ▼
Frontend: Display error + recharge prompt
         │
         ├─ "Error: Insufficient balance"
         └─ Show "Recharge Wallet" button


┌─────────────────────────────────────────────────────────────────┐
│           TRANSCRIPTION API FAILURE                              │
└─────────────────────────────────────────────────────────────────┘

User starts transcription
         │
         ▼
Backend: TranscriptionService.process_transcription()
         │
         ├─ Update status = 'processing' ✓
         ├─ Get audio file path ✓
         │
         ├─ Call OpenAI API
         │  │
         │  └─ OpenAI API returns 500 Internal Server Error
         │     raise OpenAIError("API unavailable")
         │
         ▼
Backend: Exception caught in process_transcription()
         │
         ├─ Update transcription:
         │  └─ status = 'failed'
         │  └─ error_message = "API unavailable"
         │  └─ SQL: UPDATE transcriptions SET status='failed', error_message='...'
         │
         ├─ NOTE: Wallet is NOT debited (no wallet.save() called)
         │
         └─ raise OpenAIError
         │
         ▼
Backend: TranscriptionViewSet.create() catches OpenAIError
         │
         └─ return Response(
              {'error': 'Transcription service unavailable'},
              status=503
            )
         │
         ▼
Frontend: Display error
         │
         └─ "Error: Transcription service unavailable. Please try again."


┌─────────────────────────────────────────────────────────────────┐
│           RACE CONDITION PREVENTION                              │
└─────────────────────────────────────────────────────────────────┘

Two requests try to deduct from same wallet simultaneously

Request 1: Transcribe 10-minute audio
Request 2: Transcribe 15-minute audio
Wallet balance: ₹20.00

WITHOUT select_for_update():
─────────────────────────────
Request 1: Read balance = ₹20.00
Request 2: Read balance = ₹20.00  (reads old value!)
Request 1: Deduct ₹10, save balance = ₹10.00
Request 2: Deduct ₹15, save balance = ₹5.00  (WRONG! Should be -₹5)

WITH select_for_update():
─────────────────────────
Request 1: SELECT * FROM wallets WHERE id=? FOR UPDATE  (locks row)
Request 1: Read balance = ₹20.00
Request 1: Deduct ₹10, save balance = ₹10.00
Request 1: COMMIT (releases lock)

Request 2: SELECT * FROM wallets WHERE id=? FOR UPDATE  (waits for lock)
Request 2: Read balance = ₹10.00  (correct value!)
Request 2: Deduct ₹15, balance would be -₹5
Request 2: Check: if balance < 0: raise ValueError
Request 2: ROLLBACK
Request 2: Return error: "Insufficient balance"
```

---

## 5. Database Transaction Flow

```
┌─────────────────────────────────────────────────────────────────┐
│              ATOMIC TRANSACTION EXAMPLE                          │
└─────────────────────────────────────────────────────────────────┘

@transaction.atomic
def deduct_transcription_cost(user, duration):
    # All operations in one transaction
    
    BEGIN TRANSACTION;
    ├─ SELECT * FROM wallets WHERE user_id=? FOR UPDATE;
    ├─ UPDATE wallets SET balance=..., demo_minutes=..., ...;
    ├─ INSERT INTO transactions (...) VALUES (...);
    COMMIT;
    
    # If ANY operation fails, ALL are rolled back


SUCCESS SCENARIO:
─────────────────
1. BEGIN TRANSACTION
2. Lock wallet row
3. Read: balance=₹100, demo=10
4. Calculate: cost=₹7
5. Update wallet: balance=₹93, demo=0
6. Insert transaction record
7. COMMIT
   └─ All changes saved to database
   └─ Lock released


FAILURE SCENARIO (Insufficient Balance):
────────────────────────────────────────
1. BEGIN TRANSACTION
2. Lock wallet row
3. Read: balance=₹5, demo=0
4. Calculate: cost=₹10
5. Check: if balance < cost: raise ValueError
6. ROLLBACK
   └─ No changes saved to database
   └─ Lock released
   └─ Wallet still has ₹5


FAILURE SCENARIO (Database Error):
──────────────────────────────────
1. BEGIN TRANSACTION
2. Lock wallet row
3. Read: balance=₹100, demo=10
4. Update wallet: balance=₹93, demo=0
5. Insert transaction: DATABASE CONNECTION LOST
6. ROLLBACK (automatic)
   └─ Wallet update is undone
   └─ Balance still ₹100
   └─ Lock released
```

This comprehensive documentation covers every aspect of how the backend works, from high-level architecture to low-level implementation details!