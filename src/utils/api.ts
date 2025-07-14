import type { Piece, Board } from '../types/quarto';
import { boardToFEN, pieceToNotation, type QuartoMove } from './notation';

// Interface pour l'API externe de Quarto
export interface QuartoAPI {
  // Obtenir le meilleur coup pour l'ordinateur
  getBestMove(board: Board, availablePieces: Piece[], history: QuartoMove[]): Promise<{
    selectedPiece: Piece | null; // Pièce à sélectionner pour l'adversaire
    position: string | null; // Position où placer la pièce (si on doit jouer)
  }>;
  
  // Analyser une position
  analyzePosition(board: Board, availablePieces: Piece[]): Promise<{
    evaluation: number; // Score de la position (-1 à 1)
    bestMoves: string[]; // Meilleurs coups en notation
  }>;
}

// Implémentation de base (simulée) de l'API
export class LocalQuartoEngine implements QuartoAPI {
  async getBestMove(
    board: Board, 
    availablePieces: Piece[], 
    history: QuartoMove[]
  ): Promise<{ selectedPiece: Piece | null; position: string | null }> {
    history;
    // Simulation d'un délai d'API
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Pour l'instant, sélection aléatoire (à remplacer par une vraie IA)
    const randomPiece = availablePieces[Math.floor(Math.random() * availablePieces.length)];
    
    // Trouver une position aléatoire vide
    const emptyPositions: string[] = [];
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        if (board[row][col] === null) {
          const file = String.fromCharCode('a'.charCodeAt(0) + col);
          const rank = (4 - row).toString();
          emptyPositions.push(`${file}${rank}`);
        }
      }
    }
    
    const randomPosition = emptyPositions[Math.floor(Math.random() * emptyPositions.length)];
    
    return {
      selectedPiece: randomPiece,
      position: randomPosition
    };
  }
  
  async analyzePosition(
    board: Board, 
    availablePieces: Piece[]
  ): Promise<{ evaluation: number; bestMoves: string[] }> {
    board;
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Évaluation simplifiée
    const evaluation = (Math.random() - 0.5) * 2; // Entre -1 et 1
    const bestMoves = availablePieces.slice(0, 3).map(piece => pieceToNotation(piece));
    
    return { evaluation, bestMoves };
  }
}

// API externe (exemple avec un service hypothétique)
export class RemoteQuartoAPI implements QuartoAPI {
  private baseUrl: string;
  
  constructor(baseUrl: string = 'https://api.quarto-engine.com') {
    this.baseUrl = baseUrl;
  }
  
  async getBestMove(
    board: Board, 
    availablePieces: Piece[], 
    history: QuartoMove[]
  ): Promise<{ selectedPiece: Piece | null; position: string | null }> {
    try {
      const response = await fetch(`${this.baseUrl}/best-move`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          board: boardToFEN(board),
          availablePieces: availablePieces.map(p => pieceToNotation(p)),
          history: history.map(m => m.notation),
        }),
      });
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      const data = await response.json();
      return {
        selectedPiece: data.selectedPiece ? 
          availablePieces.find(p => pieceToNotation(p) === data.selectedPiece) || null : null,
        position: data.position || null
      };
    } catch (error) {
      console.error('Remote API failed, falling back to local engine:', error);
      // Fallback vers l'engine local
      const localEngine = new LocalQuartoEngine();
      return localEngine.getBestMove(board, availablePieces, history);
    }
  }
  
  async analyzePosition(
    board: Board, 
    availablePieces: Piece[]
  ): Promise<{ evaluation: number; bestMoves: string[] }> {
    try {
      const response = await fetch(`${this.baseUrl}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          board: boardToFEN(board),
          availablePieces: availablePieces.map(p => pieceToNotation(p)),
        }),
      });
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Remote API failed, falling back to local engine:', error);
      const localEngine = new LocalQuartoEngine();
      return localEngine.analyzePosition(board, availablePieces);
    }
  }
}

// Factory pour créer l'API appropriée
export const createQuartoAPI = (useRemote: boolean = false): QuartoAPI => {
  return useRemote ? new RemoteQuartoAPI() : new LocalQuartoEngine();
};
