import React, { useState } from 'react';
import API from '../api';

import './resetPassword.css'; // use the provided CSS below

export default function ResetPasswordRequest() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('Sending...');
    try {
      const res = await API.post('/auth/request-reset', { email });
      setStatus(res.data.message);
    } catch (error) {
      setStatus(error.response?.data?.error || 'Error sending reset link');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <p className="msg">Reset Password</p>
      <input
        type="email"
        name="email"
        required
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <button type="submit">Submit</button>
      <a href="/login" className="forgot">Cancel</a>
      <p>{status}</p>
    </form>
  );
}
