import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Auth from "./Auth";

const AuthRoute: React.FC = () => {
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

  // Si l'utilisateur est déjà connecté, rediriger vers le dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  // Si l'utilisateur n'est pas connecté, afficher la page de login
  return <Auth />;
};

export default AuthRoute;
