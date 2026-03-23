import axios from 'axios';

const API_URL = 'http://localhost:5000/api/admin';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const toggleSurveyAnalyticsAccess = async (adminId) => {
  const response = await axios.put(`${API_URL}/admins/${adminId}/toggle-survey-analytics-access`, {}, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const getSurveyAnalytics = async () => {
  const response = await axios.get(`${API_URL}/survey-analytics`, {
    headers: getAuthHeader()
  });
  return response.data;
};
