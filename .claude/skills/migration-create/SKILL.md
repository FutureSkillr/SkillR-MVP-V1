---
name: migration-create
description: Create a new database migration pair (up/down SQL) with the correct sequential number
allowed-tools: Read, Glob, Grep, Bash, Write, AskUserQuestion
---

# Migration Create — Database Migration Scaffolding

Create a new migration pair `backend/migrations/NNNNNN_<name>.{up,down}.sql` with the correct next number.

## Procedure

### 1. Detect Next Migration Number

```bash
ls backend/migrations/*.up.sql | sort -V | tail -1
```

Extract the highest migration number (e.g. `000028` → next is `000029`). Zero-pad to 6 digits.

### 2. Gather Information

Ask the user for:

- **Name**: Short snake_case description (e.g. `add_user_preferences`, `create_audit_log`)
- **Description**: What this migration does (used for comments in the SQL files)

### 3. Validate Name

- Must be lowercase snake_case: `[a-z0-9_]+`
- No spaces, hyphens, or special characters
- Max 50 characters

### 4. Check for Conflicts

Verify no existing migration has the same name:

```bash
ls backend/migrations/*_${NAME}.up.sql 2>/dev/null
```

If a conflict exists, warn the user and ask for a different name.

### 5. Write Migration Files

**Up migration:** `backend/migrations/{NNNNNN}_{name}.up.sql`

```sql
-- Migration {NNNNNN}: {Description}
-- Up: {what this creates/modifies}

BEGIN;

-- TODO: Add your schema changes here
-- Examples:
-- CREATE TABLE foo (
--     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     created_at TIMESTAMPTZ NOT NULL DEFAULT now()
-- );
-- ALTER TABLE users ADD COLUMN preference TEXT;

COMMIT;
```

**Down migration:** `backend/migrations/{NNNNNN}_{name}.down.sql`

```sql
-- Migration {NNNNNN}: {Description}
-- Down: revert {what was created/modified}

BEGIN;

-- TODO: Add your rollback here
-- Examples:
-- DROP TABLE IF EXISTS foo;
-- ALTER TABLE users DROP COLUMN IF EXISTS preference;

COMMIT;
```

### 6. Verify Sequence

After writing, verify the migration sequence is unbroken:

```bash
ls backend/migrations/*.up.sql | sort -V | awk -F'/' '{print $NF}' | awk -F'_' '{print $1}' | awk 'NR>1{if($1!=prev+1) print "GAP: "prev" -> "$1} {prev=$1}'
```

### 7. Report

Tell the user:
- File paths created (up + down)
- Migration number assigned
- Remind them to:
  1. Fill in the actual SQL
  2. Test with `make migrate-up` or set `RUN_MIGRATIONS=true`
  3. Verify the down migration correctly reverts the up
