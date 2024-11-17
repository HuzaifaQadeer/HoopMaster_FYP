const API_BASE_URL = 'https://16db-223-123-45-58.ngrok-free.app';

export const API_ROUTES = {
  REGISTER: `${API_BASE_URL}/users/register`,
  LOGIN: `${API_BASE_URL}/users/login`,
  LOGOUT: `${API_BASE_URL}/users/logout`,
  RESET_PASSWORD: `${API_BASE_URL}/users/reset-password`,
  GET_PROFILE: `${API_BASE_URL}/users/profile`,
  UPDATE_PROFILE: `${API_BASE_URL}/users/profile`,
  TOGGLE_PRIVACY: `${API_BASE_URL}/users/toggle-privacy`,
  UPGRADE_PREMIUM: `${API_BASE_URL}/users/upgrade-premium`,
  UPDATE_PROFILE_PICTURE: `${API_BASE_URL}/users/profile-picture`,
  UPDATE_HIGHLIGHT_VIDEO: `${API_BASE_URL}/users/highlight-video`,
  ADD_COURSE: `${API_BASE_URL}/users/courses`,
  UPDATE_COURSE_PROGRESS: `${API_BASE_URL}/users/courses/:courseId/progress`,
  ADD_ACHIEVEMENT: `${API_BASE_URL}/users/achievements`,
  SEND_VERIFICATION_EMAIL: `${API_BASE_URL}/users/send-verification-email`,
  VERIFY_EMAIL: `${API_BASE_URL}/users/verify-email`,
  CHECK_USER_EXISTS: `${API_BASE_URL}/users/check-user-exists`,
  DELETE_USER: `${API_BASE_URL}/users/delete-user`,
  GET_PROFILE_PICTURE: `${API_BASE_URL}/users/profilepicture`,
  GET_HIGHLIGHT_VIDEO: `${API_BASE_URL}/users/highlightvideo`,
  ADD_HIGHLIGHT_VIDEO: `${API_BASE_URL}/users/highlight-video`,
};

export default {
  API_BASE_URL,
  API_ROUTES,
};
