import React, { useState } from 'react';

const FileUploadQuestion = ({ questionIndex, allowedFileTypes, onFilesChange, onLinksChange }) => {
  const [files, setFiles] = useState([]);
  const [links, setLinks] = useState(['']);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = (newFiles) => {
    const validFiles = newFiles.filter(file => {
      const isPdf = file.type === 'application/pdf';
      const isVideo = file.type.startsWith('video/');
      
      if (allowedFileTypes.includes('pdf') && isPdf) return true;
      if (allowedFileTypes.includes('video') && isVideo) return true;
      
      return false;
    });

    if (validFiles.length !== newFiles.length) {
      alert('Some files were rejected. Only PDFs and videos are allowed.');
    }

    const updatedFiles = [...files, ...validFiles];
    setFiles(updatedFiles);
    onFilesChange(questionIndex, updatedFiles);
  };

  const removeFile = (index) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    setFiles(updatedFiles);
    onFilesChange(questionIndex, updatedFiles);
  };

  const handleLinkChange = (index, value) => {
    const updatedLinks = [...links];
    updatedLinks[index] = value;
    setLinks(updatedLinks);
    onLinksChange(questionIndex, updatedLinks.filter(l => l.trim()));
  };

  const addLinkField = () => {
    setLinks([...links, '']);
  };

  const removeLinkField = (index) => {
    const updatedLinks = links.filter((_, i) => i !== index);
    setLinks(updatedLinks);
    onLinksChange(questionIndex, updatedLinks.filter(l => l.trim()));
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div style={styles.container}>
      {/* File Upload Section */}
      {(allowedFileTypes.includes('pdf') || allowedFileTypes.includes('video')) && (
        <div style={styles.uploadSection}>
          <div
            style={{
              ...styles.dropZone,
              ...(dragActive ? styles.dropZoneActive : {})
            }}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div style={styles.dropZoneContent}>
              <span style={styles.uploadIcon}>📁</span>
              <p style={styles.dropZoneText}>Drag & drop files here</p>
              <p style={styles.dropZoneSubtext}>or</p>
              <label style={styles.browseButton}>
                Browse Files
                <input
                  type="file"
                  multiple
                  accept={
                    allowedFileTypes.includes('pdf') && allowedFileTypes.includes('video')
                      ? '.pdf,video/*'
                      : allowedFileTypes.includes('pdf')
                      ? '.pdf'
                      : 'video/*'
                  }
                  onChange={handleFileInput}
                  style={styles.fileInput}
                />
              </label>
              <p style={styles.fileTypes}>
                Allowed: {allowedFileTypes.includes('pdf') && 'PDF'}{allowedFileTypes.includes('pdf') && allowedFileTypes.includes('video') && ', '}
                {allowedFileTypes.includes('video') && 'Video'} (Max 50MB)
              </p>
            </div>
          </div>

          {files.length > 0 && (
            <div style={styles.filesList}>
              {files.map((file, index) => (
                <div key={index} style={styles.fileItem}>
                  <span style={styles.fileIcon}>
                    {file.type === 'application/pdf' ? '📄' : '🎥'}
                  </span>
                  <div style={styles.fileInfo}>
                    <div style={styles.fileName}>{file.name}</div>
                    <div style={styles.fileSize}>{formatFileSize(file.size)}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    style={styles.removeButton}
                  >
                    ✖
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* External Links Section */}
      {allowedFileTypes.includes('link') && (
        <div style={styles.linksSection}>
          <h5 style={styles.sectionTitle}>External Links</h5>
          {links.map((link, index) => (
            <div key={index} style={styles.linkInput}>
              <input
                type="url"
                placeholder="https://example.com"
                value={link}
                onChange={(e) => handleLinkChange(index, e.target.value)}
                style={styles.input}
              />
              {links.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeLinkField(index)}
                  style={styles.removeLinkButton}
                >
                  ✖
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addLinkField}
            style={styles.addLinkButton}
          >
            + Add Another Link
          </button>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  uploadSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  dropZone: {
    border: '2px dashed #FFD700',
    borderRadius: '10px',
    padding: '30px',
    textAlign: 'center',
    backgroundColor: '#0d0d0d',
    transition: 'all 0.3s',
    cursor: 'pointer'
  },
  dropZoneActive: {
    backgroundColor: '#1a1a1a',
    borderColor: '#fff',
    transform: 'scale(1.02)'
  },
  dropZoneContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px'
  },
  uploadIcon: {
    fontSize: '48px'
  },
  dropZoneText: {
    color: '#FFD700',
    fontSize: '16px',
    fontWeight: 'bold',
    margin: 0
  },
  dropZoneSubtext: {
    color: '#999',
    fontSize: '14px',
    margin: 0
  },
  browseButton: {
    padding: '10px 20px',
    backgroundColor: '#FFD700',
    color: '#000',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s'
  },
  fileInput: {
    display: 'none'
  },
  fileTypes: {
    color: '#666',
    fontSize: '12px',
    margin: 0
  },
  filesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  fileItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    backgroundColor: '#1a1a1a',
    border: '1px solid #333',
    borderRadius: '8px'
  },
  fileIcon: {
    fontSize: '24px'
  },
  fileInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  fileName: {
    color: '#FFD700',
    fontSize: '14px',
    fontWeight: '500'
  },
  fileSize: {
    color: '#999',
    fontSize: '12px'
  },
  removeButton: {
    padding: '6px 10px',
    backgroundColor: '#ff4444',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    fontSize: '12px',
    cursor: 'pointer',
    transition: 'all 0.3s'
  },
  linksSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  sectionTitle: {
    color: '#FFD700',
    fontSize: '14px',
    fontWeight: 'bold',
    margin: 0
  },
  linkInput: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center'
  },
  input: {
    flex: 1,
    padding: '10px',
    backgroundColor: '#0d0d0d',
    border: '1px solid #333',
    borderRadius: '6px',
    color: '#fff',
    fontSize: '14px'
  },
  removeLinkButton: {
    padding: '8px 12px',
    backgroundColor: '#ff4444',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    fontSize: '12px',
    cursor: 'pointer'
  },
  addLinkButton: {
    padding: '10px',
    backgroundColor: '#4CAF50',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s'
  }
};

export default FileUploadQuestion;
