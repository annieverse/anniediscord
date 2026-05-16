# Local Development Setup

A practical walkthrough for getting Annie running on your machine for the first time. Plan on ~30-45 min the first time, mostly waiting for installs.

If you've never touched a discord.js bot before, the high-level mental model is: you're running a Node.js process that holds a persistent WebSocket connection to Discord, backed by Postgres for durable data and Redis for cache + cooldowns. Everything below is that picture, made concrete.

---

## 1. System prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | ≥ 24.4.1 | `package.json` engines field. nvm recommended. |
| npm | ≥ 11.4.2 | Ships with Node 24, but verify. |
| PostgreSQL | 14+ | Schema dumps were taken on 14.7. Newer is fine. |
| Redis | 6+ | Any modern build. Used for cache, cooldowns, and durational buffs. |
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

The bot connects with a single `pg.Client` (no pool — see `src/libs/database.js:27`). It expects a database it can write to with the credentials in `.env`. Schema is provided as a `pg_dump` snapshot at `src/config/db/schema.sql`.

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

The schema dump was taken with owner `annie`. Using a different role name works as long as your `.env` matches; you may see `OWNER` warnings during the load — they're cosmetic.

### 3b. Load the schema

```bash
psql -h localhost -U annie -d annie_dev -f src/config/db/schema.sql
```

This creates ~27 tables covering users, guilds, items, inventories, EXP, quests, reminders, durational buffs, relationships, autoresponders, and so on. To verify:

```bash
psql -h localhost -U annie -d annie_dev -c '\dt'
```

You should see tables like `users`, `guilds`, `user_inventories`, `user_exp`, `items`, `guild_configurations`, etc.

### 3c. About the Knex migrations

`src/config/migrations/setup.js` exists and `knex` is a runtime dependency, but **migrations are not the source of truth**. The Knex setup file references tables (`user_abouts`, `user_banners`, `locales`, `genders`, `relationship_locales`, `quest_locales`, `quest_rewards`, `item_log`, `buffs`) that don't appear in `schema.sql`, and conversely `schema.sql` contains tables Knex doesn't define. Treat `schema.sql` as canonical for local development. Talk to the maintainers before reorganizing this — it's a known piece of debt, not something to "fix" silently.

### 3d. Seeding minimum data (optional)

The bot's runtime calls `validateUserEntry` and `registerGuild` lazily as messages come in, so you do not need to pre-seed users or guilds. The `items` table, however, has hardcoded item IDs referenced from code — most importantly `itemId: 52` is the artcoins currency. If your `items` table is empty after the schema load, currency-granting features will silently no-op. Pull the production seed data from a maintainer (it's not in the repo) or insert at least item 52 manually:

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

Note: `src/libs/database.js:69` calls `Redis.createClient()` with no arguments, which means it connects to `localhost:6379` only. There is no env var for the Redis URL today — if you need a remote Redis, you'll have to patch that line.

---

## 5. Discord application setup

You need a separate dev bot — never run development against the production token.

1. Go to <https://discord.com/developers/applications> and click **New Application**.
2. Under **Bot**, create the bot user. Copy the **token** — this is your `BOT_TOKEN`.
3. Under **Bot → Privileged Gateway Intents**, enable:
   - **Server Members Intent**
   - **Message Content Intent**
   (`src/annie.js:512` requests these.)
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
| `NODE_DEV_ID` | the Application ID from step 5.5 |
| `NODE_DEV_CLIENT` | `NAPH` or `PAN` (used by `src/commands/applicationCommandsLoader.js` to route slash command registration). Pick one or add a new branch. |
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
| `DBLTOKEN`, `DBLWEBHOOK_AUTH` | Top.gg vote rewards. In dev, the webhook is mocked (`src/master.js:94`) so you don't strictly need real values, but the mock currently always-mocks regardless — see `BUGS.md` #11 if you're touching vote logic. |
| `BFD_BOT_ID`, `BFD_API_TOKEN`, `INFINITYBOTS_TOKEN` | Bot list integrations. Production-only. |
| `VOTE_WEBHOOK_URL`, `ERROR_WEBHOOK_URL` | Internal Discord webhooks for monitoring. Optional. |

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
- `NODE_DEV_CLIENT=NAPH` registers as guild commands against guild `577121315480272908` (Annie support server). You'll only see them there.
- `NODE_DEV_CLIENT=PAN` registers as global commands against your dev bot ID. Global propagation can take up to an hour, but in practice your test guild updates in a few minutes.

If you need to register against your own test guild instead, add a new branch in `src/commands/applicationCommandsLoader.js`. Don't push that branch.

---

## 8. Run the bot

```bash
npm run dev
```

This is `nodemon index.js` piped through `pino-pretty`. You should see log lines for:
- Postgres connection
- Redis connection
- Shard spawn (singular, since you only have a handful of guilds)
- Application command load (no-op at runtime since `loadAppCmds` is separate)
- "Successfully logged in to Discord"
- `<DEPLOYED>` from the ready event

If you don't see all of these, check log output — connection failures, missing intents, and bad tokens all surface as clear messages.

To verify end-to-end:
- In your test guild, type `>ping` (or whatever your `PREFIX` is). Message commands run.
- Type `/ping` if you registered slash commands. Slash commands run.
- Both paths should reply with a latency reading.

### Heads-up about dev mode

`src/controllers/events.js:14-16` registers a subset of events in dev. Specifically, **only interaction events fire**; `MessageCreate`, `GuildCreate`, `GuildMemberAdd`, role events, and shard events are gated behind `if (annie.dev) return`. This is intentional — when both prod and dev bots share the support server, you don't want both responding. Implications for you:

- **Message-command testing** (the `>ping` example above) requires either (a) running in a guild where the prod bot is absent, or (b) temporarily commenting out the dev-gate. It's not a bug, but it bites every new contributor once.
- **Welcome banners** (`guildMemberAdd`) and **autoresponders** (which run inside `messageCreate`) also won't fire in dev for the same reason.

---

## 9. Tests and lint

```bash
npm run lint:check                                  # ESLint over src/
npm run lint:fix                                    # ESLint with auto-fix
npm run unit-test                                   # Mocha against tests/**/*.js
npm run test                                        # lint + unit-test, the gate before pushing
node ./node_modules/mocha/bin/mocha tests/libs/database.test.js  # single file
```

Lint config is `eslint.config.js`. Two things to know about the style: **no semicolons** (enforced) and **strings must use backticks** (enforced — single/double quotes will fail lint). The full convention list is in `.github/copilot-instructions.md`.

---

## 10. Common first-run problems

**`npm install` fails on `canvas`.** Missing system libs. Re-read step 1.

**`PostgreSQL server fails to connect`.** PG isn't running, the credentials in `.env` are wrong, or `pg_hba.conf` rejects the auth method. Test directly with `psql -h localhost -U annie -d annie_dev` first; once that works, the bot will too.

**`REDIS <ERROR>` then process exit.** Redis isn't running or isn't on `localhost:6379`. `redis-cli ping` to verify.

**Bot logs in but doesn't respond to messages.** Two likely causes:
1. **Message Content Intent** isn't enabled in the developer portal (step 5.3).
2. The dev-mode event gate (step 8 heads-up) is filtering out `MessageCreate` and your prod bot is in the same guild.

**Slash commands don't appear in Discord.** You haven't run `npm run loadAppCmds` yet, or the `NODE_DEV_CLIENT` branch doesn't match your bot. Check the script's logs — it logs the count of commands registered.

**`Unable to send message to channel`.** The bot lacks Send Messages or Embed Links in the channel. The bot needs at minimum `View Channel`, `Send Messages`, `Embed Links`, `Attach Files`, `Read Message History`, `Use External Emojis`, `Add Reactions`. Use the OAuth2 invite URL with permission integer `140056587334` (matches the production invite).

**Custom emojis appear as `:emojiName:` literal text in replies.** `client.getEmoji(name, serverId)` looks for emojis in the support server (`577121315480272908`) by default. In dev, you don't have access to those emojis — replies referencing them render the literal name. Cosmetic only.

**Slash commands silently fail with "production error" message.** Look at the bot's terminal — the actual error is logged but suppressed from the user. Common causes: missing `items` table seed (especially row 52), missing locale keys (`src/locales/en.json`), or guild config not yet registered (send any message in the guild first to trigger `registerGuild`).

---

## 11. What to read next

In rough order:
- `CLAUDE.md` — high-level architecture (entrypoint flow, `registerNode` pattern, command shape, event dispatch, per-guild config, DB layout).
- `.github/copilot-instructions.md` — coding conventions (commit format, lint rules, logging style).
- `src/commands/template.md` — the canonical command file shape.
- `src/master.js` and `src/annie.js` — the two halves of the runtime (master shard vs per-shard client).
- `BUGS.md` — known issues to be aware of before you start touching the hot paths.

---

## 12. Cleanup

When you're done with the dev DB:
```sql
DROP DATABASE annie_dev;
DROP ROLE annie;
```
Redis keys persist by default — `redis-cli FLUSHDB` clears the dev-side cache and cooldowns if you want a clean slate.
