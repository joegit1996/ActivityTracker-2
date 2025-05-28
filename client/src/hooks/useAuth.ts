import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";

interface AdminUser {
  id: number;
  username: string;
}

interface AuthResponse {
  admin: AdminUser;
}

export function useAuth() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: authData, isLoading, error } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.clear();
      setLocation("/admin/login");
    },
  });

  const logout = () => {
    logoutMutation.mutate();
  };

  return {
    user: (authData as AuthResponse)?.admin,
    isAuthenticated: !!(authData as AuthResponse)?.admin,
    isLoading,
    error,
    logout,
    isLoggingOut: logoutMutation.isPending,
  };
}