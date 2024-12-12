const API_BASE_URL = "http://localhost:5000";

export const API_ROUTES = {
  // User Routes
  USER: {
    GET_USER_BY_ID: `${API_BASE_URL}/admin/:userId`,
    GET_PROFILE: `${API_BASE_URL}/users/profile`,
    SEND_VERIFICATION_EMAIL: `${API_BASE_URL}/users/send-verification-email`,
    VERIFY_EMAIL: `${API_BASE_URL}/users/verify-email`,
    TOTAL_USERS: `${API_BASE_URL}/users/total-users`,
    TOTAL_PREMIUM_USERS: `${API_BASE_URL}/users/total-premium-users`,
    TOTAL_REVENUE: `${API_BASE_URL}/users/total-revenue`,
    USERS_GROWTH: {
      THREE_MONTHS: `${API_BASE_URL}/user/users-growth/three-months`,
      YEAR: `${API_BASE_URL}/user/users-growth/year`,
      LIFETIME: `${API_BASE_URL}/user/users-growth/lifetime`
    },
    REVENUE_GROWTH: {
      THREE_MONTHS: `${API_BASE_URL}/user/revenue-growth/three-months`,
      YEAR: `${API_BASE_URL}/user/revenue-growth/year`,
      LIFETIME: `${API_BASE_URL}/user/revenue-growth/lifetime`
    },
    PREMIUM_SUBSCRIPTIONS: {
      THREE_MONTHS: `${API_BASE_URL}/user/premium-subscriptions/three-months`,
      YEAR: `${API_BASE_URL}/user/premium-subscriptions/year`,
      LIFETIME: `${API_BASE_URL}/user/premium-subscriptions/lifetime`
    },
    PREMIUM_UNSUBSCRIPTIONS: {
      THREE_MONTHS: `${API_BASE_URL}/user/premium-unsubscriptions/three-months`,
      YEAR: `${API_BASE_URL}/user/premium-unsubscriptions/year`,
      LIFETIME: `${API_BASE_URL}/user/premium-unsubscriptions/lifetime`
    },
    SEARCH_PLAYERS: `${API_BASE_URL}/user/search-players`,
    GET_ALL: `${API_BASE_URL}/users/all`,
    SEARCH: `${API_BASE_URL}/users/search`,
    BAN: `${API_BASE_URL}/users/:userId/ban`,
    DELETE: `${API_BASE_URL}/users/:userId`
  },

  // Course Routes
  COURSE: {
    GET_ALL: `${API_BASE_URL}/course/all`,
    GET_POPULAR: `${API_BASE_URL}/course/popular`
  },

  // Challenge Routes
  CHALLENGE: {
    GET_ALL: `${API_BASE_URL}/challenge/all`,
    CREATE: `${API_BASE_URL}/challenge/create`,
    DELETE: `${API_BASE_URL}/challenge`,
    GET_POPULAR: `${API_BASE_URL}/challenge/popular`
  },

  // Drill Routes
  DRILL: {
    GET_ALL: `${API_BASE_URL}/drill/all`,
    GET_POPULAR: `${API_BASE_URL}/drill/popular`
  },

  // Post Routes
  POST: {
    GET_ALL: `${API_BASE_URL}/post/all`,
    CREATE: `${API_BASE_URL}/post/create`,
    GET_ONE: `${API_BASE_URL}/post`, // Note: Requires /:id parameter to be appended
    GET_COMMENTS: `${API_BASE_URL}/post` // Note: Requires /:id/comments to be appended
  },

  // Comment Routes
  COMMENT: {
    GET_ONE: `${API_BASE_URL}/comment` // Note: Requires /:id parameter to be appended
  },

  // Report Routes
  REPORT: {
    GET_ALL: `${API_BASE_URL}/report/all`,
    GET_ONE: `${API_BASE_URL}/report/:reportId`,
    RESOLVE: `${API_BASE_URL}/report/:reportId/resolve`
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

export default API_BASE_URL;
