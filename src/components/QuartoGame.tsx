import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import type { GameState, Piece } from "../types/quarto";
import {
  generatePieces,
  createEmptyBoard,
  checkWin,
  isBoardFull,
} from "../utils/gameLogic";
import { createMove, positionToCoords, MoveHistory } from "../utils/notation";
import { createQuartoAPI } from "../utils/api";
import "./QuartoGame.css";

const QuartoGame: React.FC = () => {
  const [moveHistory] = useState(() => new MoveHistory());

  const [gameState, setGameState] = useState<GameState>(() => ({
    board: createEmptyBoard(),
    availablePieces: generatePieces(),
    selectedPiece: null,
    currentPlayer: "human",
    gamePhase: "selectPiece",
    winner: null,
    gameOver: false,
    moveHistory: [],
    useRemoteAPI: false,
  }));

  // Créer l'API selon la configuration
  const quartoAPI = createQuartoAPI(gameState.useRemoteAPI);

  // Gestion du tour de l'ordinateur
  useEffect(() => {
    if (gameState.currentPlayer === "computer" && !gameState.gameOver) {
      const timer = setTimeout(async () => {
        try {
          if (gameState.gamePhase === "placePiece" && gameState.selectedPiece) {
            // L'ordinateur place la pièce via l'API
            const apiResponse = await quartoAPI.getBestMove(
              gameState.board,
              gameState.availablePieces,
              moveHistory.getAllMoves()
            );

            if (apiResponse.position) {
              const [row, col] = positionToCoords(apiResponse.position);
              handleComputerMove(row, col);
            }
          } else if (gameState.gamePhase === "selectPiece") {
            // L'ordinateur sélectionne une pièce pour le joueur humain via l'API
            const apiResponse = await quartoAPI.getBestMove(
              gameState.board,
              gameState.availablePieces,
              moveHistory.getAllMoves()
            );

            if (apiResponse.selectedPiece) {
              setGameState((prev) => ({
                ...prev,
                selectedPiece: apiResponse.selectedPiece,
                availablePieces: prev.availablePieces.filter(
                  (p) => p.id !== apiResponse.selectedPiece!.id
                ),
                currentPlayer: "human",
                gamePhase: "placePiece",
              }));
            }
          }
        } catch (error) {
          console.error("API call failed:", error);
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
    quartoAPI,
    moveHistory,
  ]);

  const handleComputerMove = (row: number, col: number) => {
    if (!gameState.selectedPiece || gameState.board[row][col] !== null) return;

    const newBoard = gameState.board.map((boardRow, r) =>
      boardRow.map((cell, c) =>
        r === row && c === col ? gameState.selectedPiece : cell
      )
    );

    // Créer le move avec notation algébrique
    const move = createMove(gameState.selectedPiece, row, col);
    moveHistory.addMove(move);

    // Vérifier la victoire
    const hasWon = checkWin(newBoard);
    const boardFull = isBoardFull(newBoard);

    if (hasWon) {
      setGameState((prev) => ({
        ...prev,
        board: newBoard,
        selectedPiece: null,
        winner: "computer",
        gameOver: true,
        moveHistory: [...prev.moveHistory, move.notation],
      }));
    } else if (boardFull) {
      setGameState((prev) => ({
        ...prev,
        board: newBoard,
        selectedPiece: null,
        winner: "draw",
        gameOver: true,
        moveHistory: [...prev.moveHistory, move.notation],
      }));
    } else {
      // L'ordinateur a joué, maintenant il doit sélectionner une pièce pour le joueur
      setGameState((prev) => ({
        ...prev,
        board: newBoard,
        selectedPiece: null,
        gamePhase: "selectPiece",
        currentPlayer: "computer", // L'ordinateur reste actif pour sélectionner
        moveHistory: [...prev.moveHistory, move.notation],
      }));
    }
  };

  const selectPiece = (piece: Piece) => {
    if (
      gameState.gamePhase !== "selectPiece" ||
      gameState.currentPlayer !== "human"
    )
      return;

    setGameState((prev) => ({
      ...prev,
      selectedPiece: piece,
      availablePieces: prev.availablePieces.filter((p) => p.id !== piece.id),
      currentPlayer: "computer",
      gamePhase: "placePiece",
    }));
  };

  const placePiece = (row: number, col: number) => {
    if (
      !gameState.selectedPiece ||
      gameState.board[row][col] !== null ||
      gameState.currentPlayer !== "human"
    )
      return;

    const newBoard = gameState.board.map((boardRow, r) =>
      boardRow.map((cell, c) =>
        r === row && c === col ? gameState.selectedPiece : cell
      )
    );

    // Créer le move avec notation algébrique
    const move = createMove(gameState.selectedPiece, row, col);
    moveHistory.addMove(move);

    // Vérifier la victoire
    const hasWon = checkWin(newBoard);
    const boardFull = isBoardFull(newBoard);

    if (hasWon) {
      setGameState((prev) => ({
        ...prev,
        board: newBoard,
        selectedPiece: null,
        winner: "human",
        gameOver: true,
        moveHistory: [...prev.moveHistory, move.notation],
      }));
    } else if (boardFull) {
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
    setGameState({
      board: createEmptyBoard(),
      availablePieces: generatePieces(),
      selectedPiece: null,
      currentPlayer: "human",
      gamePhase: "selectPiece",
      winner: null,
      gameOver: false,
      moveHistory: [],
      useRemoteAPI: false,
    });
  };

  const renderBoard = () => {
    return (
      <div className="board">
        {gameState.board.map((row, rowIndex) =>
          row.map((piece, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              className={`board-cell ${
                !piece &&
                gameState.selectedPiece &&
                gameState.currentPlayer === "human" &&
                gameState.gamePhase === "placePiece"
                  ? "placeable"
                  : ""
              }`}
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
          ))
        )}
      </div>
    );
  };

  const renderPieces = () => {
    return (
      <div className="pieces-container">
        <h3>Pièces disponibles</h3>
        <div className="pieces-grid">
          {gameState.availablePieces.map((piece) => (
            <div
              key={piece.id}
              className={`piece ${
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

  return (
    <div className="quarto-game">
      <div className="game-header">
        <h1>Quarto</h1>
        <Link to="/" className="home-link">
          ← Retour à l'accueil
        </Link>
        <div className="game-status">
          <p>{getGameStatusMessage()}</p>
          {gameState.selectedPiece && (
            <div className="selected-piece">
              <span>Pièce sélectionnée:</span>
              <img
                src={gameState.selectedPiece.image}
                alt="Pièce sélectionnée"
                className="piece-image small"
              />
            </div>
          )}
        </div>
        <button onClick={resetGame} className="reset-button">
          Nouvelle partie
        </button>

        <div className="api-controls">
          <label className="api-toggle">
            <input
              type="checkbox"
              checked={gameState.useRemoteAPI}
              onChange={(e) =>
                setGameState((prev) => ({
                  ...prev,
                  useRemoteAPI: e.target.checked,
                }))
              }
            />
            Utiliser l'API externe
          </label>
        </div>
      </div>

      <div className="game-content">
        <div className="board-container">{renderBoard()}</div>

        <div className="sidebar">
          {renderPieces()}

          {/* Historique des coups */}
          <div className="move-history">
            <h3>Historique des coups</h3>
            <div className="history-content">
              {gameState.moveHistory.length === 0 ? (
                <p className="no-moves">Aucun coup joué</p>
              ) : (
                <div className="moves-list">
                  {gameState.moveHistory.map((move, index) => (
                    <div key={index} className="move-item">
                      <span className="move-number">{index + 1}.</span>
                      <span className="move-notation">{move}</span>
                    </div>
                  ))}
                </div>
              )}
              {gameState.moveHistory.length > 0 && (
                <div className="pgn-notation">
                  <strong>PGN:</strong> {moveHistory.toPGN()}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuartoGame;
