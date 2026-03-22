import axios from 'axios';

const API_URL = 'http://localhost:5000/api/comments';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const getComments = async (page = 1) => {
  const response = await axios.get(`${API_URL}?page=${page}`);
  return response.data;
};

export const createComment = async (content, files) => {
  const formData = new FormData();
  if (content) formData.append('content', content);
  
  if (files && files.length > 0) {
    files.forEach(file => {
      formData.append('files', file);
    });
  }

  const response = await axios.post(API_URL, formData, {
    headers: {
      ...getAuthHeader(),
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};

export const replyToComment = async (commentId, content, files) => {
  const formData = new FormData();
  if (content) formData.append('content', content);
  
  if (files && files.length > 0) {
    files.forEach(file => {
      formData.append('files', file);
    });
  }

  const response = await axios.post(`${API_URL}/${commentId}/reply`, formData, {
    headers: {
      ...getAuthHeader(),
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};

export const editComment = async (commentId, content) => {
  const response = await axios.put(`${API_URL}/${commentId}`, { content }, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const deleteComment = async (commentId) => {
  const response = await axios.delete(`${API_URL}/${commentId}`, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const addReaction = async (commentId, emoji) => {
  const response = await axios.post(`${API_URL}/${commentId}/reaction`, { emoji }, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const removeReaction = async (commentId) => {
  const response = await axios.delete(`${API_URL}/${commentId}/reaction`, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const getChatSettings = async () => {
  const response = await axios.get(`${API_URL}/settings/status`);
  return response.data;
};

export const toggleChat = async () => {
  const response = await axios.post(`${API_URL}/settings/toggle`, {}, {
    headers: getAuthHeader()
  });
  return response.data;
};
