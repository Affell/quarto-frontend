import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import QuartoGame from "./components/QuartoGame";
import Dashboard from "./components/Dashboard";
import GameComponent from "./components/Game";
import AuthGuard from "./components/AuthGuard";
import AuthRoute from "./components/AuthRoute";
import RootRedirect from "./components/RootRedirect";
import "./App.css";

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/auth" element={<AuthRoute />} />
            <Route
              path="/dashboard"
              element={
                <AuthGuard>
                  <Dashboard />
                </AuthGuard>
              }
            />
            <Route
              path="/game/:gameId"
              element={
                <AuthGuard>
                  <GameComponent />
                </AuthGuard>
              }
            />
            <Route
              path="/solo"
              element={
                <AuthGuard>
                  <QuartoGame />
                </AuthGuard>
              }
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
