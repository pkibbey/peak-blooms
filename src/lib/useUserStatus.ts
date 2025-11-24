import { useSession } from "next-auth/react";

export type UserStatus = "signed-out" | "unapproved" | "approved";

interface UseUserStatusReturn {
  status: UserStatus;
  isSignedOut: boolean;
  isUnapproved: boolean;
  isApproved: boolean;
  session: ReturnType<typeof useSession>["data"];
}

/**
 * Hook to determine user's account status
 * Returns the status and convenience boolean flags
 *
 * @returns {UseUserStatusReturn} User status information
 *
 * @example
 * const { status, isApproved } = useUserStatus();
 * if (isApproved) {
 *   // Show purchase button
 * }
 */
export function useUserStatus(): UseUserStatusReturn {
  const { data: session } = useSession();

  const user = session?.user as unknown as { approved?: boolean };
  const isSignedOut = !session;
  const isUnapproved = !!session && !user?.approved;
  const isApproved = !!(session && user?.approved);

  // Determine the overall status
  let status: UserStatus = "signed-out";
  if (isApproved) {
    status = "approved";
  } else if (isUnapproved) {
    status = "unapproved";
  }

  return {
    status,
    isSignedOut,
    isUnapproved,
    isApproved,
    session,
  };
}
