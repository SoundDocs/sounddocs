import { supabase } from "@/lib/supabase";

/**
 * Shared backup module for SoundDocs.
 *
 * This is the single source of truth for the user-data backup format. It is used
 * by BOTH the "Download my data" export UI (Profile page) and a first-run import
 * wizard for self-hosted copies. The format is intentionally simple (plain JSON,
 * full rows per table) so it can survive the hosted app being retired on
 * 2026-09-01 and be re-imported into a self-hosted Supabase instance later.
 *
 * Everything here runs 100% client-side using the user's authenticated Supabase
 * session, so RLS is always respected — a user can only ever export/import their
 * own rows.
 */

export const BACKUP_FORMAT = "sounddocs-backup";
export const BACKUP_VERSION = 1;

/** App version baked into the backup. Mirrors the root package.json version. */
const APP_VERSION = "2.0.0";

export interface SoundDocsBackup {
  format: typeof BACKUP_FORMAT; // "sounddocs-backup"
  version: number; // BACKUP_VERSION
  exportedAt: string; // new Date().toISOString()
  appVersion: string; // root package.json version
  user: { id: string; email: string | null };
  tables: Record<string, Record<string, unknown>[]>; // tableName -> array of full rows
  storage?: Record<string, { path: string; dataBase64: string; contentType?: string }[]>;
}

export interface ImportResult {
  importedTables: { table: string; count: number }[];
  errors: { table: string; message: string }[];
}

/**
 * Describes how a table's rows are owned by a user, so we can both EXPORT
 * (filter to the user's rows) and IMPORT (remap ownership to the new user).
 *
 * - "user": the table has a `user_id` column equal to the auth user id.
 * - "self": the table's primary key IS the auth user id (e.g. `profiles.id`).
 * - "parent": the table has no user_id; rows are owned via a foreign key to a
 *    parent table that is itself user-owned. We gather the user's parent ids and
 *    filter the child by `fkColumn IN (parentIds)`. On import, the parent FK is
 *    preserved as-is (parents are imported first with their original PKs).
 */
type OwnershipRule =
  | { kind: "user"; pk: string }
  | { kind: "self"; pk: string }
  | { kind: "parent"; pk: string; fkColumn: string; parentTable: string };

interface TableRegistryEntry {
  table: string;
  ownership: OwnershipRule;
}

/**
 * Ordered table registry. CRITICAL: parents must come before any table that
 * references them (their `*_history` tables and other FK children) so that on
 * import the parent rows exist (with preserved PKs) before children upsert.
 *
 * Ownership rules below were verified directly against the SQL migrations in
 * supabase/migrations (column names are used verbatim in queries):
 *  - Document tables: `user_id` UUID, PK `id`.
 *  - `*_history` tables: NO user_id; FK `<singular>_id` -> parent document.
 *  - comms parent table is `comms_plans` (NOT `comms_planners`); children FK via
 *    `plan_id` -> comms_plans.
 *  - measurements / lens_calculations / shared_links /
 *    user_custom_suggestions: `user_id` UUID, PK `id`.
 *  - profiles: PK `id` == auth user id (no separate user_id column); created by
 *    the self-host profiles migration (it exists out-of-band on the hosted DB).
 *
 * Global reference tables (lens_database, projector_database,
 * projector_lens_compatibility) and ephemeral/collaboration tables
 * (document_locks, pending_saves, document_activity, document_history audit,
 * cj_location) are intentionally EXCLUDED — they are not user-owned data.
 *
 * `user_claimed_shares` is also EXCLUDED: it is cross-user relational state, not
 * portable owned data. Its `shared_link_id` (NOT NULL FK -> shared_links.id)
 * points at a shared_links row owned by ANOTHER user, which the export (only
 * `shared_links WHERE user_id = me`) never includes, so on import to a fresh
 * instance the FK cannot be satisfied and the records are meaningless there.
 */
const TABLE_REGISTRY: TableRegistryEntry[] = [
  // Patch sheets + history
  { table: "patch_sheets", ownership: { kind: "user", pk: "id" } },
  {
    table: "patch_sheet_history",
    ownership: {
      kind: "parent",
      pk: "id",
      fkColumn: "patch_sheet_id",
      parentTable: "patch_sheets",
    },
  },

  // Stage plots + history
  { table: "stage_plots", ownership: { kind: "user", pk: "id" } },
  {
    table: "stage_plot_history",
    ownership: { kind: "parent", pk: "id", fkColumn: "stage_plot_id", parentTable: "stage_plots" },
  },

  // Technical riders + history
  { table: "technical_riders", ownership: { kind: "user", pk: "id" } },
  {
    table: "technical_rider_history",
    ownership: {
      kind: "parent",
      pk: "id",
      fkColumn: "technical_rider_id",
      parentTable: "technical_riders",
    },
  },

  // Run of shows + history
  { table: "run_of_shows", ownership: { kind: "user", pk: "id" } },
  {
    table: "run_of_show_history",
    ownership: {
      kind: "parent",
      pk: "id",
      fkColumn: "run_of_show_id",
      parentTable: "run_of_shows",
    },
  },

  // Production schedules + history
  { table: "production_schedules", ownership: { kind: "user", pk: "id" } },
  {
    table: "production_schedule_history",
    ownership: {
      kind: "parent",
      pk: "id",
      fkColumn: "production_schedule_id",
      parentTable: "production_schedules",
    },
  },

  // Pixel maps + history
  { table: "pixel_maps", ownership: { kind: "user", pk: "id" } },
  {
    table: "pixel_map_history",
    ownership: { kind: "parent", pk: "id", fkColumn: "pixel_map_id", parentTable: "pixel_maps" },
  },

  // Corporate mic plots + history
  { table: "corporate_mic_plots", ownership: { kind: "user", pk: "id" } },
  {
    table: "corporate_mic_plot_history",
    ownership: {
      kind: "parent",
      pk: "id",
      fkColumn: "corporate_mic_plot_id",
      parentTable: "corporate_mic_plots",
    },
  },

  // Theater mic plots + history
  { table: "theater_mic_plots", ownership: { kind: "user", pk: "id" } },
  {
    table: "theater_mic_plot_history",
    ownership: {
      kind: "parent",
      pk: "id",
      fkColumn: "theater_mic_plot_id",
      parentTable: "theater_mic_plots",
    },
  },

  // Comms planner (parent) + children (all FK via plan_id)
  { table: "comms_plans", ownership: { kind: "user", pk: "id" } },
  {
    table: "comms_transceivers",
    ownership: { kind: "parent", pk: "id", fkColumn: "plan_id", parentTable: "comms_plans" },
  },
  {
    table: "comms_beltpacks",
    ownership: { kind: "parent", pk: "id", fkColumn: "plan_id", parentTable: "comms_plans" },
  },
  {
    table: "comms_network_configs",
    ownership: { kind: "parent", pk: "id", fkColumn: "plan_id", parentTable: "comms_plans" },
  },
  {
    table: "comms_interop_configs",
    ownership: { kind: "parent", pk: "id", fkColumn: "plan_id", parentTable: "comms_plans" },
  },
  {
    table: "comms_roles_channels",
    ownership: { kind: "parent", pk: "id", fkColumn: "plan_id", parentTable: "comms_plans" },
  },

  // Measurements & calculations (direct user_id)
  { table: "leq_measurements", ownership: { kind: "user", pk: "id" } },
  { table: "math_measurements", ownership: { kind: "user", pk: "id" } },
  { table: "tf_measurements", ownership: { kind: "user", pk: "id" } },
  { table: "lens_calculations", ownership: { kind: "user", pk: "id" } },

  // Sharing (direct user_id)
  { table: "shared_links", ownership: { kind: "user", pk: "id" } },

  // User autocomplete data (direct user_id)
  { table: "user_custom_suggestions", ownership: { kind: "user", pk: "id" } },

  // Profile (PK == auth user id)
  { table: "profiles", ownership: { kind: "self", pk: "id" } },
];

/**
 * Type guard for an object that looks like a database row (a plain record).
 */
const isRowRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * Fetch all rows the user owns for a single registry entry, applying the correct
 * ownership filter. Returns an empty array (and logs) on error so a missing or
 * inaccessible table never aborts the whole export.
 */
const fetchOwnedRows = async (
  entry: TableRegistryEntry,
  userId: string,
): Promise<Record<string, unknown>[]> => {
  const { table, ownership } = entry;

  try {
    if (ownership.kind === "user") {
      const { data, error } = await supabase.from(table).select("*").eq("user_id", userId);
      if (error) throw error;
      return (data ?? []).filter(isRowRecord);
    }

    if (ownership.kind === "self") {
      const { data, error } = await supabase.from(table).select("*").eq(ownership.pk, userId);
      if (error) throw error;
      return (data ?? []).filter(isRowRecord);
    }

    // kind === "parent": gather the user's parent ids first, then filter children.
    const { data: parents, error: parentError } = await supabase
      .from(ownership.parentTable)
      .select("id")
      .eq("user_id", userId);
    if (parentError) throw parentError;

    const parentIds = (parents ?? [])
      .map((row) => (isRowRecord(row) ? row.id : null))
      .filter((id): id is string => typeof id === "string");

    if (parentIds.length === 0) return [];

    const { data, error } = await supabase
      .from(table)
      .select("*")
      .in(ownership.fkColumn, parentIds);
    if (error) throw error;
    return (data ?? []).filter(isRowRecord);
  } catch (err) {
    console.warn(`[dataBackup] Skipping table "${table}" during export:`, err);
    return [];
  }
};

/**
 * Build a complete backup of every table the given user owns. Tables that error
 * out (e.g. absent in a given deployment) are skipped gracefully rather than
 * throwing.
 *
 * NOTE: Supabase Storage is NOT used for user files in this app (a codebase
 * search found no `supabase.storage` / `.storage.from(` usage), so the optional
 * `storage` field is intentionally omitted from exports.
 */
export const exportUserData = async (
  userId: string,
  userEmail: string | null,
): Promise<SoundDocsBackup> => {
  const tables: Record<string, Record<string, unknown>[]> = {};

  for (const entry of TABLE_REGISTRY) {
    const rows = await fetchOwnedRows(entry, userId);
    tables[entry.table] = rows;
  }

  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    appVersion: APP_VERSION,
    user: { id: userId, email: userEmail },
    tables,
  };
};

/**
 * Default backup filename: `sounddocs-backup-YYYY-MM-DD.json`.
 */
const defaultBackupFilename = (): string => {
  const date = new Date().toISOString().split("T")[0];
  return `sounddocs-backup-${date}.json`;
};

/**
 * Serialize a backup to a pretty-printed JSON file and trigger a browser
 * download. Follows the same DOM pattern as src/utils/csv.ts `downloadCsv`.
 */
export const downloadBackup = (backup: SoundDocsBackup, filename?: string): void => {
  const content = JSON.stringify(backup, null, 2);
  const blob = new Blob([content], { type: "application/json" });
  const link = document.createElement("a");

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename ?? defaultBackupFilename());
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }
};

/**
 * Remap a single row's ownership column to the target user, preserving the
 * original `id` and `created_at` so re-imports are idempotent and history stays
 * intact.
 *
 * - "user": set `user_id = targetUserId`.
 * - "self": set the PK (`id`) = targetUserId (profiles row belongs to the user).
 * - "parent": leave the parent FK untouched — parents are imported first with
 *    their original PKs, so children already point at valid rows.
 */
const remapRowOwnership = (
  row: Record<string, unknown>,
  ownership: OwnershipRule,
  targetUserId: string,
): Record<string, unknown> => {
  const next = { ...row };

  if (ownership.kind === "user") {
    next.user_id = targetUserId;
  } else if (ownership.kind === "self") {
    next[ownership.pk] = targetUserId;
  }
  // kind === "parent": no remap — keep the original FK value.

  // Remap auth.users FK columns to the importing user. History rows (and some
  // others) carry `created_by` / `updated_by` referencing auth.users(id); those
  // original ids don't exist in a fresh self-hosted DB, so without this the
  // upsert fails a foreign-key constraint. Guarded by `in` so we never add a
  // column that wasn't already present on the row.
  if ("created_by" in next) next.created_by = targetUserId;
  if ("updated_by" in next) next.updated_by = targetUserId;

  return next;
};

/** Chunk size for bulk import upserts. */
const IMPORT_CHUNK_SIZE = 200;

/**
 * Upsert rows in chunks. If a chunk fails (e.g. one row violates a constraint),
 * fall back to upserting that chunk row-by-row so good rows still import and only
 * the offending rows are reported as errors. Returns the count actually imported
 * plus any per-row error messages.
 */
const upsertRowsResilient = async (
  table: string,
  rows: Record<string, unknown>[],
  pk: string,
): Promise<{ imported: number; rowErrors: string[] }> => {
  let imported = 0;
  const rowErrors: string[] = [];

  for (let i = 0; i < rows.length; i += IMPORT_CHUNK_SIZE) {
    const chunk = rows.slice(i, i + IMPORT_CHUNK_SIZE);
    const { error } = await supabase.from(table).upsert(chunk, { onConflict: pk });
    if (!error) {
      imported += chunk.length;
      continue;
    }

    // Chunk failed — retry row-by-row so one bad row doesn't drop the whole chunk.
    for (const row of chunk) {
      const { error: rowError } = await supabase.from(table).upsert(row, { onConflict: pk });
      if (rowError) {
        rowErrors.push(rowError.message);
      } else {
        imported += 1;
      }
    }
  }

  return { imported, rowErrors };
};

/**
 * Import a backup into the CURRENT (self-hosted) user's account.
 *
 * For each registry table IN ORDER (parents before children/history), the backup
 * rows are remapped to `targetUserId` and upserted with `onConflict` set to the
 * table's primary key, so importing the same backup twice is idempotent.
 *
 * This never throws on a single-row or single-table failure — every error is
 * collected into `ImportResult.errors` and processing continues. The contract is
 * set here so the (separately built) first-run import wizard compiles against it.
 */
export const importUserData = async (
  backup: SoundDocsBackup,
  targetUserId: string,
): Promise<ImportResult> => {
  const result: ImportResult = { importedTables: [], errors: [] };

  for (const entry of TABLE_REGISTRY) {
    const { table, ownership } = entry;
    const rows = backup.tables?.[table];

    if (!Array.isArray(rows) || rows.length === 0) {
      continue;
    }

    try {
      const remapped = rows
        .filter(isRowRecord)
        .map((row) => remapRowOwnership(row, ownership, targetUserId));

      const { imported, rowErrors } = await upsertRowsResilient(table, remapped, ownership.pk);

      result.importedTables.push({ table, count: imported });
      for (const message of rowErrors) {
        result.errors.push({ table, message });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      result.errors.push({ table, message });
      console.warn(`[dataBackup] Failed to import table "${table}":`, err);
    }
  }

  return result;
};
