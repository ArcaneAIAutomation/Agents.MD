# 🗄️ Database Schema Diagram - Bitcoin Sovereign Technology

**Visual representation of all database tables and their relationships**

---

## 📊 Entity Relationship Diagram (ERD)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         AUTHENTICATION SYSTEM                                │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────┐
│      users           │
├──────────────────────┤
│ • id (PK)            │◄─────────┐
│ • email (UNIQUE)     │          │
│ • password_hash      │          │
│ • email_verified     │          │
│ • verification_token │          │
│ • created_at         │          │
│ • updated_at         │          │
└──────────────────────┘          │
         ▲                        │
         │                        │
         │ (FK)                   │ (FK)
         │                        │
┌────────┴──────────┐    ┌────────┴──────────┐
│   sessions        │    │  access_codes     │
├───────────────────┤    ├───────────────────┤
│ • id (PK)         │    │ • id (PK)         │
│ • user_id (FK)    │    │ • code (UNIQUE)   │
│ • token_hash      │    │ • redeemed        │
│ • expires_at      │    │ • redeemed_by(FK) │
│ • created_at      │    │ • redeemed_at     │
└───────────────────┘    │ • created_at      │
                         └───────────────────┘

┌──────────────────────┐
│    auth_logs         │
├──────────────────────┤
│ • id (PK)            │
│ • user_id (FK)       │◄─────── (Optional FK to users)
│ • event_type         │
│ • ip_address         │
│ • user_agent         │
│ • success            │
│ • error_message      │
│ • timestamp          │
└──────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│                    UCIE (Universal Crypto Intelligence)                      │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────┐
│   ucie_tokens            │
├──────────────────────────┤
│ • id (PK)                │
│ • coingecko_id (UNIQUE)  │
│ • symbol                 │
│ • name                   │
│ • market_cap_rank        │
│ • image_url              │
│ • current_price_usd      │
│ • market_cap_usd         │
│ • total_volume_usd       │
│ • price_change_24h       │
│ • is_active              │
│ • last_updated           │
│ • created_at             │
└──────────────────────────┘
         │
         │ (Referenced by symbol)
         │
         ▼
┌──────────────────────────┐
│ ucie_analysis_cache      │
├──────────────────────────┤
│ • id (PK)                │
│ • symbol                 │◄─── (References ucie_tokens.symbol)
│ • analysis_type          │
│ • data (JSONB)           │
│ • data_quality_score     │
│ • created_at             │
│ • expires_at             │
└──────────────────────────┘
         │
         │ (Referenced by symbol)
         │
         ▼
┌──────────────────────────┐
│   ucie_phase_data        │
├──────────────────────────┤
│ • id (PK)                │
│ • session_id             │
│ • symbol                 │◄─── (References ucie_tokens.symbol)
│ • phase_number (1-4)     │
│ • phase_data (JSONB)     │
│ • created_at             │
│ • expires_at             │
└──────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│                         USER PREFERENCES (Future)                            │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────┐
│      users           │
├──────────────────────┤
│ • id (PK)            │◄─────────┐
└──────────────────────┘          │
                                  │ (FK)
                                  │
                         ┌────────┴──────────┐
                         │  ucie_watchlist   │
                         ├───────────────────┤
                         │ • id (PK)         │
                         │ • user_id (FK)    │
                         │ • symbol          │◄─── (References ucie_tokens.symbol)
                         │ • notes           │
                         │ • added_at        │
                         │ • last_viewed_at  │
                         └───────────────────┘

┌──────────────────────┐
│      users           │
├──────────────────────┤
│ • id (PK)            │◄─────────┐
└──────────────────────┘          │
                                  │ (FK)
                                  │
                         ┌────────┴──────────┐
                         │   ucie_alerts     │
                         ├───────────────────┤
                         │ • id (PK)         │
                         │ • user_id (FK)    │
                         │ • symbol          │◄─── (References ucie_tokens.symbol)
                         │ • alert_type      │
                         │ • threshold_value │
                         │ • condition_details│
                         │ • triggered       │
                         │ • triggered_at    │
                         │ • trigger_count   │
                         │ • last_checked_at │
                         │ • created_at      │
                         │ • expires_at      │
                         │ • enabled         │
                         └───────────────────┘
```

---

## 🔗 Relationship Summary

### Authentication System

**users → sessions** (One-to-Many)
- One user can have multiple active sessions
- Cascading delete: When user deleted, all sessions deleted

**users → access_codes** (One-to-One)
- One access code can be redeemed by one user
- Set NULL on delete: If user deleted, code remains but redeemed_by = NULL

**users → auth_logs** (One-to-Many)
- One user can have many log entries
- Set NULL on delete: If user deleted, logs remain but user_id = NULL

### UCIE System

**ucie_tokens → ucie_analysis_cache** (One-to-Many)
- One token can have multiple cached analyses (different types)
- No foreign key constraint (soft reference by symbol)

**ucie_tokens → ucie_phase_data** (One-to-Many)
- One token can have multiple phase data entries (different sessions)
- No foreign key constraint (soft reference by symbol)

**users → ucie_watchlist** (One-to-Many)
- One user can watch multiple tokens
- Cascading delete: When user deleted, watchlist deleted

**users → ucie_alerts** (One-to-Many)
- One user can have multiple alerts
- Cascading delete: When user deleted, alerts deleted

---

## 📊 Table Size Hierarchy

```
Largest Tables (by row count):
1. auth_logs          (Growing indefinitely - needs retention policy)
2. ucie_analysis_cache (Variable - auto-cleanup via TTL)
3. ucie_tokens        (250 rows - updated daily)
4. sessions           (Variable - cleaned up daily)
5. users              (Variable - production data)
6. ucie_phase_data    (Variable - auto-cleanup after 1 hour)
7. access_codes       (11 rows - static)
8. ucie_watchlist     (0 rows - feature not yet used)
9. ucie_alerts        (0 rows - feature not yet used)

Largest Tables (by storage size):
1. ucie_analysis_cache (~10-50 KB per row - JSONB data)
2. auth_logs          (~400 bytes per row)
3. ucie_phase_data    (~5-20 KB per row - JSONB data)
4. ucie_tokens        (~1 KB per row)
5. sessions           (~300 bytes per row)
6. users              (~500 bytes per row)
```

---

## 🔍 Index Coverage

### Heavily Indexed Tables
- **users**: 4 indexes (email, created_at, verification_token, email_verified)
- **sessions**: 3 indexes (user_id, token_hash, expires_at)
- **auth_logs**: 4 indexes (user_id, event_type, timestamp, user_failed)
- **ucie_analysis_cache**: 4 indexes (symbol, expires_at, type, symbol+type)
- **ucie_tokens**: 6 indexes (symbol, coingecko_id, rank, active, updated, search)

### Lightly Indexed Tables
- **access_codes**: 3 indexes (code, redeemed, redeemed_by)
- **ucie_phase_data**: 3 indexes (session, expires, session+symbol)
- **ucie_watchlist**: 3 indexes (user, symbol, added)
- **ucie_alerts**: 5 indexes (user, symbol, triggered, enabled, type)

**Total Indexes**: 35+ across all tables

---

## 🔐 Security Constraints

### Unique Constraints
- `users.email` - One email per user
- `access_codes.code` - One code per entry
- `ucie_tokens.coingecko_id` - One token per CoinGecko ID
- `ucie_analysis_cache(symbol, analysis_type)` - One cache per symbol+type
- `ucie_phase_data(session_id, symbol, phase_number)` - One phase per session+symbol+number
- `ucie_watchlist(user_id, symbol)` - One watchlist entry per user+symbol

### Check Constraints
- `users.email` - Must be lowercase and trimmed
- `access_codes.code` - Must be uppercase and trimmed
- `access_codes.redeemed_consistency` - If redeemed, must have redeemed_by and redeemed_at
- `sessions.expires_at_future` - Must expire in the future
- `auth_logs.event_type_valid` - Must be valid event type
- `ucie_analysis_cache.data_quality_score` - Must be 0-100
- `ucie_phase_data.phase_number` - Must be 1-4
- `ucie_alerts.alert_type_check` - Price alerts must have threshold

### Foreign Key Constraints
- `sessions.user_id` → `users.id` (CASCADE DELETE)
- `access_codes.redeemed_by` → `users.id` (SET NULL)
- `auth_logs.user_id` → `users.id` (SET NULL)
- `ucie_watchlist.user_id` → `users.id` (CASCADE DELETE)
- `ucie_alerts.user_id` → `users.id` (CASCADE DELETE)

---

## 🔄 Data Flow Patterns

### Authentication Flow
```
1. User Registration:
   access_codes (validate) → users (insert) → access_codes (mark redeemed) → auth_logs (log)

2. User Login:
   users (validate) → sessions (insert) → auth_logs (log)

3. Session Validation:
   sessions (query) → users (return data)

4. User Logout:
   sessions (delete) → auth_logs (log)
```

### UCIE Analysis Flow
```
1. Token Search:
   ucie_tokens (query) → return metadata

2. Analysis Request:
   ucie_analysis_cache (check) → API (fetch if not cached) → ucie_analysis_cache (store)

3. Progressive Loading:
   Phase 1 → ucie_phase_data (store) → Phase 2 → ucie_phase_data (store) → ...

4. User Watchlist:
   ucie_watchlist (query by user_id) → ucie_tokens (join for metadata)

5. User Alerts:
   ucie_alerts (query enabled) → ucie_analysis_cache (check conditions) → trigger if met
```

---

## 📈 Growth Projections

### Expected Growth Rates

**users**: +10-50 per day (early stage)
- Month 1: 100 users
- Month 3: 500 users
- Month 6: 2,000 users
- Year 1: 10,000 users

**sessions**: ~2x active users (multiple devices)
- Cleaned up daily (expired sessions)
- Steady state: 2,000-5,000 active sessions

**auth_logs**: +100-500 per day
- Grows indefinitely without retention policy
- Recommendation: Keep 90 days, archive older

**ucie_analysis_cache**: +50-200 per day
- Auto-cleanup via TTL
- Steady state: 1,000-5,000 entries

**ucie_tokens**: Static (250 tokens)
- Updated daily, not growing
- Steady state: 250 entries

---

## 🎯 Optimization Opportunities

### Query Optimization
1. **Most Frequent Queries**:
   - User lookup by email (login)
   - Session validation by token
   - Cache lookup by symbol+type
   - Token search by symbol

2. **Optimization Applied**:
   - All have indexes ✅
   - Parameterized queries ✅
   - Connection pooling ✅

### Storage Optimization
1. **Largest Tables**:
   - auth_logs (needs retention policy)
   - ucie_analysis_cache (auto-cleanup working)

2. **Optimization Needed**:
   - Add auth_logs retention (90 days)
   - Monitor cache hit rate
   - Archive old data periodically

---

## ✅ Schema Health Status

**Overall**: 🟢 **EXCELLENT**

- ✅ All tables properly indexed
- ✅ Foreign keys enforced
- ✅ Constraints validated
- ✅ Cascading deletes configured
- ✅ Auto-cleanup functions created
- ✅ Triggers for updated_at working
- ✅ JSONB for flexible data storage
- ✅ UUID primary keys for security

**Minor Improvements**:
- Add auth_logs retention policy
- Implement watchlist & alerts features
- Add Row-Level Security (future)

---

**Last Updated**: January 27, 2025  
**Total Tables**: 9  
**Total Indexes**: 35+  
**Total Constraints**: 15+  
**Status**: ✅ PRODUCTION READY

