import React from 'react';

const ProgressBar = ({ progress, totals }) => {
  const { completionPercentage, videosWatched, pdfsDownloaded, quizCompleted } = progress;
  
  const getColor = (percentage) => {
    if (percentage < 30) return '#ff4444';
    if (percentage < 70) return '#FFD700';
    return '#4CAF50';
  };

  const color = getColor(completionPercentage);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>Your Progress</h3>
        <div style={styles.circularProgress}>
          <svg width="120" height="120" style={styles.svg}>
            <circle
              cx="60"
              cy="60"
              r="50"
              fill="none"
              stroke="#333"
              strokeWidth="10"
            />
            <circle
              cx="60"
              cy="60"
              r="50"
              fill="none"
              stroke={color}
              strokeWidth="10"
              strokeDasharray={`${2 * Math.PI * 50}`}
              strokeDashoffset={`${2 * Math.PI * 50 * (1 - completionPercentage / 100)}`}
              strokeLinecap="round"
              transform="rotate(-90 60 60)"
            />
          </svg>
          <div style={styles.percentageText}>
            <span style={{ ...styles.percentage, color }}>{completionPercentage}%</span>
          </div>
        </div>
      </div>

      <div style={styles.breakdown}>
        <div style={styles.item}>
          <span style={styles.icon}>🎥</span>
          <div style={styles.itemContent}>
            <span style={styles.itemLabel}>Videos Watched</span>
            <div style={styles.progressBarContainer}>
              <div 
                style={{
                  ...styles.progressBarFill,
                  width: `${totals.videos > 0 ? (videosWatched.length / totals.videos) * 100 : 0}%`,
                  backgroundColor: '#FFD700'
                }}
              />
            </div>
            <span style={styles.itemValue}>{videosWatched.length} / {totals.videos}</span>
          </div>
        </div>

        <div style={styles.item}>
          <span style={styles.icon}>📄</span>
          <div style={styles.itemContent}>
            <span style={styles.itemLabel}>PDFs Downloaded</span>
            <div style={styles.progressBarContainer}>
              <div 
                style={{
                  ...styles.progressBarFill,
                  width: `${totals.pdfs > 0 ? (pdfsDownloaded.length / totals.pdfs) * 100 : 0}%`,
                  backgroundColor: '#FFD700'
                }}
              />
            </div>
            <span style={styles.itemValue}>{pdfsDownloaded.length} / {totals.pdfs}</span>
          </div>
        </div>

        <div style={styles.item}>
          <span style={styles.icon}>✅</span>
          <div style={styles.itemContent}>
            <span style={styles.itemLabel}>Quiz</span>
            <span style={{
              ...styles.badge,
              backgroundColor: quizCompleted ? '#4CAF50' : '#333',
              color: quizCompleted ? '#fff' : '#999'
            }}>
              {quizCompleted ? `Completed (${progress.quizScore}%)` : 'Not Completed'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    backgroundColor: '#1a1a1a',
    border: '1px solid #FFD700',
    borderRadius: '15px',
    padding: '30px',
    marginBottom: '30px',
    boxShadow: '0 4px 15px rgba(255, 215, 0, 0.2)'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
    flexWrap: 'wrap',
    gap: '20px'
  },
  title: {
    color: '#FFD700',
    fontSize: '24px',
    fontWeight: 'bold',
    margin: 0
  },
  circularProgress: {
    position: 'relative',
    width: '120px',
    height: '120px'
  },
  svg: {
    transform: 'rotate(0deg)'
  },
  percentageText: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    textAlign: 'center'
  },
  percentage: {
    fontSize: '28px',
    fontWeight: 'bold'
  },
  breakdown: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    backgroundColor: '#0d0d0d',
    padding: '15px',
    borderRadius: '10px',
    border: '1px solid #333'
  },
  icon: {
    fontSize: '32px'
  },
  itemContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  itemLabel: {
    color: '#999',
    fontSize: '14px'
  },
  itemValue: {
    color: '#FFD700',
    fontSize: '16px',
    fontWeight: 'bold'
  },
  progressBarContainer: {
    width: '100%',
    height: '8px',
    backgroundColor: '#333',
    borderRadius: '4px',
    overflow: 'hidden'
  },
  progressBarFill: {
    height: '100%',
    transition: 'width 0.3s ease',
    borderRadius: '4px'
  },
  badge: {
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    alignSelf: 'flex-start'
  }
};

export default ProgressBar;
