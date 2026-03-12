---
name: database-skill
description: Design database schemas and implement tables, migrations, and data access patterns. Use for building reliable persistence layers.
---

# Database Skill – Tables, Migrations, Schema Design

## Scope
This skill covers end-to-end database work for an application:
- Schema design (entities, relationships, constraints)
- Creating tables and indexes
- Writing and running migrations safely
- Data access layer patterns (ORM/SQLModel/Prisma/etc.)
- Seed data and local/dev setup
- Verification (queries, smoke tests)

## Instructions

### 1. Requirements → Data Model
- Translate product requirements into a clear data model.
- Identify entities, fields, relationships, and lifecycle (created_at, updated_at, soft delete if needed).
- Define constraints early (NOT NULL, UNIQUE, CHECK constraints where useful).

### 2. Schema Design
- Choose correct types (UUID vs int, text length, timestamps with timezone when needed).
- Normalize where appropriate; denormalize only with justification.
- Define relationships:
  - one-to-many, many-to-many (join tables), optional relationships
- Use consistent naming conventions:
  - snake_case table/column names
  - singular vs plural policy (pick one and enforce it)

### 3. Tables & Indexing
- Create tables with:
  - primary keys
  - foreign keys with appropriate on-delete behavior (CASCADE/RESTRICT/SET NULL)
  - indexes for common queries (but avoid premature indexing)
- Add unique indexes for identifiers (email, external_id, etc.)
- Add composite indexes for frequent filters/sorts (e.g., (user_id, status), (user_id, created_at)).

### 4. Migrations (Mandatory)
- Generate migrations (no manual DB edits).
- Ensure migrations are:
  - reversible (down migrations when supported)
  - safe in production (avoid destructive changes without plan)
- For breaking changes:
  - use multi-step migrations (expand → backfill → switch → contract)
- Keep migrations small and well-named.

### 5. Data Access Layer
- Implement CRUD data access methods for key entities.
- Keep database logic separated from API/UI logic.
- Use transactions where consistency matters.
- Handle concurrency (optimistic locking or careful updates) when required.

### 6. Seeding & Local Setup
- Provide a clear local/dev setup:
  - connection string/env vars
  - create DB, run migrations
  - seed optional sample data
- Ensure a fresh clone can run DB setup with minimal steps.

### 7. Verification
- Add a “DB smoke test”:
  - create record → read → update → delete
- Include example queries for key use cases.
- Ensure schema matches specs and application expectations.

## Best Practices
- Store secrets in environment variables (never hardcode).
- Prefer explicit constraints over relying on app logic.
- Avoid storing derived values unless needed for performance.
- Use migrations as source of truth (schema drift is unacceptable).
- Document schema decisions and tradeoffs.

## Outputs
When this skill is used, it should produce:
- A schema spec (ERD-style description in text is fine)
- Migration files (versioned, named, reproducible)
- ORM models / schema definitions
- Updated README instructions for setup
- Basic verification steps/tests

## Example Deliverables Structure
- /specs/database-schema.md
- /migrations/ (versioned migrations)
- /src/db/ (models, engine/session, repository layer)
- README updates (setup + migrate + seed)
