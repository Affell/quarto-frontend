// Types pour le jeu Quarto

export interface Piece {
  id: number;
  color: 'blanc' | 'noir';
  shape: 'carré' | 'rond';
  size: 'grand' | 'petit';
  fill: 'plein' | 'troué';
  image: string;
}

export interface Position {
  row: number;
  col: number;
}

export type Board = (Piece | null)[][];

export interface GameState {
  board: Board;
  availablePieces: Piece[];
  selectedPiece: Piece | null;
  currentPlayer: 'human' | 'computer';
  gamePhase: 'selectPiece' | 'placePiece';
  winner: 'human' | 'computer' | 'draw' | null;
  gameOver: boolean;
  moveHistory: string[]; // Historique des coups en notation algébrique
  useRemoteAPI: boolean; // Utiliser l'API externe ou le moteur local
  aiDepth: number; // Profondeur de recherche pour l'IA (1-16)
}

export const BOARD_SIZE = 4;
