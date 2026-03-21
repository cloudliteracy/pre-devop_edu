import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { moduleAPI, paymentAPI } from '../services/api';

const ModuleDetail = () => {
  const { id } = useParams();
  const [module, setModule] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  useEffect(() => {
    const fetchModule = async () => {
      try {
        const { data } = await moduleAPI.getById(id);
        setModule(data);
      } catch (error) {
        console.error('Error:', error);
      }
    };
    fetchModule();
  }, [id]);

  const handlePayment = async () => {
    try {
      const { data } = await paymentAPI.initiate({
        moduleId: id,
        paymentMethod,
        phoneNumber
      });
      alert('Payment initiated: ' + JSON.stringify(data));
    } catch (error) {
      alert('Payment failed: ' + error.response?.data?.message);
    }
  };

  if (!module) return <div>Loading...</div>;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h1>{module.title}</h1>
      <p>{module.description}</p>
      <h2>Price: {module.price} XAF</h2>

      <div style={{ marginTop: '30px' }}>
        <h3>Select Payment Method</h3>
        <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} style={{ padding: '10px', width: '100%' }}>
          <option value="">Choose payment method</option>
          <option value="mtn_momo">MTN Mobile Money</option>
          <option value="orange_money">Orange Money</option>
          <option value="stripe">Visa/Mastercard</option>
          <option value="paypal">PayPal</option>
        </select>

        {(paymentMethod === 'mtn_momo' || paymentMethod === 'orange_money') && (
          <input
            type="tel"
            placeholder="Phone Number (e.g., 237XXXXXXXXX)"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            style={{ padding: '10px', width: '100%', marginTop: '10px' }}
          />
        )}

        <button
          onClick={handlePayment}
          disabled={!paymentMethod}
          style={{ padding: '15px 30px', background: '#28a745', color: 'white', border: 'none', marginTop: '20px', width: '100%' }}
        >
          Pay Now
        </button>
      </div>

      <div style={{ marginTop: '40px' }}>
        <h3>Module Content</h3>
        <p>PDFs: {module.pdfs?.length || 0}</p>
        <p>Videos: {module.videos?.length || 0}</p>
        <p>Quiz Questions: {module.quiz?.questions?.length || 0}</p>
      </div>
    </div>
  );
};

export default ModuleDetail;
