const API_BASE_URL = 'https://nodeapp.loca.lt';

export const API_ROUTES = {
  // User Routes
  user: {
    create: '/user/register',
    delete: '/user/delete-user',
    getTotalUsers: '/user/total-users',
    getTotalPremiumUsers: '/user/total-premium-users',
    getTotalRevenue: '/user/total-revenue',
    getUsersGrowth: {
      threeMonths: '/user/users-growth/three-months',
      year: '/user/users-growth/year',
      lifetime: '/user/users-growth/lifetime'
    },
    getRevenueGrowth: {
      threeMonths: '/user/revenue-growth/three-months',
      year: '/user/revenue-growth/year',
      lifetime: '/user/revenue-growth/lifetime'
    },
    getPremiumSubscriptions: {
      threeMonths: '/user/premium-subscriptions/three-months',
      year: '/user/premium-subscriptions/year',
      lifetime: '/user/premium-subscriptions/lifetime'
    },
    getPremiumUnsubscriptions: {
      threeMonths: '/user/premium-unsubscriptions/three-months',
      year: '/user/premium-unsubscriptions/year',
      lifetime: '/user/premium-unsubscriptions/lifetime'
    },
    searchPlayers: '/user/search-players'
  },

  // Course Routes
  course: {
    create: '/course/create',
    getAll: '/course/all',
    getPopular: '/course/popular'
  },

  // Challenge Routes
  challenge: {
    create: '/challenge/create',
    getAll: '/challenge/all',
    delete: '/challenge', // Note: Requires /:id parameter to be appended
    getPopular: '/challenge/popular'
  },

  // Drill Routes
  drill: {
    create: '/drill/create',
    getAll: '/drill/all',
    getPopular: '/drill/popular'
  },

  // Post Routes
  post: {
    getAll: '/post/all',
    create: '/post/create',
    getOne: '/post', // Note: Requires /:id parameter to be appended
    getComments: '/post' // Note: Requires /:id/comments to be appended
  },

  // Comment Routes
  comment: {
    create: '/comment/create',
    getOne: '/comment' // Note: Requires /:id parameter to be appended
  },

  // Report Routes
  report: {
    create: '/report/create',
    getAll: '/report/all'
  },

  // Premium Routes
  premium: {
    setAmount: '/premium/set-amount',
    setDiscount: '/premium/set-discount',
    removeDiscount: '/premium/remove-discount'
  },

  // Admin Routes
  admin: {
    login: '/admin/login',
    create: '/admin/create',
    logout: '/admin/logout',
    changePassword: '/admin/change-password'
  }
};

export default API_BASE_URL;
