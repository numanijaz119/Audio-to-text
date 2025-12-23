# Backend Code Examples & Explanations

## Table of Contents
1. [Complete Request-Response Cycle](#complete-request-response-cycle)
2. [Service Layer Patterns](#service-layer-patterns)
3. [Database Operations](#database-operations)
4. [Error Handling Patterns](#error-handling-patterns)
5. [Testing Examples](#testing-examples)

---

## 1. Complete Request-Response Cycle

### Example: Creating a Transcription

**Step 1: Client Request**
```javascript
// Frontend (React)
const response = await api.post('/transcriptions/', {
  audio_file_id: '123e4567-e89b-12d3-a456-426614174000',
  language: 'english'
});
```

**Step 2: HTTP Request**
```http
POST /api/transcriptions/ HTTP/1.1
Host: localhost:8000
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
Content-Type: application/json

{
  "audio_file_id": "123e4567-e89b-12d3-a456-426614174000",
  "language": "english"
}
```

**Step 3: Django Middleware Processing**
```python
# 1. SecurityMiddleware
# - Checks HTTPS (in production)
# - Sets security headers

# 2. SessionMiddleware
# - Manages session data (not used for API)

# 3. CorsMiddleware
# - Checks Origin header
# - Adds CORS headers if allowed

# 4. CsrfMiddleware
# - Skipped for API (uses JWT instead)

# 5. AuthenticationMiddleware
# - Extracts JWT from Authorization header
# - Validates token signature
# - Loads user from database
# - Sets request.user
```

**Step 4: URL Routing**
```python
# AudioText/urls.py
urlpatterns = [
    path('api/', include('api.urls')),
]

# api/urls.py
router = DefaultRouter()
router.register(r'transcriptions', TranscriptionViewSet, basename='transcription')

urlpatterns = [
    path('', include(router.urls)),
]

# Routes to: TranscriptionViewSet.create()
```

**Step 5: View Layer**
```python
class TranscriptionViewSet(viewsets.ModelViewSet):
    serializer_class = TranscriptionSerializer
    permission_classes = [IsAuthenticated]
    
    def create(self, request):
        """
        Handle POST /api/transcriptions/
        """
        try:
            # Validate input
            serializer = TranscriptionCreateSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            # validated_data = {
            #     'audio_file_id': UUID('123e4567...'),
            #     'language': 'english'
            # }
            
            # Call service layer
            transcription = TranscriptionService.create_transcription(
                serializer.validated_data['audio_file_id'],
                serializer.validated_data['language'],
                request.user  # Authenticated user from JWT
            )
            
            # Process transcription (in production, use Celery)
            TranscriptionService.process_transcription(transcription)
            
            # Serialize response
            result_serializer = TranscriptionSerializer(transcription)
            return Response(result_serializer.data, status=201)
            
        except ValueError as e:
            return Response({'error': str(e)}, status=400)
        except Exception as e:
            return Response({'error': 'Internal server error'}, status=500)
```

**Step 6: Service Layer**
```python
class TranscriptionService:
    @staticmethod
    def create_transcription(audio_file_id, language, user):
        # Get audio file
        try:
            audio_file = AudioFile.objects.get(id=audio_file_id, user=user)
        except AudioFile.DoesNotExist:
            raise ValueError("Audio file not found")
        
        # Check balance
        has_balance, estimated_cost = WalletService.check_sufficient_balance(
            user,
            float(audio_file.duration)
        )
        
        if not has_balance:
            raise ValueError("Insufficient balance. Please recharge your wallet.")
        
        # Create transcription record
        transcription = Transcription.objects.create(
            user=user,
            audio_file=audio_file,
            language=language,
            duration=audio_file.duration,
            cost=estimated_cost,
            status='pending'
        )
        
        return transcription
```

**Step 7: Database Queries**
```sql
-- Get audio file
SELECT * FROM audio_files 
WHERE id = '123e4567-e89b-12d3-a456-426614174000' 
AND user_id = 'user-uuid';

-- Get wallet
SELECT * FROM wallets WHERE user_id = 'user-uuid';

-- Create transcription
INSERT INTO transcriptions (
    id, user_id, audio_file_id, language, 
    duration, cost, status, created_at
) VALUES (
    'new-uuid', 'user-uuid', 'audio-uuid', 'english',
    15.5, 7.50, 'pending', NOW()
);
```

**Step 8: Response**
```http
HTTP/1.1 201 Created
Content-Type: application/json

{
  "id": "456e7890-e89b-12d3-a456-426614174001",
  "audio_file": "123e4567-e89b-12d3-a456-426614174000",
  "audio_filename": "meeting.mp3",
  "language": "english",
  "text": "",
  "duration": 15.5,
  "cost": 7.50,
  "status": "pending",
  "created_at": "2024-12-21T10:30:00Z",
  "completed_at": null
}
```

---


## 2. Service Layer Patterns

### Pattern 1: Get or Create with Initialization

```python
@staticmethod
@transaction.atomic
def get_or_create_user(email, name, provider, provider_id):
    """
    Atomically get existing user or create new user with wallet.
    
    Why @transaction.atomic?
    - Ensures user and wallet are created together
    - If wallet creation fails, user creation is rolled back
    - Database is never left in inconsistent state
    """
    user, created = User.objects.get_or_create(
        provider=provider,
        provider_id=provider_id,
        defaults={
            'email': email,
            'name': name,
        }
    )
    
    if created:
        # New user - initialize wallet
        Wallet.objects.create(
            user=user,
            demo_minutes_remaining=Decimal('10.00')
        )
    
    return user, created

# Usage
user, is_new = AuthService.get_or_create_user(
    'user@example.com',
    'John Doe',
    'google',
    'google_123'
)

if is_new:
    print("Welcome! You have 10 free demo minutes!")
else:
    print("Welcome back!")
```

### Pattern 2: Balance Check Before Operation

```python
@staticmethod
def check_sufficient_balance(user, duration_minutes):
    """
    Check if user can afford transcription.
    Returns (has_balance, cost) tuple.
    
    Why return both?
    - Caller knows if operation can proceed
    - Caller knows exact cost to display to user
    """
    wallet = user.wallet
    cost = WalletService.calculate_cost(
        duration_minutes,
        wallet.demo_minutes_remaining
    )
    
    # Check demo minutes
    if wallet.demo_minutes_remaining >= Decimal(str(duration_minutes)):
        return True, cost  # Fully covered by demo
    
    # Check wallet balance for remaining amount
    remaining_duration = (
        Decimal(str(duration_minutes)) - 
        wallet.demo_minutes_remaining
    )
    remaining_cost = remaining_duration * Decimal('1.00')
    
    return wallet.balance >= remaining_cost, cost

# Usage
has_balance, cost = WalletService.check_sufficient_balance(user, 15.5)

if not has_balance:
    raise ValueError(f"Insufficient balance. Need ₹{cost}, have ₹{user.wallet.balance}")

print(f"Transcription will cost ₹{cost}")
```

### Pattern 3: Atomic Deduction with Audit Trail

```python
@staticmethod
@transaction.atomic
def deduct_transcription_cost(user, duration_minutes):
    """
    Atomically deduct cost and create transaction record.
    
    Key features:
    1. select_for_update() prevents race conditions
    2. Demo minutes deducted first (priority billing)
    3. Transaction record for audit trail
    4. All-or-nothing (atomic)
    """
    # Lock wallet row
    wallet = Wallet.objects.select_for_update().get(user=user)
    
    duration = Decimal(str(duration_minutes))
    duration_rounded = Decimal(math.ceil(float(duration)))
    
    # Save state for transaction record
    balance_before = wallet.balance
    demo_before = wallet.demo_minutes_remaining
    
    # Deduct demo minutes first
    if wallet.demo_minutes_remaining > 0:
        demo_used = min(wallet.demo_minutes_remaining, duration_rounded)
        wallet.demo_minutes_remaining -= demo_used
        duration_rounded -= demo_used
    
    # Deduct remaining from balance
    cost = Decimal('0.00')
    if duration_rounded > 0:
        cost = duration_rounded * Decimal('1.00')
        wallet.balance -= cost
        wallet.total_spent += cost
    
    wallet.total_minutes_used += Decimal(str(duration_minutes))
    wallet.save()
    
    # Create audit trail
    transaction_obj = Transaction.objects.create(
        wallet=wallet,
        type='debit',
        amount=cost,
        balance_before=balance_before,
        balance_after=wallet.balance,
        description=f'Transcription: {duration_minutes:.2f} min (Demo: {demo_before:.2f} → {wallet.demo_minutes_remaining:.2f})'
    )
    
    return transaction_obj, cost

# Usage
try:
    transaction, cost = WalletService.deduct_transcription_cost(user, 15.5)
    print(f"Deducted ₹{cost}. New balance: ₹{user.wallet.balance}")
except Exception as e:
    print(f"Deduction failed: {e}")
    # Wallet unchanged due to rollback
```

### Pattern 4: External API with Error Handling

```python
@staticmethod
@transaction.atomic
def process_transcription(transcription):
    """
    Process transcription with proper error handling.
    
    Error scenarios:
    1. File not found → Mark failed, no cost
    2. API error → Mark failed, no cost
    3. Success → Mark completed, deduct cost
    """
    try:
        # Update status
        transcription.status = 'processing'
        transcription.save()
        
        # Get file path
        audio_path = os.path.join(
            settings.MEDIA_ROOT,
            transcription.audio_file.file_path
        )
        
        if not os.path.exists(audio_path):
            raise FileNotFoundError("Audio file not found on disk")
        
        # Call external API
        client = OpenAI(api_key=settings.OPENAI_API_KEY)
        
        with open(audio_path, 'rb') as audio_file:
            language_code = 'en' if transcription.language == 'english' else 'hi'
            
            response = client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                language=language_code,
                response_format="text"
            )
        
        # Success - deduct cost
        transaction_obj, actual_cost = WalletService.deduct_transcription_cost(
            transcription.user,
            float(transcription.duration)
        )
        
        # Update transcription
        transcription.text = response
        transcription.cost = actual_cost
        transcription.status = 'completed'
        transcription.completed_at = timezone.now()
        transcription.save()
        
        return transcription
        
    except (FileNotFoundError, OpenAIError) as e:
        # Mark as failed, DON'T deduct cost
        transcription.status = 'failed'
        transcription.error_message = str(e)
        transcription.save()
        raise e

# Usage
try:
    result = TranscriptionService.process_transcription(transcription)
    print(f"Success: {result.text[:100]}...")
except FileNotFoundError:
    print("Error: Audio file not found")
except OpenAIError:
    print("Error: Transcription service unavailable")
```

---

## 3. Database Operations

### Query Optimization

```python
# BAD: N+1 Query Problem
transcriptions = Transcription.objects.filter(user=user)
for t in transcriptions:
    print(t.audio_file.filename)  # Queries DB each time!
    # Query 1: SELECT * FROM transcriptions WHERE user_id=?
    # Query 2: SELECT * FROM audio_files WHERE id=?
    # Query 3: SELECT * FROM audio_files WHERE id=?
    # ... N more queries

# GOOD: Use select_related for ForeignKey
transcriptions = Transcription.objects.filter(user=user).select_related('audio_file')
for t in transcriptions:
    print(t.audio_file.filename)  # Already loaded!
    # Query 1: SELECT * FROM transcriptions 
    #          JOIN audio_files ON transcriptions.audio_file_id = audio_files.id
    #          WHERE user_id=?
    # Only 1 query!

# GOOD: Use prefetch_related for reverse ForeignKey
users = User.objects.prefetch_related('transcriptions')
for user in users:
    for t in user.transcriptions.all():  # Already loaded!
        print(t.id)
```

### Bulk Operations

```python
# BAD: Multiple INSERT queries
for i in range(100):
    Transaction.objects.create(
        wallet=wallet,
        type='debit',
        amount=1.00,
        ...
    )
# 100 separate INSERT queries!

# GOOD: Single bulk INSERT
transactions = [
    Transaction(
        wallet=wallet,
        type='debit',
        amount=1.00,
        ...
    )
    for i in range(100)
]
Transaction.objects.bulk_create(transactions)
# 1 INSERT query with 100 rows!
```

### Aggregation

```python
from django.db.models import Sum, Count, Avg

# Get total spent by user
total_spent = Transaction.objects.filter(
    wallet__user=user,
    type='debit'
).aggregate(total=Sum('amount'))
# SQL: SELECT SUM(amount) FROM transactions WHERE ...

# Get transcription statistics
stats = Transcription.objects.filter(user=user).aggregate(
    total_count=Count('id'),
    total_duration=Sum('duration'),
    avg_cost=Avg('cost')
)
# {
#     'total_count': 25,
#     'total_duration': Decimal('387.5'),
#     'avg_cost': Decimal('8.50')
# }
```

### Complex Queries

```python
from django.db.models import Q, F

# OR conditions
transcriptions = Transcription.objects.filter(
    Q(status='completed') | Q(status='processing')
)
# SQL: WHERE status='completed' OR status='processing'

# Field comparison
expensive_transcriptions = Transcription.objects.filter(
    cost__gt=F('duration')  # cost > duration
)
# SQL: WHERE cost > duration

# Annotations
from django.db.models import Case, When, Value

transcriptions = Transcription.objects.annotate(
    cost_category=Case(
        When(cost=0, then=Value('free')),
        When(cost__lt=10, then=Value('cheap')),
        default=Value('expensive')
    )
)
```

---

