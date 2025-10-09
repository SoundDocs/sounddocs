import * as React from "react";
import { Clock, ChevronDown, ChevronUp, RotateCcw, Loader2, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { VersionHistory } from "@/types/collaboration";

export interface DocumentHistoryProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when dialog should close */
  onOpenChange: (open: boolean) => void;
  /** List of version history entries */
  versions: VersionHistory[];
  /** Callback when user clicks to restore a version */
  onRestore: (versionId: string) => void;
  /** Whether versions are currently loading */
  loading?: boolean;
  /** Error message if loading failed */
  error?: string;
  /** Callback to load more versions (infinite scroll) */
  onLoadMore?: () => void;
  /** Whether more versions are available to load */
  hasMore?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * VersionEntry Component - Individual version in the timeline
 */
const VersionEntry: React.FC<{
  version: VersionHistory;
  onRestore: (versionId: string) => void;
  onToggleExpand: () => void;
  isExpanded: boolean;
}> = ({ version, onRestore, onToggleExpand, isExpanded }) => {
  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? "" : "s"} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="relative border-l-2 border-gray-200 pl-6 pb-8 last:pb-0">
      {/* Timeline dot */}
      <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full border-2 border-white bg-indigo-500" />

      <div className="space-y-2">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{version.userEmail}</p>
            <p className="text-xs text-gray-500">{formatTimestamp(version.createdAt)}</p>
            {version.description && (
              <p className="text-sm text-gray-600 mt-1">{version.description}</p>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleExpand}
            className="flex-shrink-0"
            aria-expanded={isExpanded}
            aria-label={isExpanded ? "Collapse version details" : "Expand version details"}
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>

        {/* Changed fields summary */}
        <div className="flex flex-wrap gap-1">
          {version.changedFields.slice(0, 3).map((field) => (
            <span
              key={field}
              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800"
            >
              {field}
            </span>
          ))}
          {version.changedFields.length > 3 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
              +{version.changedFields.length - 3} more
            </span>
          )}
        </div>

        {/* Expanded view */}
        {isExpanded && (
          <div className="mt-4 space-y-3 bg-gray-50 rounded-md p-3">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-700 uppercase">Changed Fields</p>
              <div className="space-y-1">
                {version.changedFields.map((field) => (
                  <div key={field} className="text-sm text-gray-600">
                    • {field}
                  </div>
                ))}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onRestore(version.id)}
              className="w-full"
            >
              <RotateCcw className="h-3 w-3 mr-2" />
              Restore this version
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * DocumentHistory Component
 *
 * Displays a timeline of document versions with the ability to view changes
 * and restore previous versions. Supports infinite scroll for large histories.
 *
 * @example
 * ```tsx
 * <DocumentHistory
 *   open={isHistoryOpen}
 *   onOpenChange={setIsHistoryOpen}
 *   versions={versionHistory}
 *   onRestore={handleRestore}
 *   loading={isLoading}
 * />
 * ```
 */
export const DocumentHistory: React.FC<DocumentHistoryProps> = ({
  open,
  onOpenChange,
  versions = [],
  onRestore,
  loading = false,
  error,
  onLoadMore,
  hasMore = false,
  className,
}) => {
  const [expandedVersions, setExpandedVersions] = React.useState<Set<string>>(new Set());
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);

  const toggleExpanded = (versionId: string) => {
    setExpandedVersions((prev) => {
      const next = new Set(prev);
      if (next.has(versionId)) {
        next.delete(versionId);
      } else {
        next.add(versionId);
      }
      return next;
    });
  };

  // Infinite scroll handler
  const handleScroll = React.useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      if (!onLoadMore || !hasMore || loading) return;

      const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
      const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;

      // Load more when scrolled 80% down
      if (scrollPercentage > 0.8) {
        onLoadMore();
      }
    },
    [onLoadMore, hasMore, loading],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("max-w-2xl max-h-[80vh]", className)}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Version History
          </DialogTitle>
          <DialogDescription>View and restore previous versions of this document</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Future: Add filters here */}
          {/* <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Filter className="h-3 w-3 mr-2" />
              Filter by user
            </Button>
          </div> */}

          {/* Timeline */}
          <ScrollArea className="h-[50vh] pr-4" ref={scrollAreaRef} onScrollCapture={handleScroll}>
            {error ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            ) : loading && versions.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : versions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Clock className="h-12 w-12 text-gray-300 mb-4" />
                <p className="text-sm text-gray-600">No version history available</p>
                <p className="text-xs text-gray-500 mt-1">
                  Changes will appear here as you edit the document
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-0">
                  {versions.map((version) => (
                    <VersionEntry
                      key={version.id}
                      version={version}
                      onRestore={onRestore}
                      onToggleExpand={() => toggleExpanded(version.id)}
                      isExpanded={expandedVersions.has(version.id)}
                    />
                  ))}
                </div>

                {/* Load more indicator */}
                {loading && versions.length > 0 && (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                  </div>
                )}

                {!loading && !hasMore && versions.length > 5 && (
                  <div className="flex items-center justify-center py-4">
                    <p className="text-xs text-gray-500">No more versions</p>
                  </div>
                )}
              </>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};

DocumentHistory.displayName = "DocumentHistory";
