import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { MarketHeader } from "./components/marketplace/MarketHeader";
import { LanguageProvider, useLanguage } from "./contexts/LanguageContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import AdDetail from "./pages/AdDetail";
import Ads from "./pages/Ads";
import Home from "./pages/Home";
import MyListings from "./pages/MyListings";
import Messages from "./pages/Messages";
import NotFound from "./pages/NotFound";
import Notifications from "./pages/Notifications";
import PublishListing from "./pages/PublishListing";
import Legal from "./pages/Legal";
import AppLanding from "./pages/AppLanding";
import Admin from "./pages/Admin";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/ads" component={Ads} />
      <Route path="/ads/:id" component={AdDetail} />
      <Route path="/publish" component={PublishListing} />
      <Route path="/publish/:id" component={PublishListing} />
      <Route path="/my-listings" component={MyListings} />
      <Route path="/notifications" component={Notifications} />
      <Route path="/messages/:id" component={Messages} />
      <Route path="/messages" component={Messages} />
      <Route path="/terms"><Legal kind="terms" /></Route>
      <Route path="/privacy"><Legal kind="privacy" /></Route>
      <Route path="/support"><Legal kind="support" /></Route>
      <Route path="/app" component={AppLanding} />
      <Route path="/admin" component={Admin} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function Application() {
  const { dir } = useLanguage();
  const [location] = useLocation();
  const isAdminRoute = location.startsWith("/admin");
  return (
    <ThemeProvider defaultTheme="light">
      <TooltipProvider>
        {!isAdminRoute ? <MarketHeader /> : null}
        <Router />
        <Toaster position="top-center" richColors dir={dir} />
      </TooltipProvider>
    </ThemeProvider>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <Application />
      </LanguageProvider>
    </ErrorBoundary>
  );
}
