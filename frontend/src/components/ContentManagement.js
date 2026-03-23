import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as contentService from '../services/content';
import QuizBuilder from './QuizBuilder';

const ContentManagement = ({ user }) => {
  const [modules, setModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [markdownFile, setMarkdownFile] = useState(null);
  const [imageFiles, setImageFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [showQuizBuilder, setShowQuizBuilder] = useState(false);

  useEffect(() => {
    loadModules();
  }, []);

  const loadModules = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/modules', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setModules(response.data);
    } catch (error) {
      console.error('Error loading modules:', error);
    }
  };

  const handleVideoUpload = async () => {
    if (!videoFile || !selectedModule) return;

    try {
      setUploading(true);
      await contentService.uploadVideo(selectedModule, videoFile);
      alert('Video uploaded successfully!');
      setVideoFile(null);
    } catch (error) {
      alert(error.response?.data?.message || 'Error uploading video');
    } finally {
      setUploading(false);
    }
  };

  const handleMarkdownUpload = async () => {
    if (!markdownFile || !selectedModule) return;

    try {
      setUploading(true);
      await contentService.uploadMarkdown(selectedModule, markdownFile);
      alert('Markdown uploaded successfully!');
      setMarkdownFile(null);
    } catch (error) {
      alert(error.response?.data?.message || 'Error uploading markdown');
    } finally {
      setUploading(false);
    }
  };

  const handleImagesUpload = async () => {
    if (imageFiles.length === 0 || !selectedModule) return;

    try {
      setUploading(true);
      const result = await contentService.uploadImages(selectedModule, imageFiles);
      alert(`${result.images.length} images uploaded successfully!`);
      setImageFiles([]);
    } catch (error) {
      alert(error.response?.data?.message || 'Error uploading images');
    } finally {
      setUploading(false);
    }
  };

  const canUpload = user?.isSuperAdmin || user?.canUploadContent;

  if (!canUpload) {
    return (
      <div style={styles.noAccess}>
        <h3>⚠️ Content Upload Access Required</h3>
        <p>Contact the super admin to request content upload permissions.</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Content Management</h2>
      <p style={styles.subtitle}>Upload videos, markdown guides, and images for modules</p>

      <div style={styles.moduleSelector}>
        <label style={styles.label}>Select Module:</label>
        <select
          value={selectedModule || ''}
          onChange={(e) => setSelectedModule(e.target.value)}
          style={styles.select}
        >
          <option value="">-- Select a module --</option>
          {modules.map(module => (
            <option key={module._id} value={module._id}>
              {module.title}
            </option>
          ))}
        </select>
      </div>

      {selectedModule && (
        <>
          <div style={styles.uploadSection}>
            <h3 style={styles.sectionTitle}>📹 Upload Video</h3>
            <input
              type="file"
              accept="video/*"
              onChange={(e) => setVideoFile(e.target.files[0])}
              style={styles.fileInput}
            />
            {videoFile && <p style={styles.fileName}>{videoFile.name}</p>}
            <button
              onClick={handleVideoUpload}
              disabled={!videoFile || uploading}
              style={styles.uploadBtn}
            >
              {uploading ? 'Uploading...' : 'Upload Video'}
            </button>
          </div>

          <div style={styles.uploadSection}>
            <h3 style={styles.sectionTitle}>📝 Upload Markdown (.md)</h3>
            <input
              type="file"
              accept=".md"
              onChange={(e) => setMarkdownFile(e.target.files[0])}
              style={styles.fileInput}
            />
            {markdownFile && <p style={styles.fileName}>{markdownFile.name}</p>}
            <button
              onClick={handleMarkdownUpload}
              disabled={!markdownFile || uploading}
              style={styles.uploadBtn}
            >
              {uploading ? 'Uploading...' : 'Upload Markdown'}
            </button>
          </div>

          <div style={styles.uploadSection}>
            <h3 style={styles.sectionTitle}>🖼️ Upload Images (for markdown)</h3>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setImageFiles(Array.from(e.target.files))}
              style={styles.fileInput}
            />
            {imageFiles.length > 0 && (
              <p style={styles.fileName}>{imageFiles.length} images selected</p>
            )}
            <button
              onClick={handleImagesUpload}
              disabled={imageFiles.length === 0 || uploading}
              style={styles.uploadBtn}
            >
              {uploading ? 'Uploading...' : 'Upload Images'}
            </button>
          </div>

          <div style={styles.uploadSection}>
            <h3 style={styles.sectionTitle}>📝 Create/Edit Quiz</h3>
            <p style={styles.sectionDesc}>Build quiz questions with multiple choice options</p>
            <button
              onClick={() => setShowQuizBuilder(true)}
              style={styles.uploadBtn}
            >
              🎯 Open Quiz Builder
            </button>
          </div>
        </>
      )}

      {showQuizBuilder && (
        <QuizBuilder
          moduleId={selectedModule}
          onClose={() => setShowQuizBuilder(false)}
          onSave={() => {
            alert('Quiz saved! Learners can now take the quiz.');
          }}
        />
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: '20px'
  },
  title: {
    color: '#FFD700',
    marginBottom: '10px'
  },
  subtitle: {
    color: '#999',
    marginBottom: '30px'
  },
  noAccess: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#999'
  },
  moduleSelector: {
    marginBottom: '30px'
  },
  label: {
    color: '#FFD700',
    display: 'block',
    marginBottom: '10px',
    fontWeight: 'bold'
  },
  select: {
    width: '100%',
    padding: '12px',
    background: '#000',
    border: '2px solid #333',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '1rem'
  },
  uploadSection: {
    background: '#1a1a1a',
    padding: '25px',
    borderRadius: '12px',
    marginBottom: '20px',
    border: '2px solid #333'
  },
  sectionTitle: {
    color: '#FFD700',
    marginBottom: '15px'
  },
  sectionDesc: {
    color: '#999',
    fontSize: '0.9rem',
    marginBottom: '15px'
  },
  fileInput: {
    width: '100%',
    padding: '10px',
    background: '#000',
    border: '2px solid #333',
    borderRadius: '8px',
    color: '#fff',
    marginBottom: '10px'
  },
  fileName: {
    color: '#999',
    fontSize: '0.9rem',
    marginBottom: '10px'
  },
  uploadBtn: {
    background: '#FFD700',
    color: '#000',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '8px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '1rem'
  }
};

export default ContentManagement;
