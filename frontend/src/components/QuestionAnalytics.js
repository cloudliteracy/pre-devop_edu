import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import './QuestionAnalytics.css';

const QuestionAnalytics = ({ question, questionIndex }) => {
  const { questionText, questionType, options, responses } = question;

  // Calculate analytics for choice questions
  const getChoiceAnalytics = () => {
    const data = options.map((option, index) => {
      let count = 0;
      
      if (questionType === 'single') {
        count = responses.filter(r => r.answer === index).length;
      } else if (questionType === 'multiple') {
        count = responses.filter(r => Array.isArray(r.answer) && r.answer.includes(index)).length;
      }
      
      return {
        name: option.text.length > 20 ? option.text.substring(0, 20) + '...' : option.text,
        fullName: option.text,
        count
      };
    });
    
    return data;
  };

  // Get open-ended responses
  const getOpenEndedResponses = () => {
    return responses.map(r => ({
      userName: r.userId?.name || 'Anonymous',
      answer: r.answer,
      timestamp: new Date(r.timestamp).toLocaleString()
    }));
  };

  // Get file upload responses
  const getFileUploadResponses = () => {
    return responses.map(r => ({
      userName: r.userId?.name || 'Anonymous',
      files: r.files || [],
      timestamp: new Date(r.timestamp).toLocaleString()
    }));
  };

  const COLORS = ['#FFD700', '#FFA500', '#FF8C00', '#FF7F50', '#FF6347', '#FF4500', '#DC143C', '#C71585'];

  // Handle file upload questions
  if (questionType === 'file_upload') {
    const fileResponses = getFileUploadResponses();
    
    return (
      <div className="question-analytics">
        <h4 className="question-title">Q{questionIndex + 1}: {questionText}</h4>
        <div className="analytics-type">File Upload Question</div>
        <div className="response-count">{responses.length} Response{responses.length !== 1 ? 's' : ''}</div>
        
        {fileResponses.length > 0 ? (
          <div className="file-responses">
            {fileResponses.map((resp, index) => (
              <div key={index} className="response-item">
                <div className="response-header">
                  <span className="response-user">{resp.userName}</span>
                  <span className="response-time">{resp.timestamp}</span>
                </div>
                <div className="uploaded-files">
                  {resp.files.length > 0 ? (
                    resp.files.map((file, fIndex) => (
                      <div key={fIndex} className="file-item">
                        {file.fileType === 'link' ? (
                          <>
                            <span className="file-icon">🔗</span>
                            <a href={file.linkUrl} target="_blank" rel="noopener noreferrer" className="file-link">
                              {file.linkUrl}
                            </a>
                          </>
                        ) : (
                          <>
                            <span className="file-icon">{file.fileType === 'pdf' ? '📄' : '🎥'}</span>
                            <a href={`http://localhost:5000/${file.filePath}`} target="_blank" rel="noopener noreferrer" className="file-link">
                              {file.fileName}
                            </a>
                            <span className="file-size">({(file.fileSize / 1024 / 1024).toFixed(2)} MB)</span>
                          </>
                        )}
                      </div>
                    ))
                  ) : (
                    <span className="no-files">No files uploaded</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-responses">No responses yet</div>
        )}
      </div>
    );
  }

  if (questionType === 'open') {
    const openResponses = getOpenEndedResponses();
    
    return (
      <div className="question-analytics">
        <h4 className="question-title">Q{questionIndex + 1}: {questionText}</h4>
        <div className="analytics-type">Open-Ended Question</div>
        <div className="response-count">{responses.length} Response{responses.length !== 1 ? 's' : ''}</div>
        
        {openResponses.length > 0 ? (
          <div className="open-responses">
            {openResponses.map((resp, index) => (
              <div key={index} className="response-item">
                <div className="response-header">
                  <span className="response-user">{resp.userName}</span>
                  <span className="response-time">{resp.timestamp}</span>
                </div>
                <div className="response-text">{resp.answer}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-responses">No responses yet</div>
        )}
      </div>
    );
  }

  // Choice questions (single or multiple)
  const chartData = getChoiceAnalytics();
  const totalResponses = responses.length;

  // Calculate percentages for pie chart
  const pieData = chartData.map(item => ({
    name: item.fullName,
    value: item.count,
    percentage: totalResponses > 0 ? ((item.count / totalResponses) * 100).toFixed(1) : 0
  }));

  // Custom label renderer
  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, name, value, percentage, index }) => {
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 30;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    // Only show label if there's a value
    if (value === 0) return null;

    const label = `${name}: ${value} (${percentage}%)`;
    
    return (
      <text 
        x={x} 
        y={y} 
        fill="#FFD700"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize="14px"
        fontWeight="bold"
      >
        {label}
      </text>
    );
  };

  return (
    <div className="question-analytics">
      <h4 className="question-title">Q{questionIndex + 1}: {questionText}</h4>
      <div className="analytics-type">
        {questionType === 'single' ? 'Single Choice' : 'Multiple Choice'}
      </div>
      <div className="response-count">{totalResponses} Response{totalResponses !== 1 ? 's' : ''}</div>
      
      {totalResponses > 0 ? (
        <div className="pie-chart-wrapper">
          <ResponsiveContainer width="100%" height={500}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={true}
                label={renderCustomLabel}
                outerRadius={140}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value, name, props) => [`${value} responses (${props.payload.percentage}%)`, props.payload.name]}
                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #FFD700', borderRadius: '8px' }}
                labelStyle={{ color: '#FFD700' }}
                itemStyle={{ color: '#fff' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="no-responses">No responses yet</div>
      )}
    </div>
  );
};

export default QuestionAnalytics;
