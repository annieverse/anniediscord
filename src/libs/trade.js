"use strict"

/**
 * Player-to-player trade state machine.
 *
 * This module is the headless logic layer described in `docs/trade-system-design.md`.
 * It owns: state transitions, eligibility checks, atomic commit-or-rollback. It does
 * NOT know about Discord components or embeds — that responsibility belongs to the
 * UI controller that PR 2 will add. Keeping the two layers separate is what makes
 * the state machine straightforward to test without spinning up a Discord client.
 *
 * The expected lifecycle is:
 *   const session = new TradeSession({ db, guildId, userAId, userBId })
 *   await session.requireBothFree()                  // honors TRADE_SESSION lock
 *   await session.acquireLocks()
 *   session.accept()                                 // → ACTIVE
 *   await session.addItem('a', { itemId, qty })      // eligibility + state mutations
 *   session.setArtcoins('b', 1500)
 *   session.setReady('a', true); session.setReady('b', true) // → READIED
 *   const result = await session.execute()           // → committed | failed
 *   await session.releaseLocks()
 *
 * Every method that mutates state validates the current state first and throws on
 * misuse, so a UI bug can't drive the session into an impossible shape silently.
 *
 * @link docs/trade-system-design.md §4–§6
 */

/** @enum {string} */
const STATE = Object.freeze({
    REQUESTED: `REQUESTED`,
    ACTIVE: `ACTIVE`,
    READIED: `READIED`,
    EXECUTING: `EXECUTING`,
    COMMITTED: `COMMITTED`,
    CANCELLED: `CANCELLED`,
    FAILED: `FAILED`
})

const ARTCOINS_ITEM_ID = 52
const FRAGMENTS_ITEM_ID = 51
const LUCKY_TICKET_ITEM_ID = 71
//  Items that should never appear as a tradeable line (use the Set artcoins
//  control for AC; fragments and tickets are non-fungible by design).
const NON_LINE_ITEM_IDS = new Set([ARTCOINS_ITEM_ID, FRAGMENTS_ITEM_ID, LUCKY_TICKET_ITEM_ID])

const SESSION_LOCK_TTL_SECONDS = 60 * 15
const SESSION_LOCK_PREFIX = `TRADE_SESSION:`

const SIDE_A = `a`
const SIDE_B = `b`

class TradeError extends Error {
    constructor(code, detail) {
        super(`${code}${detail ? `:${detail}` : ``}`)
        this.code = code
        this.detail = detail || null
    }
}

class TradeSession {
    /**
     * @param {object} ctx
     * @param {object} ctx.db                       Annie's `client.db` instance.
     * @param {string} ctx.guildId
     * @param {string} ctx.userAId                  Initiator.
     * @param {string} ctx.userBId                  Acceptor.
     * @param {boolean} [ctx.allowSelfTrade=false]  Escape hatch for solo dev
     *                                              testing — when true, A and B
     *                                              are allowed to be the same
     *                                              user. The command surface is
     *                                              the only place that should
     *                                              ever set this to true, and
     *                                              only after gating on env
     *                                              flags. The lib itself stays
     *                                              policy-free.
     * @param {object} [ctx.deps]                   Test seam — override `now`/`logger`.
     * @param {Function} [ctx.deps.now]             Returns current epoch ms (default Date.now).
     * @param {object} [ctx.deps.logger]            Optional pino-shaped logger.
     */
    constructor({ db, guildId, userAId, userBId, allowSelfTrade = false, deps = {} }) {
        if (!db) throw new TypeError(`TradeSession: missing db`)
        if (!guildId) throw new TypeError(`TradeSession: missing guildId`)
        if (!userAId || !userBId) throw new TypeError(`TradeSession: missing user ids`)
        if (userAId === userBId && !allowSelfTrade) throw new TradeError(`SELF_TRADE`)
        this.db = db
        this.guildId = guildId
        this.userAId = userAId
        this.userBId = userBId
        this.now = deps.now || (() => Date.now())
        this.logger = deps.logger || null
        this.state = STATE.REQUESTED
        this.offers = {
            [SIDE_A]: { items: new Map(), artcoins: 0 },
            [SIDE_B]: { items: new Map(), artcoins: 0 }
        }
        this.ready = { [SIDE_A]: false, [SIDE_B]: false }
        this.locksAcquired = false
        this.lastTouchedAt = this.now()
        this.failureReason = null
        this.tradeLogId = null
        //  Self-trade signals to the UI layer that one user is acting as
        //  both columns. The lib doesn't change behavior beyond letting the
        //  constructor pass; the command uses `currentSide` to know which
        //  column the active button click should mutate.
        this.isSelfTrade = userAId === userBId
        this.currentSide = SIDE_A
    }

    /**
     * Return a serializable snapshot — the UI layer renders from this.
     * Maps are flattened to arrays so the caller doesn't need to know the
     * internal storage shape.
     * @return {object}
     */
    snapshot() {
        return {
            state: this.state,
            ready: { ...this.ready },
            offers: {
                [SIDE_A]: this.#offerSnapshot(SIDE_A),
                [SIDE_B]: this.#offerSnapshot(SIDE_B)
            },
            failureReason: this.failureReason,
            tradeLogId: this.tradeLogId
        }
    }

    #offerSnapshot(side) {
        const offer = this.offers[side]
        return {
            items: Array.from(offer.items.entries()).map(([itemId, qty]) => ({ itemId, qty })),
            artcoins: offer.artcoins
        }
    }

    /**
     * Reject if either user already has a session lock. Caller decides which
     * locale message to surface. Does NOT acquire locks — call acquireLocks
     * separately so it can be paired with releaseLocks in a finally.
     */
    async requireBothFree() {
        if (this.isSelfTrade) {
            //  Only one identity to check when A and B are the same user.
            const aLocked = await this.db.databaseUtils.doesCacheExist(SESSION_LOCK_PREFIX + this.userAId)
            if (aLocked) throw new TradeError(`ALREADY_IN_TRADE`, `a`)
            return
        }
        const [aLocked, bLocked] = await Promise.all([
            this.db.databaseUtils.doesCacheExist(SESSION_LOCK_PREFIX + this.userAId),
            this.db.databaseUtils.doesCacheExist(SESSION_LOCK_PREFIX + this.userBId)
        ])
        if (aLocked) throw new TradeError(`ALREADY_IN_TRADE`, `a`)
        if (bLocked) throw new TradeError(`ALREADY_IN_TRADE`, `b`)
    }

    /**
     * Set both Redis locks with a hard 15-min TTL. Idempotent if already held;
     * safe to call once per session start. In self-trade mode only one lock
     * is set (A and B are the same user id, so two writes would dedupe in
     * Redis anyway — keeping this explicit for clarity).
     */
    async acquireLocks() {
        if (this.isSelfTrade) {
            await this.db.databaseUtils.setCache(SESSION_LOCK_PREFIX + this.userAId, `1`, { EX: SESSION_LOCK_TTL_SECONDS })
        } else {
            await Promise.all([
                this.db.databaseUtils.setCache(SESSION_LOCK_PREFIX + this.userAId, `1`, { EX: SESSION_LOCK_TTL_SECONDS }),
                this.db.databaseUtils.setCache(SESSION_LOCK_PREFIX + this.userBId, `1`, { EX: SESSION_LOCK_TTL_SECONDS })
            ])
        }
        this.locksAcquired = true
    }

    /**
     * Best-effort release. Safe to call multiple times. Never throws — a
     * stuck Redis can't block us from ending a session in memory; the TTL
     * is the backstop.
     */
    async releaseLocks() {
        try {
            if (this.isSelfTrade) {
                await this.db.databaseUtils.delCache(SESSION_LOCK_PREFIX + this.userAId)
            } else {
                await Promise.all([
                    this.db.databaseUtils.delCache(SESSION_LOCK_PREFIX + this.userAId),
                    this.db.databaseUtils.delCache(SESSION_LOCK_PREFIX + this.userBId)
                ])
            }
        } catch (err) {
            if (this.logger) this.logger.warn({ action: `trade_lock_release_failed`, msg: err && err.message })
        }
        this.locksAcquired = false
    }

    /**
     * Transition REQUESTED → ACTIVE on B's accept click.
     */
    accept() {
        this.#requireState(STATE.REQUESTED)
        this.state = STATE.ACTIVE
        this.lastTouchedAt = this.now()
    }

    /**
     * Cancel from any state except already-terminal.
     * @param {string} reason free-text label for telemetry (`user_cancel`, `idle_timeout`, etc.)
     */
    cancel(reason = `user_cancel`) {
        if (this.#isTerminal()) return
        this.state = STATE.CANCELLED
        this.failureReason = reason
        this.lastTouchedAt = this.now()
    }

    /**
     * Add (or stack) an item line in `side`'s offer.
     * Re-validates eligibility at every call so a swapped offer can't carry
     * stale assumptions.
     *
     * @param {('a'|'b')} side
     * @param {object} params
     * @param {number} params.itemId
     * @param {number} params.qty                    Positive integer.
     * @throws {TradeError} on eligibility failure.
     */
    async addItem(side, { itemId, qty } = {}) {
        this.#assertActiveOrReadied()
        this.#assertSide(side)
        if (!Number.isInteger(qty) || qty <= 0) throw new TradeError(`QTY_INVALID`)
        if (NON_LINE_ITEM_IDS.has(Number(itemId))) throw new TradeError(`ITEM_NOT_TRADEABLE`, String(itemId))

        const userId = this.#userIdFor(side)
        const item = await this.#fetchItem(itemId)
        if (!item) throw new TradeError(`ITEM_NOT_FOUND`, String(itemId))
        if (!this.#isItemTradeable(item)) throw new TradeError(`ITEM_NOT_TRADEABLE`, String(itemId))

        const owned = await this.#fetchOwnedQuantity(userId, itemId)
        const alreadyOffered = this.offers[side].items.get(itemId) || 0
        if (owned < alreadyOffered + qty) throw new TradeError(`INSUFFICIENT_ITEM`, String(itemId))

        this.offers[side].items.set(itemId, alreadyOffered + qty)
        this.#onOfferMutated()
    }

    /**
     * Remove qty from `side`'s line. Removing more than offered clamps to
     * zero (UI hint: "remove all"). Removing from a missing line is a no-op.
     */
    removeItem(side, { itemId, qty } = {}) {
        this.#assertActiveOrReadied()
        this.#assertSide(side)
        if (!Number.isInteger(qty) || qty <= 0) throw new TradeError(`QTY_INVALID`)
        const offer = this.offers[side]
        const current = offer.items.get(itemId) || 0
        if (!current) return
        const next = current - qty
        if (next <= 0) offer.items.delete(itemId)
        else offer.items.set(itemId, next)
        this.#onOfferMutated()
    }

    /**
     * Set artcoins on `side`. Use 0 to clear. Caller is responsible for
     * checking the user's actual balance with the friendly preflight; the
     * authoritative gate is the conditional UPDATE at execute time.
     */
    setArtcoins(side, amount) {
        this.#assertActiveOrReadied()
        this.#assertSide(side)
        if (!Number.isInteger(amount) || amount < 0) throw new TradeError(`AC_INVALID`)
        this.offers[side].artcoins = amount
        this.#onOfferMutated()
    }

    /**
     * Toggle one side's ready flag. When both are true the session moves to
     * READIED. Setting ready=false while READIED moves back to ACTIVE.
     */
    setReady(side, value) {
        this.#assertActiveOrReadied()
        this.#assertSide(side)
        this.ready[side] = !!value
        if (this.ready[SIDE_A] && this.ready[SIDE_B]) {
            this.state = STATE.READIED
        } else if (this.state === STATE.READIED) {
            this.state = STATE.ACTIVE
        }
        this.lastTouchedAt = this.now()
    }

    /**
     * Drive the modify-while-locked rule: any offer mutation while READIED
     * snaps both ready flags off and reverts to ACTIVE. The mutation itself
     * still applies — that's what the user wanted; they just need to
     * re-confirm.
     * @private
     */
    #onOfferMutated() {
        if (this.state === STATE.READIED) {
            this.ready[SIDE_A] = false
            this.ready[SIDE_B] = false
            this.state = STATE.ACTIVE
        }
        this.lastTouchedAt = this.now()
    }

    /**
     * Atomic commit. Called only when both ready flags are true.
     *
     * Transaction body:
     *   1. Debit every line of A's items (conditional UPDATE).
     *   2. Debit A's artcoins if any.
     *   3. Mirror for B.
     *   4. Credit B with what A spent; credit A with what B spent.
     *   5. Insert audit log row inside the same transaction.
     * Failure: rolls back, writes a `status='failed'` row best-effort, returns
     * `{ ok: false, code }`.
     */
    async execute() {
        if (this.state !== STATE.READIED) throw new TradeError(`NOT_READIED`)
        if (!this.ready[SIDE_A] || !this.ready[SIDE_B]) throw new TradeError(`NOT_READIED`)
        this.state = STATE.EXECUTING

        const a = this.#offerSnapshot(SIDE_A)
        const b = this.#offerSnapshot(SIDE_B)

        try {
            const result = await this.db.databaseUtils.transaction(async () => {
                await this.#debitSide(this.userAId, a)
                await this.#debitSide(this.userBId, b)
                await this.#creditSide(this.userBId, a)
                await this.#creditSide(this.userAId, b)
                const log = await this.db.trades.recordTradeLog({
                    guildId: this.guildId,
                    userAId: this.userAId,
                    userBId: this.userBId,
                    aOffer: a,
                    bOffer: b,
                    status: `committed`
                })
                return { tradeId: log && log.tradeId }
            })
            this.state = STATE.COMMITTED
            this.tradeLogId = result && result.tradeId
            return { ok: true, tradeId: this.tradeLogId }
        } catch (err) {
            this.state = STATE.FAILED
            const code = err instanceof TradeError ? err.code : `EXEC_FAILED_GENERIC`
            const detail = err instanceof TradeError ? err.detail : (err && err.message)
            this.failureReason = detail ? `${code}:${detail}` : code
            //  Best-effort failure log outside the rolled-back transaction.
            //  A second failure here is swallowed — the trade was already rolled
            //  back, so a missing audit row is acceptable for an event that
            //  never affected inventory.
            try {
                const log = await this.db.trades.recordTradeLog({
                    guildId: this.guildId,
                    userAId: this.userAId,
                    userBId: this.userBId,
                    aOffer: a,
                    bOffer: b,
                    status: `failed`,
                    failureReason: this.failureReason
                })
                this.tradeLogId = log && log.tradeId
            } catch (logErr) {
                if (this.logger) this.logger.warn({ action: `trade_failure_log_dropped`, msg: logErr && logErr.message })
            }
            return { ok: false, code: code, detail: detail || null }
        }
    }

    async #debitSide(userId, offer) {
        for (const line of offer.items) {
            const res = await this.db.databaseUtils.spendInventory({
                itemId: line.itemId,
                value: line.qty,
                userId: userId,
                guildId: this.guildId
            })
            if (!res.ok) throw new TradeError(`INSUFFICIENT_ITEM`, String(line.itemId))
        }
        if (offer.artcoins > 0) {
            const res = await this.db.databaseUtils.spendInventory({
                itemId: ARTCOINS_ITEM_ID,
                value: offer.artcoins,
                userId: userId,
                guildId: this.guildId
            })
            if (!res.ok) throw new TradeError(`INSUFFICIENT_ARTCOINS`)
        }
    }

    async #creditSide(userId, offer) {
        for (const line of offer.items) {
            await this.db.databaseUtils.updateInventory({
                itemId: line.itemId,
                value: line.qty,
                operation: `+`,
                userId: userId,
                guildId: this.guildId
            })
        }
        if (offer.artcoins > 0) {
            await this.db.databaseUtils.updateInventory({
                itemId: ARTCOINS_ITEM_ID,
                value: offer.artcoins,
                operation: `+`,
                userId: userId,
                guildId: this.guildId
            })
        }
    }

    /**
     * Eligibility gate per the design doc §5. Fails closed for legacy or
     * malformed `bind` values: only "y…" strings count as tradeable.
     * @private
     */
    #isItemTradeable(item) {
        if (!item) return false
        const bind = item.bind
        if (typeof bind !== `string`) return false
        if (!bind.toLowerCase().startsWith(`y`)) return false
        if (item.owned_by_guild_id && String(item.owned_by_guild_id) !== String(this.guildId)) return false
        return true
    }

    async #fetchItem(itemId) {
        const rows = await this.db.shop.getItem(itemId, this.guildId)
        if (!rows) return null
        if (Array.isArray(rows)) return rows[0] || null
        return rows
    }

    async #fetchOwnedQuantity(userId, itemId) {
        if (typeof this.db.databaseUtils.getOwnedQuantity === `function`) {
            return this.db.databaseUtils.getOwnedQuantity({ userId, itemId, guildId: this.guildId })
        }
        //  Fallback: walk the user's inventory once and read the line.
        const inv = await this.db.databaseUtils.getUserInventory(userId, this.guildId)
        if (!inv) return 0
        const line = inv.find(row => Number(row.item_id) === Number(itemId))
        if (!line) return 0
        if (line.in_use && Number(line.in_use) === 1) return 0
        return Number(line.quantity) || 0
    }

    #userIdFor(side) {
        return side === SIDE_A ? this.userAId : this.userBId
    }

    #assertSide(side) {
        if (side !== SIDE_A && side !== SIDE_B) throw new TradeError(`INVALID_SIDE`, String(side))
    }

    #assertActiveOrReadied() {
        if (this.state !== STATE.ACTIVE && this.state !== STATE.READIED) {
            throw new TradeError(`INVALID_STATE`, this.state)
        }
    }

    #requireState(expected) {
        if (this.state !== expected) throw new TradeError(`INVALID_STATE`, `${this.state}!=${expected}`)
    }

    #isTerminal() {
        return this.state === STATE.COMMITTED || this.state === STATE.FAILED || this.state === STATE.CANCELLED
    }
}

module.exports = {
    TradeSession,
    TradeError,
    STATE,
    SESSION_LOCK_PREFIX,
    SESSION_LOCK_TTL_SECONDS,
    NON_LINE_ITEM_IDS,
    ARTCOINS_ITEM_ID
}
