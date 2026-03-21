import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div style={{ textAlign: 'center', padding: '50px' }}>
      <h1>Welcome to CloudLiteracy</h1>
      <h2>Master DevOps - One Module at a Time</h2>
      <p style={{ fontSize: '18px', margin: '30px 0' }}>
        Learn DevOps with our comprehensive 7-module course. Each module includes PDFs, videos, and quizzes.
      </p>
      <div style={{ marginTop: '40px' }}>
        <Link to="/modules">
          <button style={{ padding: '15px 40px', fontSize: '18px', background: '#007bff', color: 'white', border: 'none', borderRadius: '5px', marginRight: '10px' }}>
            Browse Modules
          </button>
        </Link>
        <Link to="/login">
          <button style={{ padding: '15px 40px', fontSize: '18px', background: '#28a745', color: 'white', border: 'none', borderRadius: '5px' }}>
            Login
          </button>
        </Link>
      </div>
    </div>
  );
};

export default Home;
