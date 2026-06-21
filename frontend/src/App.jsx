import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SocketProvider } from './context/SocketContext';
import useAuthStore from './store/authStore';

import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';
import ProtectedRoute from './components/layout/ProtectedRoute';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import DashboardPage from './pages/DashboardPage';
import ArenaPage from './pages/ArenaPage';
import DuelLobbyPage from './pages/DuelLobbyPage';
import ProfilePage from './pages/ProfilePage';
import PlayPage from './pages/PlayPage';
import MatchPage from './pages/MatchPage';
import DailyChallengePage from './pages/DailyChallengePage';
import PracticePage from './pages/PracticePage';
import LeaderboardPage from './pages/LeaderboardPage';
import TournamentsPage from './pages/TournamentsPage';
import TournamentDetailPage from './pages/TournamentDetailPage';
import SettingsPage from './pages/SettingsPage';
import AdminPage from './pages/AdminPage';
import MiniSudokuPage from './pages/MiniSudokuPage';
import CrossMathPage from './pages/CrossMathPage';
import MathMazePage from './pages/MathMazePage';
import MindSnapPage from './pages/MindSnapPage';
import GameAnalysisPage from './pages/GameAnalysisPage';

const App = () => {
  const { initialize, isAuthenticated } = useAuthStore();

  useEffect(() => {
    initialize();
  }, []);

  return (
    <BrowserRouter>
      <SocketProvider>
        <Routes>
          <Route element={<MainLayout />}>
            <Route index element={<LandingPage />} />
            <Route path="leaderboard" element={<LeaderboardPage />} />
            <Route path="tournaments" element={<TournamentsPage />} />
            <Route path="tournaments/:id" element={<TournamentDetailPage />} />
            <Route path="profile/:username" element={<ProfilePage />} />
            {/* /dashboard → redirect to /arena */}
            <Route path="dashboard" element={<ProtectedRoute><Navigate to="/arena" replace /></ProtectedRoute>} />
            <Route path="arena" element={<ProtectedRoute><ArenaPage /></ProtectedRoute>} />
            <Route path="play" element={<ProtectedRoute><Navigate to="/arena" replace /></ProtectedRoute>} />
            <Route path="settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            <Route path="admin" element={<ProtectedRoute adminOnly><AdminPage /></ProtectedRoute>} />
          </Route>

          <Route element={<AuthLayout />}>
            <Route path="login" element={isAuthenticated ? <Navigate to="/arena" replace /> : <LoginPage />} />
            <Route path="register" element={isAuthenticated ? <Navigate to="/arena" replace /> : <RegisterPage />} />
            <Route path="forgot-password" element={<ForgotPasswordPage />} />
          </Route>

          {/* Game routes (no MainLayout) */}
          <Route path="match/:roomId" element={<ProtectedRoute><MatchPage /></ProtectedRoute>} />
          <Route path="analysis/:roomId" element={<ProtectedRoute><GameAnalysisPage /></ProtectedRoute>} />
          <Route path="play/daily" element={<ProtectedRoute><DailyChallengePage /></ProtectedRoute>} />
          <Route path="play/daily/math" element={<ProtectedRoute><DailyChallengePage /></ProtectedRoute>} />
          <Route path="play/practice" element={<ProtectedRoute><PracticePage /></ProtectedRoute>} />
          <Route path="play/duel/:category/:mode" element={<ProtectedRoute><DuelLobbyPage /></ProtectedRoute>} />

          {/* Puzzle pages */}
          <Route path="play/sudoku" element={<ProtectedRoute><MiniSudokuPage /></ProtectedRoute>} />
          <Route path="play/crossmath" element={<ProtectedRoute><CrossMathPage /></ProtectedRoute>} />
          <Route path="play/mathmaze" element={<ProtectedRoute><MathMazePage /></ProtectedRoute>} />
          <Route path="play/mindsnap" element={<ProtectedRoute><MindSnapPage /></ProtectedRoute>} />
          {/* KenKen not yet built — redirect to daily */}
          <Route path="play/kenken" element={<ProtectedRoute><DailyChallengePage /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </SocketProvider>
    </BrowserRouter>
  );
};

export default App;
