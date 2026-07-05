import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ProtectedRoute }    from "./components/layout/ProtrctedRoute";
import { DashboardLayout }   from "./components/layout/DashboardLayout";
import Login      from "./pages/auth/Login";
import Register   from "./pages/auth/Register";
import Dashboard  from "./pages/dashboard/Dashboard";
import Chat       from "./pages/dashboard/Chat";
import Memories   from "./pages/dashboard/Memorise";
import Timeline   from "./pages/dashboard/Timeline";
import Graph      from "./pages/dashboard/Graph";
import { useAuthStore } from "./store/auth";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

export default function App() {
  const { isAuthenticated } = useAuthStore();
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login"    element={isAuthenticated ? <Navigate to="/chat" /> : <Login />} />
          <Route path="/register" element={isAuthenticated ? <Navigate to="/chat" /> : <Register />} />
          <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route path="/"         element={<Dashboard />} />
            <Route path="/chat"     element={<Chat />}      />
            <Route path="/memories" element={<Memories />}  />
            <Route path="/timeline" element={<Timeline />}  />
            <Route path="/graph"    element={<Graph />}     />
          </Route>
          <Route path="*" element={<Navigate to={isAuthenticated ? "/chat" : "/login"} />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}