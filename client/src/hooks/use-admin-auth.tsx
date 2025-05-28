import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { useLocation } from "wouter";

// Admin user type
interface AdminUser {
  id: number;
  username: string;
  role: string;
}

// Auth context type
interface AdminAuthContextType {
  admin: AdminUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (token: string, admin: AdminUser) => void;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();

  const isAuthenticated = !!admin;

  // Check for existing token on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("adminToken");
      const savedAdmin = localStorage.getItem("adminUser");

      if (token && savedAdmin) {
        try {
          // Verify token with backend
          const response = await fetch("/api/me", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const adminData = await response.json();
            setAdmin(adminData);
          } else {
            // Token invalid, clear storage
            localStorage.removeItem("adminToken");
            localStorage.removeItem("adminUser");
          }
        } catch (error) {
          // Network error, try to use saved admin data
          try {
            const parsedAdmin = JSON.parse(savedAdmin);
            setAdmin(parsedAdmin);
          } catch {
            localStorage.removeItem("adminToken");
            localStorage.removeItem("adminUser");
          }
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = (token: string, adminUser: AdminUser) => {
    localStorage.setItem("adminToken", token);
    localStorage.setItem("adminUser", JSON.stringify(adminUser));
    setAdmin(adminUser);
  };

  const logout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    setAdmin(null);
    setLocation("/login");
  };

  return (
    <AdminAuthContext.Provider
      value={{
        admin,
        isLoading,
        isAuthenticated,
        login,
        logout,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

// Hook to use admin authentication
export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used within AdminAuthProvider");
  }
  return context;
}

// Protected route component for admin routes
export function ProtectedAdminRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAdminAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation("/login");
    }
  }, [isAuthenticated, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  return <>{children}</>;
}