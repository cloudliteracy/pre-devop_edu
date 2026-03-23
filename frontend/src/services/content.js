import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const uploadVideo = async (moduleId, videoFile) => {
  const formData = new FormData();
  formData.append('video', videoFile);

  const response = await axios.post(`${API_URL}/content/${moduleId}/video`, formData, {
    headers: {
      ...getAuthHeader(),
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};

export const uploadMarkdown = async (moduleId, markdownFile) => {
  const formData = new FormData();
  formData.append('markdown', markdownFile);

  const response = await axios.post(`${API_URL}/content/${moduleId}/markdown`, formData, {
    headers: {
      ...getAuthHeader(),
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};

export const uploadImages = async (moduleId, imageFiles) => {
  const formData = new FormData();
  imageFiles.forEach(file => {
    formData.append('images', file);
  });

  const response = await axios.post(`${API_URL}/content/${moduleId}/images`, formData, {
    headers: {
      ...getAuthHeader(),
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};

export const getModuleContent = async (moduleId) => {
  const response = await axios.get(`${API_URL}/content/${moduleId}`, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const toggleUploadAccess = async (adminId) => {
  const response = await axios.put(`${API_URL}/admin/admins/${adminId}/toggle-upload-access`, {}, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const markVideoComplete = async (moduleId) => {
  const response = await axios.post(`${API_URL}/progress/${moduleId}/video-complete`, {}, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const markMarkdownViewed = async (moduleId) => {
  const response = await axios.post(`${API_URL}/progress/${moduleId}/markdown-viewed`, {}, {
    headers: getAuthHeader()
  });
  return response.data;
};
