import type { Piece, Board } from '../types/quarto';
import { BOARD_SIZE } from '../types/quarto';

// Génère toutes les 16 pièces du Quarto
export const generatePieces = (): Piece[] => {
  const pieces: Piece[] = [];
  let id = 0;

  const colors = ['blanc', 'noir'] as const;
  const shapes = ['carré', 'rond'] as const;
  const sizes = ['grand', 'petit'] as const;
  const fills = ['plein', 'troué'] as const;

  // Générer les pièces dans l'ordre spécifié : blanc, carré, grand, plein en subdivisions
  for (const color of colors) {
    for (const shape of shapes) {
      for (const size of sizes) {
        for (const fill of fills) {
          pieces.push({
            id,
            color,
            shape,
            size,
            fill,
            image: `/assets/pieces/p${id}.jpg`
          });
          id++;
        }
      }
    }
  }

  return pieces;
};

// Crée un plateau vide
export const createEmptyBoard = (): Board => {
  return Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));
};

// Vérifie s'il y a une ligne de 4 pièces avec au moins une caractéristique commune
export const checkWin = (board: Board): boolean => {
  // Vérifier les lignes
  for (let row = 0; row < BOARD_SIZE; row++) {
    if (checkLine(board[row])) return true;
  }

  // Vérifier les colonnes
  for (let col = 0; col < BOARD_SIZE; col++) {
    const column = board.map(row => row[col]);
    if (checkLine(column)) return true;
  }

  // Vérifier les diagonales
  const diagonal1 = board.map((row, i) => row[i]);
  const diagonal2 = board.map((row, i) => row[BOARD_SIZE - 1 - i]);
  
  if (checkLine(diagonal1) || checkLine(diagonal2)) return true;

  return false;
};

// Vérifie si une ligne de 4 pièces a au moins une caractéristique commune
const checkLine = (line: (Piece | null)[]): boolean => {
  // Vérifier que toutes les cases sont remplies
  if (line.some(piece => piece === null)) return false;

  const pieces = line as Piece[];

  // Vérifier chaque caractéristique
  const colorSame = pieces.every(piece => piece.color === pieces[0].color);
  const shapeSame = pieces.every(piece => piece.shape === pieces[0].shape);
  const sizeSame = pieces.every(piece => piece.size === pieces[0].size);
  const fillSame = pieces.every(piece => piece.fill === pieces[0].fill);

  return colorSame || shapeSame || sizeSame || fillSame;
};

// Vérifie si le plateau est plein (match nul)
export const isBoardFull = (board: Board): boolean => {
  return board.every(row => row.every(cell => cell !== null));
};

// IA simple pour sélectionner une pièce
export const selectPieceForHuman = (availablePieces: Piece[]): Piece => {
  // Pour l'instant, sélection aléatoire (peut être améliorée)
  const randomIndex = Math.floor(Math.random() * availablePieces.length);
  return availablePieces[randomIndex];
};

// IA simple pour placer une pièce
export const getComputerMove = (board: Board): { row: number; col: number } => {
  const emptyCells: { row: number; col: number }[] = [];
  
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (board[row][col] === null) {
        emptyCells.push({ row, col });
      }
    }
  }

  // Pour l'instant, sélection aléatoire (peut être améliorée)
  const randomIndex = Math.floor(Math.random() * emptyCells.length);
  return emptyCells[randomIndex];
};
