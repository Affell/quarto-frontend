import type {
  User,
  LoginForm,
  SignupForm,
  AuthResponse,
  Challenge,
  SendChallengeRequest,
  RespondToChallengeRequest,
  ChallengeListResponse,
  ChallengeResponse,
  Game,
  SelectPieceRequest,
  PlacePieceRequest,
  APIError,
  UsersListResponse,
  GetUsersParams
} from '../types/api';
import config from '../config';

const API_BASE_URL = config.apiBaseUrl;

class QuartoBackendAPI {
  private token: string | null = null;

  constructor() {
    // Récupérer le token du localStorage au démarrage
    this.token = localStorage.getItem('quarto-token');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { 'Quarto-Connect-Token': this.token }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const error: APIError = await response.json();
        throw new Error(error.message || `HTTP Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  // Authentication
  async login(form: LoginForm): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(form),
    });
    
    this.token = response.token;
    localStorage.setItem('quarto-token', this.token);
    return response;
  }

  async signup(form: SignupForm): Promise<{ message: string }> {
    return this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(form),
    });
  }

  async logout(): Promise<{ message: string }> {
    const response = await this.request<{ message: string }>('/auth/logout', {
      method: 'POST',
    });
    
    this.token = null;
    localStorage.removeItem('quarto-token');
    return response;
  }

  async getMe(): Promise<User> {
    return this.request<User>('/auth/me');
  }

  async recover(email: string): Promise<{ message: string }> {
    return this.request('/auth/recover', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(token: string, password: string): Promise<{ message: string }> {
    return this.request('/auth/reset_password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    });
  }

  // Challenges
  async sendChallenge(request: SendChallengeRequest): Promise<Challenge> {
    return this.request<Challenge>('/challenge/send', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getMyChallenges(): Promise<ChallengeListResponse> {
    return this.request<ChallengeListResponse>('/challenge/my', {
      method: 'GET',
    });
  }

  async respondToChallenge(request: RespondToChallengeRequest): Promise<ChallengeResponse> {
    return this.request<ChallengeResponse>('/challenge/respond', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Games
  async getMyGames(status?: number): Promise<Game[]> {
    // status: 0 = "playing", 1 = "finished"
    const url = status !== undefined ? `/game/my?status=${status}` : '/game/my';
    return this.request<Game[]>(url, {
      method: 'GET',
    });
  }
  async getGame(id: string): Promise<Game> {
    return this.request<Game>(`/game/${id}`, {
      method: 'GET',
    });
  }

  async selectPiece(gameId: string, request: SelectPieceRequest): Promise<Game> {
    return this.request<Game>(`/game/${gameId}/select-piece`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async placePiece(gameId: string, request: PlacePieceRequest): Promise<Game> {
    return this.request<Game>(`/game/${gameId}/place-piece`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async forfeitGame(gameId: string): Promise<Game> {
    return this.request<Game>(`/game/${gameId}/forfeit`, {
      method: 'POST',
    });
  }

  // WebSocket - Nouveau format avec game_id uniquement et token
  createWebSocket(gameId: string): WebSocket {
    // Construction de l'URL WebSocket avec le token et game_id
    let wsUrl = `${config.wsBaseUrl}/ws?game_id=${gameId}`;
    
    // Ajouter le token dans l'URL car les WebSockets ne supportent pas les headers personnalisés
    if (this.token) {
      wsUrl += `&token=${encodeURIComponent(this.token)}`;
    }
    
    return new WebSocket(wsUrl);
  }

  // Users endpoints
  async getUsers(params: GetUsersParams = {}): Promise<UsersListResponse> {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.page_size) searchParams.append('page_size', params.page_size.toString());
    
    const query = searchParams.toString();
    const endpoint = query ? `/users?${query}` : '/users';
    
    return this.request<UsersListResponse>(endpoint);
  }

  async getUserById(id: number): Promise<User> {
    return this.request<User>(`/users/${id}`);
  }

  // Utility methods
  isAuthenticated(): boolean {
    return !!this.token;
  }

  getToken(): string | null {
    return this.token;
  }

  setToken(token: string): void {
    this.token = token;
    localStorage.setItem('quarto-token', token);
  }

  clearToken(): void {
    this.token = null;
    localStorage.removeItem('quarto-token');
  }
}

// Export singleton instance
export const backendAPI = new QuartoBackendAPI();
export default backendAPI;
