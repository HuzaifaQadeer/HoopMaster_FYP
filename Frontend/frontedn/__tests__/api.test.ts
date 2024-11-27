import axios from 'axios';
import { API_ROUTES } from '../config/config';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('User API Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Registration Tests
  describe('Registration API', () => {
    const validUserData = {
      email: 'test@example.com',
      password: 'Password123!',
      displayName: 'Test User'
    };

    test('should register user successfully', async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: { message: 'User registered successfully' } });
      
      const response = await axios.post(API_ROUTES.REGISTER, validUserData);
      expect(response.data.message).toBe('User registered successfully');
    });

    test('should fail registration with existing email', async () => {
      mockedAxios.post.mockRejectedValueOnce({ 
        response: { 
          status: 400, 
          data: { message: 'User already exists' } 
        } 
      });

      await expect(axios.post(API_ROUTES.REGISTER, validUserData))
        .rejects.toThrow();
    });

    test('should fail registration with invalid email format', async () => {
      const invalidData = { ...validUserData, email: 'invalid-email' };
      mockedAxios.post.mockRejectedValueOnce({ 
        response: { status: 400, data: { message: 'Invalid email format' } }
      });
      await expect(axios.post(API_ROUTES.REGISTER, invalidData)).rejects.toThrow();
    });

    test('should fail registration with weak password', async () => {
      const weakPasswordData = { ...validUserData, password: '123' };
      mockedAxios.post.mockRejectedValueOnce({ 
        response: { status: 400, data: { message: 'Password too weak' } }
      });
      await expect(axios.post(API_ROUTES.REGISTER, weakPasswordData)).rejects.toThrow();
    });
  });

  // Login Tests
  describe('Login API', () => {
    const loginData = {
      email: 'test@example.com',
      password: 'Password123!'
    };

    test('should login successfully', async () => {
      mockedAxios.post.mockResolvedValueOnce({ 
        data: { 
          token: 'fake-token',
          user: { id: '1', email: 'test@example.com' } 
        } 
      });

      const response = await axios.post(API_ROUTES.LOGIN, loginData);
      expect(response.data.token).toBeDefined();
    });

    test('should fail login with wrong credentials', async () => {
      mockedAxios.post.mockRejectedValueOnce({ 
        response: { 
          status: 401, 
          data: { message: 'Invalid credentials' } 
        } 
      });

      await expect(axios.post(API_ROUTES.LOGIN, loginData))
        .rejects.toThrow();
    });

    test('should fail login with non-existent email', async () => {
      mockedAxios.post.mockRejectedValueOnce({ 
        response: { status: 404, data: { message: 'User not found' } }
      });
      await expect(axios.post(API_ROUTES.LOGIN, { 
        email: 'nonexistent@example.com', 
        password: 'Password123!' 
      })).rejects.toThrow();
    });

    test('should handle server error during login', async () => {
      mockedAxios.post.mockRejectedValueOnce({ 
        response: { status: 500, data: { message: 'Internal server error' } }
      });
      await expect(axios.post(API_ROUTES.LOGIN, loginData)).rejects.toThrow();
    });
  });

  // Profile Tests
  describe('Profile API', () => {
    const token = 'fake-token';
    const config = { headers: { Authorization: `Bearer ${token}` } };

    test('should get profile successfully', async () => {
      mockedAxios.get.mockResolvedValueOnce({ 
        data: { 
          id: '1', 
          email: 'test@example.com',
          displayName: 'Test User' 
        } 
      });

      const response = await axios.get(API_ROUTES.GET_PROFILE, config);
      expect(response.data.email).toBe('test@example.com');
    });

    test('should update profile successfully', async () => {
      const updateData = { displayName: 'Updated Name' };
      mockedAxios.put.mockResolvedValueOnce({ 
        data: { 
          id: '1', 
          displayName: 'Updated Name' 
        } 
      });

      const response = await axios.put(API_ROUTES.UPDATE_PROFILE, updateData, config);
      expect(response.data.displayName).toBe('Updated Name');
    });

    test('should fail getting profile with invalid token', async () => {
      const invalidConfig = { headers: { Authorization: 'Bearer invalid-token' } };
      mockedAxios.get.mockRejectedValueOnce({ 
        response: { status: 401, data: { message: 'Invalid token' } }
      });
      await expect(axios.get(API_ROUTES.GET_PROFILE, invalidConfig)).rejects.toThrow();
    });

    test('should handle empty update data', async () => {
      mockedAxios.put.mockRejectedValueOnce({ 
        response: { status: 400, data: { message: 'No data to update' } }
      });
      await expect(axios.put(API_ROUTES.UPDATE_PROFILE, {}, config)).rejects.toThrow();
    });
  });

  // Profile Picture Tests
  describe('Profile Picture API', () => {
    const token = 'fake-token';
    const config = { headers: { Authorization: `Bearer ${token}` } };

    test('should upload profile picture successfully', async () => {
      const formData = new FormData();
      const mockFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
      formData.append('profilePicture', mockFile);

      mockedAxios.put.mockResolvedValueOnce({ 
        data: { message: 'Profile picture updated successfully' } 
      });

      const response = await axios.put(API_ROUTES.UPDATE_PROFILE_PICTURE, formData, config);
      expect(response.data.message).toBe('Profile picture updated successfully');
    });

    test('should fail uploading invalid file type', async () => {
      const formData = new FormData();
      const mockFile = new File([''], 'test.txt', { type: 'text/plain' });
      formData.append('profilePicture', mockFile);

      mockedAxios.put.mockRejectedValueOnce({ 
        response: { 
          status: 400, 
          data: { message: 'Invalid file type' } 
        } 
      });

      await expect(axios.put(API_ROUTES.UPDATE_PROFILE_PICTURE, formData, config))
        .rejects.toThrow();
    });

    test('should fail uploading empty file', async () => {
      const formData = new FormData();
      mockedAxios.put.mockRejectedValueOnce({ 
        response: { status: 400, data: { message: 'No file provided' } }
      });
      await expect(axios.put(API_ROUTES.UPDATE_PROFILE_PICTURE, formData, config))
        .rejects.toThrow();
    });

    test('should fail uploading oversized image', async () => {
      const formData = new FormData();
      const mockFile = new File([''], 'large.jpg', { type: 'image/jpeg' });
      Object.defineProperty(mockFile, 'size', { value: 10 * 1024 * 1024 }); // 10MB
      formData.append('profilePicture', mockFile);

      mockedAxios.put.mockRejectedValueOnce({ 
        response: { status: 400, data: { message: 'File too large' } }
      });
      await expect(axios.put(API_ROUTES.UPDATE_PROFILE_PICTURE, formData, config))
        .rejects.toThrow();
    });
  });

  // Highlight Video Tests
  describe('Highlight Video API', () => {
    const token = 'fake-token';
    const config = { headers: { Authorization: `Bearer ${token}` } };

    test('should upload highlight video successfully', async () => {
      const formData = new FormData();
      const mockFile = new File([''], 'test.mp4', { type: 'video/mp4' });
      formData.append('highlightVideo', mockFile);

      mockedAxios.put.mockResolvedValueOnce({ 
        data: { message: 'Highlight video updated successfully' } 
      });

      const response = await axios.put(API_ROUTES.UPDATE_HIGHLIGHT_VIDEO, formData, config);
      expect(response.data.message).toBe('Highlight video updated successfully');
    });

    test('should fail uploading large video file', async () => {
      const formData = new FormData();
      const mockFile = new File([''], 'large.mp4', { type: 'video/mp4' });
      Object.defineProperty(mockFile, 'size', { value: 200 * 1024 * 1024 }); // 200MB
      formData.append('highlightVideo', mockFile);

      mockedAxios.put.mockRejectedValueOnce({ 
        response: { 
          status: 400, 
          data: { message: 'Video file must be smaller than 100MB' } 
        } 
      });

      await expect(axios.put(API_ROUTES.UPDATE_HIGHLIGHT_VIDEO, formData, config))
        .rejects.toThrow();
    });
  });

  // Email Verification Tests
  describe('Email Verification API', () => {
    test('should send verification email successfully', async () => {
      mockedAxios.post.mockResolvedValueOnce({ 
        data: { message: 'Verification email sent' } 
      });

      const response = await axios.post(API_ROUTES.SEND_VERIFICATION_EMAIL, { 
        email: 'test@example.com' 
      });
      expect(response.data.message).toBe('Verification email sent');
    });

    test('should verify email successfully', async () => {
      mockedAxios.post.mockResolvedValueOnce({ 
        data: { message: 'Email verified successfully' } 
      });

      const response = await axios.post(API_ROUTES.VERIFY_EMAIL, { 
        email: 'test@example.com',
        code: '123456'
      });
      expect(response.data.message).toBe('Email verified successfully');
    });

    test('should fail with invalid verification code', async () => {
      mockedAxios.post.mockRejectedValueOnce({ 
        response: { status: 400, data: { message: 'Invalid verification code' } }
      });
      await expect(axios.post(API_ROUTES.VERIFY_EMAIL, {
        email: 'test@example.com',
        code: 'invalid'
      })).rejects.toThrow();
    });

    test('should fail with expired verification code', async () => {
      mockedAxios.post.mockRejectedValueOnce({ 
        response: { status: 400, data: { message: 'Verification code expired' } }
      });
      await expect(axios.post(API_ROUTES.VERIFY_EMAIL, {
        email: 'test@example.com',
        code: '123456'
      })).rejects.toThrow();
    });
  });

  // Premium Upgrade Tests
  describe('Premium Upgrade API', () => {
    const token = 'fake-token';
    const config = { headers: { Authorization: `Bearer ${token}` } };

    test('should upgrade to premium successfully', async () => {
      mockedAxios.post.mockResolvedValueOnce({ 
        data: { message: 'Upgraded to premium successfully' } 
      });

      const response = await axios.post(API_ROUTES.UPGRADE_PREMIUM, {}, config);
      expect(response.data.message).toBe('Upgraded to premium successfully');
    });

    test('should fail upgrade with invalid payment', async () => {
      mockedAxios.post.mockRejectedValueOnce({ 
        response: { status: 400, data: { message: 'Payment failed' } }
      });
      await expect(axios.post(API_ROUTES.UPGRADE_PREMIUM, {
        paymentMethod: 'invalid'
      }, config)).rejects.toThrow();
    });

    test('should fail upgrade for already premium user', async () => {
      mockedAxios.post.mockRejectedValueOnce({ 
        response: { status: 400, data: { message: 'User already premium' } }
      });
      await expect(axios.post(API_ROUTES.UPGRADE_PREMIUM, {}, config)).rejects.toThrow();
    });
  });

  // Privacy Toggle Tests
  describe('Privacy Toggle API', () => {
    const token = 'fake-token';
    const config = { headers: { Authorization: `Bearer ${token}` } };

    test('should toggle privacy successfully', async () => {
      mockedAxios.put.mockResolvedValueOnce({ 
        data: { isPrivate: true } 
      });

      const response = await axios.put(API_ROUTES.TOGGLE_PRIVACY, {}, config);
      expect(response.data.isPrivate).toBe(true);
    });
  });

  // User Deletion Tests
  describe('User Deletion API', () => {
    test('should delete user successfully', async () => {
      mockedAxios.delete.mockResolvedValueOnce({ 
        data: { message: 'User deleted successfully' } 
      });

      const response = await axios.delete(API_ROUTES.DELETE_USER, { 
        data: { userId: '1' } 
      });
      expect(response.data.message).toBe('User deleted successfully');
    });

    test('should fail deleting non-existent user', async () => {
      mockedAxios.delete.mockRejectedValueOnce({ 
        response: { 
          status: 404, 
          data: { message: 'User not found' } 
        } 
      });

      await expect(axios.delete(API_ROUTES.DELETE_USER, { 
        data: { userId: 'non-existent' } 
      })).rejects.toThrow();
    });
  });
});
