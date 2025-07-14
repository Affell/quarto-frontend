import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { user, isLoading } = useAuth();

  // Afficher un loader pendant la vérification de l'authentification
  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <div>Chargement...</div>
      </div>
    );
  }

  // Si l'utilisateur n'est pas connecté, rediriger vers le login
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Si l'utilisateur est connecté, afficher le contenu
  return <>{children}</>;
};

export default AuthGuard;
