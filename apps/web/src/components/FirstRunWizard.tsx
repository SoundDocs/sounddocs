import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Server,
  Upload,
  FileJson,
  CheckCircle2,
  AlertTriangle,
  Loader,
  LogIn,
  ArrowRight,
  Database,
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import {
  BACKUP_FORMAT,
  BACKUP_VERSION,
  importUserData,
  type SoundDocsBackup,
  type ImportResult,
} from "@/lib/dataBackup";

interface FirstRunWizardProps {
  /** Called when the wizard is finished or skipped (sets the localStorage flag). */
  onComplete: () => void;
}

type WizardStep = "welcome" | "import" | "done";

/**
 * Count the total number of rows across every table in a backup, so we can show
 * the user a "N records will be imported" summary before they commit.
 */
const countBackupRecords = (backup: SoundDocsBackup): number => {
  const tables = backup.tables ?? {};
  return Object.values(tables).reduce(
    (total, rows) => total + (Array.isArray(rows) ? rows.length : 0),
    0,
  );
};

/**
 * Validate a parsed object is a SoundDocs backup of a version we can import.
 * Returns the typed backup on success, or a human-readable error string.
 */
const validateBackup = (parsed: unknown): { backup: SoundDocsBackup } | { error: string } => {
  if (typeof parsed !== "object" || parsed === null) {
    return { error: "This file doesn't look like a SoundDocs backup." };
  }

  const obj = parsed as Record<string, unknown>;

  if (obj.format !== BACKUP_FORMAT) {
    return {
      error:
        "This isn't a SoundDocs backup file. Choose the sounddocs-backup-*.json you exported from your Profile.",
    };
  }

  if (typeof obj.version !== "number") {
    return { error: "This backup is missing a version number and can't be imported." };
  }

  if (obj.version > BACKUP_VERSION) {
    return {
      error: `This backup was made by a newer version of SoundDocs (format v${obj.version}). Please update this self-hosted instance before importing.`,
    };
  }

  if (typeof obj.tables !== "object" || obj.tables === null || Array.isArray(obj.tables)) {
    return { error: "This backup has no data tables and can't be imported." };
  }

  // version < BACKUP_VERSION is tolerated: importUserData ignores unknown/absent
  // tables, so an older backup imports whatever tables it does contain.
  return { backup: parsed as SoundDocsBackup };
};

const formatExportedAt = (iso: string): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString();
};

const StepBadge: React.FC<{ active: boolean; complete: boolean; label: string }> = ({
  active,
  complete,
  label,
}) => (
  <div className="flex items-center gap-2">
    <div
      className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
        complete
          ? "bg-indigo-600 text-white"
          : active
            ? "bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-500"
            : "bg-gray-800 text-gray-500"
      }`}
    >
      {complete ? <CheckCircle2 className="h-4 w-4" /> : label}
    </div>
  </div>
);

const FirstRunWizard: React.FC<FirstRunWizardProps> = ({ onComplete }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [step, setStep] = useState<WizardStep>("welcome");
  const [backup, setBackup] = useState<SoundDocsBackup | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [fileError, setFileError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  const recordCount = useMemo(() => (backup ? countBackupRecords(backup) : 0), [backup]);

  const importedTotal = useMemo(
    () => (result ? result.importedTables.reduce((sum, t) => sum + t.count, 0) : 0),
    [result],
  );

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    setFileError(null);
    setImportError(null);
    setBackup(null);
    setResult(null);

    const file = event.target.files?.[0];
    if (!file) {
      setFileName("");
      return;
    }
    setFileName(file.name);

    let text: string;
    try {
      text = await file.text();
    } catch {
      setFileError("Couldn't read that file. Please try selecting it again.");
      return;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      setFileError("That file isn't valid JSON. Make sure you picked the backup .json file.");
      return;
    }

    const validated = validateBackup(parsed);
    if ("error" in validated) {
      setFileError(validated.error);
      return;
    }

    setBackup(validated.backup);
  };

  const handleImport = async (): Promise<void> => {
    if (!backup || !user) return;

    setIsImporting(true);
    setImportError(null);
    try {
      const importResult = await importUserData(backup, user.id);
      setResult(importResult);
      setStep("done");
    } catch (err) {
      // importUserData is designed not to throw, but guard anyway so a bug never
      // leaves the user stuck on a spinner with no feedback.
      const message = err instanceof Error ? err.message : String(err);
      setImportError(`Import failed: ${message}`);
    } finally {
      setIsImporting(false);
    }
  };

  const handleSkip = (): void => {
    onComplete();
  };

  const handleFinish = (): void => {
    onComplete();
    navigate("/dashboard");
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-gray-700 bg-gray-950/95 shadow-2xl shadow-indigo-900/20 backdrop-blur-lg">
        {/* Header / step indicator */}
        <div className="flex items-center justify-between border-b border-gray-800 px-6 py-4">
          <div className="flex items-center gap-2">
            <Server className="h-5 w-5 text-indigo-400" />
            <span className="text-sm font-semibold text-gray-200">SoundDocs setup</span>
          </div>
          <div className="flex items-center gap-3">
            <StepBadge active={step === "welcome"} complete={step !== "welcome"} label="1" />
            <div className="h-px w-4 bg-gray-700" />
            <StepBadge active={step === "import"} complete={step === "done"} label="2" />
            <div className="h-px w-4 bg-gray-700" />
            <StepBadge active={step === "done"} complete={step === "done"} label="3" />
          </div>
        </div>

        <div className="p-6">
          {/* ------------------------------------------------------------- */}
          {/* Step 1 — Welcome                                              */}
          {/* ------------------------------------------------------------- */}
          {step === "welcome" && (
            <div className="text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-500/10 ring-1 ring-indigo-500/30">
                <Server className="h-8 w-8 text-indigo-400" />
              </div>
              <h2 className="mb-3 text-2xl font-bold text-white">
                Welcome to your self-hosted SoundDocs
              </h2>
              <p className="mx-auto mb-8 max-w-md text-gray-300">
                You can import the backup you downloaded from the hosted app to bring all your
                documents over, or start fresh with an empty instance.
              </p>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                <button
                  onClick={() => setStep("import")}
                  className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-indigo-500"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Import my backup
                </button>
                <button
                  onClick={handleSkip}
                  className="inline-flex items-center justify-center rounded-lg bg-gray-800 px-6 py-3 text-white transition-colors hover:bg-gray-700"
                >
                  Skip — start fresh
                </button>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* Step 2 — Import                                               */}
          {/* ------------------------------------------------------------- */}
          {step === "import" && (
            <div>
              <h2 className="mb-2 text-xl font-bold text-white">Import your backup</h2>
              <p className="mb-6 text-sm text-gray-400">
                Choose the <span className="font-mono text-gray-300">sounddocs-backup-*.json</span>{" "}
                file you exported from your Profile on the hosted app.
              </p>

              {/* Not signed in: import needs an authenticated user for RLS. */}
              {!user ? (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-5">
                  <div className="flex items-start">
                    <LogIn className="mr-3 mt-0.5 h-5 w-5 flex-shrink-0 text-amber-400" />
                    <div>
                      <p className="font-medium text-amber-100">Create your account first</p>
                      <p className="mt-1 text-sm text-amber-100/80">
                        Importing writes your documents into your own account, so you need to be
                        signed in first. Create an account on this self-hosted instance, then come
                        back to this wizard to import.
                      </p>
                      <button
                        onClick={() => navigate("/signup")}
                        className="mt-4 inline-flex items-center justify-center rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-500"
                      >
                        Create an account
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-700 bg-gray-900/50 px-6 py-8 text-center transition-colors hover:border-indigo-500/60 hover:bg-gray-900">
                    <FileJson className="mb-3 h-8 w-8 text-indigo-400" />
                    <span className="text-sm font-medium text-gray-200">
                      {fileName || "Click to choose your backup file"}
                    </span>
                    <span className="mt-1 text-xs text-gray-500">.json files only</span>
                    <input
                      type="file"
                      accept=".json,application/json"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>

                  {fileError && (
                    <div className="mt-4 flex items-start rounded-lg border border-red-500/30 bg-red-500/10 p-4">
                      <AlertTriangle className="mr-3 mt-0.5 h-5 w-5 flex-shrink-0 text-red-400" />
                      <p className="text-sm text-red-200">{fileError}</p>
                    </div>
                  )}

                  {backup && !fileError && (
                    <div className="mt-4 rounded-lg border border-gray-700 bg-gray-800/50 p-4">
                      <div className="flex items-center text-indigo-300">
                        <Database className="mr-2 h-5 w-5" />
                        <span className="font-medium">Backup ready to import</span>
                      </div>
                      <dl className="mt-3 space-y-1.5 text-sm">
                        <div className="flex justify-between">
                          <dt className="text-gray-400">Exported</dt>
                          <dd className="text-gray-200">{formatExportedAt(backup.exportedAt)}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-400">App version</dt>
                          <dd className="text-gray-200">{backup.appVersion}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-400">Records to import</dt>
                          <dd className="font-semibold text-white">{recordCount}</dd>
                        </div>
                        {backup.user?.email && (
                          <div className="flex justify-between">
                            <dt className="text-gray-400">Original account</dt>
                            <dd className="text-gray-200">{backup.user.email}</dd>
                          </div>
                        )}
                      </dl>
                    </div>
                  )}

                  {importError && (
                    <div className="mt-4 flex items-start rounded-lg border border-red-500/30 bg-red-500/10 p-4">
                      <AlertTriangle className="mr-3 mt-0.5 h-5 w-5 flex-shrink-0 text-red-400" />
                      <p className="text-sm text-red-200">{importError}</p>
                    </div>
                  )}

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <button
                      onClick={handleSkip}
                      disabled={isImporting}
                      className="text-sm text-gray-400 transition-colors hover:text-gray-200 disabled:opacity-50"
                    >
                      Skip — start fresh
                    </button>
                    <button
                      onClick={handleImport}
                      disabled={!backup || isImporting}
                      className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isImporting ? (
                        <>
                          <Loader className="mr-2 h-4 w-4 animate-spin" />
                          Importing your data…
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Import my data
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* Step 3 — Done                                                 */}
          {/* ------------------------------------------------------------- */}
          {step === "done" && result && (
            <div>
              <div className="text-center">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 ring-1 ring-green-500/30">
                  <CheckCircle2 className="h-8 w-8 text-green-400" />
                </div>
                <h2 className="mb-2 text-2xl font-bold text-white">Import complete</h2>
                <p className="mb-6 text-gray-300">
                  Imported <span className="font-semibold text-white">{importedTotal}</span> record
                  {importedTotal === 1 ? "" : "s"} across {result.importedTables.length} table
                  {result.importedTables.length === 1 ? "" : "s"}.
                </p>
              </div>

              {result.importedTables.length > 0 && (
                <div className="mb-4 max-h-48 overflow-y-auto rounded-lg border border-gray-700 bg-gray-800/50 p-4">
                  <p className="mb-2 text-sm font-medium text-gray-300">Imported</p>
                  <ul className="space-y-1 text-sm">
                    {result.importedTables.map((t) => (
                      <li key={t.table} className="flex justify-between text-gray-400">
                        <span className="font-mono">{t.table}</span>
                        <span className="text-gray-200">{t.count}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Never hide errors — surface every per-table failure. */}
              {result.errors.length > 0 && (
                <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
                  <div className="mb-2 flex items-center text-amber-200">
                    <AlertTriangle className="mr-2 h-5 w-5" />
                    <span className="text-sm font-medium">
                      {result.errors.length} table
                      {result.errors.length === 1 ? "" : "s"} had problems
                    </span>
                  </div>
                  <ul className="space-y-1.5 text-sm">
                    {result.errors.map((e) => (
                      <li key={e.table} className="text-amber-100/90">
                        <span className="font-mono text-amber-200">{e.table}</span>: {e.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-6 flex justify-center">
                <button
                  onClick={handleFinish}
                  className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-indigo-500"
                >
                  Go to dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FirstRunWizard;
