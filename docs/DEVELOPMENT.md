# Local Development Setup

A practical walkthrough for getting Annie running on your machine for the first time. Plan on ~30-45 min the first time, mostly waiting for installs.

If you've never touched a discord.js bot before, the high-level mental model is: you're running a Node.js process that holds a persistent WebSocket connection to Discord, backed by Postgres for durable data and Redis for cache, session locks and buffs. Everything below is that picture, made concrete.

---

## 1. System prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | ≥ 24.4.1 | `package.json` engines field. nvm recommended. |
| npm | ≥ 11.4.2 | Ships with Node 24, but verify. |
| PostgreSQL | 14+ | Schema dumps were taken on 14.7. Newer is fine. |
| Redis | 6+ | Any modern build. Used for cache, session locks, and durational buffs. |
| Git | any | |
| Build toolchain for `node-canvas` | system-dependent | See "Canvas native deps" below. |

### Canvas native deps

`canvas` and `canvas-constructor` compile against Cairo / Pango / libjpeg / giflib at install time. If `npm install` fails on `canvas`, you're missing system libraries.

- **Debian / Ubuntu / WSL2**:
  ```bash
  sudo apt-get install -y build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev pkg-config python3
  ```
- **macOS**: `brew install pkg-config cairo pango libpng jpeg giflib librsvg`
- **Windows**: use WSL2. The native Windows path for `node-canvas` is painful and not what the maintainers run.

### Recommended developer setup for WSL2 / Linux

Postgres and Redis can run as system services, in Docker, or as Homebrew services on macOS. The team runs them locally as system services. If you prefer Docker, a minimal `docker-compose.yml` with `postgres:14` and `redis:7-alpine` works fine — bind to `localhost` and match the `.env` ports.

---

## 2. Clone and install

```bash
git clone git@github.com:annieverse/anniediscord.git
cd anniediscord
npm ci      # use ci, not install — keeps the lockfile honest
```

`npm ci` will compile the canvas native module. If it fails, fix the system libs (above) and retry.

---

## 3. Postgres setup

The bot connects with a single `pg.Client` (no pool — see `Database.connect()` in `src/libs/database.js`). It expects a database it can write to with the credentials in `.env`. The schema is owned by knex migrations under `src/config/migrations/`; `src/config/db/schema.sql` is a `pg_dump` snapshot kept in sync with them.

### 3a. Create the role and database

```bash
sudo -u postgres psql
```

Inside `psql`:

```sql
CREATE ROLE annie WITH LOGIN PASSWORD 'a-strong-password';
ALTER ROLE annie CREATEDB;
CREATE DATABASE annie_dev OWNER annie;
\q
```

Using a different role name works as long as your `.env` matches — the baseline migration strips the `OWNER TO annie` clauses from the dump, so whichever user connects owns the tables.

### 3b. Create the schema

Fill in the `PG_*` values in `.env` first (step 6), then run:

```bash
npm run db:migrate
```

On an empty database this runs the baseline migration (`00000000000000_initial.js`), which loads `src/config/db/schema.sql`, and then every timestamped migration after it. The result is 28 tables covering users, guilds, items, inventories, EXP, quests, reminders, durational buffs, relationships, autoresponders, the trade log, and so on. To verify:

```bash
npm run db:status
psql -h localhost -U annie -d annie_dev -c '\dt'
```

You should see tables like `users`, `guilds`, `user_inventories`, `user_exp`, `items`, `guild_configurations`, `user_trade_log`, plus knex's own `knex_migrations` tables.

### 3c. Working with migrations

The migration set is the source of truth for the schema. `schema.sql` is documentation and the seed for the baseline; don't hand-edit it.

| Command | What it does |
|---------|--------------|
| `npm run db:migrate` | Apply pending migrations. Safe to re-run. |
| `npm run db:status` | List completed and pending migrations. |
| `npm run db:rollback` | Roll back the most recent batch. The baseline refuses to roll back. |
| `npm run db:make <name>` | Scaffold a new timestamped migration in `src/config/migrations/`. |

Every new migration needs a working `down`. After a migration changes tables, refresh the snapshot:

```bash
pg_dump --schema-only --no-owner --no-privileges annie_dev > src/config/db/schema.sql
```

If your database was created by loading `schema.sql` directly with `psql` (the old instructions), you don't need to start over: the baseline detects the existing `users` table and skips itself, and `db:migrate` only applies what came after.

Migrations only cover schema changes. Runtime queries go through raw `pg`, not knex.

### 3d. Seeding minimum data (optional)

The bot's runtime calls `validateUserEntry` and `registerGuild` lazily as messages come in, so you do not need to pre-seed users or guilds. The `items` table, however, has hardcoded item IDs referenced from code — most importantly `itemId: 52` is the artcoins currency. If your `items` table is empty after migrating, currency-granting features will silently no-op. Pull the production seed data from a maintainer (it's not in the repo) or insert at least item 52 manually:

```sql
-- minimum viable items row, talk to maintainers for the real seed
INSERT INTO items (item_id, name, alias) VALUES (52, 'Artcoins', 'artcoins');
```

(Adjust columns to match your actual `items` schema — check with `\d items`.)

---

## 4. Redis setup

No special configuration. Default install on `localhost:6379` with no password is what the bot expects:

```bash
# Ubuntu / WSL2
sudo apt-get install -y redis-server
sudo systemctl enable --now redis-server

# macOS
brew install redis
brew services start redis
```

Verify:
```bash
redis-cli ping     # → PONG
```

Note: `connectRedis()` in `src/libs/database.js` calls `Redis.createClient()` with no arguments, which means it connects to `localhost:6379` only. There is no env var for the Redis URL today — if you need a remote Redis, you'll have to patch that line.

---

## 5. Discord application setup

You need a separate dev bot — never run development against the production token.

1. Go to <https://discord.com/developers/applications> and click **New Application**.
2. Under **Bot**, create the bot user. Copy the **token** — this is your `BOT_TOKEN`.
3. Under **Bot → Privileged Gateway Intents**, enable:
   - **Server Members Intent**
   - **Message Content Intent**
   (The intents are requested at the bottom of `src/annie.js`.)
4. Under **OAuth2 → URL Generator**, select scopes `bot` and `applications.commands`. Generate the invite URL and add the bot to a personal test server you control.
5. Under **General Information**, copy the **Application ID** — this is your `NODE_DEV_ID`.

---

## 6. `.env` file

Copy the template and fill in only what you need locally:

```bash
cp .env.example .env
```

### Required for any local run
| Var | Value |
|-----|-------|
| `NODE_ENV` | `development` |
| `NODE_DEV_ID` | the Application ID from step 5.5. Read by the `PAN` route of `npm run loadAppCmds`. |
| `NODE_DEV_CLIENT` | `NAPH` or `PAN` (used by `src/commands/applicationCommandsLoader.js` to route slash command registration). New contributors want `PAN` — see step 7. |
| `PORT` | `3000` (or any free port) |
| `BOT_TOKEN` | the token from step 5.2 |
| `PG_HOST` | `localhost` |
| `PG_USER` | `annie` |
| `PG_PASS` | the password you set in step 3a |
| `PG_DB` | `annie_dev` |
| `PG_PORT` | `5432` |
| `PREFIX` | any single character, e.g. `>` (used as the global fallback prefix) |

### Required for specific features
| Var | When you need it |
|-----|------------------|
| `PIXIV_REFRESH_TOKEN` | Only if you're working on `src/commands/artsy/pixiv.js`. Skip otherwise. |
| `DBLTOKEN`, `DBLWEBHOOK_AUTH` | Top.gg vote rewards. With `NODE_ENV=development` the `/dblwebhook` listener in `src/master.js` is a mock and the top.gg stats post is skipped, so you don't need real values. |
| `BFD_BOT_ID`, `BFD_API_TOKEN`, `INFINITYBOTS_TOKEN` | Bot list integrations. Production-only. |
| `VOTE_WEBHOOK_URL`, `ERROR_WEBHOOK_URL` | Internal Discord webhooks for monitoring. Optional. |
| `PRIVATE_API_TOKEN` | Bearer token for the private API under `/api/v1` (`src/api/`). Leave unset unless you're working on it — every request then returns 503. |
| `BYPASS_SELF_TRADE` | Set to `1` together with `NODE_ENV=development` to `/trade` with yourself, so you can test the trade flow with one account. Has no effect on its own. Never set in production. |

### Optional logging
| Var | Default | Effect |
|-----|---------|--------|
| `LOG_LEVEL` | `debug` in dev, `info` in prod | Pino log level |
| `STREAM_LOG_TO_FILE` | unset | Set to `1` to also write logs as JSON to `./logs/<dd-mm-yyyy>.json` |

---

## 7. Register slash commands (one-time, then on every command change)

Slash commands need to be registered with Discord's API once (and again any time you add, rename, or change the description / options of an `applicationCommand`-flagged command). The bot does **not** register them at startup.

```bash
npm run loadAppCmds
```

Behavior depends on `NODE_ENV` + `NODE_DEV_CLIENT`:
- `NODE_DEV_CLIENT=PAN` registers as global commands against the bot in `NODE_DEV_ID`. Global propagation can take up to an hour, but in practice your test guild updates in a few minutes. This is the route to use with your own dev bot.
- `NODE_DEV_CLIENT=NAPH` registers as guild commands against guild `577121315480272908` (Annie support server) using a hardcoded application ID. It only works with that maintainer's dev bot.

If you need to register against your own test guild instead, add a new branch in `src/commands/applicationCommandsLoader.js`. Don't push that branch.

---

## 8. Run the bot

```bash
npm run dev
```

This is `nodemon index.js` piped through `pino-pretty`. You should see log lines for:
- The private API being mounted (`private_api_mounted`) and the port being listened on
- Shard spawn (singular, since you only have a handful of guilds)
- Postgres connection
- Redis connection
- "Successfully logged in to Discord"
- `<DEPLOYED>` from the ready event
- `runtime_event_processing_unlocked` — from this point the bot reacts to messages and interactions

If you don't see all of these, check log output — connection failures, missing intents, and bad tokens all surface as clear messages.

To verify end-to-end:
- In your test guild, type `>ping` (or whatever your `PREFIX` is). Message commands run.
- Type `/ping` if you registered slash commands. Slash commands run.
- Both paths should reply with a latency reading.

### Heads-up about dev mode

`src/controllers/events.js` attaches only part of the event set when `NODE_ENV=development`. `ready`, `error`, `interactionCreate` and `messageCreate` are always attached, so slash commands, prefix commands, autoresponders and passive EXP / artcoins gain all work locally. Everything below the `if (annie.dev) return` line is production-only: message delete logging, shard events, channel, emoji, guild and role events. Implications for you:

- **Welcome banners** (`guildMemberAdd`), **guild join / leave handling** and the **server log** features don't fire in dev. To work on one, temporarily move its line above the dev gate. Don't commit that.
- If the production bot shares a guild with your dev bot and both use the same prefix, both answer prefix commands. Test in a guild without the production bot, or set a different `PREFIX`.

### Heads-up about the startup lock

Events are ignored until two things have happened: the shard's `ready` tasks finished, and the master process finished spawning shards (`src/utils/runtimeEventGate.js`). Normally that takes a few seconds. If `ready` fails — usually Postgres or Redis — the shard stays locked and the bot looks online but silent. Look for `ready_initialization_failed` or `runtime_event_processing_blocked` in the logs.

---

## 9. Tests and lint

```bash
npm run lint:check                                  # ESLint over src/
npm run lint:fix                                    # ESLint with auto-fix
npm run unit-test                                   # Mocha against tests/**/*.js
npm run test                                        # lint + unit-test, the gate before pushing
node ./node_modules/mocha/bin/mocha tests/libs/database.test.js  # single file
```

The test suite mocks Discord, Postgres and Redis, so it runs without any of the services above.

Lint config is `eslint.config.js`. Two things to know about the style: **no semicolons** (enforced) and **strings must use backticks** (enforced — single/double quotes will fail lint). The full convention list is in `.github/copilot-instructions.md`.

---

## 10. Common first-run problems

**`npm install` fails on `canvas`.** Missing system libs. Re-read step 1.

**`PostgreSQL server fails to connect`.** PG isn't running, the credentials in `.env` are wrong, or `pg_hba.conf` rejects the auth method. Test directly with `psql -h localhost -U annie -d annie_dev` first; once that works, the bot will too.

**`REDIS <ERROR>` then process exit.** Redis isn't running or isn't on `localhost:6379`. `redis-cli ping` to verify.

**Bot logs in but doesn't respond to messages.** Two likely causes:
1. **Message Content Intent** isn't enabled in the developer portal (step 5.3).
2. The startup lock (step 8 heads-up) never released because the `ready` event failed. Check the logs for `ready_initialization_failed`.
3. Your message uses the wrong prefix. The guild may have a custom one — mention the bot to see it.

**Slash commands don't appear in Discord.** You haven't run `npm run loadAppCmds` yet, or the `NODE_DEV_CLIENT` branch doesn't match your bot. Check the script's logs — it logs the count of commands registered.

**`Unable to send message to channel`.** The bot lacks Send Messages or Embed Links in the channel. The bot needs at minimum `View Channel`, `Send Messages`, `Embed Links`, `Attach Files`, `Read Message History`, `Use External Emojis`, `Add Reactions`. Use the OAuth2 invite URL with permission integer `140056587334` (matches the production invite).

**Custom emojis appear as `:emojiName:` literal text in replies.** `client.getEmoji(name, serverId)` looks for emojis in the support server (`577121315480272908`) by default. In dev, you don't have access to those emojis — replies referencing them render the literal name. Cosmetic only.

**A command replies with an error message.** In dev the reply includes the stack trace; the bot's terminal has the same error. Common causes: missing `items` table seed (especially row 52), missing locale keys (`src/locales/en.json`), or guild config not yet registered (send any message in the guild first to trigger `registerGuild`).

---

## 11. What to read next

In rough order:
- `CLAUDE.md` — high-level architecture (repository layout, entrypoint flow, `registerNode` pattern, command shape, event dispatch, per-guild config, DB layout, private API, trade system).
- `.github/copilot-instructions.md` — coding conventions (commit format, lint rules, logging style).
- `src/commands/template.md` — the canonical command file shape.
- `src/master.js` and `src/annie.js` — the two halves of the runtime (master shard vs per-shard client).
- `docs/trade-system-design.md` — how the player-to-player trade system works, if you're touching it.

---

## 12. Cleanup

When you're done with the dev DB:
```sql
DROP DATABASE annie_dev;
DROP ROLE annie;
```
Redis keys persist by default — `redis-cli FLUSHDB` clears the dev-side cache and session locks if you want a clean slate.
