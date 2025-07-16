import type { Piece, Board } from '../types/quarto';

// Notation algébrique pour Quarto
// Format: [BCGP]-[position]
// B/N: Blanc/Noir, C/R: Carré/Rond, G/P: Grand/Petit, P/T: Plein/Troué
// Position: a1-d4 (comme aux échecs)

export interface QuartoMove {
  piece: Piece;
  position: string; // ex: "c3"
  notation: string; // ex: "BCGP-c3"
}

// Convertit une pièce en notation
export const pieceToNotation = (piece: Piece): string => {
  const color = piece.color === 'blanc' ? 'B' : 'N';
  const shape = piece.shape === 'carré' ? 'C' : 'R';
  const size = piece.size === 'grand' ? 'G' : 'P';
  const fill = piece.fill === 'plein' ? 'P' : 'T';
  
  return `${color}${shape}${size}${fill}`;
};

// Convertit les coordonnées (row, col) en notation position (ex: 0,2 -> c1)
export const coordsToPosition = (row: number, col: number): string => {
  const file = String.fromCharCode('a'.charCodeAt(0) + col); // a, b, c, d
  const rank = (row + 1).toString(); // 1, 2, 3, 4
  return `${file}${rank}`;
};

// Convertit une position en coordonnées (ex: "c3" -> [1, 2])
export const positionToCoords = (position: string): [number, number] => {
  const file = position[0];
  const rank = position[1];
  
  const col = file.charCodeAt(0) - 'a'.charCodeAt(0); // a=0, b=1, c=2, d=3
  const row = parseInt(rank) - 1; // 1=0, 2=1, 3=2, 4=3
  
  return [row, col];
};

// Crée un move complet avec notation
export const createMove = (piece: Piece, row: number, col: number): QuartoMove => {
  const position = coordsToPosition(row, col);
  const notation = `${pieceToNotation(piece)}-${position}`;
  
  return {
    piece,
    position,
    notation
  };
};

// Parse une notation pour récupérer la pièce et la position
export const parseNotation = (notation: string): { pieceNotation: string; position: string } => {
  const [pieceNotation, position] = notation.split('-');
  return { pieceNotation, position };
};

// Trouve une pièce dans la liste par sa notation
export const findPieceByNotation = (pieces: Piece[], notation: string): Piece | null => {
  return pieces.find(piece => pieceToNotation(piece) === notation) || null;
};

// Convertit l'état du plateau en notation FEN-like pour Quarto
export const boardToFEN = (board: Board): string => {
  let fen = '';
  
  for (let row = 0; row < 4; row++) {
    let emptyCount = 0;
    let rankStr = '';
    
    for (let col = 0; col < 4; col++) {
      const piece = board[row][col];
      if (piece === null) {
        emptyCount++;
      } else {
        if (emptyCount > 0) {
          rankStr += emptyCount.toString();
          emptyCount = 0;
        }
        rankStr += pieceToNotation(piece);
      }
    }
    
    if (emptyCount > 0) {
      rankStr += emptyCount.toString();
    }
    
    fen += rankStr;
    if (row < 3) fen += '/';
  }
  
  return fen;
};

// Valide si une notation est correcte
export const isValidNotation = (notation: string): boolean => {
  const regex = /^[BN][CR][GP][PT]-[a-d][1-4]$/;
  return regex.test(notation);
};

// Historique des coups
export class MoveHistory {
  private moves: QuartoMove[] = [];
  
  addMove(move: QuartoMove): void {
    this.moves.push(move);
  }
  
  getLastMove(): QuartoMove | null {
    return this.moves.length > 0 ? this.moves[this.moves.length - 1] : null;
  }
  
  getAllMoves(): QuartoMove[] {
    return [...this.moves];
  }
  
  getMoveCount(): number {
    return this.moves.length;
  }
  
  clear(): void {
    this.moves = [];
  }
  
  // Génère une notation PGN-like pour le jeu
  toPGN(): string {
    let pgn = '';
    for (let i = 0; i < this.moves.length; i++) {
      const move = this.moves[i];
      const moveNumber = Math.floor(i / 2) + 1;
      
      if (i % 2 === 0) {
        pgn += `${moveNumber}. `;
      }
      
      pgn += move.notation;
      
      if (i % 2 === 1) {
        pgn += ' ';
      } else if (i < this.moves.length - 1) {
        pgn += ' ';
      }
    }
    return pgn.trim();
  }
}
