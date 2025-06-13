import React, { useState } from 'react';
import axios from 'axios';
import Button from '@mui/material/Button';
import SendIcon from '@mui/icons-material/Send';
import './sendEmail.css';

function ContactForm() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post('http://localhost:5000/api/email/send', {
        email,
        message,
      });
      alert('Email sent successfully!');
      setEmail('');
      setMessage('');
    } catch (error) {
      console.error('Send error:', error);
      alert('Error sending email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="contact__form" onSubmit={handleSubmit}>
      <input
        className="email__from"
        type="email"
        placeholder="Your email"
        value={email}
        required
        onChange={(e) => setEmail(e.target.value)}
      />
      <textarea
        className="message__box"
        placeholder="Your message"
        value={message}
        required
        onChange={(e) => setMessage(e.target.value)}
      />
      <Button
        variant="contained"
        type="submit"
        endIcon={<SendIcon />}
        disabled={loading}
        className="submit__btn"
      >
        {loading ? 'Sending...' : 'Send'}
      </Button>
    </form>
  );
}

export default ContactForm;
