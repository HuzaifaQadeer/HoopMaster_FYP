const API_BASE_URL = 'https://nodeapp.loca.lt';
const AI_API_URL = 'https://flaskapp.loca.lt';

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
  CHATBOT_QUERY: `${AI_API_URL}/api/chat`,
  GET_ALL_DRILLS: `${API_BASE_URL}/drills/all`,
  GET_POPULAR_DRILLS: `${API_BASE_URL}/drills/popular`,
  GET_DRILL_BY_ID: `${API_BASE_URL}/drills`,
};

export default {
  API_BASE_URL,
  API_ROUTES,
};
