const API_BASE_URL = "http://localhost:5000";

export const API_ROUTES = {
  // User Routes
  USER: {
    GET_USER_BY_ID: `${API_BASE_URL}/users/:userId`,
    GET_PROFILE: `${API_BASE_URL}/users/profile`,
    SEND_VERIFICATION_EMAIL: `${API_BASE_URL}/users/send-verification-email`,
    VERIFY_EMAIL: `${API_BASE_URL}/users/verify-email`,
    TOTAL_USERS: `${API_BASE_URL}/users/total-users`,
    TOTAL_PREMIUM_USERS: `${API_BASE_URL}/users/total-premium-users`,
    USERS_GROWTH: {
      THREE_MONTHS: `${API_BASE_URL}/users/users-growth/three-months`,
      YEAR: `${API_BASE_URL}/users/users-growth/year`,
      LIFETIME: `${API_BASE_URL}/users/users-growth/lifetime`
    },
    SEARCH_PLAYERS: `${API_BASE_URL}/users/search-players`,
    GET_ALL: `${API_BASE_URL}/users/all`,
    SEARCH: `${API_BASE_URL}/users/search`,
    BAN: `${API_BASE_URL}/users/ban/:userId`,
    DELETE: `${API_BASE_URL}/users/:userId`
  },

  // Revenue Routes (New)
  REVENUE: {
    TOTAL: `${API_BASE_URL}/revenue/total`,
    GROWTH: {
      THREE_MONTHS: `${API_BASE_URL}/revenue/growth/three-months`,
      YEAR: `${API_BASE_URL}/revenue/growth/year`,
      LIFETIME: `${API_BASE_URL}/revenue/growth/lifetime`
    },
    PREMIUM_SUBSCRIPTIONS: {
      THREE_MONTHS: `${API_BASE_URL}/revenue/subscriptions/three-months`,
      YEAR: `${API_BASE_URL}/revenue/subscriptions/year`,
      LIFETIME: `${API_BASE_URL}/revenue/subscriptions/lifetime`
    },
    PREMIUM_UNSUBSCRIPTIONS: {
      THREE_MONTHS: `${API_BASE_URL}/revenue/unsubscriptions/three-months`,
      YEAR: `${API_BASE_URL}/revenue/unsubscriptions/year`,
      LIFETIME: `${API_BASE_URL}/revenue/unsubscriptions/lifetime`
    }
  },

  // Course Routes
  COURSE: {
    GET_ALL: `${API_BASE_URL}/courses/all`,
    GET_POPULAR: `${API_BASE_URL}/courses/popular`
  },

  // Challenge Routes
  CHALLENGE: {
    GET_ALL: `${API_BASE_URL}/challenges/all`,
    CREATE: `${API_BASE_URL}/challenges/create`,
    DELETE: `${API_BASE_URL}/challenges/`,
    GET_POPULAR: `${API_BASE_URL}/challenges/popular`
  },

  // Drill Routes
  DRILL: {
    GET_ALL: `${API_BASE_URL}/drills/all`,
    GET_POPULAR: `${API_BASE_URL}/drills/popular`
  },

  // Post Routes
  POST: {
    GET_ALL: `${API_BASE_URL}/posts/all`,
    CREATE: `${API_BASE_URL}/posts/create`,
    GET_ONE: `${API_BASE_URL}/posts`, // Note: Requires /:id parameter to be appended
    GET_COMMENTS: `${API_BASE_URL}/posts`, // Note: Requires /:id/comments to be appended
    DELETE: `${API_BASE_URL}/posts/:id`
  },

  // Comment Routes
  COMMENT: {
    GET_ONE: `${API_BASE_URL}/comments`, // Note: Requires /:id parameter to be appended
    DELETE: `${API_BASE_URL}/comments/:id`
  },

  // Report Routes
  REPORT: {
    GET_ALL: `${API_BASE_URL}/reports/all`,
    GET_ONE: `${API_BASE_URL}/reports/:reportId`,
    RESOLVE: `${API_BASE_URL}/reports/:reportId/resolve`
  },

  // Premium Routes
  PREMIUM: {
    GET: `${API_BASE_URL}/premium`,
    SET_AMOUNT: `${API_BASE_URL}/premium/set-amount`,
    SET_DISCOUNT: `${API_BASE_URL}/premium/set-discount`,
    REMOVE_DISCOUNT: `${API_BASE_URL}/premium/remove-discount`
  },

  // Admin Routes
  ADMIN: {
    LOGIN: `${API_BASE_URL}/admin/login`,
    LOGOUT: `${API_BASE_URL}/admin/logout`,
    CHANGE_PASSWORD: `${API_BASE_URL}/admin/change-password`
  }
};

export const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  // Get the token using the correct key 'auth_token'
  const token = localStorage.getItem('auth_token');

  const defaultOptions: RequestInit = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      // Add Authorization header if token exists
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(url, defaultOptions);
  
  if (response.status === 401) {
    // Handle unauthorized access
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }
  
  return response;
};

export default API_BASE_URL;
