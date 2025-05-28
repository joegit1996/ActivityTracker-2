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

// Component to handle language detection and routing
function LanguageRouter() {
  const [location, setLocation] = useLocation();
  const { i18n } = useTranslation();

  useEffect(() => {
    // Extract language from URL path
    const pathSegments = location.split('/').filter(Boolean);
    const possibleLang = pathSegments[0];
    
    // Check if first segment is a valid language
    if (possibleLang === 'en' || possibleLang === 'ar') {
      // Set the language in i18n
      if (i18n.language !== possibleLang) {
        i18n.changeLanguage(possibleLang);
      }
    } else if (location !== '/' && !location.startsWith('/en/') && !location.startsWith('/ar/')) {
      // Redirect to language-prefixed URL (default to English)
      const browserLang = navigator.language.toLowerCase();
      const defaultLang = browserLang.startsWith('ar') ? 'ar' : 'en';
      setLocation(`/${defaultLang}${location}`);
      return;
    }
  }, [location, i18n, setLocation]);

  return (
    <Switch>
      {/* Language-aware routes */}
      <Route path="/:lang/progress/:userId" component={Progress} />
      <Route path="/:lang/admin" component={Admin} />
      
      {/* Legacy routes - redirect to language-prefixed versions */}
      <Route path="/progress/:userId">
        {(params) => {
          const browserLang = navigator.language.toLowerCase();
          const defaultLang = browserLang.startsWith('ar') ? 'ar' : 'en';
          setLocation(`/${defaultLang}/progress/${params.userId}`);
          return null;
        }}
      </Route>
      
      <Route path="/admin">
        {() => {
          const browserLang = navigator.language.toLowerCase();
          const defaultLang = browserLang.startsWith('ar') ? 'ar' : 'en';
          setLocation(`/${defaultLang}/admin`);
          return null;
        }}
      </Route>
      
      {/* Root redirect */}
      <Route path="/">
        {() => {
          const browserLang = navigator.language.toLowerCase();
          const defaultLang = browserLang.startsWith('ar') ? 'ar' : 'en';
          setLocation(`/${defaultLang}/progress/1`);
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
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
