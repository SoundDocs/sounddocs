import * as React from "react";
import { Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { PresenceUser } from "@/types/collaboration";

export interface ActiveUsersProps {
  /** List of currently active users */
  users: PresenceUser[];
  /** Maximum number of visible avatars before showing "+X more" */
  maxVisible?: number;
  /** Additional CSS classes */
  className?: string;
  /** Current user ID (to exclude from list) */
  currentUserId?: string;
}

/**
 * Generates initials from a name or email
 */
const getInitials = (name: string | undefined, email: string): string => {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }
  // Use email prefix if no name
  return email.substring(0, 2).toUpperCase();
};

/**
 * Avatar Component for individual user
 */
const UserAvatar: React.FC<{
  user: PresenceUser;
  className?: string;
}> = ({ user, className }) => {
  const initials = getInitials(user.name, user.email);
  const displayName = user.name || user.email;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-xs font-semibold text-white shadow-sm transition-transform hover:scale-110 hover:z-10",
              className,
            )}
            style={{ backgroundColor: user.color }}
            role="img"
            aria-label={`${displayName} is active`}
          >
            {initials}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p className="text-sm">{displayName}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

/**
 * ActiveUsers Component
 *
 * Displays a list of users currently viewing/editing the document.
 * Shows user avatars with initials, stacked with overlap, and a count.
 *
 * @example
 * ```tsx
 * <ActiveUsers
 *   users={activeUsers}
 *   currentUserId={user.id}
 *   maxVisible={5}
 * />
 * ```
 */
export const ActiveUsers: React.FC<ActiveUsersProps> = ({
  users,
  maxVisible = 5,
  className,
  currentUserId,
}) => {
  // Filter out current user
  const otherUsers = React.useMemo(() => {
    return users.filter((user) => user.userId !== currentUserId);
  }, [users, currentUserId]);

  const visibleUsers = otherUsers.slice(0, maxVisible);
  const remainingCount = Math.max(0, otherUsers.length - maxVisible);

  // Show "No collaborators" message when alone
  if (otherUsers.length === 0) {
    return (
      <div
        className={cn("flex items-center gap-1.5 text-sm text-gray-400", className)}
        role="group"
        aria-label="No other users viewing"
      >
        <Users className="h-4 w-4" aria-hidden="true" />
        <span>No collaborators</span>
      </div>
    );
  }

  return (
    <div
      className={cn("flex items-center gap-2", className)}
      role="group"
      aria-label={`${otherUsers.length} user${otherUsers.length === 1 ? "" : "s"} viewing`}
    >
      {/* Stacked avatars */}
      <div className="flex -space-x-2">
        {visibleUsers.map((user, index) => (
          <UserAvatar
            key={user.userId}
            user={user}
            className="relative"
            style={{ zIndex: visibleUsers.length - index }}
          />
        ))}
        {remainingCount > 0 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-gray-400 text-xs font-semibold text-white shadow-sm transition-transform hover:scale-110",
                  )}
                  role="img"
                  aria-label={`${remainingCount} more user${remainingCount === 1 ? "" : "s"}`}
                >
                  +{remainingCount}
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="text-sm">{remainingCount} more</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {/* User count with icon */}
      <div className="flex items-center gap-1 text-sm text-gray-300">
        <Users className="h-4 w-4" aria-hidden="true" />
        <span>
          {otherUsers.length} {otherUsers.length === 1 ? "user" : "users"} viewing
        </span>
      </div>
    </div>
  );
};

ActiveUsers.displayName = "ActiveUsers";
