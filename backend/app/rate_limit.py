"""In-process sliding-window rate limiter — stdlib only, no extra dependencies.

Protects authentication and upload endpoints from brute-force / abuse. Counters
are per process; for multi-worker or multi-node deployments replace the
in-memory store with a shared backend (e.g. Redis) — the interface is
intentionally tiny so that swap is a one-class change.
"""

import threading
import time
from collections import defaultdict, deque


class RateLimiter:
    """Sliding-window counter per key. Prunes stale hits lazily on access."""

    def __init__(self) -> None:
        self._hits: dict[str, deque[float]] = defaultdict(deque)
        self._lock = threading.Lock()

    def hit_and_check(self, key: str, limit: int, window_seconds: float) -> bool:
        """Record one hit; return True if the request is allowed under the limit."""
        now = time.monotonic()
        with self._lock:
            hits = self._hits[key]
            cutoff = now - window_seconds
            while hits and hits[0] < cutoff:
                hits.popleft()
            if len(hits) >= limit:
                return False
            hits.append(now)
            return True

    def reset(self, key: str) -> None:
        """Clear a key (e.g. a successful login resets the failure counter)."""
        with self._lock:
            self._hits.pop(key, None)


rate_limiter = RateLimiter()