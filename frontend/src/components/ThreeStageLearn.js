import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import * as contentService from '../services/content';
import QuizTaking from './QuizTaking';
import CertificateModal from './CertificateModal';
import './ThreeStageLearn.css';

const ThreeStageLearn = ({ moduleId, progress, onProgressUpdate }) => {
  const [currentStage, setCurrentStage] = useState(1);
  const [moduleContent, setModuleContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCertificate, setShowCertificate] = useState(false);
  const [certificateId, setCertificateId] = useState(null);

  useEffect(() => {
    loadContent();
    determineCurrentStage();
  }, [moduleId, progress]);

  const loadContent = async () => {
    try {
      const content = await contentService.getModuleContent(moduleId);
      setModuleContent(content);
    } catch (error) {
      console.error('Error loading content:', error);
    } finally {
      setLoading(false);
    }
  };

  const determineCurrentStage = () => {
    if (!progress?.videoCompleted) {
      setCurrentStage(1);
    } else if (!progress?.markdownViewed) {
      setCurrentStage(2);
    } else {
      setCurrentStage(3);
    }
  };

  const handleVideoComplete = async () => {
    try {
      await contentService.markVideoComplete(moduleId);
      onProgressUpdate();
      setCurrentStage(2);
    } catch (error) {
      alert('Error marking video complete');
    }
  };

  const handleMarkdownComplete = async () => {
    try {
      await contentService.markMarkdownViewed(moduleId);
      onProgressUpdate();
      setCurrentStage(3);
    } catch (error) {
      alert('Error marking practice complete');
    }
  };

  const handleQuizComplete = (result) => {
    onProgressUpdate();
    if (result.passed && result.certificateId) {
      setCertificateId(result.certificateId);
      setShowCertificate(true);
    }
  };

  const isStageUnlocked = (stage) => {
    if (stage === 1) return true;
    if (stage === 2) return progress?.videoCompleted;
    if (stage === 3) return progress?.videoCompleted && progress?.markdownViewed;
    return false;
  };

  if (loading) {
    return <div className="stage-loading">Loading module content...</div>;
  }

  return (
    <div className="three-stage-container">
      {/* Stage Progress Indicator */}
      <div className="stage-progress">
        <div className={`stage-indicator ${currentStage >= 1 ? 'active' : ''} ${progress?.videoCompleted ? 'completed' : ''}`}>
          <div className="stage-number">1</div>
          <div className="stage-label">Video</div>
          {progress?.videoCompleted && <div className="stage-check">✓</div>}
        </div>
        <div className="stage-connector"></div>
        <div className={`stage-indicator ${currentStage >= 2 ? 'active' : ''} ${progress?.markdownViewed ? 'completed' : ''}`}>
          <div className="stage-number">2</div>
          <div className="stage-label">Practice</div>
          {progress?.markdownViewed && <div className="stage-check">✓</div>}
        </div>
        <div className="stage-connector"></div>
        <div className={`stage-indicator ${currentStage >= 3 ? 'active' : ''} ${progress?.quizCompleted ? 'completed' : ''}`}>
          <div className="stage-number">3</div>
          <div className="stage-label">Quiz</div>
          {progress?.quizCompleted && <div className="stage-check">✓</div>}
        </div>
      </div>

      {/* Stage 1: Video */}
      <div className={`stage-section ${currentStage === 1 ? 'active' : ''} ${!isStageUnlocked(1) ? 'locked' : ''}`}>
        <div className="stage-header">
          <h2>📹 Stage 1: Watch Video</h2>
          {isStageUnlocked(1) ? (
            <span className="stage-status unlocked">Unlocked</span>
          ) : (
            <span className="stage-status locked">🔒 Locked</span>
          )}
        </div>

        {isStageUnlocked(1) ? (
          <div className="stage-content">
            {moduleContent?.videoUrl ? (
              <>
                <video controls className="module-video" key={moduleContent.videoUrl}>
                  <source src={`http://localhost:5000${moduleContent.videoUrl}`} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
                {!progress?.videoCompleted && (
                  <button onClick={handleVideoComplete} className="complete-btn">
                    ✓ Mark Video as Complete
                  </button>
                )}
                {progress?.videoCompleted && (
                  <div className="completed-badge">✅ Video Completed</div>
                )}
              </>
            ) : (
              <div className="no-content">No video available for this module yet.</div>
            )}
          </div>
        ) : (
          <div className="locked-overlay">
            <div className="locked-message">
              <span className="lock-icon">🔒</span>
              <p>Complete previous stage to unlock</p>
            </div>
          </div>
        )}
      </div>

      {/* Stage 2: Hands-On Practice (Markdown) */}
      <div className={`stage-section ${currentStage === 2 ? 'active' : ''} ${!isStageUnlocked(2) ? 'locked' : ''}`}>
        <div className="stage-header">
          <h2>💻 Stage 2: Hands-On Practice</h2>
          {isStageUnlocked(2) ? (
            <span className="stage-status unlocked">Unlocked</span>
          ) : (
            <span className="stage-status locked">🔒 Locked</span>
          )}
        </div>

        {isStageUnlocked(2) ? (
          <div className="stage-content">
            {/* Dual Screen Notice */}
            <div className="dual-screen-notice">
              <div className="notice-icon">💻 + 🖥️</div>
              <div className="notice-content">
                <h3>RECOMMENDED SETUP</h3>
                <p>For optimal learning experience:</p>
                <ul>
                  <li><strong>Laptop:</strong> View these step-by-step instructions</li>
                  <li><strong>Monitor:</strong> Practice and follow along with the demo</li>
                </ul>
                <p className="notice-tip">This dual-screen setup allows you to learn with ease and flexibility without switching windows.</p>
              </div>
            </div>

            {moduleContent?.markdownContent ? (
              <>
                <div className="markdown-content">
                  <ReactMarkdown
                    components={{
                      code({ node, inline, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || '');
                        return !inline && match ? (
                          <div className="code-block-wrapper">
                            <div className="code-block-header">
                              <span className="code-language">{match[1]}</span>
                              <button
                                className="copy-code-btn"
                                onClick={() => {
                                  navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
                                  alert('Code copied to clipboard!');
                                }}
                              >
                                📋 Copy
                              </button>
                            </div>
                            <SyntaxHighlighter
                              style={vscDarkPlus}
                              language={match[1]}
                              PreTag="div"
                              {...props}
                            >
                              {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                          </div>
                        ) : (
                          <code className={className} {...props}>
                            {children}
                          </code>
                        );
                      },
                      img({ src, alt }) {
                        // Handle relative image paths
                        const imageSrc = src.startsWith('http') ? src : `http://localhost:5000${src}`;
                        return <img src={imageSrc} alt={alt} className="markdown-image" />;
                      }
                    }}
                  >
                    {moduleContent.markdownContent}
                  </ReactMarkdown>
                </div>
                {!progress?.markdownViewed && (
                  <button onClick={handleMarkdownComplete} className="complete-btn">
                    ✓ I've Completed the Practice
                  </button>
                )}
                {progress?.markdownViewed && (
                  <div className="completed-badge">✅ Practice Completed</div>
                )}
              </>
            ) : (
              <div className="no-content">No practice content available for this module yet.</div>
            )}
          </div>
        ) : (
          <div className="locked-overlay">
            <div className="locked-message">
              <span className="lock-icon">🔒</span>
              <p>Complete Stage 1 (Video) to unlock</p>
            </div>
          </div>
        )}
      </div>

      {/* Stage 3: Quiz */}
      <div className={`stage-section ${currentStage === 3 ? 'active' : ''} ${!isStageUnlocked(3) ? 'locked' : ''}`}>
        <div className="stage-header">
          <h2>📝 Stage 3: Take Quiz</h2>
          {isStageUnlocked(3) ? (
            <span className="stage-status unlocked">Unlocked</span>
          ) : (
            <span className="stage-status locked">🔒 Locked</span>
          )}
        </div>

        {isStageUnlocked(3) ? (
          <div className="stage-content">
            {moduleContent?.quiz?.questions?.length > 0 ? (
              <QuizTaking 
                quiz={moduleContent.quiz} 
                moduleId={moduleId}
                onQuizComplete={handleQuizComplete}
              />
            ) : (
              <div className="no-content">No quiz available for this module yet.</div>
            )}
          </div>
        ) : (
          <div className="locked-overlay">
            <div className="locked-message">
              <span className="lock-icon">🔒</span>
              <p>Complete Stage 2 (Practice) to unlock</p>
            </div>
          </div>
        )}
      </div>

      {showCertificate && certificateId && (
        <CertificateModal 
          certificateId={certificateId}
          onClose={() => setShowCertificate(false)}
        />
      )}
    </div>
  );
};

export default ThreeStageLearn;
