import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { Piece, GameState } from "../types/quarto";
import {
  generatePieces,
  createEmptyBoard,
  checkWin,
  isBoardFull,
} from "../utils/gameLogic";
import { createMove, positionToCoords, MoveHistory } from "../utils/notation";
import { createQuartoAPI } from "../utils/api";
import "./QuartoGame.css";

// Type pour l'historique des mouvements dans le composant
interface GameMoveDisplay {
  id: number;
  notation: string;
}

const QuartoGame: React.FC = () => {
  const navigate = useNavigate();
  const [moveHistory] = useState(() => new MoveHistory());
  const [aiScore, setAiScore] = useState<number | null>(null);
  const [gameHistoryDisplay, setGameHistoryDisplay] = useState<
    GameMoveDisplay[]
  >([]);

  const [gameState, setGameState] = useState<GameState>(() => ({
    board: createEmptyBoard(),
    availablePieces: generatePieces(),
    selectedPiece: null,
    currentPlayer: "human",
    gamePhase: "selectPiece",
    winner: null,
    gameOver: false,
    moveHistory: [],
    useRemoteAPI: true,
    aiDepth: 6,
  }));

  // Créer l'API selon la configuration
  const quartoAPI = createQuartoAPI(true);

  // Gestion du tour de l'ordinateur
  useEffect(() => {
    if (gameState.currentPlayer === "computer" && !gameState.gameOver) {
      console.log("🎮 Computer turn started", {
        gamePhase: gameState.gamePhase,
        selectedPiece: gameState.selectedPiece,
        availablePieces: gameState.availablePieces.length,
      });

      const timer = setTimeout(async () => {
        try {
          if (
            gameState.gamePhase === "placePiece" &&
            gameState.selectedPiece !== null
          ) {
            console.log("🤖 Computer placing piece:", gameState.selectedPiece);

            // L'ordinateur place la pièce qui lui a été donnée et choisit la suivante pour l'humain
            const apiResponse = await quartoAPI.getBestMove(
              gameState.board,
              gameState.availablePieces,
              moveHistory.getAllMoves(),
              gameState.aiDepth,
              gameState.selectedPiece
            );

            console.log("📡 API Response:", apiResponse);

            if (apiResponse.position) {
              const [row, col] = positionToCoords(apiResponse.position);
              setAiScore(apiResponse.score || null);
              handleComputerMove(row, col, apiResponse.suggestedPiece);
            } else {
              console.error("❌ No valid position from API");
            }
          } else if (gameState.gamePhase === "selectPiece") {
            console.log("🤖 Computer selecting piece for human");

            // L'ordinateur choisit une pièce pour l'humain (seulement si l'ordinateur commence le jeu)
            const apiResponse = await quartoAPI.getBestMove(
              gameState.board,
              gameState.availablePieces,
              moveHistory.getAllMoves(),
              gameState.aiDepth,
              null
            );

            console.log("📡 Selection API Response:", apiResponse);

            if (
              apiResponse.suggestedPiece !== null &&
              apiResponse.suggestedPiece !== undefined
            ) {
              console.log(
                "🎯 Computer suggests piece for human:",
                apiResponse.suggestedPiece
              );

              if (apiResponse.score !== undefined) {
                setAiScore(apiResponse.score);
              }
              // L'ordinateur donne une pièce à l'humain pour qu'il commence
              setGameState((prev) => ({
                ...prev,
                selectedPiece: apiResponse.suggestedPiece,
                availablePieces: prev.availablePieces.filter(
                  (p) => p.id !== apiResponse.suggestedPiece!.id
                ),
                currentPlayer: "human",
                gamePhase: "placePiece",
              }));
            } else {
              console.error("❌ No suggested piece returned from API");
            }
          }
        } catch (error) {
          console.error("💥 API call failed:", error);
          // Fallback simple en cas d'erreur
          if (gameState.gamePhase === "selectPiece") {
            const randomPiece =
              gameState.availablePieces[
                Math.floor(Math.random() * gameState.availablePieces.length)
              ];
            setGameState((prev) => ({
              ...prev,
              selectedPiece: randomPiece,
              availablePieces: prev.availablePieces.filter(
                (p) => p.id !== randomPiece.id
              ),
              currentPlayer: "human",
              gamePhase: "placePiece",
            }));
          }
        }
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [
    gameState.currentPlayer,
    gameState.gamePhase,
    gameState.gameOver,
    gameState.selectedPiece, // Ajouté pour détecter les changements
    quartoAPI,
    moveHistory,
  ]);

  const handleComputerMove = (
    row: number,
    col: number,
    suggestedPiece: Piece | null
  ) => {
    console.log("🎯 handleComputerMove called", {
      row,
      col,
      selectedPiece: gameState.selectedPiece,
      suggestedPiece,
      boardPosition: gameState.board[row]?.[col],
    });

    if (
      gameState.selectedPiece === null ||
      gameState.selectedPiece === undefined
    ) {
      console.error("❌ No selected piece for computer to place!");
      return;
    }

    if (gameState.board[row][col] !== null) {
      console.error("❌ Position already occupied!", {
        row,
        col,
        occupiedBy: gameState.board[row][col],
      });
      return;
    }

    const newBoard = gameState.board.map((boardRow, r) =>
      boardRow.map((cell, c) =>
        r === row && c === col ? gameState.selectedPiece : cell
      )
    );

    console.log("🏁 Board updated, piece placed at", { row, col });

    // Créer le move avec notation algébrique
    const move = createMove(gameState.selectedPiece, row, col);
    moveHistory.addMove(move);

    console.log("📝 Move recorded:", move.notation);

    // Vérifier la victoire
    const hasWon = checkWin(newBoard);
    const boardFull = isBoardFull(newBoard);

    console.log("🔍 Game status check:", { hasWon, boardFull });

    if (hasWon) {
      console.log("🏆 Computer wins!");
      setGameState((prev) => ({
        ...prev,
        board: newBoard,
        selectedPiece: null,
        winner: "computer",
        gameOver: true,
        moveHistory: [...prev.moveHistory, move.notation],
      }));
    } else if (boardFull) {
      console.log("🤝 Game ends in draw!");
      setGameState((prev) => ({
        ...prev,
        board: newBoard,
        selectedPiece: null,
        winner: "draw",
        gameOver: true,
        moveHistory: [...prev.moveHistory, move.notation],
      }));
    } else {
      // L'ordinateur a joué et a choisi une pièce pour l'humain
      if (suggestedPiece !== null && suggestedPiece !== undefined) {
        console.log("🎁 Computer gives piece to human:", suggestedPiece);
        setGameState((prev) => ({
          ...prev,
          board: newBoard,
          selectedPiece: suggestedPiece,
          availablePieces: prev.availablePieces.filter(
            (p) => p.id !== suggestedPiece.id
          ),
          gamePhase: "placePiece",
          currentPlayer: "human", // L'humain doit placer la pièce choisie par l'ordinateur
          moveHistory: [...prev.moveHistory, move.notation],
        }));
      } else {
        console.log("⚠️ No suggested piece, human must select");
        // Fallback : l'humain doit choisir une pièce pour l'ordinateur
        setGameState((prev) => ({
          ...prev,
          board: newBoard,
          selectedPiece: null,
          gamePhase: "selectPiece",
          currentPlayer: "human",
          moveHistory: [...prev.moveHistory, move.notation],
        }));
      }
    }
  };

  const selectPiece = (piece: Piece) => {
    console.log("👤 Human selecting piece:", piece);

    if (
      gameState.gamePhase !== "selectPiece" ||
      gameState.currentPlayer !== "human"
    ) {
      console.log("❌ Cannot select piece:", {
        gamePhase: gameState.gamePhase,
        currentPlayer: gameState.currentPlayer,
      });
      return;
    }

    console.log("✅ Human selected piece for computer:", piece);
    setGameState((prev) => ({
      ...prev,
      selectedPiece: piece,
      availablePieces: prev.availablePieces.filter((p) => p.id !== piece.id),
      currentPlayer: "computer",
      gamePhase: "placePiece",
    }));
  };

  const placePiece = (row: number, col: number) => {
    console.log("👤 Human placing piece at:", { row, col });
    console.log("Current game state:", {
      gamePhase: gameState.gamePhase,
      currentPlayer: gameState.currentPlayer,
      selectedPiece: gameState.selectedPiece,
      positionOccupied: gameState.board[row][col],
    });

    if (
      gameState.selectedPiece === null ||
      gameState.selectedPiece === undefined ||
      gameState.board[row][col] !== null ||
      gameState.currentPlayer !== "human"
    ) {
      console.log("❌ Cannot place piece:", {
        hasSelectedPiece:
          gameState.selectedPiece !== null &&
          gameState.selectedPiece !== undefined,
        positionFree: gameState.board[row][col] === null,
        isHumanTurn: gameState.currentPlayer === "human",
      });
      return;
    }

    console.log("✅ Human placing piece:", {
      piece: gameState.selectedPiece,
      row,
      col,
    });

    const newBoard = gameState.board.map((boardRow, r) =>
      boardRow.map((cell, c) =>
        r === row && c === col ? gameState.selectedPiece : cell
      )
    );

    // Créer le move avec notation algébrique
    const move = createMove(gameState.selectedPiece, row, col);
    moveHistory.addMove(move);

    console.log("📝 Human move recorded:", move.notation);

    // Vérifier la victoire
    const hasWon = checkWin(newBoard);
    const boardFull = isBoardFull(newBoard);

    console.log("🔍 Game status check after human move:", {
      hasWon,
      boardFull,
    });

    if (hasWon) {
      console.log("🎉 Game won by human!");
      setGameState((prev) => ({
        ...prev,
        board: newBoard,
        selectedPiece: null,
        winner: "human",
        gameOver: true,
        moveHistory: [...prev.moveHistory, move.notation],
      }));
    } else if (boardFull) {
      console.log("🤝 Game ended in draw");
      setGameState((prev) => ({
        ...prev,
        board: newBoard,
        selectedPiece: null,
        winner: "draw",
        gameOver: true,
        moveHistory: [...prev.moveHistory, move.notation],
      }));
    } else {
      // Le joueur a joué, maintenant il doit sélectionner une pièce pour l'ordinateur
      console.log("🔄 Game continues - human must select piece for computer");
      setGameState((prev) => ({
        ...prev,
        board: newBoard,
        selectedPiece: null,
        gamePhase: "selectPiece",
        currentPlayer: "human", // Le joueur reste actif pour sélectionner
        moveHistory: [...prev.moveHistory, move.notation],
      }));
    }
  };

  const resetGame = () => {
    moveHistory.clear();
    setAiScore(null);
    setGameHistoryDisplay([]);
    setGameState({
      board: createEmptyBoard(),
      availablePieces: generatePieces(),
      selectedPiece: null,
      currentPlayer: "human",
      gamePhase: "selectPiece",
      winner: null,
      gameOver: false,
      moveHistory: [],
      useRemoteAPI: true,
      aiDepth: 6,
    });
  };

  const leaveGame = () => {
    navigate("/");
  };

  const renderBoard = () => {
    return (
      <div className="board">
        {gameState.board.map((row, rowIndex) =>
          row.map((piece, colIndex) => {
            const isPlaceable =
              !piece &&
              gameState.selectedPiece !== null &&
              gameState.selectedPiece !== undefined &&
              gameState.currentPlayer === "human" &&
              gameState.gamePhase === "placePiece";

            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={`board-cell ${isPlaceable ? "can-place" : ""}`}
                onClick={() => {
                  if (
                    gameState.gamePhase === "placePiece" &&
                    gameState.currentPlayer === "human"
                  ) {
                    placePiece(rowIndex, colIndex);
                  }
                }}
              >
                {piece && (
                  <img
                    src={piece.image}
                    alt={`${piece.color} ${piece.shape} ${piece.size} ${piece.fill}`}
                    className="piece-image"
                  />
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
          {gameState.availablePieces.map((piece) => (
            <div
              key={piece.id}
              className={`piece-card ${
                gameState.gamePhase === "selectPiece" &&
                gameState.currentPlayer === "human"
                  ? "selectable"
                  : ""
              }`}
              onClick={() => selectPiece(piece)}
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
    if (gameState.gameOver) {
      if (gameState.winner === "draw") {
        return "Match nul !";
      }
      return `${
        gameState.winner === "human" ? "Vous avez" : "L'ordinateur a"
      } gagné !`;
    }

    if (gameState.gamePhase === "selectPiece") {
      return gameState.currentPlayer === "human"
        ? "Sélectionnez une pièce pour l'ordinateur"
        : "L'ordinateur sélectionne une pièce pour vous...";
    } else {
      return gameState.currentPlayer === "human"
        ? "Placez la pièce sur le plateau"
        : "L'ordinateur place la pièce...";
    }
  };

  const getCurrentPlayerName = () => {
    return gameState.currentPlayer === "human" ? "Vous" : "Ordinateur";
  };

  return (
    <div className="game-container">
      <div className="game-header">
        <div className="game-title">
          <h1>Quarto vs IA</h1>
        </div>
        <button onClick={leaveGame} className="leave-btn">
          Retour à l'accueil
        </button>
      </div>

      <div className="game-content">
        <div className="board-section">
          {/* Informations des joueurs */}
          <div className="players-container">
            <div
              className={`player-card ${
                gameState.currentPlayer === "human" ? "current-player" : ""
              }`}
            >
              <div className="player-avatar">V</div>
              <div className="player-info">
                <div className="player-name">Vous</div>
                <div className="player-badges">
                  <span className="you-badge">Humain</span>
                  {gameState.currentPlayer === "human" && (
                    <span className="turn-indicator">À jouer</span>
                  )}
                </div>
              </div>
            </div>

            <div className="vs-divider">VS</div>

            <div
              className={`player-card ${
                gameState.currentPlayer === "computer" ? "current-player" : ""
              }`}
            >
              <div className="player-avatar">🤖</div>
              <div className="player-info">
                <div className="player-name">IA</div>
                <div className="player-badges">
                  <span className="you-badge">Bot</span>
                  {gameState.currentPlayer === "computer" && (
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
          {gameState.selectedPiece !== null &&
            gameState.selectedPiece !== undefined && (
              <div className="selected-piece-display">
                <h3>Pièce à placer</h3>
                <div className="selected-piece-preview">
                  <img
                    src={gameState.selectedPiece.image}
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

          {/* Score de l'IA */}
          {gameState.useRemoteAPI && aiScore !== null && (
            <div className="ai-score-display">
              <h3>Évaluation IA</h3>
              <div className="score-preview">
                <span className="score-value">Score: {aiScore}</span>
                <small>Profondeur: {gameState.aiDepth}</small>
              </div>
            </div>
          )}

          {/* Plateau de jeu */}
          <div className="board-container">{renderBoard()}</div>

          {/* Contrôles de l'IA */}
          <div className="ai-controls">
            <div className="ai-depth-control">
              <label htmlFor="ai-depth">
                Profondeur IA: {gameState.aiDepth}
              </label>
              <input
                id="ai-depth"
                type="range"
                min="1"
                max="16"
                value={gameState.aiDepth}
                onChange={(e) =>
                  setGameState((prev) => ({
                    ...prev,
                    aiDepth: parseInt(e.target.value),
                  }))
                }
                disabled={
                  gameState.currentPlayer === "computer" && !gameState.gameOver
                }
              />
              <div className="depth-labels">
                <span>Rapide</span>
                <span>Équilibré</span>
                <span>Fort</span>
              </div>
            </div>
            <button onClick={resetGame} className="reset-button">
              Nouvelle partie
            </button>
          </div>
        </div>

        <div className="game-sidebar">
          {renderPieces()}

          <div className="move-history">
            <h3>Historique des coups</h3>
            <div className="history-content">
              {gameHistoryDisplay.length === 0 ? (
                <p className="no-moves">Aucun coup joué</p>
              ) : (
                <div className="moves-list">
                  {gameHistoryDisplay.map((move, index) => (
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
                <strong>Mode:</strong> Humain vs IA
              </p>
              <p>
                <strong>Tour actuel:</strong> {getCurrentPlayerName()}
              </p>
              <p>
                <strong>Coups joués:</strong> {gameHistoryDisplay.length}
              </p>
              <p>
                <strong>Profondeur IA:</strong> {gameState.aiDepth}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuartoGame;
