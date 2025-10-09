import * as React from "react";
import { ChevronDown, ChevronRight, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface VersionDiffProps {
  /** Old version data */
  oldVersion: Record<string, unknown>;
  /** New version data */
  newVersion: Record<string, unknown>;
  /** List of fields that changed (optional - will be computed if not provided) */
  changedFields?: string[];
  /** Whether to show unchanged fields in collapsed state */
  showUnchanged?: boolean;
  /** Additional CSS classes */
  className?: string;
}

interface FieldDiff {
  fieldName: string;
  oldValue: unknown;
  newValue: unknown;
  changeType: "added" | "modified" | "removed" | "unchanged";
}

/**
 * Computes the diff between two version snapshots
 */
const computeDiff = (
  oldVersion: Record<string, unknown>,
  newVersion: Record<string, unknown>,
): FieldDiff[] => {
  const allKeys = new Set([...Object.keys(oldVersion), ...Object.keys(newVersion)]);
  const diffs: FieldDiff[] = [];

  allKeys.forEach((key) => {
    const oldValue = oldVersion[key];
    const newValue = newVersion[key];

    if (!(key in oldVersion)) {
      diffs.push({ fieldName: key, oldValue: undefined, newValue, changeType: "added" });
    } else if (!(key in newVersion)) {
      diffs.push({ fieldName: key, oldValue, newValue: undefined, changeType: "removed" });
    } else if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      diffs.push({ fieldName: key, oldValue, newValue, changeType: "modified" });
    } else {
      diffs.push({ fieldName: key, oldValue, newValue, changeType: "unchanged" });
    }
  });

  return diffs;
};

/**
 * Formats a value for display
 */
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

/**
 * FieldDiffRow Component - Individual field comparison
 */
const FieldDiffRow: React.FC<{
  diff: FieldDiff;
  isExpanded: boolean;
  onToggleExpand: () => void;
}> = ({ diff, isExpanded, onToggleExpand }) => {
  const isComplex = typeof diff.oldValue === "object" || typeof diff.newValue === "object";

  const getChangeStyle = (): string => {
    switch (diff.changeType) {
      case "added":
        return "bg-green-50 border-green-200";
      case "removed":
        return "bg-red-50 border-red-200";
      case "modified":
        return "bg-yellow-50 border-yellow-200";
      case "unchanged":
        return "bg-gray-50 border-gray-200";
    }
  };

  const getChangeLabel = (): string => {
    switch (diff.changeType) {
      case "added":
        return "Added";
      case "removed":
        return "Removed";
      case "modified":
        return "Modified";
      case "unchanged":
        return "Unchanged";
    }
  };

  const getChangeLabelColor = (): string => {
    switch (diff.changeType) {
      case "added":
        return "text-green-700 bg-green-100";
      case "removed":
        return "text-red-700 bg-red-100";
      case "modified":
        return "text-yellow-700 bg-yellow-100";
      case "unchanged":
        return "text-gray-600 bg-gray-100";
    }
  };

  return (
    <div className={cn("border rounded-lg overflow-hidden", getChangeStyle())}>
      {/* Header */}
      <div
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-black/5"
        onClick={onToggleExpand}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {isComplex ? (
            isExpanded ? (
              <ChevronDown className="h-4 w-4 flex-shrink-0 text-gray-500" />
            ) : (
              <ChevronRight className="h-4 w-4 flex-shrink-0 text-gray-500" />
            )
          ) : (
            <div className="w-4" />
          )}
          <span className="font-medium text-gray-900 truncate">{diff.fieldName}</span>
        </div>
        <span
          className={cn(
            "px-2 py-0.5 text-xs font-semibold rounded-full flex-shrink-0",
            getChangeLabelColor(),
          )}
        >
          {getChangeLabel()}
        </span>
      </div>

      {/* Values comparison */}
      {(isExpanded || !isComplex) && (
        <div className="px-3 pb-3 space-y-2">
          {diff.changeType !== "added" && (
            <div className="space-y-1">
              <p className="text-xs font-semibold text-gray-600 uppercase">Old Value</p>
              <div className="bg-white rounded border border-gray-200 p-2">
                <pre className="text-sm text-gray-800 whitespace-pre-wrap break-all">
                  {formatValue(diff.oldValue)}
                </pre>
              </div>
            </div>
          )}

          {diff.changeType === "modified" && (
            <div className="flex items-center justify-center">
              <ArrowRight className="h-4 w-4 text-gray-400" />
            </div>
          )}

          {diff.changeType !== "removed" && (
            <div className="space-y-1">
              <p className="text-xs font-semibold text-gray-600 uppercase">New Value</p>
              <div className="bg-white rounded border border-gray-200 p-2">
                <pre className="text-sm text-gray-800 whitespace-pre-wrap break-all">
                  {formatValue(diff.newValue)}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * VersionDiff Component
 *
 * Displays a side-by-side comparison of two document versions,
 * highlighting added, modified, and removed fields.
 *
 * @example
 * ```tsx
 * <VersionDiff
 *   oldVersion={previousSnapshot}
 *   newVersion={currentSnapshot}
 *   showUnchanged={false}
 * />
 * ```
 */
export const VersionDiff: React.FC<VersionDiffProps> = ({
  oldVersion,
  newVersion,
  changedFields,
  showUnchanged = false,
  className,
}) => {
  const [expandedFields, setExpandedFields] = React.useState<Set<string>>(new Set());

  const diffs = React.useMemo(() => {
    const allDiffs = computeDiff(oldVersion, newVersion);

    // Filter by changed fields if provided
    if (changedFields && changedFields.length > 0) {
      return allDiffs.filter((diff) => changedFields.includes(diff.fieldName));
    }

    // Filter out unchanged fields unless showUnchanged is true
    if (!showUnchanged) {
      return allDiffs.filter((diff) => diff.changeType !== "unchanged");
    }

    return allDiffs;
  }, [oldVersion, newVersion, changedFields, showUnchanged]);

  const toggleExpanded = (fieldName: string) => {
    setExpandedFields((prev) => {
      const next = new Set(prev);
      if (next.has(fieldName)) {
        next.delete(fieldName);
      } else {
        next.add(fieldName);
      }
      return next;
    });
  };

  const changedCount = diffs.filter((d) => d.changeType !== "unchanged").length;
  const unchangedCount = diffs.filter((d) => d.changeType === "unchanged").length;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Summary */}
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 bg-yellow-200 rounded-full" />
          <span className="text-gray-700">{changedCount} changed</span>
        </div>
        {showUnchanged && unchangedCount > 0 && (
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 bg-gray-200 rounded-full" />
            <span className="text-gray-700">{unchangedCount} unchanged</span>
          </div>
        )}
      </div>

      {/* Diff list */}
      <ScrollArea className="max-h-[60vh]">
        <div className="space-y-3 pr-4">
          {diffs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No changes detected</p>
            </div>
          ) : (
            diffs.map((diff) => (
              <FieldDiffRow
                key={diff.fieldName}
                diff={diff}
                isExpanded={expandedFields.has(diff.fieldName)}
                onToggleExpand={() => toggleExpanded(diff.fieldName)}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

VersionDiff.displayName = "VersionDiff";
