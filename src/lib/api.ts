const API_URLS = {
  auth: 'https://functions.poehali.dev/655bad2e-5122-4932-94d0-6871a147fce2',
  chats: 'https://functions.poehali.dev/7d37fe61-d169-4ffd-96d6-8b740cd2804a',
  invites: 'https://functions.poehali.dev/d044ce71-63fa-4ad4-8a0f-ba86c89830bc',
  users: 'https://functions.poehali.dev/d4006d9f-ef4e-4209-8d55-2a631cb623a5',
  init: 'https://functions.poehali.dev/209a2754-1be3-4d5f-8ac7-d7ac18ab33ad',
};

export const getAuthToken = (): string | null => {
  return localStorage.getItem('accessToken');
};

export const setAuthToken = (token: string) => {
  localStorage.setItem('accessToken', token);
};

export const setRefreshToken = (token: string) => {
  localStorage.setItem('refreshToken', token);
};

export const clearTokens = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
};

export const apiRequest = async (
  url: string,
  options: RequestInit = {}
): Promise<any> => {
  const token = getAuthToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(url, {
    ...options,
    headers,
  });
  
  if (!response.ok && response.status === 401) {
    clearTokens();
    window.location.href = '/auth';
    throw new Error('Unauthorized');
  }
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }
  
  return data;
};

export const authApi = {
  register: async (username: string, displayName: string, password: string, inviteToken: string) => {
    return apiRequest(API_URLS.auth, {
      method: 'POST',
      body: JSON.stringify({
        action: 'register',
        username,
        displayName,
        password,
        inviteToken,
      }),
    });
  },
  
  login: async (username: string, password: string) => {
    return apiRequest(API_URLS.auth, {
      method: 'POST',
      body: JSON.stringify({
        action: 'login',
        username,
        password,
      }),
    });
  },
  
  getCurrentUser: async () => {
    return apiRequest(API_URLS.auth);
  },
};

export const chatsApi = {
  listChats: async () => {
    return apiRequest(`${API_URLS.chats}?action=list_chats`);
  },
  
  getMessages: async (chatId: string) => {
    return apiRequest(`${API_URLS.chats}?action=messages&chatId=${chatId}`);
  },
  
  createChat: async (userId: string) => {
    return apiRequest(API_URLS.chats, {
      method: 'POST',
      body: JSON.stringify({
        action: 'create_chat',
        userId,
      }),
    });
  },
  
  sendMessage: async (chatId: string, body: string) => {
    return apiRequest(API_URLS.chats, {
      method: 'POST',
      body: JSON.stringify({
        action: 'send_message',
        chatId,
        body,
      }),
    });
  },
};

export const invitesApi = {
  listInvites: async () => {
    return apiRequest(API_URLS.invites);
  },
  
  createInvite: async (maxUses: number, daysValid: number) => {
    return apiRequest(API_URLS.invites, {
      method: 'POST',
      body: JSON.stringify({
        maxUses,
        daysValid,
      }),
    });
  },
  
  revokeInvite: async (inviteId: string) => {
    return apiRequest(API_URLS.invites, {
      method: 'DELETE',
      body: JSON.stringify({
        inviteId,
      }),
    });
  },
};

export const usersApi = {
  listUsers: async () => {
    return apiRequest(API_URLS.users);
  },
};

export const initApi = {
  checkInit: async () => {
    const response = await fetch(API_URLS.init);
    return response.json();
  },
  
  createFirstInvite: async () => {
    const response = await fetch(API_URLS.init, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    return response.json();
  },
};