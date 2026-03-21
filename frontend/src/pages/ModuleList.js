import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { moduleAPI } from '../services/api';

const ModuleList = () => {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchModules = async () => {
      try {
        const { data } = await moduleAPI.getAll();
        setModules(data);
      } catch (error) {
        console.error('Error fetching modules:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchModules();
  }, []);

  if (loading) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading...</div>;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <h1>DevOps Learning Modules</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {modules.map((module) => (
          <div key={module._id} style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '8px' }}>
            <h3>Module {module.order}: {module.title}</h3>
            <p>{module.description}</p>
            <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#007bff' }}>{module.price} XAF</p>
            <Link to={`/module/${module._id}`}>
              <button style={{ padding: '10px 20px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}>
                View Module
              </button>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ModuleList;
