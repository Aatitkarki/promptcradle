
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PromptProvider } from "@/context/PromptContext";
import { AuthProvider } from "@/context/AuthContext";
import { AnimatePresence } from "framer-motion";
import Header from "@/components/Header";
import Index from "./pages/Index";
import PromptDetail from "./pages/PromptDetail";
import NotFound from "./pages/NotFound";
import UserMenu from "./components/UserMenu";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <PromptProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <div className="min-h-screen flex flex-col">
              <Header>
                <UserMenu />
              </Header>
              <main className="flex-1 container py-6 px-4">
                <AnimatePresence mode="wait">
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/prompt/:id" element={<PromptDetail />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </AnimatePresence>
              </main>
            </div>
          </BrowserRouter>
        </TooltipProvider>
      </PromptProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
