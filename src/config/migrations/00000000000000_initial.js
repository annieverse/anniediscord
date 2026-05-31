"use strict"
const fs = require(`fs`)
const path = require(`path`)

/**
 * Baseline migration. Loads `src/config/db/schema.sql` verbatim — that file
 * is the source of truth for the bot's table shape. Any change beyond this
 * point is its own timestamped migration; this one's job is to reproduce
 * the current production schema on a fresh dev DB.
 *
 * Idempotent: if `users` already exists we assume the rest of the schema
 * does too and skip. That's the same shape the legacy migration used and
 * keeps existing deployments stable.
 *
 * Two preprocessing passes on the dump before we hand it to Postgres:
 *   1. Strip every `ALTER TABLE ... OWNER TO annie;` clause. The `annie`
 *      role may not exist on a fresh dev box; the connected user becomes
 *      the table owner by default and that's the right answer.
 *   2. Drop `pg_dump`-emitted SET pragmas. They're session-scoped and
 *      not portable across PG versions / users; the rest of the file
 *      (CREATE TABLE / CONSTRAINT / INDEX) is what actually matters.
 *
 * @param {import('knex')} knex
 * @return {Promise<void>}
 */
exports.up = async function (knex) {
    if (await knex.schema.hasTable(`users`)) return
    const schemaPath = path.resolve(__dirname, `../db/schema.sql`)
    const raw = fs.readFileSync(schemaPath, `utf8`)
    const sql = raw
        //  Strip OWNER TO <role> clauses; the connected DB user owns
        //  whatever they create, which is the right behavior for dev.
        .replace(/ALTER\s+TABLE[^;]*OWNER\s+TO\s+\w+\s*;/gi, ``)
        //  pg_dump's session pragmas at the top of the file. Harmless when
        //  applicable, errors when the connecting user lacks rights.
        .replace(/^SET\s+[^;]+;\s*$/gim, ``)
        .replace(/^SELECT\s+pg_catalog\.set_config[^;]+;\s*$/gim, ``)
        //  Strip the dump-info header comments and the trailing
        //  "dump complete" marker. They're noise inside a migration.
        .replace(/^--\s*PostgreSQL database dump.*$/gim, ``)
        .replace(/^--\s*Dumped (from|by).*$/gim, ``)
    await knex.raw(sql)
}

/**
 * No down for the baseline. Roll back individual post-baseline migrations
 * instead — knex will refuse to roll back this one with the message below
 * rather than silently dropping every table the bot needs.
 */
exports.down = async function () {
    throw new Error(`Baseline migration cannot be rolled back. Roll back specific post-baseline migrations instead.`)
}
