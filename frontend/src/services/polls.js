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

export const createPoll = async (title, questions, duration) => {
  const response = await axios.post(API_URL, { title, questions, duration }, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const updatePoll = async (pollId, title, questions) => {
  const response = await axios.put(`${API_URL}/${pollId}`, { title, questions }, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const votePoll = async (pollId, responses) => {
  const response = await axios.post(`${API_URL}/${pollId}/vote`, { responses }, {
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
