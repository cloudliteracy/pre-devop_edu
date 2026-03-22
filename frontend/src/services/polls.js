import axios from 'axios';

const API_URL = 'http://localhost:5000/api/polls';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const getPolls = async (status = '') => {
  const url = status ? `${API_URL}?status=${status}` : API_URL;
  const response = await axios.get(url);
  return response.data;
};

export const createPoll = async (question, options, duration) => {
  const response = await axios.post(API_URL, { question, options, duration }, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const votePoll = async (pollId, optionIndex) => {
  const response = await axios.post(`${API_URL}/${pollId}/vote`, { optionIndex }, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const deletePoll = async (pollId) => {
  const response = await axios.delete(`${API_URL}/${pollId}`, {
    headers: getAuthHeader()
  });
  return response.data;
};
