import React, { useState } from 'react';

import API from '../api';

function SendsesEmail() {
  const [form, setForm] = useState({ to: '', subject: '', text: '' });
  const [status, setStatus] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('Sending...');
    try {
      const res = await API.post('/auth/send-ses-email', form); // Adjust if route is different
        
      setStatus(res.data.message);
    } catch (err) {
      console.error(err);
      setStatus('Failed to send email.');
    }
  };

  return (
    <div>
      <h2>Send Email</h2>
      <form onSubmit={handleSubmit}>
        <input type="email" name="to" placeholder="Recipient" value={form.to} onChange={handleChange} required />
        <input type="text" name="subject" placeholder="Subject" value={form.subject} onChange={handleChange} required />
        <textarea name="text" placeholder="Message" value={form.text} onChange={handleChange} required />
        <button type="submit">Send</button>
      </form>
      <p>{status}</p>
    </div>
  );
}

export default SendsesEmail;
