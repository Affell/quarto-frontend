import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { backendAPI } from "../services/backendAPI";
import type { Game, ChallengeListResponse, User } from "../types/api";
import "./Dashboard.css";

const Dashboard: React.FC = () => {
  const [myGames, setMyGames] = useState<Game[]>([]);
  const [challenges, setChallenges] = useState<ChallengeListResponse>({
    sent: [],
    received: [],
  });
  const [users, setUsers] = useState<User[]>([]);
  // const [usersTotal, setUsersTotal] = useState(0);
  const [usersPage, setUsersPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingGames, setIsLoadingGames] = useState(false);
  const [isLoadingChallenges, setIsLoadingChallenges] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [error, setError] = useState("");
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [challengeMessage, setChallengeMessage] = useState("");

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const loadGames = useCallback(async () => {
    try {
      setIsLoadingGames(true);
      const gamesResponse = await backendAPI.getMyGames();
      setMyGames(gamesResponse);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement des parties"
      );
    } finally {
      setIsLoadingGames(false);
    }
  }, []);

  const loadChallenges = useCallback(async () => {
    try {
      setIsLoadingChallenges(true);
      const challengesResponse = await backendAPI.getMyChallenges();
      setChallenges(challengesResponse);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement des challenges"
      );
    } finally {
      setIsLoadingChallenges(false);
    }
  }, []);

  const loadUsers = useCallback(async (page: number = 1) => {
    try {
      setIsLoadingUsers(true);
      const usersResponse = await backendAPI.getUsers({ page, page_size: 10 });
      setUsers(usersResponse.users);
      // setUsersTotal(usersResponse.total);
      setUsersPage(page);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement des utilisateurs"
      );
    } finally {
      setIsLoadingUsers(false);
    }
  }, []);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [gamesResponse, challengesResponse] = await Promise.all([
        backendAPI.getMyGames(),
        backendAPI.getMyChallenges(),
      ]);

      setMyGames(gamesResponse);
      setChallenges(challengesResponse);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur lors du chargement"
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (showUsersModal) {
      loadUsers(1);
    }
  }, [showUsersModal, loadUsers]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/auth");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur lors de la déconnexion"
      );
    }
  };

  const sendChallenge = async (challengedId: number, message?: string) => {
    try {
      await backendAPI.sendChallenge({
        challenged_id: challengedId,
        message: message || undefined,
      });

      setChallengeMessage("");
      setShowUsersModal(false);
      loadChallenges(); // Recharger les challenges
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors de l'envoi du challenge"
      );
    }
  };

  const respondToChallenge = async (challengeId: string, accept: boolean) => {
    try {
      const response = await backendAPI.respondToChallenge({
        challenge_id: challengeId,
        accept,
      });

      if (accept && response.game) {
        navigate(`/game/${response.game.id}`);
      } else {
        loadChallenges(); // Recharger les challenges
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors de la réponse au challenge"
      );
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `il y a ${days} jour${days > 1 ? "s" : ""}`;
    if (hours > 0) return `il y a ${hours} heure${hours > 1 ? "s" : ""}`;
    if (minutes > 0) return `il y a ${minutes} minute${minutes > 1 ? "s" : ""}`;
    return "à l'instant";
  };

  const getGameOpponent = (game: Game) => {
    return game.player1_id === user?.id
      ? `Joueur ${game.player2_id}`
      : `Joueur ${game.player1_id}`;
  };

  const getGameStatus = (game: Game) => {
    if (game.status === "finished") {
      if (game.winner === "draw") return "Match nul";
      const isWinner =
        (game.winner === "player1" && game.player1_id === user?.id) ||
        (game.winner === "player2" && game.player2_id === user?.id);
      return isWinner ? "Victoire" : "Défaite";
    }

    const isMyTurn =
      (game.current_turn === "player1" && game.player1_id === user?.id) ||
      (game.current_turn === "player2" && game.player2_id === user?.id);
    return isMyTurn ? "Votre tour" : "Tour de l'adversaire";
  };

  if (isLoading) {
    return (
      <div className="dashboard-container">
        <div className="loading">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-brand">
            <h1>Quarto Online</h1>
            <span className="beta-badge">Beta</span>
          </div>
          <div className="user-info">
            <div className="user-profile">
              <div className="user-avatar">
                {user?.username?.charAt(0).toUpperCase()}
              </div>
              <span className="user-name">{user?.username}</span>
            </div>
            <button onClick={handleLogout} className="logout-btn">
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-content">
          {error && (
            <div className="error-banner">
              <span>{error}</span>
              <button onClick={() => setError("")} className="close-error">
                ×
              </button>
            </div>
          )}

          <section className="welcome-section">
            <h2>Bienvenue, {user?.username} !</h2>
            <p>
              Prêt pour une partie de Quarto ? Défiez vos amis ou affrontez des
              adversaires du monde entier !
            </p>
          </section>

          <section className="play-section">
            <h2>Jouer</h2>
            <div className="play-options">
              <div
                className="play-option"
                onClick={() => setShowUsersModal(true)}
              >
                <div className="play-option-icon">⚔️</div>
                <h3>Défier un joueur</h3>
                <p>Choisissez un adversaire dans la liste des joueurs</p>
              </div>
              <div className="play-option" onClick={() => navigate("/solo")}>
                <div className="play-option-icon">🤖</div>
                <h3>Jouer contre l'IA</h3>
                <p>Entraînez-vous contre l'ordinateur</p>
              </div>
            </div>
          </section>

          <section className="challenges-section">
            <div className="section-header">
              <h2>Challenges</h2>
              <button
                onClick={loadChallenges}
                className="refresh-btn"
                disabled={isLoadingChallenges}
              >
                {isLoadingChallenges ? "⏳" : "🔄"} Actualiser
              </button>
            </div>

            {challenges.received.length > 0 && (
              <div className="challenges-received">
                <h3>Challenges reçus</h3>
                <div className="challenges-grid">
                  {challenges.received.map((challenge) => (
                    <div key={challenge.id} className="challenge-card received">
                      <div className="challenge-header">
                        <span className="challenger">
                          Joueur {challenge.challenger_id}
                        </span>
                        <span className="challenge-time">
                          {formatTimeAgo(challenge.created_at)}
                        </span>
                      </div>
                      {challenge.message && (
                        <p className="challenge-message">
                          "{challenge.message}"
                        </p>
                      )}
                      {challenge.status === "pending" && (
                        <div className="challenge-actions">
                          <button
                            onClick={() =>
                              respondToChallenge(challenge.id, true)
                            }
                            className="accept-btn"
                          >
                            Accepter
                          </button>
                          <button
                            onClick={() =>
                              respondToChallenge(challenge.id, false)
                            }
                            className="decline-btn"
                          >
                            Refuser
                          </button>
                        </div>
                      )}
                      {challenge.status !== "pending" && (
                        <div className={`challenge-status ${challenge.status}`}>
                          {challenge.status === "accepted" && "Accepté"}
                          {challenge.status === "declined" && "Refusé"}
                          {challenge.status === "expired" && "Expiré"}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {challenges.sent.length > 0 && (
              <div className="challenges-sent">
                <h3>Challenges envoyés</h3>
                <div className="challenges-grid">
                  {challenges.sent.map((challenge) => (
                    <div key={challenge.id} className="challenge-card sent">
                      <div className="challenge-header">
                        <span className="challenged">
                          Joueur {challenge.challenged_id}
                        </span>
                        <span className="challenge-time">
                          {formatTimeAgo(challenge.created_at)}
                        </span>
                      </div>
                      {challenge.message && (
                        <p className="challenge-message">
                          "{challenge.message}"
                        </p>
                      )}
                      <div className={`challenge-status ${challenge.status}`}>
                        {challenge.status === "pending" && "En attente..."}
                        {challenge.status === "accepted" && "Accepté ✓"}
                        {challenge.status === "declined" && "Refusé ✗"}
                        {challenge.status === "expired" && "Expiré"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {challenges.received.length === 0 &&
              challenges.sent.length === 0 && (
                <div className="no-challenges">
                  <p>
                    Aucun challenge en cours. Défiez quelqu'un pour commencer !
                  </p>
                </div>
              )}
          </section>

          <section className="games-section">
            <div className="section-header">
              <h2>Mes parties</h2>
              <button
                onClick={loadGames}
                className="refresh-btn"
                disabled={isLoadingGames}
              >
                {isLoadingGames ? "⏳" : "🔄"} Actualiser
              </button>
            </div>

            {myGames.length > 0 ? (
              <div className="games-grid">
                {myGames.map((game) => (
                  <div
                    key={game.id}
                    className="game-card"
                    onClick={() => navigate(`/game/${game.id}`)}
                  >
                    <div className="game-header">
                      <span className="opponent">{getGameOpponent(game)}</span>
                      <span className={`game-status ${game.status}`}>
                        {getGameStatus(game)}
                      </span>
                    </div>
                    <div className="game-info">
                      <span className="game-time">
                        {formatTimeAgo(game.updated_at)}
                      </span>
                      {game.status === "active" && (
                        <span className="continue-btn">Continuer →</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-games">
                <p>
                  Aucune partie en cours. Lancez un challenge pour commencer !
                </p>
              </div>
            )}
          </section>
        </div>

        <aside className="sidebar">
          <div className="quick-actions">
            <h3>Actions rapides</h3>
            <button
              onClick={() => setShowUsersModal(true)}
              className="action-btn"
            >
              ⚔️ Nouveau challenge
            </button>
            <button
              onClick={() => navigate("/solo")}
              className="action-btn secondary"
            >
              🤖 Jouer vs IA
            </button>
          </div>

          <div className="stats-card">
            <h3>Statistiques</h3>
            <div className="stat-item">
              <span className="stat-label">Parties actives</span>
              <span className="stat-value">
                {myGames.filter((g) => g.status === "active").length}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Challenges en attente</span>
              <span className="stat-value">
                {
                  challenges.received.filter((c) => c.status === "pending")
                    .length
                }
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Parties terminées</span>
              <span className="stat-value">
                {myGames.filter((g) => g.status === "finished").length}
              </span>
            </div>
          </div>
        </aside>
      </main>

      {showUsersModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Défier un joueur</h3>
              <button
                onClick={() => setShowUsersModal(false)}
                className="close-modal"
              >
                ×
              </button>
            </div>
            <div className="modal-content">
              {isLoadingUsers ? (
                <div className="loading">Chargement des joueurs...</div>
              ) : users.length > 0 ? (
                <div className="users-list">
                  {users
                    .filter((u) => u.id !== user?.id) // Exclure l'utilisateur actuel
                    .map((u) => (
                      <div key={u.id} className="user-item">
                        <div className="user-info">
                          <div className="user-avatar">
                            {u.username.charAt(0).toUpperCase()}
                          </div>
                          <span className="user-name">{u.username}</span>
                        </div>
                        <button
                          onClick={() => sendChallenge(u.id, challengeMessage)}
                          className="challenge-user-btn"
                        >
                          Défier
                        </button>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="no-users">
                  <p>Aucun joueur trouvé.</p>
                </div>
              )}

              <div className="modal-form">
                <div className="form-group">
                  <label htmlFor="challengeMessage">
                    Message (optionnel) :
                  </label>
                  <input
                    type="text"
                    id="challengeMessage"
                    value={challengeMessage}
                    onChange={(e) => setChallengeMessage(e.target.value)}
                    placeholder="Ex: Prêt pour une partie ?"
                    maxLength={200}
                  />
                </div>

                <div className="pagination">
                  {usersPage > 1 && (
                    <button
                      onClick={() => loadUsers(usersPage - 1)}
                      className="pagination-btn"
                      disabled={isLoadingUsers}
                    >
                      ← Précédent
                    </button>
                  )}

                  <span className="page-info">
                    Page {usersPage} ({users.length} joueurs)
                  </span>

                  {users.length === 10 && (
                    <button
                      onClick={() => loadUsers(usersPage + 1)}
                      className="pagination-btn"
                      disabled={isLoadingUsers}
                    >
                      Suivant →
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
