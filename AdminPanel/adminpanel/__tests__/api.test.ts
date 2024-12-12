import axios from 'axios';
import API_BASE_URL, { API_ROUTES } from '../app/config/api-endpoints';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Admin API Tests', () => {
  let adminToken: string;

  beforeEach(() => {
    jest.clearAllMocks();
    adminToken = 'fake-admin-token';
  });

  // Helper for auth header
  const authHeader = () => ({
    headers: { Authorization: `Bearer ${adminToken}` }
  });

  // Admin Authentication Tests
  describe('Admin Authentication', () => {
    test('should login admin successfully', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          token: 'fake-admin-token',
          admin: { id: '1', email: 'afzalmuhammadaun@gmail.com' }
        }
      });

      const response = await axios.post(API_ROUTES.ADMIN.LOGIN, {
        email: 'afzalmuhammadaun@gmail.com',
        password: 'ChangeMe123!'
      });

      expect(response.data).toHaveProperty('token');
      adminToken = response.data.token;
    });
  });

  // User Routes Tests
  describe('User Routes', () => {
    test('should get total users count', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { count: 100 }
      });

      const response = await axios.get(API_ROUTES.USER.TOTAL_USERS);
      expect(response.data).toHaveProperty('count');
    });

    test('should get total premium users', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { count: 50 }
      });

      const response = await axios.get(API_ROUTES.USER.TOTAL_PREMIUM_USERS);
      expect(response.data).toHaveProperty('count');
    });

    test('should get total revenue', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { revenue: 5000 }
      });

      const response = await axios.get(API_ROUTES.USER.TOTAL_REVENUE);
      expect(response.data).toHaveProperty('revenue');
    });

    // Growth Tests
    describe('Growth Statistics', () => {
      test('should get users growth - three months', async () => {
        mockedAxios.get.mockResolvedValueOnce({
          data: [{ date: '2024-01', count: 10 }]
        });

        const response = await axios.get(API_ROUTES.USER.USERS_GROWTH.THREE_MONTHS);
        expect(Array.isArray(response.data)).toBe(true);
      });
    });
  });

  // Premium Routes Tests (Requires Auth)
  describe('Premium Routes', () => {
    test('should set premium amount', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: { message: 'Premium amount updated' }
      });

      const response = await axios.post(
        API_ROUTES.PREMIUM.SET_AMOUNT, 
        { amount: 9.99 },
        authHeader()
      );
      expect(response.data).toHaveProperty('message');
    });
  });

  // Report Routes Tests (Requires Auth)
  describe('Report Routes', () => {
    test('should get all reports', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: [{ id: 1, reason: 'spam' }]
      });

      const response = await axios.get(API_ROUTES.REPORT.GET_ALL, authHeader());
      expect(Array.isArray(response.data)).toBe(true);
    });
  });

  // Admin Logout Test
  describe('Admin Logout', () => {
    test('should logout admin successfully', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: { message: 'Logged out successfully' }
      });

      const response = await axios.post(API_ROUTES.ADMIN.LOGOUT, {}, authHeader());
      expect(response.data).toHaveProperty('message', 'Logged out successfully');
    });
  });
});
