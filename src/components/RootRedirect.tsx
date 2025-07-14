import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const RootRedirect: React.FC = () => {
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

  // Rediriger vers le dashboard si connecté, sinon vers le login
  return <Navigate to={user ? "/dashboard" : "/auth"} replace />;
};

export default RootRedirect;
