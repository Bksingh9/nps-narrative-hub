import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { FilterProvider } from "@/contexts/FilterContext";
import Index from "./pages/Index";
import States from "./pages/States";
import Stores from "./pages/Stores";
import Drivers from "./pages/Drivers";
import Regions from "./pages/Regions";
import Alerts from "./pages/Alerts";
import Settings from "./pages/Settings";
import Upload from "./pages/Upload";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="dark">
      <FilterProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/states" element={<States />} />
              <Route path="/stores" element={<Stores />} />
              <Route path="/drivers" element={<Drivers />} />
              <Route path="/regions" element={<Regions />} />
              <Route path="/alerts" element={<Alerts />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/upload" element={<Upload />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </FilterProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
