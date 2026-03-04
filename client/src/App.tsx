import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import LogPage from "./pages/LogPage";
import HistoryPage from "./pages/HistoryPage";
import Sidebar from "./components/Sidebar";
import BottomNav from "./components/BottomNav";
import OfflineBanner from "./components/OfflineBanner";

const pageVariants = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.32, ease: [0.4, 0, 0.2, 1] } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] } },
};

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={
            <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
              <DashboardPage />
            </motion.div>
          }
        />
        <Route
          path="/log"
          element={
            <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
              <LogPage />
            </motion.div>
          }
        />
        <Route
          path="/history"
          element={
            <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
              <HistoryPage />
            </motion.div>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

function AppShell() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="page-loader">
        <div className="spinner" />
        <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>
          Loading HealthTracker…
        </span>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <div className="app-shell">
      <OfflineBanner />
      <Sidebar />
      <main className="main-content">
        <AnimatedRoutes />
      </main>
      <BottomNav />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppShell />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
