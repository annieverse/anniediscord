/**
 * Adds the `user_trade_log` table for the player-to-player trade system.
 * One row per executed-or-failed trade. Idle/timeout-cancelled sessions
 * do not write here — see docs/trade-system-design.md §3.2.
 *
 * `a_offer` / `b_offer` are jsonb: `{ items: [{itemId, qty}], artcoins: N }`.
 * We don't query into the offer payload, so a normalized lines table would
 * be over-engineering for write-once audit data.
 *
 * @param {import('knex')} knex
 * @return {Promise<void>}
 */
exports.up = async function (knex) {
    const exists = await knex.schema.hasTable(`user_trade_log`)
    if (exists) return
    await knex.schema.createTable(`user_trade_log`, table => {
        table.bigIncrements(`trade_id`).primary()
        table.timestamp(`registered_at`).defaultTo(knex.fn.now())
        table.string(`guild_id`).notNullable()
        table.string(`user_a_id`).notNullable()
        table.string(`user_b_id`).notNullable()
        table.jsonb(`a_offer`).notNullable()
        table.jsonb(`b_offer`).notNullable()
        table.string(`status`).notNullable()
        table.string(`failure_reason`)
        table.index([`guild_id`, `registered_at`], `idx_user_trade_log_guild`)
        table.index([`user_a_id`, `registered_at`], `idx_user_trade_log_user_a`)
        table.index([`user_b_id`, `registered_at`], `idx_user_trade_log_user_b`)
    })
}

exports.down = async function (knex) {
    const exists = await knex.schema.hasTable(`user_trade_log`)
    if (exists) await knex.schema.dropTable(`user_trade_log`)
}
