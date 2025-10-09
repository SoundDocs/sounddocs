import * as React from "react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export interface EditingIndicatorProps {
  /** Name of the user editing the field */
  userName: string;
  /** User's assigned color (hex code) */
  userColor: string;
  /** Name of the field being edited */
  fieldName: string;
  /** Whether to show as a wrapper (adds border) or just tooltip */
  variant?: "border" | "tooltip-only";
  /** Additional CSS classes */
  className?: string;
  /** Child elements (the field being edited) */
  children?: React.ReactNode;
}

/**
 * EditingIndicator Component
 *
 * Shows a colored border around a field being edited by another user.
 * Displays a tooltip with the user's name and field being edited.
 *
 * @example
 * ```tsx
 * <EditingIndicator
 *   userName="John Doe"
 *   userColor="#3B82F6"
 *   fieldName="Title"
 * >
 *   <input type="text" value={title} onChange={handleChange} />
 * </EditingIndicator>
 * ```
 */
export const EditingIndicator: React.FC<EditingIndicatorProps> = ({
  userName,
  userColor,
  fieldName,
  variant = "border",
  className,
  children,
}) => {
  const [isVisible, setIsVisible] = React.useState(false);

  // Fade in animation
  React.useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  if (variant === "tooltip-only") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn("relative", className)}>{children}</div>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p className="text-sm">
              <span className="font-semibold">{userName}</span> is editing{" "}
              <span className="font-medium">{fieldName}</span>
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "relative rounded-md transition-all duration-300",
              isVisible ? "opacity-100" : "opacity-0",
              className,
            )}
            style={{
              boxShadow: isVisible ? `0 0 0 2px ${userColor}` : "none",
            }}
          >
            {children}
            {/* Animated corner indicator */}
            <div
              className="absolute -top-1 -right-1 h-3 w-3 rounded-full border-2 border-white shadow-sm animate-pulse"
              style={{ backgroundColor: userColor }}
              aria-hidden="true"
            />
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" style={{ borderColor: userColor }}>
          <p className="text-sm">
            <span className="font-semibold">{userName}</span> is editing{" "}
            <span className="font-medium">{fieldName}</span>
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

EditingIndicator.displayName = "EditingIndicator";

/**
 * Hook to manage editing indicators for multiple fields
 *
 * @example
 * ```tsx
 * const { getFieldIndicator } = useEditingIndicators(presenceUsers);
 *
 * // In render:
 * {getFieldIndicator("title")}
 * ```
 */
export const useEditingIndicators = (
  presenceUsers: Array<{
    userId: string;
    name?: string;
    email: string;
    color: string;
    editingField?: string;
  }>,
  currentUserId?: string,
) => {
  const getFieldIndicator = React.useCallback(
    (fieldName: string): { isBeingEdited: boolean; editor?: { name: string; color: string } } => {
      const editor = presenceUsers.find(
        (user) => user.editingField === fieldName && user.userId !== currentUserId,
      );

      if (!editor) {
        return { isBeingEdited: false };
      }

      return {
        isBeingEdited: true,
        editor: {
          name: editor.name || editor.email,
          color: editor.color,
        },
      };
    },
    [presenceUsers, currentUserId],
  );

  return { getFieldIndicator };
};
