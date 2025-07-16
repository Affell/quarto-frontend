import type { Piece, Board } from '../types/quarto';
import { pieceToNotation, type QuartoMove } from './notation';
import config from '../config';

// Interface pour l'API externe de Quarto
export interface QuartoAPI {
  // Obtenir le meilleur coup pour l'ordinateur
  getBestMove(board: Board, availablePieces: Piece[], history: QuartoMove[], depth?: number, selectedPiece?: Piece | null): Promise<{
    position: string | null; // Position où placer la pièce sélectionnée
    suggestedPiece: Piece | null; // Pièce suggérée pour l'adversaire
    score?: number; // Score d'évaluation du coup
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
    history: QuartoMove[],
    depth: number = 3,
    selectedPiece?: Piece | null
  ): Promise<{ position: string | null; suggestedPiece: Piece | null; score?: number }> {
    history;
    depth;
    selectedPiece;
    
    // Simulation d'un délai d'API
    await new Promise(resolve => setTimeout(resolve, 500));
    
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
    
    // Sélectionner une pièce aléatoire pour l'adversaire
    const suggestedPiece = availablePieces[Math.floor(Math.random() * availablePieces.length)];
    
    return {
      position: randomPosition,
      suggestedPiece,
      score: Math.floor(Math.random() * 100) // Score simulé
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

// API externe utilisant l'endpoint AI /ai/solve
export class RemoteQuartoAPI implements QuartoAPI {
  private baseUrl: string;
  
  constructor(baseUrl: string = config.apiBaseUrl) {
    this.baseUrl = baseUrl;
  }
  
  async getBestMove(
    board: Board, 
    availablePieces: Piece[], 
    history: QuartoMove[],
    depth: number = 6,
    selectedPiece?: Piece | null
  ): Promise<{ position: string | null; suggestedPiece: Piece | null; score?: number }> {
    try {
      // Construire le corps de la requête
      const requestBody: any = {
        history: history.map(m => m.notation),
        depth: Math.max(1, Math.min(16, depth)) // Limiter entre 1 et 16
      };

      // Ajouter la pièce sélectionnée si elle existe
      if (selectedPiece) {
        requestBody.selected_piece = selectedPiece.id;
      }

      const response = await fetch(`${this.baseUrl}/ai/solve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('🤖 API Response received:', data);
      
      // Parse la réponse de l'IA
      if (data.best_move) {
        // Extraire la position du best_move (format: "BCGP-a1")
        const position = this.extractPositionFromBestMove(data.best_move);
        console.log('📍 Extracted position:', position);
        
        // Trouver la pièce suggérée pour l'adversaire
        let suggestedPiece: Piece | null = null;
        if (data.suggested_piece) {
          suggestedPiece = availablePieces.find(p => p.id === data.suggested_piece) || null;
          console.log('🎯 Found suggested piece:', suggestedPiece);
        }
        
        const result = {
          position,
          suggestedPiece,
          score: data.score || 0
        };
        console.log('✅ Final getBestMove result:', result);
        return result;
      }
      
      console.log('❌ No best_move in response');
      return { position: null, suggestedPiece: null, score: 0 };
    } catch (error) {
      console.error('Remote API failed, falling back to local engine:', error);
      // Fallback vers l'engine local
      const localEngine = new LocalQuartoEngine();
      return localEngine.getBestMove(board, availablePieces, history, depth, selectedPiece);
    }
  }
  
  private extractPositionFromBestMove(bestMove: string): string | null {
    // Format attendu: "BCGP-a1" -> extraire "a1"
    const parts = bestMove.split('-');
    if (parts.length !== 2) {
      return null;
    }
    return parts[1]; // Retourner la position (ex: "a1")
  }
  
  async analyzePosition(
    board: Board, 
    availablePieces: Piece[]
  ): Promise<{ evaluation: number; bestMoves: string[] }> {
    try {
      // Évaluation simplifiée côté client pour l'instant
      board;
      availablePieces;
      
      const evaluation = (Math.random() - 0.5) * 2; // Entre -1 et 1
      const bestMoves = availablePieces.slice(0, 3).map(piece => pieceToNotation(piece));
      
      return { evaluation, bestMoves };
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
