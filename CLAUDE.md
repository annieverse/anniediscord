# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Annie is a Discord bot built on `discord.js` v14 with PostgreSQL + Redis. It uses a sharded architecture (`ShardingManager`) and runs an Express server in the master process that serves both the top.gg vote webhook and a bearer-token private API under `/api/v1`.

Coding conventions (no semicolons, backticks-only strings, conventional commits, JSDoc, structured Pino logs, etc.) live in `.github/copilot-instructions.md`. Read that first — those rules are enforced by the ESLint config in `eslint.config.js` and apply to every change.

Node ≥ 24.4.1, npm ≥ 11.4.2.

## Repository layout

```
index.js                  # dotenv + src/master.js
loadCommands.js           # slash-command registration script (npm run loadAppCmds)
pino.config.js            # shared Pino logger
src/
  master.js               # master process: ShardingManager, Express, top.gg webhook
  annie.js                # Annie client, one instance per shard
  api/                    # private HTTP API mounted on the master's Express app
    index.js              #   mount + auth gate + JSON body parser
    middleware/           #   requirePrivateApiToken.js
    routes/v1/            #   /api/v1/ping, /api/v1/commands
    lib/                  #   listCommands.js (reads command metadata from disk)
  commands/<group>/       # artsy, developer, fun, setting, system, user
  commands/loader.js      # builds the command Collections
  commands/applicationCommandsLoader.js   # pushes slash commands to Discord
  controllers/            # events.js, commands.js, applicationCommand.js, autoResponder.js, points.js
  events/<category>/      # base, channel, emoji, guild, interaction, message, role, shard
  libs/                   # database.js, response.js, localizer.js, trade.js, confirmator.js, exp.js, reminder.js, ...
  utils/                  # small helpers (commandCooldown, runtimeEventGate, errorHandler, cacheReset, ...)
  config/                 # global.js, customConfig.js, permissions.js, points.js, knexfile.js, migrations/, db/schema.sql
  locales/                # en.json, fr.json, id.json
  quests/en.json          # quest content
  ui/                     # canvas rendering: setup.js, components/cards.js, prebuild/<card>.js, colors/
  assets/, fonts/         # static images and fonts; assets/{selfupload,customWelcomer,customShop} are gitignored user uploads
tests/                    # mocha suites, mirroring src/ (api, commands, events, libs, master, utils)
docs/                     # CHANGELOG (generated), DEVELOPMENT.md (local setup), trade-system-design.md, faq, legal docs
.claude/agents/           # subagent definitions (see Agent delegation)
```

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

`npm run loadAppCmds` must be re-run any time you add, rename, or change the `options`/`description` of an application (slash) command — the bot itself does not register slash commands at startup. Behavior depends on `NODE_ENV` and, in dev, `NODE_DEV_CLIENT` (`PAN` or `NAPH`); see `src/commands/applicationCommandsLoader.js` for the per-developer routing. The `PAN` route also reads `NODE_DEV_ID` (the dev bot's application ID); the `NAPH` route uses a hardcoded application ID. `NODE_ENV` values in use are `development`, `production` and `production_beta`.

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

`.env` is required for everything (DB creds, `BOT_TOKEN`, `PIXIV_REFRESH_TOKEN`, top.gg keys, `PRIVATE_API_TOKEN`, etc.) — see `.env.example`. Redis has no env var: `Redis.createClient()` is called with no arguments, so it always connects to `localhost:6379`.

## Entrypoint flow

1. `index.js` → `src/master.js` runs the **master process**: creates the asset upload directories, prunes orphaned self-upload covers (`src/utils/pruneSelfUploadCovers.js`), spawns `ShardingManager` over `src/annie.js` (sequentially, 30s apart), and starts Express on `PORT` (default 3000). Express carries the private API (`require('./api')(server)`) and the top.gg vote webhook on `POST /dblwebhook`, which `broadcastEval`s the reward distribution onto shard 0 only (so the DM + DB write happen exactly once). In development the webhook is a mock listener. After the initial spawn the master posts server/shard counts to top.gg (`postTopggStats`, skipped in development).
2. `src/annie.js` exports a singleton `Annie extends Discord.Client`. Each shard instantiates this. The constructor wires intents, cache limits (most managers zeroed), WebSocket timeouts, and a stack of helper props (`localization`, `responseLibs`, `pointsController`, `experienceLibs`, `cronManager`, `cooldowns`, etc.).
3. `prepareLogin()` connects the DB, loads the three command Collections, and attaches the events controller, then `attemptLogin()` retries up to 3× on WebSocket handshake timeout.
4. The `ready` event (`src/events/base/ready.js`) calls `db.initializeDb()`, registers `client.reminders`, then loads guild configs, auto-responders and durational buffs.

### Runtime event gate

A shard is `ready` long before the manager has finished spawning every shard, so user-facing events are held back until both sides are done. `src/utils/runtimeEventGate.js` keeps two flags on the client: `readyTasksComplete` (set at the end of `ready.js` via `client.markReadyTasksComplete()`) and `managerSpawnComplete` (set by the master through `broadcastEval` → `client.unlockEventProcessing()`, after the initial spawn and again whenever a shard respawns). Events are processed only when both are true. If `ready.js` throws, the shard stays locked (`ready_initialization_failed`). A handler that silently does nothing right after startup is usually this gate — look for `runtime_event_processing_blocked` in the logs.

## Client extension pattern (`registerNode`)

`Annie.registerNode(value, key)` installs a property directly on the client. After startup the client carries:

- `client.db` — the `Database` instance (PG `Client` + Redis client + sub-utility classes attached in `db.initializeDb()`, called from the `ready` event)
- `client.message_commands`, `client.application_commands`, `client.guildonly_commands` — `Discord.Collection`s built by `src/commands/loader.js`
- `client.logger` — Pino child logger tagged with the shard name (`src/utils/shardIdParser.js` + `src/config/shardName.json`)
- `client.reminders` — the `Reminder` instance (`src/libs/reminder.js`), registered in `ready`
- `client.dblApi`, `client.errorWebhook` — production only, registered in `ready` (`errorWebhook` only when `ERROR_WEBHOOK_URL` is set)

When you need bot-wide state, follow this same pattern instead of importing singletons.

## Commands

- One file per command in `src/commands/<group>/`. Group folder name becomes `command.group`. Current groups: `artsy`, `developer`, `fun`, `setting`, `system`, `user`.
- The shape is fixed by `src/commands/template.md`. The three booleans `applicationCommand`, `messageCommand`, `server_specific` decide which Collection(s) the loader puts the command into. `tests/commandTests/commandStructure.js` checks the required keys.
- Slash entry: `Iexecute(client, reply, interaction, options, locale)`. Message entry: `execute(client, reply, message, arg, locale, prefix)`. Both should funnel into a shared `run()`. A slash command with autocomplete options also exports `autocomplete(client, interaction)`.
- Cooldowns and permission gating are handled centrally in `src/controllers/commands.js` and `src/controllers/applicationCommand.js` *before* `execute`/`Iexecute` is invoked — don't re-implement either inside a command. The shared cooldown logic is `src/utils/commandCooldown.js` (3s, from `src/config/commands.js`); it is stored in `client.cooldowns`, in memory per shard, and rolled back if the command exits before running.
- `permissionLevel` 0–4 maps to `src/config/permissions.js`. The user's level is resolved by `src/libs/permissions.js`. Developer IDs are hardcoded in both files.
- `client.guildonly_commands` is keyed by guild ID, each value a Collection of that guild's commands. `interactionCreate` builds a per-interaction lookup from it; never merge guild-only commands into `client.application_commands`.
- The controllers refuse to run a command until the user is in the Redis set `VALIDATED_USERID` (filled by `validateUserEntry`).
- `loader.js` skips any file whose exports include a `help` key — that is the deprecated structure.
- Errors thrown from a command are reported to the support server by `src/utils/errorHandler.js`. An error whose message starts with `[Internal Error]` is treated as expected: it is not relayed, and `src/utils/cacheReset.js` clears that command's Redis session keys. A new command that holds a session key should be added to `cacheReset.js`.

## Events

`src/controllers/events.js` is the only place event handlers are attached. It maps each `Events.*` to a file under `src/events/<category>/<name>.js` via `reqEvent()`. Most handlers are wrapped in `runtimeEvent(...)`, which drops the event while the runtime event gate is locked (see **Runtime event gate**); wrap new user-facing handlers the same way.

`ready`, `error`, `interactionCreate` and `messageCreate` are attached in every environment. Events below the `if (annie.dev) return` line are production-only (message delete / bulk delete, shard, channel, emoji, guild, role) — keep that gate in mind when testing locally.

`src/events/base/raw.js`, `src/events/message/messageUpdate.js` and `src/events/role/roleUpdate.js` exist but are not attached in `events.js`.

`messageCreate` (the hot path) does, in order: bot/DM filter → skip if `guild.configs` is not loaded yet → `validateUserEntry` → guild registration → mention-prefix-hint → AutoResponder (if `AR_MODULE`) → command dispatch → passive ARTCOINS gain → passive EXP gain (if `EXP_MODULE`). Per-user cooldowns for passive gain live in `client.cooldowns` (a `Discord.Collection`); buff multipliers come from Redis sets keyed `EXP_BUFF:<guild>@<user>` and `ARTCOINS_BUFF:<guild>@<user>`.

## Per-guild configuration

`src/config/customConfig.js` exposes `availableConfigurations` as a **getter** (the comment at the top explains why — replacing it with a plain array breaks `registerGuildConfigurations`). Values are loaded into `guild.configs` (a `Map<configName, configObject>`) by `Annie.registerGuildConfigurations()`, which is called on `ready` and on `guildCreate`. Always read settings via `message.guild.configs.get('PREFIX').value`, not by hitting the DB. `_parseConfigurationBasedOnType` casts the stored string to the type declared in `allowedTypes`.

## Database

`src/libs/database.js` is one big file containing `Database` plus every sub-utility class (`DatabaseUtils`, `Quests`, `Reminders`, `GuildUtils`, `AutoResponder`, `DurationalBuffs`, `UserUtils`, `SystemUtils`, `CustomRewards`, `Shop`, `Covers`, `Relationships`, `Trades`). They are instantiated together in `db.initializeDb()` and reached as `client.db.databaseUtils`, `.quests`, `.reminders`, `.guildUtils`, `.autoResponder`, `.durationalBuffs`, `.userUtils`, `.systemUtils`, `.customRewardUtils`, `.shop`, `.covers`, `.relationships`, `.trades`. A new sub-utility class goes in this file, extends `DatabaseUtils`, and is added to `initializeDb()`.

- Postgres uses raw `pg.Client` (not a pool); `pg-copy-streams` is available for bulk loads. Schema is owned by knex migrations under `src/config/migrations/` (see the **Database schema** section above for the day-to-day workflow); `src/config/db/schema.sql` is a synced `pg_dump` snapshot used for fresh installs and documentation. Runtime queries do not go through knex — only schema changes do.
- `pg`'s int8→string parser is overridden to `parseInt` at the top of the file.
- Redis is the cache, session-lock and buff store (keys such as `TRADE_SESSION:`, `CONFIRMATOR:`, `GACHA_SESSION:`, `REGISTERED_AR@<guild>`, the `VALIDATED_USERID` set); use `databaseUtils.setCache` / `getCache` / `doesCacheExist` / `delCache` for plain keys. Command and passive-gain cooldowns are not in Redis — they live in `client.cooldowns`. `DatabaseUtils._ensureRedisReady()` exists because of a real race-condition bug — when adding new utility classes that touch Redis, await it before the first call.

## Localization & responses

- `client.localization` is a singleton (`src/libs/localizer.js`) that loads every `src/locales/*.json` at startup — currently `en`, `fr`, `id`. Per-request flow: fetch the user's locale with `client.db.userUtils.getUserLocale(userId)`, then build `const locale = (key) => client.localization.findLocale(key, userData.lang)` and pass it down. Always pass `lang` explicitly: the shared `client.localization.lang` setter is legacy and races between concurrent users. The command controllers already build `locale` and hand it to `execute`/`Iexecute`.
- Lookup falls back to `en`, then to the `LOCALE_NOT_FOUND` placeholder, logging `origin_locale_missing` / `fallback_locale_missing`. Locale files are nested JSON flattened with dots, so keys read like `USER_PERMS.START`.
- Never hardcode user-facing strings — add the key to `src/locales/en.json` in `UPPER_CASE` (and to `fr.json` / `id.json` if a translation is provided).
- All replies go through `client.responseLibs(messageOrInteraction, channelAsInstance, locale)` (`src/libs/response.js`). It handles permissions checks, embeds, sockets/templating, `deleteIn`, and `ephemeral`.

## Private API

`src/api/index.js` mounts onto the master's Express app at `/api`; routes are versioned under `/api/v1` (`src/api/routes/v1/index.js`). Add a new version as a sibling directory under `routes/` instead of changing v1.

- Every route requires `Authorization: Bearer <PRIVATE_API_TOKEN>` (`src/api/middleware/requirePrivateApiToken.js`). With the env var unset, every request gets 503.
- `GET /api/v1/ping` — liveness. `GET /api/v1/commands` — command metadata read from disk by `src/api/lib/listCommands.js`, with functions stripped and anything above `permissionLevel` 3 (developer commands) left out.
- The API runs in the master process, which has no Discord client and no `client.db`. A route that needs bot state has to go through the `ShardingManager` (`broadcastEval`), as the vote webhook does.
- The JSON body parser is scoped to `/api` so it does not touch `/dblwebhook`.

## Trade system

Player-to-player trading is split into three layers; `docs/trade-system-design.md` is the reference for behavior.

- `src/libs/trade.js` — `TradeSession`, a headless state machine (`REQUESTED → ACTIVE → READIED → EXECUTING → COMMITTED | CANCELLED | FAILED`) that owns eligibility checks, Redis session locks (`TRADE_SESSION:`) and the atomic commit. It knows nothing about Discord.
- `src/commands/user/trade.js` — the Discord UI (buttons, embeds, collectors). `src/commands/user/tradehistory.js` reads the log.
- `src/ui/prebuild/tradeWindow.js` — the canvas banner. `client.db.trades` (`Trades` in `database.js`) writes `user_trade_log`, created by migration `20260601000000_add_user_trade_log.js`.

Self-trade is refused unless both `NODE_ENV=development` and `BYPASS_SELF_TRADE=1` are set (solo testing only).

## Canvas UI

Image cards are drawn with `canvas-constructor`. `src/ui/setup.js` registers the fonts in `src/fonts/` and exports `Canvas`; `src/ui/components/cards.js` is the shared card builder; each card type has a file in `src/ui/prebuild/` (profile, level, leaderboard, inventory, gacha, welcomer, tradeWindow, ...). Themes and palettes are in `src/ui/colors/`. Static images are loaded by name through `src/utils/loadAsset.js`.

## Tests

Mocha + Chai + Sinon, no config file: `npm run unit-test` runs every `.js` file under `tests/`, so a helper placed there is executed as a suite. File names are mixed (`*.test.js` and plain `*.js`); both are picked up. Tests mock Discord, Postgres and Redis — none needs a live service. Put a new suite under the folder that mirrors the source (`tests/libs/`, `tests/commands/`, `tests/api/`, `tests/utils/`, `tests/events/`, `tests/master/`).

## Logging

Use the Pino logger from `pino.config.js` (already attached as `client.logger` and as a child on each shard). Prefer the v2 object form: `logger.info({ action: 'snake_case_action', requestId, userId, msg })`. ESLint disallows `console.*`. Set `STREAM_LOG_TO_FILE=1` to additionally write to `./logs/<dd-mm-yyyy>.json`. `LOG_LEVEL` overrides the default level (`info` in production, `debug` otherwise).

## Releases

`semantic-release` runs from CI (`.github/workflows/release.yml`, on push to `master`, after lint and unit tests pass) and writes to `docs/CHANGELOG.md`. `.releaserc.json` also lists a `next` branch, but the workflow only triggers on `master`. Version bumps and changelog entries are automated from conventional-commit messages — do not edit `package.json#version` or the changelog by hand.

## Agent delegation

The main session is the orchestrator: it plans, delegates, then integrates and verifies the result itself. Subagents live in `.claude/agents/`.

| Agent | Model | Use it for |
|---|---|---|
| `explorer` | Haiku, medium effort | Finding the files, functions, locale keys and tests a task touches |
| `worker` | Opus, medium effort | Implementing a scoped change once the files are known |
| `tester` | Haiku, medium effort | Running lint and mocha and reporting the result |
| `escalation` | Fable, high effort | A problem that is still failing after two worker and tester rounds |

Rules:
- Delegate on demand. Split work only when it helps; do not spawn every role for every task.
- Do it directly when the task is small: a lookup one Grep answers, an edit of a few lines in a known file, a single test file to run.
- Use `explorer` when the relevant code is not yet known, and pass its `path:line` findings to `worker` instead of having `worker` search again.
- Give `worker` the goal, the file paths and what done looks like. One worker per independent change; run them in parallel only when they touch different files.
- Run `tester` after changes, then read the diff and the test report yourself before calling the task done.
- Use `escalation` only when stuck, and tell it what was already tried.
- Subagents never commit, push, run migrations or run `npm run loadAppCmds`. Those stay with the orchestrator, after the user agrees.
