import time
import logging
from functools import wraps
from django.db import transaction
from django.db.utils import OperationalError

logger = logging.getLogger('api')


def retry_on_deadlock(max_retries=3, base_delay=0.1):
    """
    Decorator to retry database operations on deadlock with exponential backoff.
    
    Args:
        max_retries: Maximum number of retry attempts
        base_delay: Base delay in seconds (doubles each retry)
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            for attempt in range(max_retries):
                try:
                    return func(*args, **kwargs)
                except OperationalError as e:
                    error_msg = str(e).lower()
                    if ('deadlock' in error_msg or 'lock wait timeout' in error_msg) and attempt < max_retries - 1:
                        delay = base_delay * (2 ** attempt)
                        logger.warning(f"Database deadlock detected in {func.__name__}, retrying in {delay}s (attempt {attempt + 1}/{max_retries})")
                        time.sleep(delay)
                        continue
                    raise
            return None
        return wrapper
    return decorator
