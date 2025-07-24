import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  // Check for mobile auth first
  const mobileUser = localStorage.getItem("mobileAuthUser");
  const mobileAuth = mobileUser ? JSON.parse(mobileUser) : null;

  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    enabled: !mobileAuth, // Only check Replit auth if no mobile auth
  });

  // If mobile auth exists, use that; otherwise use Replit auth
  const currentUser = mobileAuth || user;
  const isAuthenticated = !!(mobileAuth || user);

  return {
    user: currentUser,
    isLoading: !mobileAuth && isLoading,
    isAuthenticated,
    isMobileAuth: !!mobileAuth,
  };
}
