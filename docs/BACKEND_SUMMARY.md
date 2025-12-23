# Backend Technical Summary

## Quick Reference

### Architecture Layers

```
Client (Frontend)
    ↓ HTTP/JSON
API Layer (Views)
    ↓ Python Objects
Service Layer (Business Logic)
    ↓ ORM Queries
Model Layer (Django ORM)
    ↓ SQL
Database (MySQL/SQLite)
```

### Key Technologies

- **Framework**: Django 5.x + Django REST Framework
- **Database**: MySQL (production) / SQLite (development)
- **Authentication**: JWT (Simple JWT) + OAuth (django-allauth)
- **External APIs**: OpenAI Whisper, Razorpay
- **File Handling**: mutagen, pydub

---

## Core Concepts

### 1. Models (Database Schema)

**User**: OAuth-based authentication
- UUID primary key
- Email, name, provider (google/facebook)
- No password (OAuth only)

**Wallet**: Financial tracking
- OneToOne with User
- Decimal fields for accuracy
- Tracks balance, demo minutes, totals

**Transaction**: Audit trail
- Immutable records
- balance_before/after for verification
- Links to payment_id for reconciliation

**AudioFile**: Uploaded files
- Stores metadata (duration, size, format)
- File path for physical file
- Linked to user

**Transcription**: Processing records
- Status tracking (pending/processing/completed/failed)
- Stores result text
- Links to audio file and user

### 2. Services (Business Logic)

**AuthService**
- OAuth user creation/retrieval
- JWT token generation
- Wallet initialization

**WalletService**
- Balance checking
- Cost calculation
- Demo minutes priority
- Transaction creation

**AudioService**
- File validation
- Duration extraction
- Storage management

**TranscriptionService**
- Whisper API integration
- Status management
- Error handling

**PaymentService**
- Razorpay order creation
- Signature verification
- Webhook handling

### 3. API Endpoints

**Authentication**
- `POST /api/auth/google/login/` - Google OAuth
- `POST /api/auth/facebook/login/` - Facebook OAuth
- `GET /api/auth/user/` - Current user

**Wallet**
- `GET /api/wallet/details/` - Balance & stats
- `POST /api/wallet/create_order/` - Create payment
- `POST /api/wallet/verify_payment/` - Verify payment

**Audio**
- `POST /api/audio/` - Upload file
- `GET /api/audio/` - List files
- `DELETE /api/audio/{id}/` - Delete file

**Transcriptions**
- `POST /api/transcriptions/` - Create transcription
- `GET /api/transcriptions/` - List with filters
- `GET /api/transcriptions/{id}/download/` - Download text
- `GET /api/transcriptions/export_csv/` - Export CSV

---

## Key Patterns

### 1. Atomic Transactions

```python
@transaction.atomic
def operation():
    # All operations succeed or all fail
    model1.save()
    model2.save()
    # If error: both rolled back
```

### 2. Row Locking

```python
wallet = Wallet.objects.select_for_update().get(user=user)
# Prevents race conditions
# Other requests wait until lock released
```

### 3. Demo Minutes Priority

```
Total: 15 minutes
Demo available: 10 minutes
─────────────────────────
Demo used: 10 minutes
Wallet charged: 5 minutes × ₹1 = ₹5
```

### 4. Error Handling

```python
try:
    # Operation
except SpecificError:
    # Handle specific case
except Exception:
    # Handle unexpected
    # Log for debugging
```

---

## Data Flow Examples

### User Registration

```
1. Google OAuth → email, name, provider_id
2. get_or_create_user()
3. If new: Create User + Wallet (10 demo min)
4. Generate JWT tokens
5. Return user + tokens
```

### Audio Upload

```
1. Receive file
2. Validate format & size
3. Save to disk (media/audio_files/{user_id}/{uuid}.ext)
4. Extract duration (mutagen/pydub)
5. Validate duration (< 60 min)
6. Create AudioFile record
7. Calculate estimated cost
8. Return file info + cost
```

### Transcription

```
1. Check balance
2. Create Transcription (status='pending')
3. Update status='processing'
4. Call OpenAI Whisper API
5. Deduct cost (demo first, then wallet)
6. Update status='completed' + text
7. Create Transaction record
8. Return transcription
```

### Payment

```
1. Create Razorpay order
2. User pays in Razorpay modal
3. Razorpay returns payment_id + signature
4. Verify signature (HMAC-SHA256)
5. Credit wallet
6. Create Transaction record
7. Return confirmation
```

---

## Security Features

### 1. Authentication
- JWT tokens (signed, can't be tampered)
- OAuth (no password storage)
- Token expiry (7 days access, 30 days refresh)

### 2. Authorization
- User can only access own data
- Queryset filtering by user
- Permission classes

### 3. Input Validation
- Serializers validate types
- File format validation
- Duration limits
- Amount validation

### 4. Payment Security
- Signature verification
- HMAC-SHA256
- Timing-attack safe comparison

### 5. Database Security
- ORM prevents SQL injection
- Parameterized queries
- Constraint enforcement

### 6. File Security
- UUID filenames
- User-specific directories
- Format validation
- Size limits

---

## Performance Optimizations

### 1. Database Indexes
```python
class Meta:
    indexes = [
        models.Index(fields=['email']),
        models.Index(fields=['created_at']),
    ]
```

### 2. Query Optimization
```python
# Use select_related for ForeignKey
.select_related('audio_file')

# Use prefetch_related for reverse FK
.prefetch_related('transcriptions')
```

### 3. Pagination
```python
# Returns 20 items per page
REST_FRAMEWORK = {
    'PAGE_SIZE': 20,
}
```

### 4. Decimal for Money
```python
# Exact calculations
balance = Decimal('100.00')
cost = Decimal('7.50')
new_balance = balance - cost  # Exact!
```

---

## Error Scenarios

### 1. Insufficient Balance
```
Check → Insufficient → Raise ValueError → 400 Bad Request
No wallet deduction
```

### 2. File Too Large
```
Validate → Too large → Delete file → Raise ValueError → 400
No database record
```

### 3. API Failure
```
Call API → Error → Mark failed → No wallet deduction → 503
Transcription record exists with status='failed'
```

### 4. Race Condition
```
select_for_update() → Lock row → Process → Release lock
Second request waits for lock
```

---

## Testing Strategy

### Unit Tests
```python
def test_calculate_cost():
    cost = WalletService.calculate_cost(15, 10)
    assert cost == Decimal('5.00')
```

### Integration Tests
```python
def test_create_transcription():
    response = client.post('/api/transcriptions/', data)
    assert response.status_code == 201
    assert Transcription.objects.count() == 1
```

### Property-Based Tests
```python
@given(duration=floats(min_value=0, max_value=60))
def test_cost_never_negative(duration):
    cost = WalletService.calculate_cost(duration, 10)
    assert cost >= 0
```

---

## Production Considerations

### 1. Async Processing
```python
# Use Celery for transcription
@shared_task
def process_transcription_task(transcription_id):
    transcription = Transcription.objects.get(id=transcription_id)
    TranscriptionService.process_transcription(transcription)
```

### 2. Caching
```python
# Cache wallet balance
cache.set(f'wallet_{user_id}', balance, timeout=300)
```

### 3. Monitoring
```python
# Log errors
logger.error(f"Transcription failed: {e}", exc_info=True)

# Track metrics
statsd.increment('transcription.success')
```

### 4. Scaling
- Read replicas for database
- CDN for media files
- Load balancer for API
- Redis for caching
- Celery workers for tasks

---

## Summary

The backend is built with:

✅ **Clean Architecture**: Layered, testable, maintainable
✅ **ACID Compliance**: Data consistency guaranteed
✅ **Security**: JWT, OAuth, payment verification
✅ **Error Handling**: Comprehensive, user-friendly
✅ **Performance**: Optimized queries, indexes
✅ **Scalability**: Service layer, async-ready
✅ **Best Practices**: Type safety, documentation

**Ready for production deployment!**
