# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Annie is a Discord bot built on `discord.js` v14 with PostgreSQL + Redis. It uses a sharded architecture (`ShardingManager`) and ships an Express server on the same process for the top.gg vote webhook.

Coding conventions (no semicolons, backticks-only strings, conventional commits, JSDoc, structured Pino logs, etc.) live in `.github/copilot-instructions.md`. Read that first — those rules are enforced by the ESLint config in `eslint.config.js` and apply to every change.

Node ≥ 24.4.1, npm ≥ 11.4.2.

## Common commands

```bash
npm run dev               # nodemon + pino-pretty against index.js
npm run lint:check        # eslint src
npm run lint:fix          # eslint src --fix
npm run unit-test         # mocha tests/**/*.js
npm run test              # lint + unit-test (the gate before committing)
node ./node_modules/mocha/bin/mocha tests/libs/database.test.js   # single test file
npm run loadAppCmds       # push slash command definitions to Discord (uses NODE_ENV + NODE_DEV_CLIENT)
npm run db:migrate        # apply pending knex migrations to the DB in .env
npm run db:status         # show pending vs completed migrations
npm run db:rollback       # roll back the most recent migration batch
npm run db:make <name>    # scaffold a new migration file under src/config/migrations
npm start                 # pm2 production start (ecosystem.config.js)
```

`npm run loadAppCmds` must be re-run any time you add, rename, or change the `options`/`description` of an application (slash) command — the bot itself does not register slash commands at startup. Behavior depends on `NODE_ENV` and, in dev, `NODE_DEV_CLIENT` (`PAN` or `NAPH`); see `src/commands/applicationCommandsLoader.js` for the per-developer routing.

## Database schema

Schema is owned by knex migrations under `src/config/migrations/`. Source of truth is the migration set; `src/config/db/schema.sql` is a `pg_dump` snapshot kept synced with it for documentation and to seed the baseline migration.

**Fresh dev setup:** with a `.env` pointing at an empty PostgreSQL database, a single command bootstraps the schema:

```bash
npm run db:migrate
```

The baseline migration (`00000000000000_initial.js`) loads `schema.sql` verbatim — minus `OWNER TO annie` clauses and `pg_dump` SET pragmas, which would fail on a fresh dev box where neither the role nor the elevated session rights exist. Subsequent timestamped migrations apply on top. The result is a complete dev schema without production data.

Day-to-day:
- Apply outstanding migrations: `npm run db:migrate`. Always safe to re-run.
- Check current state: `npm run db:status`. Lists completed and pending files.
- Roll back the last batch: `npm run db:rollback`. Use sparingly — every post-baseline migration must define a working `down`. The baseline itself refuses to roll back.
- Scaffold a new migration: `npm run db:make <name>` — generates a timestamped file in the migrations directory.

After a migration adds, drops, or alters tables, refresh `schema.sql` so the snapshot stays useful (typical flow: `pg_dump --schema-only --no-owner --no-privileges <db> > src/config/db/schema.sql`). The snapshot is documentation; don't hand-edit it as the source of truth.

If your DB was bootstrapped from `schema.sql` directly (no `knex_migrations` table yet), the first `db:migrate` short-circuits the baseline via `hasTable('users')` and only runs post-baseline migrations.

`.env` is required for everything (DB creds, `BOT_TOKEN`, `PIXIV_REFRESH_TOKEN`, top.gg keys, etc.) — see `.env.example`.

## Entrypoint flow

1. `index.js` → `src/master.js` runs the **master shard process**: spawns `ShardingManager` over `src/annie.js`, sets up Express, listens for top.gg vote webhooks on `POST /dblwebhook`, and `broadcastEval`s the reward distribution onto shard 0 only (so the DM + DB write happen exactly once).
2. `src/annie.js` exports a singleton `Annie extends Discord.Client`. Each shard instantiates this. The constructor wires intents, cache limits (most managers zeroed), WebSocket timeouts, and a stack of helper props (`localization`, `responseLibs`, `pointsController`, `experienceLibs`, `cronManager`, `cooldowns`, etc.).
3. `prepareLogin()` loads the DB, the three command Collections, and the events controller, then `attemptLogin()` retries up to 3× on WebSocket handshake timeout.

## Client extension pattern (`registerNode`)

`Annie.registerNode(value, key)` installs a property directly on the client. After startup the client carries:

- `client.db` — the `Database` instance (PG `Client` + Redis client + sub-utility classes attached in `db.initializeDb()`, called from the `ready` event)
- `client.message_commands`, `client.application_commands`, `client.guildonly_commands` — `Discord.Collection`s built by `src/commands/loader.js`
- `client.logger` — Pino child logger tagged with the shard name (`src/utils/shardIdParser.js` + `src/config/shardName.json`)

When you need bot-wide state, follow this same pattern instead of importing singletons.

## Commands

- One file per command in `src/commands/<group>/`. Group folder name becomes `command.group`.
- The shape is fixed by `src/commands/template.md`. The three booleans `applicationCommand`, `messageCommand`, `server_specific` decide which Collection(s) the loader puts the command into.
- Slash entry: `Iexecute(client, reply, interaction, options, locale)`. Message entry: `execute(client, reply, message, arg, locale)`. Both should funnel into a shared `run()`.
- Cooldowns and permission gating are handled centrally in `src/controllers/commands.js` and `src/controllers/applicationCommand.js` *before* `execute`/`Iexecute` is invoked — don't re-implement either inside a command.
- `permissionLevel` 0–4 maps to `src/config/permissions.js` (Developer IDs are hardcoded there).
- `loader.js` skips any file whose exports include a `help` key — that is the deprecated structure.

## Events

`src/controllers/events.js` is the only place event handlers are attached. It maps each `Events.*` to a file under `src/events/<category>/<name>.js` via `reqEvent()`. Events below the `if (annie.dev) return` line are production-only (shard, channel, emoji, guild, message-delete, role) — keep that gate in mind when testing locally.

`messageCreate` (the hot path) does, in order: bot/DM filter → `validateUserEntry` → guild config registration → mention-prefix-hint → AutoResponder → command dispatch → passive ARTCOINS gain → passive EXP gain. Per-user cooldowns for passive gain live in `client.cooldowns` (a `Discord.Collection`); buff multipliers come from Redis sets keyed `EXP_BUFF:<guild>@<user>` and `ARTCOINS_BUFF:<guild>@<user>`.

## Per-guild configuration

`src/config/customConfig.js` exposes `availableConfigurations` as a **getter** (the comment at the top explains why — replacing it with a plain array breaks `registerGuildConfigurations`). Values are loaded into `guild.configs` (a `Map<configName, configObject>`) by `Annie.registerGuildConfigurations()`, which is called on `ready` and on `guildCreate`. Always read settings via `message.guild.configs.get('PREFIX').value`, not by hitting the DB. `_parseConfigurationBasedOnType` casts the stored string to the type declared in `allowedTypes`.

## Database

`src/libs/database.js` is one big file containing `Database` plus every sub-utility class (`DatabaseUtils`, `Quests`, `Reminders`, `GuildUtils`, `AutoResponder`, `DurationalBuffs`, `UserUtils`, `SystemUtils`, `CustomRewards`, `Shop`, `Covers`, `Relationships`). They are instantiated together in `db.initializeDb()` after Redis is up.

- Postgres uses raw `pg.Client` (not a pool); `pg-copy-streams` is available for bulk loads. Schema is owned by knex migrations under `src/config/migrations/` (see the **Database schema** section above for the day-to-day workflow); `src/config/db/schema.sql` is a synced `pg_dump` snapshot used for fresh installs and documentation. Runtime queries do not go through knex — only schema changes do.
- `pg`'s int8→string parser is overridden to `parseInt` at the top of the file.
- Redis is the cooldown / cache / buff store. `DatabaseUtils._ensureRedisReady()` exists because of a real race-condition bug — when adding new utility classes that touch Redis, await it before the first call.

## Localization & responses

- `client.localization` is a singleton (`src/libs/localizer.js`). Per-request flow: fetch user locale, set `client.localization.lang`, then build `const locale = (key) => client.localization.findLocale(key)` and pass it down. Never hardcode user-facing strings — add the key to `src/locales/en.json` (and `fr.json` if a translation is provided) in `UPPER_CASE`.
- All replies go through `client.responseLibs(messageOrInteraction, channelAsInstance, locale)` (`src/libs/response.js`). It handles permissions checks, embeds, sockets/templating, `deleteIn`, and `ephemeral`.

## Logging

Use the Pino logger from `pino.config.js` (already attached as `client.logger` and as a child on each shard). Prefer the v2 object form: `logger.info({ action: 'snake_case_action', requestId, userId, msg })`. ESLint disallows `console.*`. Set `STREAM_LOG_TO_FILE=1` to additionally write to `./logs/<dd-mm-yyyy>.json`.

## Releases

`semantic-release` runs from CI on `master`/`next` (`.releaserc.json`) and writes to `docs/CHANGELOG.md`. Version bumps and changelog entries are automated from conventional-commit messages — do not edit `package.json#version` or the changelog by hand.
