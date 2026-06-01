# Trade System — Design Document

**Status:** Implemented and shipping
**Author:** klerikdust (with Claude)
**Original draft:** 2026-06-01
**Last revised:** 2026-06-01 (post-implementation)
**Scope:** Player-to-player item & artcoin trading inside a single guild

This document was originally written as a pre-implementation design and has been rewritten to reflect the system as it ships. Anything still labeled "future" or "deferred" lives in §12; everything else describes current behavior.

---

## 1. Goals and non-goals

### Goals
- Two members of the same guild can exchange items and artcoins through a paired confirmation flow.
- Tradeable inventory respects the existing `items.bind` flag and the current-guild boundary.
- Either side mutating their offer after a lock invalidates **all** locks, mirroring MMORPG anti-sneak conventions.
- Inventory writes are atomic — a failed credit cannot leave one side debited.
- Every successful trade is recorded in `user_trade_log` for audit / dispute resolution.
- Available as both prefix command (`>trade @user`) and slash command (`/trade user:<user>`).
- Branded canvas banner above the trade window matches the initiator's saved theme + cover.
- Solo developers can self-test via `BYPASS_SELF_TRADE` + `NODE_ENV=development`.

### Non-goals
- Cross-guild trades. Trade scope is the guild the request was issued in.
- Trading items the bot does not own a row for (e.g. role rewards, custom-shop intangibles).
- Trade taxes / fees. The pay command's 2% tax is its own affordance; trade is direct.
- A persistent trade-listing market (auction house). This is direct A↔B only.
- Cancelling individual line items after lock without resetting the whole lock state. State machine stays simple.

---

## 2. User flow

```
User A: /trade user:@B
        │
        ▼
┌──────────────────────────────────┐
│ Trade request sent to B          │  Public message in channel:
│ Buttons: Accept / Decline        │  "@A wants to trade with @B"
│ Timeout: 30s                     │  Auto-cancel on timeout. Self-trade
└──────────────────────────────────┘  bypass skips this step entirely.
        │ B clicks Accept
        ▼
┌──────────────────────────────────┐
│ Active trade session             │  Embed shows banner + two columns:
│  ┌─ A's offer ─┐ ┌─ B's offer ─┐ │  ┌─ A ──────────┐ ┌─ B ──────────┐
│  │ items: …    │ │ items: …    │ │  │ items: …     │ │ items: …     │
│  │ artcoins: 0 │ │ artcoins: 0 │ │  │ artcoins: 0  │ │ artcoins: 0  │
│  │ Unlocked ✗  │ │ Unlocked ✗  │ │  │ Unlocked ✗   │ │ Unlocked ✗   │
│  └─────────────┘ └─────────────┘ │  └──────────────┘ └──────────────┘
│ Buttons: Add  Remove  Lock  Cancel│ + active-hint follow-up:
│ Timeout: 5 min idle              │  "Periodically check the items
└──────────────────────────────────┘   offered before pressing Lock…"
        │ both Lock ✓
        ▼
┌──────────────────────────────────┐
│ Final confirmation               │  Separate follow-up message:
│ Two-party trades: two buttons    │  "Both sides have been locked.
│ Self-trade: one button           │   Confirm within 10 seconds…"
│ Timeout: 10s                     │  Each participant clicks their own.
└──────────────────────────────────┘  Mutating offer mid-confirm aborts.
        │ both Confirm
        ▼
┌──────────────────────────────────┐
│ Atomic execution                 │  Single PG transaction:
│ - Debit A's items + AC           │   - spendInventory per line + AC
│ - Credit B's items + AC          │   - updateInventory credit phase
│ - Insert user_trade_log row      │   - INSERT user_trade_log
└──────────────────────────────────┘
        │
        ▼
   "Trade completed!♡ ╰─ A and B just exchanged items"
   + tradehistory follow-up
```

Cancel paths from any state:
- Either user clicks **Cancel** → session ends, no inventory writes.
- Idle timeout (5 min) → auto-cancel.
- Bot loses access to the channel mid-flight → session ends silently on next button press.
- Final-confirm timeout (10s) → locks release, trade window stays open for another attempt.

Modify-while-locked rule:
- If A or B clicks Add/Remove or Set artcoins (now folded into Add) after at least one of them has Locked, **both** lock states reset to ✗ regardless of state. The mutation itself still applies; users have to consciously re-Lock before the trade can commit. This is the anti-sneak guarantee — A's consent before a change is no longer consent after it.

---

## 3. Data model

### 3.1 Existing tables we read or write

| Table | How trade uses it |
|---|---|
| `items` | Read `bind`, `name`, `alias`, `type_id`, `owned_by_guild_id`. Eligibility filter. |
| `user_inventories` | Source of truth. Atomic debit (`spendInventory`) + credit (`updateInventory`). |
| `users` | Read via `User.requestMetadata` for theme + cover + avatar URLs. |

### 3.2 New table: `user_trade_log`

```sql
CREATE TABLE public.user_trade_log (
    trade_id     bigint NOT NULL,
    registered_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    guild_id     text NOT NULL,
    user_a_id    text NOT NULL,           -- Initiator
    user_b_id    text NOT NULL,           -- Acceptor
    a_offer      jsonb NOT NULL,          -- { items: [{itemId, qty}], artcoins: N }
    b_offer      jsonb NOT NULL,
    status       text NOT NULL,           -- 'committed' | 'cancelled' | 'failed'
    failure_reason text,                  -- Populated when status != 'committed'
    PRIMARY KEY (trade_id)
);

CREATE INDEX idx_user_trade_log_guild ON public.user_trade_log(guild_id, registered_at DESC);
CREATE INDEX idx_user_trade_log_user_a ON public.user_trade_log(user_a_id, registered_at DESC);
CREATE INDEX idx_user_trade_log_user_b ON public.user_trade_log(user_b_id, registered_at DESC);
```

`jsonb` for offers because the count of distinct items per side is unbounded (within Discord embed limits) and we never query into the offer payload. A normalized lines table would be over-engineering for write-once audit data.

`status='cancelled'` rows are not currently written — only `committed` (success) and `failed` (rollback). Idle-timeout sessions and explicit cancels do not produce log rows. If support burden grows around "what happened to my trade", reintroducing cancelled rows is a small change.

Schema is owned by `00000000000000_initial.js` (which loads `schema.sql` verbatim) and `20260601000000_add_user_trade_log.js`. Apply with `npm run db:migrate`.

### 3.3 Open-session lock (Redis-only)

```
Key:        TRADE_SESSION:<userId>
Value:      `1`
TTL:        900 (15 min, hard ceiling)
```

Set on session start for both users; deleted on every session-end path (commit, cancel, timeout). One trade per user globally. If a user has a stale lock (process crashed mid-trade, etc.), the 15-min TTL self-heals.

The lock is **not** authoritative for inventory atomicity — `spendInventory`'s conditional UPDATE is. The lock is purely UX: prevents a user from juggling two trade windows.

In self-trade mode (BYPASS_SELF_TRADE) only one lock is set since A and B share the user id.

---

## 4. State machine

```
                      ┌────────────────┐
                      │   REQUESTED    │
                      └────┬───────┬───┘
        B clicks Accept →  │       │ ← B Decline / 30s timeout
                           ▼       ▼
                  ┌────────────┐ (END: cancelled)
                  │   ACTIVE   │
                  └────┬───────┴────────────┐
                       │                    │
   either side Lock →  │                    │ ← either Cancel / 5min idle
                       ▼                    ▼
                  ┌──────────┐           (END: cancelled)
                  │ READIED  │  (internal name; "Locked" in UI)
                  └────┬─────┴────────────────────┐
                       │                          │
   any offer mutation clears all locks → back to ACTIVE
                       │
   confirm follow-up → both Confirm in 10s →
                       ▼
                  ┌──────────┐
                  │ EXECUTING│  PG transaction + log
                  └────┬─────┘
                       │
                       ▼
                  (END: committed | failed)
```

Internal state names (`READIED`, `ready` map, `setReady`, customId `trade:ready`) retain the legacy "ready" vocabulary; user-visible strings say "Lock". The relabel was a UI-only change; renaming the state machine wasn't worth the ripple in the test suite.

### State transitions

| From | Event | To | Side effects |
|---|---|---|---|
| (none) | A invokes /trade B | REQUESTED | acquire TRADE_SESSION lock(s); render request embed |
| (none) | A self-trades with bypass enabled | ACTIVE | acquire one TRADE_SESSION lock; skip request prompt |
| REQUESTED | B clicks Accept | ACTIVE | render trade window with banner |
| REQUESTED | B clicks Decline | (cancelled) | release locks; close embed |
| REQUESTED | 30s timeout | (cancelled) | release locks; close embed |
| ACTIVE | either Add/Remove | ACTIVE (offer mutated, all locks cleared) | re-render |
| ACTIVE | both clicked Lock | READIED | render final-confirm follow-up message |
| ACTIVE | either Cancel | (cancelled) | release locks |
| ACTIVE | 5min idle | (cancelled) | release locks |
| READIED | either modifies offer | ACTIVE | clear both lock flags BEFORE applying mutation |
| READIED | both Confirm in 10s | EXECUTING | begin transaction |
| READIED | either Cancel | (cancelled) | release locks |
| READIED | 10s window expires | ACTIVE | release lock flags, surface FINAL_TIMEOUT (auto-deletes after 10s) |
| EXECUTING | success | (committed) | log row; render success embed; tradehistory follow-up |
| EXECUTING | spendInventory `ok:false` | (failed) | log row with failure_reason; release locks |

The "any offer mutation clears all locks" rule is encoded in `#onOfferMutated` and clears flags regardless of which side mutated and regardless of how many sides had locked. The asymmetric case (A locked, B silently swaps an item, A's prior consent stays, next B-lock auto-commits) was a real scam vector that this rule closes.

---

## 5. Eligibility rules

A line is added to an offer only if all of the following hold:

1. **Quantity:** the user owns at least the requested quantity in the current guild's inventory (`user_inventories.quantity >= requested AND in_use = 0`).
2. **Bind:** `items.bind LIKE 'y%'` (case-insensitive) — interpreted from the existing `setShop` UX where the user typed `yes`/`y`. Anything else (NULL, missing, `'n'`, legacy items) fails closed: not tradeable.
3. **Custom-item scope:** if `items.owned_by_guild_id IS NOT NULL`, it must equal the current guild's id. Global items (NULL `owned_by_guild_id`) pass unconditionally as far as scope.
4. **Excluded item ids:** artcoins (52), fragments (51), and lucky_ticket (71) are not addable as line items. Artcoins are added through the same Add flow, but as a special first option in the select; fragments and lucky tickets are non-fungible by design.

The pre-confirm select menu in the Add flow filters by all of these so users only see addable items. The lib re-validates at addItem so a stale select can't bypass the gate.

For artcoins specifically:
- Each side's offered AC must be `>= 0`. Negative or non-integer rejects.
- Optional cap: `max(0, balance - alreadyOffered)` enforced at the modal preflight and re-checked at execute. The conditional UPDATE in `spendInventory` is the actual gate; the UI cap is a friendly preflight.

---

## 6. Execution: the atomic transaction

The commit path runs inside `client.db.databaseUtils.transaction(fn)`:

```js
await client.db.databaseUtils.transaction(async () => {
    // Debit phase — every spend uses the conditional UPDATE
    for (const line of aOffer.items) {
        const ok = await spendInventory({ itemId: line.itemId, value: line.qty,
                                          userId: aId, guildId })
        if (!ok.ok) throw new TradeError(`INSUFFICIENT_ITEM`, line.itemId)
    }
    if (aOffer.artcoins > 0) {
        const ok = await spendInventory({ itemId: 52, value: aOffer.artcoins,
                                          userId: aId, guildId })
        if (!ok.ok) throw new TradeError(`INSUFFICIENT_ARTCOINS`)
    }
    // ... mirror for B ...

    // Credit phase — only after every debit landed
    for (const line of aOffer.items) {
        await updateInventory({ itemId: line.itemId, value: line.qty,
                                operation: '+', userId: bId, guildId })
    }
    // ... mirror for A and AC ...

    // Audit log — same transaction so a failed log rolls the trade back
    await recordTradeLog({ guildId, userAId, userBId, aOffer, bOffer, status: 'committed' })
})
```

Failure handling (`TradeSession.execute`):
- A `TradeError` thrown inside `transaction(fn)` triggers ROLLBACK. No half-states.
- Catch block writes a `status='failed'` log row outside the rolled-back transaction, best-effort. If that log write itself fails, it's swallowed with a Pino warn — the trade was already rolled back, audit gap is acceptable for an event that never affected inventory.
- Returns `{ ok: false, code, detail }` to the command layer, which surfaces `TRADE.EXEC_FAILED_INSUFFICIENT` for `INSUFFICIENT_*` and `TRADE.EXEC_FAILED_GENERIC` for anything else.

Cache invalidation: deferred. The current `getUserInventory` doesn't cache long enough for a stale read after a trade to matter, and the brief drift was deemed acceptable. If we add a long-lived inventory cache later, this needs `delCache` on both users post-commit.

---

## 7. UI contract

### 7.1 Trade window layout

```
┌─────────────────────────────────────────────┐
│  Trade — Annie's Support                    │
│  [300×160 banner: theme cover + 2 avatars]  │
├─────────────────────────────────────────────┤
│  ┌───────────────┐  ┌───────────────┐       │
│  │ @userA        │  │ @userB        │       │
│  │ ───────────── │  │ ───────────── │       │
│  │ 2× Apple      │  │ 1× Pear       │       │
│  │ 🪙 1500       │  │ 🪙 0          │       │
│  │ Locked ✓      │  │ Unlocked ✗    │       │
│  └───────────────┘  └───────────────┘       │
└─────────────────────────────────────────────┘
[Add] [Remove] [Lock] [Cancel]
```

Embed border uses `palette.crimson` (`#912f46`) regardless of state — the per-side Lock indicator carries state info.

The OFFER_EMPTY placeholder is suppressed on a side that has artcoins offered but no items; the AC line stands on its own. Only fully-empty sides show "(no items)".

In self-trade (dev only), the row gains a second action row with `Switch (now: A)` to flip which column subsequent clicks affect, and the Lock button reads `Lock A` / `Unlock A` (or B) since one user owns both columns.

### 7.2 Banner

Custom canvas builder at `src/ui/prebuild/tradeWindow.js`, mirroring `ownerHeader.js` (the inventory header):

- 300×160, theme + cover layer driven by initiator's saved preferences.
- Two avatars centered: initiator at x=120, partner at x=225 (both centers on the horizontal midline).
- Rebuilt on every render; cost is one canvas draw, no DB calls. Mid-trade theme/cover changes pick up on the next refresh.

### 7.3 Buttons

| customId | Label | Behavior |
|---|---|---|
| `trade:add` | Add | Opens ephemeral select of tradeable inventory + Artcoins option |
| `trade:remove` | Remove | Modal asking for item + qty to remove from offer |
| `trade:ready` | Lock / Unlock | Toggles own lock flag |
| `trade:cancel` | Cancel | Ends session |
| `trade:switch` | Switch (now: A) | Self-trade only; flips currentSide |
| `trade:accept` / `trade:decline` | Accept / Decline | Request prompt (B only) |
| `trade:final:a` / `:b` / `:solo` | Confirm (Alice) / (Bob) / Confirm | Final-confirm follow-up |

Filter on `createMessageComponentCollector` checks `interaction.user.id` is one of the two participants. Participants clicking the wrong side's confirm get an ephemeral `TRADE.NOT_PARTICIPANT`.

### 7.4 Add flow

Two-step interaction since modals can't host select menus:

1. Click **Add** → ephemeral message with a select. First option is **Artcoins** (with current balance in the description); the rest are up to 24 inventory items filtered by §5.
2. Pick → modal shows for the selected item with `Quantity (you have N)` label and `1 to N` placeholder.
3. Submit qty → ephemeral deleted, trade window updated.

The qty modal supports up to **3 retries** with the failure reason inlined into the modal title (`How many to offer? — Apple · Too many — max 5`). After 3 invalid attempts the loop surfaces `ADD_TOO_MANY_RETRIES` and the user re-clicks Add to try again — defense against accidentally pressing Submit on bad input.

The Artcoins option uses `collectAddArtcoins` with the same retry-with-inline-error shape; cap is `max(0, balance - alreadyOffered)`.

### 7.5 Final-confirm follow-up

Sent as a **separate message** below the trade window so the trade window stays visible:

- Normal trade: `[Confirm (Alice)] [Confirm (Bob)]` — both participants must click their own button. First-clicker gets an ephemeral `FINAL_PROMPT_WAITING`; second-clicker triggers execute.
- Self-trade: `[Confirm]` — single click commits.
- Timeout (10s): message deletes, locks release, `TRADE.FINAL_TIMEOUT` posted with `deleteIn: 10s`, trade window stays open for another attempt.
- Mid-confirm offer mutation: lib's `#onOfferMutated` clears the locks, collector detects state ≠ READIED and exits with `mutated`, message deletes silently, trade window reflects the new offer.

---

## 8. Concurrency and edge cases

| Scenario | Handling |
|---|---|
| User A starts trade with B; A also has open trade with C | Rejected at request time; A's `TRADE_SESSION` lock is set |
| User clicks Lock, then immediately Add | Locks cleared before Add applies (lib `#onOfferMutated`); embed re-renders |
| Partner silently swaps item after first user locked | Same rule — first user's lock is dropped before the swap; consent revoked automatically |
| User leaves the guild mid-trade | Membership not actively checked; if ID is stale at execute time, debit fails on missing inventory row, transaction rolls back |
| Bot restarts mid-trade | Session lives only in process memory + Redis lock. On restart, the message is orphaned (buttons stop working). The 15-min Redis TTL releases the lock; users retry. No DB cleanup needed because nothing was committed |
| Item gets unbound (`setShop` mid-trade changes `bind`) | Eligibility was checked at Add and at execute (via `spendInventory`'s conditional UPDATE). The item ID remains the same; the bind flag isn't re-checked at execute, so an unbind doesn't block a trade that was started before the change |
| User burns the offered item in another flow during the 10s confirm window | `spendInventory` returns `ok:false`; transaction rolls back; embed shows "X no longer has enough" |
| Bypass user accidentally enables `BYPASS_SELF_TRADE` in production | Both `NODE_ENV=development` AND `BYPASS_SELF_TRADE=1` are required; either alone is a no-op |
| Two-party trade where one user closes Discord during confirm | 10s timeout fires, locks release, FINAL_TIMEOUT auto-deletes, trade window remains; users can re-Lock or Cancel |

---

## 9. Files

| File | Status | Notes |
|---|---|---|
| `src/config/db/schema.sql` | Updated | Includes `user_trade_log` block |
| `src/config/migrations/20260601000000_add_user_trade_log.js` | Added | Knex migration |
| `src/libs/database.js` | Updated | `Trades` class with `recordTradeLog`, `getTradeHistory`. Wired into `initializeDb` |
| `src/libs/trade.js` | Added | `TradeSession` controller — state machine, atomic execute, eligibility checks |
| `src/commands/user/trade.js` | Added | Message + slash entry; component collectors; modals; banner wiring |
| `src/commands/user/tradehistory.js` | Added | Reads `user_trade_log` for invoking user; paginated; renders sent/received from viewer's perspective |
| `src/ui/prebuild/tradeWindow.js` | Added | Custom canvas banner with both avatars |
| `src/locales/en.json` | Updated | New `TRADE.*` and `TRADEHISTORY.*` blocks |
| `src/locales/id.json` | Updated | Mirror translations |
| `.env.example` | Updated | Documents `BYPASS_SELF_TRADE` |
| `tests/libs/trade.test.js` | Added | State machine: locks, eligibility, ready revoke, asymmetric anti-sneak, AC mutation, execute commit/rollback (15 cases) |
| `tests/commands/trade.test.js` | Added | Command shell: metadata, early exits, bypass gate, item resolvers, fetchTradeableInventory filtering, truncate (16 cases) |
| `tests/commands/tradehistory.test.js` | Added | Pagination, entry rendering with perspective flip, offer compaction, metadata (11 cases) |

No changes to `Confirmator` — single-party flow stays as-is. The trade system uses its own collectors.

---

## 10. Locale keys

The implementation uses the keys originally previewed in §10 of the draft, plus additions for the post-implementation polish. Notable groups:

- **Request/timeout/cancel**: `REQUEST_PROMPT`, `REQUEST_DECLINED`, `REQUEST_TIMEOUT`, `CANCELLED`, `IDLE_TIMEOUT`, `NOT_PARTICIPANT`.
- **Eligibility errors**: `ITEM_NOT_TRADEABLE`, `INSUFFICIENT_ITEM`, `QTY_INVALID`, `AC_INVALID`, `AC_INSUFFICIENT`.
- **Add flow**: `ADD_OPTION_ARTCOINS`, `ADD_OPTION_ARTCOINS_DESC`, `ADD_SELECT_PROMPT`, `ADD_SELECT_PLACEHOLDER`, `ADD_QTY_MODAL_TITLE`, `ADD_QTY_LABEL_WITH_OWNED`, `ADD_QTY_PLACEHOLDER`, `ADD_QTY_ERROR_INVALID`, `ADD_QTY_ERROR_TOO_MANY`, `ADD_NO_TRADEABLE_ITEMS`, `ADD_TOO_MANY_RETRIES`, `ADD_SELECT_TIMEOUT`.
- **Artcoins-in-Add**: `AC_LABEL_WITH_BALANCE`, `AC_PLACEHOLDER`, `AC_ERROR_INVALID`, `AC_ERROR_TOO_MANY`.
- **Lock & confirm**: `READY_YES`/`READY_NO`/`READY_REVOKED` ("Locked ✓" / "Unlocked ✗"), `FINAL_PROMPT`, `FINAL_PROMPT_WAITING`, `FINAL_TIMEOUT`.
- **Outcome**: `EXEC_SUCCESS`, `EXEC_SUCCESS_FOLLOWUP`, `EXEC_FAILED_INSUFFICIENT`, `EXEC_FAILED_GENERIC`, `ACTIVE_HINT_FOLLOWUP`.
- **History**: `TRADEHISTORY.GUIDE`, `EMPTY`, `INTRO`, `ENTRY_COMMITTED`, `ENTRY_FAILED`, `ENTRY_DIVIDER`, `PAGE_FOOTER`, `OFFER_NONE`, `OFFER_ITEM`, `OFFER_ARTCOINS`, `STATUS_FAILED`, `STATUS_CANCELLED`.

`localeIntegrity.js` validates parity between `en.json` and `id.json`.

---

## 11. Test coverage

**`tests/libs/trade.test.js`** (15 cases):
- Self-trade rejection at construction, and the bypass when `allowSelfTrade: true`.
- Lock acquire/release, including single-key behavior in self-trade.
- `requireBothFree` with side detail.
- Eligibility: bound items, no-bind legacy, cross-guild custom items, excluded line items, stacked-offer over-spend.
- AC validation.
- Lock toggle: state transitions to/from READIED.
- Modify-while-locked: clears both locks; **asymmetric case** (one side locked, partner mutates) explicitly covered.
- AC mutation also clears locks.
- removeItem clamping.
- Invalid-state mutation guards.
- Execute: commit happy path, rollback on later debit failure.
- NOT_READIED guard before execute.

**`tests/commands/trade.test.js`** (16 cases):
- Command metadata.
- Early exits: self-trade rejection, bot rejection, ALREADY_IN_TRADE.
- Bypass gate: NODE_ENV alone doesn't bypass; BYPASS_SELF_TRADE alone doesn't bypass; both together do.
- Item resolvers: id-first, fuzzy, in_use exclusion, offer-scoped resolver.
- `fetchTradeableInventory` filter (bound, in_use, zero-qty, no-bind, excluded ids, cross-guild scoping).
- `truncate` helper.

**`tests/commands/tradehistory.test.js`** (11 cases):
- Pagination boundaries.
- Committed entry rendering with perspective flip (target is user_a vs user_b).
- Failed entry rendering with status and reason.
- Offer compaction: items + AC, empty offer, jsonb-as-string fallback, malformed JSON.
- Command metadata.

Total: **42 trade-specific tests**, part of a 161-test suite.

---

## 12. Out-of-scope follow-ups

Things that remain deferred. None block shipping; flagged here so we don't lose the threads.

- **`/cancelTrade` for support staff**, in case a session ever gets stuck past its TTL. Not needed if the 15-min Redis TTL is reliable.
- **Trade requests via DM (cross-guild)**. Real product question; not implementing.
- **Bind re-check at execute time**. Currently we only check at Add. An admin un-binding mid-trade silently lets the trade finish; uncommon, low-risk.
- **Member-left-guild detection at execute**. Today the trade just fails when `spendInventory` finds no row; surfacing a friendlier `MEMBER_LEFT_GUILD` would be nice polish.
- **Per-guild trade enable/disable toggle**. Add as `TRADE_MODULE` in `customConfig.js` if guilds want to disable trading.
- **Item names on `/tradehistory` pages**. Today rendered as `#itemId` to avoid N×M shop lookups per render. Caching item names by id at startup would let us swap to names cheaply.
- **Failure-side naming on EXEC_FAILED_INSUFFICIENT**. Currently surfaces `someone` or the item id; threading the side back through the lib to say "Bob no longer has 5× Apple" is a small refactor.
- **Pagination on the Add select**. Hard cap is 25 items; no current install exceeds this. If needed, add a "load more" affordance.
- **Inventory cache invalidation post-commit**. Deferred until there's a long-lived cache to invalidate.
- **Internal rename of `ready` → `lock` in lib code**. UI already says "Lock"; the state machine and tests still use `READIED` / `setReady` / `trade:ready` for stability. Worth a sweep alongside the next major refactor of the trade lib.

---

## 13. Resolved open questions

The five open calls flagged in the original draft have all landed:

1. **Item-select cap of 25** — shipped with no pagination. No current install needs more.
2. **`/tradehistory` ships in the same patch** — landed in PR 3 of the original three-PR split.
3. **Idle 5min / final-confirm 10s / request 30s** — accepted, with one revision: final-confirm tightened from 15s to 10s.
4. **Failure log rows for explicit failures only** — implemented as designed; idle timeouts and explicit cancels do not produce log rows.
5. **Slash option type for the target user is `User`** — implemented; the prefix path uses `User.lookFor` like `gift.js`.

Post-implementation additions:

- **`BYPASS_SELF_TRADE` for solo dev testing** — accepted late in implementation. Two-flag gate (`NODE_ENV=development` + `BYPASS_SELF_TRADE=1`) so a stray env var can't enable it in production-ish environments.
- **Custom canvas banner** — added in the polish phase. 300×160, theme + cover from initiator, two avatars centered.
- **Set artcoins folded into Add** — the original draft had a separate Set artcoins button; collapsed into a select option for less button clutter.
- **Two-button final confirm** — original draft had a single Confirm/Cancel pair. Now each participant has their own button so the bot can detect first-vs-both-confirmed and surface a "waiting" ephemeral.
- **Anti-sneak rule strengthened** — original modify-while-locked rule only fired in READIED. Asymmetric case (one side locked, partner mutates) was a real scam vector; the rule now clears both locks on any mutation regardless of state.
