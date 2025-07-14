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

export interface Game {
  id: string;
  player1_id: number;
  player2_id: number;
  status: 'active' | 'finished';
  current_turn: 'player1' | 'player2';
  game_phase: 'selectPiece' | 'placePiece';
  board: string; // JSON serialized 4x4 board
  available_pieces: string; // JSON array of piece IDs
  selected_piece: number | null; // Current piece ID to place
  move_history: string; // JSON array of moves in notation
  winner?: 'player1' | 'player2' | 'draw';
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
