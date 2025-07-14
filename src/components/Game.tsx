import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useWebSocket } from "../hooks/useWebSocket";
import { backendAPI } from "../services/backendAPI";
import type { Game, Move, User } from "../types/api";
import type { Piece, Board } from "../types/quarto";
import { generatePieces, createEmptyBoard } from "../utils/gameLogic";
import "./Game.css";

interface GameComponentProps {}

const GameComponent: React.FC<GameComponentProps> = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [game, setGame] = useState<Game | null>(null);
  const [player1Info, setPlayer1Info] = useState<User | null>(null);
  const [player2Info, setPlayer2Info] = useState<User | null>(null);
  const [board, setBoard] = useState<Board>(createEmptyBoard());
  const [availablePieces, setAvailablePieces] = useState<Piece[]>(
    generatePieces()
  );
  const [selectedPiece, setSelectedPiece] = useState<Piece | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gamePhase, setGamePhase] = useState<"selectPiece" | "placePiece">(
    "selectPiece"
  );
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [gameHistory, setGameHistory] = useState<Move[]>([]);
  const [spectatorMode, setSpectatorMode] = useState(false);

  // Fonction pour mettre à jour l'état du jeu depuis les données WebSocket
  const updateGameStateFromWebSocket = useCallback((gameData: Game) => {
    console.log("🔄 Mise à jour depuis WebSocket:", gameData);
    setGame(gameData);
    reconstructGameState(gameData);
    updateTurnState(gameData);

    // Mettre à jour l'historique depuis les données WebSocket
    if (gameData.move_history) {
      const moves = JSON.parse(gameData.move_history);
      const formattedHistory = moves.map((notation: string, index: number) => ({
        id: index + 1,
        notation: notation,
      }));
      setGameHistory(formattedHistory);
    }
  }, []);

  // Fonction de gestion des messages WebSocket
  const handleWebSocketMessage = useCallback(
    (message: any) => {
      console.log("WebSocket message received:", message);

      switch (message.type) {
        case "piece_selected":
          if (message.game_id === gameId && message.data) {
            console.log("Pièce sélectionnée, mise à jour depuis WebSocket...");
            updateGameStateFromWebSocket(message.data);
          }
          break;

        case "piece_placed":
          if (message.game_id === gameId && message.data) {
            console.log("Pièce placée, mise à jour depuis WebSocket...");
            updateGameStateFromWebSocket(message.data);
          }
          break;

        case "game_finished":
          if (message.game_id === gameId && message.data) {
            console.log("Partie terminée, mise à jour depuis WebSocket...");
            updateGameStateFromWebSocket(message.data);
          }
          break;

        case "game_forfeited":
          if (message.game_id === gameId && message.data) {
            console.log("Partie abandonnée, mise à jour depuis WebSocket...");
            updateGameStateFromWebSocket(message.data);
          }
          break;

        default:
          console.log("Unknown WebSocket message type:", message.type, message);
      }
    },
    [gameId, updateGameStateFromWebSocket]
  );

  // WebSocket avec hook propre - Connecté uniquement à la partie spécifique
  const { isConnected } = useWebSocket({
    gameId: gameId || "", // gameId est maintenant requis, utiliser string vide si undefined
    onMessage: handleWebSocketMessage,
    onOpen: () => console.log("WebSocket Game connecté"),
    onClose: () => console.log("WebSocket Game fermé"),
    onError: (error) => console.error("WebSocket Game erreur:", error),
  });

  // Charger les données de la partie
  useEffect(() => {
    const loadGame = async () => {
      if (!gameId || !user) return;

      try {
        setLoading(true);
        const gameData = await backendAPI.getGame(gameId);
        setGame(gameData);

        // Charger l'historique depuis les données du jeu
        if (gameData.move_history) {
          const moves = JSON.parse(gameData.move_history);
          const formattedHistory = moves.map(
            (notation: string, index: number) => ({
              id: index + 1,
              notation: notation,
            })
          );
          setGameHistory(formattedHistory);
        } else {
          setGameHistory([]);
        }

        // Vérifier si l'utilisateur est un joueur ou spectateur
        const isPlayer =
          gameData.player1_id === user.id || gameData.player2_id === user.id;
        setSpectatorMode(!isPlayer);

        // Charger les informations des joueurs
        try {
          const [player1Data, player2Data] = await Promise.all([
            backendAPI.getUserById(gameData.player1_id),
            backendAPI.getUserById(gameData.player2_id),
          ]);
          setPlayer1Info(player1Data);
          setPlayer2Info(player2Data);
        } catch (err) {
          console.error("Erreur lors du chargement des joueurs:", err);
        }

        // Reconstruire l'état du jeu depuis l'historique
        await reconstructGameState(gameData);

        // Déterminer qui doit jouer
        updateTurnState(gameData);
      } catch (err) {
        console.error("Erreur lors du chargement de la partie:", err);
        setError("Impossible de charger la partie");
      } finally {
        setLoading(false);
      }
    };

    loadGame();
  }, [gameId, user]);

  const reconstructGameState = async (gameData: Game) => {
    // Générer toutes les pièces une seule fois
    const pieces = generatePieces();

    // Reconstruire le plateau depuis le JSON
    const boardData = JSON.parse(gameData.board);
    console.log("Plateau brut depuis backend:", boardData);

    // Convertir les IDs du plateau en objets Piece complets
    const reconstructedBoard: Board = boardData.map((row: any[]) =>
      row.map((cellValue: any) => {
        if (cellValue === null || cellValue === undefined) {
          return null;
        }
        // Si c'est un ID de pièce, trouver l'objet Piece correspondant
        if (typeof cellValue === "number") {
          const piece = pieces.find((p) => p.id === cellValue);
          console.log(`Conversion ID ${cellValue} -> Pièce:`, piece);
          return piece || null;
        }
        // Si c'est déjà un objet Piece, le retourner tel quel
        return cellValue;
      })
    );

    console.log("Plateau reconstruit:", reconstructedBoard);
    setBoard(reconstructedBoard);

    // Reconstruire les pièces disponibles depuis le JSON
    const availablePieceIds = JSON.parse(gameData.available_pieces);
    const available = pieces.filter((p) => availablePieceIds.includes(p.id));
    setAvailablePieces(available);

    // Utiliser la phase directement depuis les données du jeu
    if (gameData.status === "active") {
      console.log("Game phase:", gameData.game_phase);
      console.log("Selected piece ID:", gameData.selected_piece);
      setGamePhase(gameData.game_phase);

      // Gérer la pièce sélectionnée
      if (
        gameData.selected_piece !== null &&
        gameData.selected_piece !== undefined
      ) {
        const selected = pieces.find((p) => p.id === gameData.selected_piece);
        console.log("Pièce trouvée:", selected);
        setSelectedPiece(selected || null);
      } else {
        console.log("Pas de pièce sélectionnée");
        setSelectedPiece(null);
      }
    }
  };

  const updateTurnState = (gameData: Game) => {
    if (!user || gameData.status !== "active") {
      setIsMyTurn(false);
      return;
    }

    // Déterminer qui doit jouer selon current_turn
    let currentPlayerId: number;
    if (gameData.current_turn === "player1") {
      currentPlayerId = gameData.player1_id;
    } else {
      currentPlayerId = gameData.player2_id;
    }

    setIsMyTurn(currentPlayerId === user.id);
  };

  const selectPiece = async (piece: Piece) => {
    if (!gameId || !isMyTurn || gamePhase !== "selectPiece" || spectatorMode)
      return;

    try {
      await backendAPI.selectPiece(gameId, { piece_id: piece.id });
      console.log("Pièce sélectionnée, attente de mise à jour WebSocket...");
    } catch (error) {
      console.error("Erreur lors de la sélection de pièce:", error);
      setError("Erreur lors de la sélection de pièce");
    }
  };

  const placePiece = async (row: number, col: number) => {
    if (
      !gameId ||
      !isMyTurn ||
      gamePhase !== "placePiece" ||
      !selectedPiece ||
      spectatorMode
    )
      return;
    if (board[row][col] !== null) return;

    try {
      const position = coordsToPositionUI(row, col);
      console.log(`Clic sur row=${row}, col=${col} -> position=${position}`);
      await backendAPI.placePiece(gameId, { position });
      console.log("Pièce placée, attente de mise à jour WebSocket...");
    } catch (error) {
      console.error("Erreur lors du placement de pièce:", error);
      setError("Erreur lors du placement de pièce");
    }
  };

  const leaveGame = () => {
    navigate("/dashboard");
  };

  // Fonction de conversion qui place A1 en haut à gauche
  const coordsToPositionUI = (row: number, col: number): string => {
    const file = String.fromCharCode("A".charCodeAt(0) + col);
    const rank = (row + 1).toString();
    return `${file}${rank}`;
  };

  const renderBoard = () => {
    // Debug pour voir l'état des variables
    console.log("🎮 État du plateau:");
    console.log("- selectedPiece:", selectedPiece);
    console.log("- gamePhase:", gamePhase);
    console.log("- isMyTurn:", isMyTurn);
    console.log("- spectatorMode:", spectatorMode);

    return (
      <div className="board">
        {board.map((row, rowIndex) =>
          row.map((piece, colIndex) => {
            const isPlaceable =
              !piece &&
              selectedPiece &&
              isMyTurn &&
              gamePhase === "placePiece" &&
              !spectatorMode;

            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={`board-cell ${isPlaceable ? "placeable" : ""}`}
                onClick={() => {
                  console.log(`🎯 Clic sur case ${rowIndex}-${colIndex}:`);
                  console.log("- gamePhase:", gamePhase);
                  console.log("- isMyTurn:", isMyTurn);
                  console.log("- spectatorMode:", spectatorMode);
                  console.log("- piece sur case:", piece);

                  if (
                    gamePhase === "placePiece" &&
                    isMyTurn &&
                    !spectatorMode
                  ) {
                    placePiece(rowIndex, colIndex);
                  }
                }}
              >
                {piece && piece.image && (
                  <img
                    src={piece.image}
                    alt={`${piece.color || "unknown"} ${
                      piece.shape || "unknown"
                    } ${piece.size || "unknown"} ${piece.fill || "unknown"}`}
                    className="piece-image"
                  />
                )}
                {piece && !piece.image && (
                  <div className="piece-placeholder">
                    ID: {typeof piece === "object" ? piece.id : piece}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    );
  };

  const renderPieces = () => {
    return (
      <div className="pieces-section">
        <h3>Pièces disponibles</h3>
        <div className="pieces-grid">
          {availablePieces.map((piece) => (
            <div
              key={piece.id}
              className={`piece-card ${
                gamePhase === "selectPiece" && isMyTurn && !spectatorMode
                  ? "selectable"
                  : ""
              }`}
              onClick={() => !spectatorMode && selectPiece(piece)}
            >
              <img
                src={piece.image}
                alt={`${piece.color} ${piece.shape} ${piece.size} ${piece.fill}`}
                className="piece-image"
              />
            </div>
          ))}
        </div>
      </div>
    );
  };

  const getGameStatusMessage = () => {
    if (!game) return "";

    if (game.status === "finished") {
      if (game.winner === "player1") {
        return "Le joueur 1 a gagné !";
      } else if (game.winner === "player2") {
        return "Le joueur 2 a gagné !";
      }
      return "Match nul !";
    }

    if (spectatorMode) {
      const currentPlayerName =
        game.current_turn === "player1" ? "Joueur 1" : "Joueur 2";
      if (gamePhase === "selectPiece") {
        return `${currentPlayerName} sélectionne une pièce...`;
      } else {
        return `${currentPlayerName} place la pièce...`;
      }
    }

    if (gamePhase === "selectPiece") {
      return isMyTurn
        ? "Sélectionnez une pièce pour votre adversaire"
        : "Votre adversaire sélectionne une pièce...";
    } else {
      return isMyTurn
        ? "Placez la pièce sur le plateau"
        : "Votre adversaire place la pièce...";
    }
  };

  const getCurrentPlayerName = () => {
    if (!game) return "";
    if (game.current_turn === "player1") {
      return player1Info?.username || "Joueur 1";
    } else {
      return player2Info?.username || "Joueur 2";
    }
  };

  if (loading) {
    return (
      <div className="game-container">
        <div className="loading">Chargement de la partie...</div>
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="game-container">
        <div className="error">
          {error || "Partie non trouvée"}
          <button onClick={leaveGame} className="back-btn">
            Retour au tableau de bord
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="game-container">
      <div className="game-header">
        <div className="game-title">
          <h1>Partie Quarto</h1>
          {spectatorMode && <span className="spectator-badge">Spectateur</span>}
          {isConnected && (
            <span className="connection-status connected">●</span>
          )}
          {!isConnected && (
            <span className="connection-status disconnected">●</span>
          )}
        </div>

        <button onClick={leaveGame} className="leave-btn">
          Quitter la partie
        </button>
      </div>

      {error && (
        <div className="error-banner">
          {error}
          <button onClick={() => setError(null)} className="close-error">
            ×
          </button>
        </div>
      )}

      <div className="game-content">
        <div className="board-section">
          {" "}
          {/* Informations des joueurs */}
          <div className="players-container">
            <div
              className={`player-card ${
                game.current_turn === "player1" ? "current-player" : ""
              }`}
            >
              <div className="player-avatar">
                {(player1Info?.username || "J1").charAt(0).toUpperCase()}
              </div>
              <div className="player-info">
                <div className="player-name">
                  {player1Info?.username || "Joueur 1"}
                </div>
                <div className="player-badges">
                  {game.player1_id === user?.id && (
                    <span className="you-badge">Vous</span>
                  )}
                  {game.current_turn === "player1" && (
                    <span className="turn-indicator">À jouer</span>
                  )}
                </div>
              </div>
            </div>

            <div className="vs-divider">VS</div>

            <div
              className={`player-card ${
                game.current_turn === "player2" ? "current-player" : ""
              }`}
            >
              <div className="player-avatar">
                {(player2Info?.username || "J2").charAt(0).toUpperCase()}
              </div>
              <div className="player-info">
                <div className="player-name">
                  {player2Info?.username || "Joueur 2"}
                </div>
                <div className="player-badges">
                  {game.player2_id === user?.id && (
                    <span className="you-badge">Vous</span>
                  )}
                  {game.current_turn === "player2" && (
                    <span className="turn-indicator">À jouer</span>
                  )}
                </div>
              </div>
            </div>
          </div>
          {/* Statut du jeu */}
          <div className="game-status-main">
            <p>{getGameStatusMessage()}</p>
          </div>
          {/* Pièce sélectionnée */}
          {selectedPiece && (
            <div className="selected-piece-display">
              <h3>Pièce à placer</h3>
              <div className="selected-piece-preview">
                <img
                  src={selectedPiece.image}
                  alt="Pièce sélectionnée"
                  className="piece-image"
                />
                <div>
                  <strong>Pièce sélectionnée</strong>
                  <br />
                  <small>Cliquez sur une case libre pour la placer</small>
                </div>
              </div>
            </div>
          )}
          {/* Plateau de jeu */}
          <div className="board-container">{renderBoard()}</div>
        </div>

        <div className="game-sidebar">
          {renderPieces()}

          <div className="move-history">
            <h3>Historique des coups</h3>
            <div className="history-content">
              {gameHistory.length === 0 ? (
                <p className="no-moves">Aucun coup joué</p>
              ) : (
                <div className="moves-list">
                  {gameHistory.map((move, index) => (
                    <div key={move.id} className="move-item">
                      <span className="move-number">{index + 1}.</span>
                      <span className="move-notation">{move.notation}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="game-details">
            <h3>Informations</h3>
            <div className="details-content">
              <p>
                <strong>Statut:</strong>{" "}
                {game.status === "active"
                  ? "En cours"
                  : game.status === "finished"
                  ? "Terminée"
                  : "En attente"}
              </p>
              <p>
                <strong>Tour actuel:</strong> {getCurrentPlayerName()}
              </p>
              <p>
                <strong>Coups joués:</strong> {gameHistory.length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameComponent;
