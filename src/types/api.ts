// Types pour l'API Backend Quarto

export interface User {
  id: number;
  username: string;
}

export interface LoginForm {
  email?: string;
  password?: string;
  token?: string;
}

export interface SignupForm {
  email: string;
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// Nouveau système de challenges
export interface Challenge {
  id: string;
  challenger_id: number;
  challenged_id: number;
  status: 'pending' | 'accepted' | 'declined' | 'expired' | 'cancelled';
  message?: string;
  game_id?: string;
  created_at: string;
  updated_at: string;
  expires_at: string;
  responded_at?: string;
}

export interface SendChallengeRequest {
  challenged_id: number;
  message?: string;
}

export interface RespondToChallengeRequest {
  challenge_id: string;
  accept: boolean;
}

export interface ChallengeListResponse {
  sent: Challenge[];
  received: Challenge[];
}

export interface ChallengeResponse {
  challenge: Challenge;
  game?: Game;
}

// Position représente une position sur le plateau Quarto (4x4)
export interface GamePosition {
  row: number;
  col: number;
}

// Move représente un mouvement complet dans Quarto (placement + sélection pour l'adversaire)
export interface GameMove {
  piece: number; // ID de la pièce sélectionnée par l'adversaire (0-15)
  position: GamePosition; // Position où placer la pièce sélectionnée
}

export interface Game {
  id: string;
  player1_id: number;
  player2_id: number;
  current_turn: number; // ID of the player whose turn it is
  game_phase: number; // 0 = "selectPiece", 1 = "placePiece"
  board: number[][]; // 4x4 matrix of Piece (numbers 0-15, -1 = empty)
  available_pieces: number[]; // List of available pieces (0-15)
  selected_piece: number; // Current piece to place (0-15, -1 = none)
  status: number; // 0 = "playing", 1 = "finished"
  winner: number; // ID of the winner (0 if draw)
  move_history: GameMove[]; // List of moves made in the game
  created_at: string;
  updated_at: string;
}

export interface Move {
  id: string;
  game_id: string;
  player_id: number;
  piece_id: number;
  position: string; // "a1" to "d4"
  notation: string; // "BCGP-c3"
  move_number: number;
  created_at: string;
}

export interface SelectPieceRequest {
  piece_id: number;
}

export interface PlacePieceRequest {
  position: string;
}

export interface WebSocketMessage {
  type: string;
  game_id?: string;
  user_id: string;
  data: any;
}

// Messages WebSocket selon la nouvelle documentation
export interface WSPingMessage extends WebSocketMessage {
  type: "ping";
  data: {};
}

export interface WSPongMessage extends WebSocketMessage {
  type: "pong";
  data: {
    message: string;
  };
}

export interface WSPieceSelectedMessage extends WebSocketMessage {
  type: "piece_selected";
  game_id: string;
  data: Game;
}

export interface WSPiecePlacedMessage extends WebSocketMessage {
  type: "piece_placed";
  game_id: string;
  data: Game;
}

export interface WSGameFinishedMessage extends WebSocketMessage {
  type: "game_finished";
  game_id: string;
  data: Game;
}

export interface WSGameForfeitedMessage extends WebSocketMessage {
  type: "game_forfeited";
  game_id: string;
  data: Game;
}

export interface APIError {
  message: string;
  code?: string;
  details?: any;
}

export type WebSocketMessageType = 
  | WSPingMessage
  | WSPongMessage
  | WSPieceSelectedMessage
  | WSPiecePlacedMessage
  | WSGameFinishedMessage
  | WSGameForfeitedMessage;

// Types pour les endpoints users
export interface UsersListResponse {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
  users: User[];
}

export interface GetUsersParams {
  page?: number;
  page_size?: number;
}
