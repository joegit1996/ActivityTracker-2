import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import NotFound from "@/pages/not-found";
import Progress from "@/pages/progress";
import Admin from "@/pages/admin";
import Login from "@/pages/login";
import { AdminAuthProvider, ProtectedAdminRoute } from "@/hooks/use-admin-auth";

// Component to handle language detection and routing
function LanguageRouter() {
  const [location, setLocation] = useLocation();
  const { i18n } = useTranslation();

  useEffect(() => {
    // Skip language detection for admin and login routes
    if (location.startsWith('/admin') || location.startsWith('/login')) {
      return;
    }

    // Extract language from URL path for /web routes
    const pathSegments = location.split('/').filter(Boolean);
    
    // Handle /web/lang/... routes
    if (pathSegments[0] === 'web') {
      const possibleLang = pathSegments[1];
      
      // Check if second segment is a valid language
      if (possibleLang === 'en' || possibleLang === 'ar') {
        // Set the language in i18n
        if (i18n.language !== possibleLang) {
          i18n.changeLanguage(possibleLang);
        }
      } else if (!location.startsWith('/web/en/') && !location.startsWith('/web/ar/')) {
        // Redirect to language-prefixed URL (default to English)
        const browserLang = navigator.language.toLowerCase();
        const defaultLang = browserLang.startsWith('ar') ? 'ar' : 'en';
        const remainingPath = location.replace('/web', '');
        setLocation(`/web/${defaultLang}${remainingPath}`);
        return;
      }
    }
  }, [location, i18n, setLocation]);

  return (
    <Switch>
      {/* Authentication routes */}
      <Route path="/login" component={Login} />
      
      {/* Admin routes (no language prefix) */}
      <Route path="/admin">
        <ProtectedAdminRoute>
          <Admin />
        </ProtectedAdminRoute>
      </Route>
      
      {/* Web application routes with language prefixes */}
      <Route path="/web/:lang/progress/:userId/:campaignId?" component={Progress} />
      
      {/* Legacy routes - redirect to new structure */}
      <Route path="/:lang/progress/:userId/:campaignId?">
        {(params) => {
          const campaignPath = params.campaignId ? `/${params.campaignId}` : '';
          setLocation(`/web/${params.lang}/progress/${params.userId}${campaignPath}`);
          return null;
        }}
      </Route>
      
      <Route path="/progress/:userId/:campaignId?">
        {(params) => {
          const browserLang = navigator.language.toLowerCase();
          const defaultLang = browserLang.startsWith('ar') ? 'ar' : 'en';
          const campaignPath = params.campaignId ? `/${params.campaignId}` : '';
          setLocation(`/web/${defaultLang}/progress/${params.userId}${campaignPath}`);
          return null;
        }}
      </Route>
      
      <Route path="/:lang/admin">
        {() => {
          setLocation('/admin');
          return null;
        }}
      </Route>
      
      {/* Root redirect */}
      <Route path="/">
        {() => {
          const browserLang = navigator.language.toLowerCase();
          const defaultLang = browserLang.startsWith('ar') ? 'ar' : 'en';
          setLocation(`/web/${defaultLang}/progress/1`);
          return null;
        }}
      </Route>
      
      {/* 404 for everything else */}
      <Route component={NotFound} />
    </Switch>
  );
}

function Router() {
  return <LanguageRouter />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AdminAuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AdminAuthProvider>
    </QueryClientProvider>
  );
}

export default App;
