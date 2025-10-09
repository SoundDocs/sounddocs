import * as React from "react";
import { AlertTriangle, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { DocumentConflict } from "@/types/collaboration";

export interface ConflictResolutionProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when dialog should close */
  onOpenChange: (open: boolean) => void;
  /** List of conflicting fields */
  conflicts: DocumentConflict[];
  /** Document ID */
  documentId: string;
  /** Callback when user chooses resolution strategy */
  onResolve: (
    strategy: "local" | "remote" | "merge",
    mergedFields?: Record<string, "local" | "remote">,
  ) => void;
  /** Whether resolution is in progress */
  resolving?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * ConflictField Component - Individual field conflict
 */
const ConflictField: React.FC<{
  conflict: DocumentConflict;
  selectedVersion: "local" | "remote";
  onSelectionChange: (version: "local" | "remote") => void;
}> = ({ conflict, selectedVersion, onSelectionChange }) => {
  const formatValue = (value: unknown): string => {
    if (value === null) return "null";
    if (value === undefined) return "—";
    if (typeof value === "string") return value;
    if (typeof value === "boolean") return value ? "true" : "false";
    if (typeof value === "number") return value.toString();
    if (Array.isArray(value)) {
      if (value.length === 0) return "[]";
      return `[${value.length} items]`;
    }
    if (typeof value === "object") {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="border border-yellow-200 rounded-lg overflow-hidden bg-yellow-50">
      {/* Field name */}
      <div className="bg-yellow-100 px-4 py-2 border-b border-yellow-200">
        <p className="font-semibold text-gray-900">{conflict.field}</p>
      </div>

      {/* Conflict options */}
      <div className="p-4 space-y-4">
        {/* Local version */}
        <div
          className={cn(
            "border-2 rounded-lg p-3 cursor-pointer transition-all",
            selectedVersion === "local"
              ? "border-indigo-500 bg-indigo-50"
              : "border-gray-200 bg-white hover:border-gray-300",
          )}
          onClick={() => onSelectionChange("local")}
        >
          <div className="flex items-start gap-3">
            <div className="flex items-center h-5 mt-0.5">
              <Checkbox
                id={`${conflict.field}-local`}
                checked={selectedVersion === "local"}
                onCheckedChange={(checked) => checked && onSelectionChange("local")}
                className="h-4 w-4"
              />
            </div>
            <div className="flex-1 space-y-2">
              <Label
                htmlFor={`${conflict.field}-local`}
                className="text-sm font-semibold text-gray-900 cursor-pointer"
              >
                Your changes
              </Label>
              <p className="text-xs text-gray-500">
                Modified {formatTimestamp(conflict.localTimestamp)}
              </p>
              <div className="bg-white border border-gray-200 rounded p-2 mt-2">
                <pre className="text-sm text-gray-800 whitespace-pre-wrap break-all">
                  {formatValue(conflict.localValue)}
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* Remote version */}
        <div
          className={cn(
            "border-2 rounded-lg p-3 cursor-pointer transition-all",
            selectedVersion === "remote"
              ? "border-indigo-500 bg-indigo-50"
              : "border-gray-200 bg-white hover:border-gray-300",
          )}
          onClick={() => onSelectionChange("remote")}
        >
          <div className="flex items-start gap-3">
            <div className="flex items-center h-5 mt-0.5">
              <Checkbox
                id={`${conflict.field}-remote`}
                checked={selectedVersion === "remote"}
                onCheckedChange={(checked) => checked && onSelectionChange("remote")}
                className="h-4 w-4"
              />
            </div>
            <div className="flex-1 space-y-2">
              <Label
                htmlFor={`${conflict.field}-remote`}
                className="text-sm font-semibold text-gray-900 cursor-pointer"
              >
                Their changes
              </Label>
              <p className="text-xs text-gray-500">
                Modified {formatTimestamp(conflict.remoteTimestamp)}
              </p>
              <div className="bg-white border border-gray-200 rounded p-2 mt-2">
                <pre className="text-sm text-gray-800 whitespace-pre-wrap break-all">
                  {formatValue(conflict.remoteValue)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * ConflictResolution Component
 *
 * Displays a modal dialog when version conflicts are detected,
 * allowing users to choose between their changes, remote changes,
 * or manually merge field by field.
 *
 * @example
 * ```tsx
 * <ConflictResolution
 *   open={hasConflict}
 *   onOpenChange={setHasConflict}
 *   conflicts={detectedConflicts}
 *   documentId={documentId}
 *   onResolve={handleResolveConflict}
 * />
 * ```
 */
export const ConflictResolution: React.FC<ConflictResolutionProps> = ({
  open,
  onOpenChange,
  conflicts = [],
  documentId,
  onResolve,
  resolving = false,
  className,
}) => {
  const [resolutionMode, setResolutionMode] = React.useState<"choice" | "merge">("choice");
  const [fieldSelections, setFieldSelections] = React.useState<Record<string, "local" | "remote">>(
    {},
  );

  // Initialize field selections with suggested resolutions
  React.useEffect(() => {
    if (conflicts.length > 0) {
      const initialSelections: Record<string, "local" | "remote"> = {};
      conflicts.forEach((conflict) => {
        // Default to more recent change
        const localTime = new Date(conflict.localTimestamp).getTime();
        const remoteTime = new Date(conflict.remoteTimestamp).getTime();
        initialSelections[conflict.field] = localTime > remoteTime ? "local" : "remote";
      });
      setFieldSelections(initialSelections);
    }
  }, [conflicts]);

  const handleQuickResolve = (strategy: "local" | "remote") => {
    onResolve(strategy);
    setResolutionMode("choice");
  };

  const handleMergeResolve = () => {
    onResolve("merge", fieldSelections);
    setResolutionMode("choice");
  };

  const handleFieldSelection = (field: string, version: "local" | "remote") => {
    setFieldSelections((prev) => ({
      ...prev,
      [field]: version,
    }));
  };

  const allFieldsSelected = conflicts.every((conflict) => conflict.field in fieldSelections);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("max-w-3xl max-h-[85vh]", className)}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-yellow-700">
            <AlertTriangle className="h-5 w-5" />
            Version Conflict Detected
          </DialogTitle>
          <DialogDescription>
            This document was modified by another user. Choose how to resolve the conflict.
          </DialogDescription>
        </DialogHeader>

        {resolutionMode === "choice" ? (
          /* Quick resolution options */
          <div className="space-y-4 py-4">
            <p className="text-sm text-gray-600">
              {conflicts.length} field{conflicts.length === 1 ? "" : "s"} ha
              {conflicts.length === 1 ? "s" : "ve"} conflicting changes. Choose a resolution
              strategy:
            </p>

            <div className="grid gap-4">
              {/* Keep my changes */}
              <button
                onClick={() => handleQuickResolve("local")}
                disabled={resolving}
                className={cn(
                  "w-full text-left border-2 rounded-lg p-4 transition-all",
                  "border-gray-200 hover:border-indigo-500 hover:bg-indigo-50",
                  "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2",
                  resolving && "opacity-50 cursor-not-allowed",
                )}
              >
                <p className="font-semibold text-gray-900 mb-1">Keep my changes</p>
                <p className="text-sm text-gray-600">
                  Overwrite the remote version with your local changes
                </p>
              </button>

              {/* Use their changes */}
              <button
                onClick={() => handleQuickResolve("remote")}
                disabled={resolving}
                className={cn(
                  "w-full text-left border-2 rounded-lg p-4 transition-all",
                  "border-gray-200 hover:border-indigo-500 hover:bg-indigo-50",
                  "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2",
                  resolving && "opacity-50 cursor-not-allowed",
                )}
              >
                <p className="font-semibold text-gray-900 mb-1">Use their changes</p>
                <p className="text-sm text-gray-600">
                  Discard your local changes and use the remote version
                </p>
              </button>

              {/* Merge manually */}
              <button
                onClick={() => setResolutionMode("merge")}
                disabled={resolving}
                className={cn(
                  "w-full text-left border-2 rounded-lg p-4 transition-all",
                  "border-indigo-300 bg-indigo-50 hover:border-indigo-500",
                  "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2",
                  resolving && "opacity-50 cursor-not-allowed",
                )}
              >
                <p className="font-semibold text-indigo-900 mb-1">Merge manually</p>
                <p className="text-sm text-indigo-700">
                  Review each conflicting field and choose which version to keep
                </p>
              </button>
            </div>
          </div>
        ) : (
          /* Manual merge interface */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">Select which version to keep for each field:</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setResolutionMode("choice")}
                disabled={resolving}
              >
                Back to options
              </Button>
            </div>

            <ScrollArea className="max-h-[50vh]">
              <div className="space-y-4 pr-4">
                {conflicts.map((conflict) => (
                  <ConflictField
                    key={conflict.field}
                    conflict={conflict}
                    selectedVersion={fieldSelections[conflict.field] || "local"}
                    onSelectionChange={(version) => handleFieldSelection(conflict.field, version)}
                  />
                ))}
              </div>
            </ScrollArea>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={resolving}>
                Cancel
              </Button>
              <Button onClick={handleMergeResolve} disabled={!allFieldsSelected || resolving}>
                {resolving ? (
                  <>Resolving...</>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Save merged version
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

ConflictResolution.displayName = "ConflictResolution";
