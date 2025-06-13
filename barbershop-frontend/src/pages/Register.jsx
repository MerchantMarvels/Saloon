import React, { useState } from 'react';
import API from '../api';
import { useNavigate } from 'react-router-dom';

function Register() {
  const [form, setForm] = useState({ name: '', bname: '', email: '', password: '', role: 'admin' });
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Send the form data to the server, without the business_id
      await API.post('/auth/register', form);
      alert('Registration successful');
      navigate('/login');
    } catch (err) {
      console.error('Register error:', err); // Log full error
      alert('Error: ' + (err.response?.data?.error || 'Unknown error'));
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Register</h2>
      <input name="name" placeholder="Name" onChange={handleChange} />
      <input name="bname" placeholder="Business Name" onChange={handleChange} />
      <input name="email" type="email" placeholder="Email" onChange={handleChange} />
      <input name="password" type="password" placeholder="Password" onChange={handleChange} />
      <select name="role" onChange={handleChange}>
        <option value="admin">Admin</option>
        <option value="employee">Employee</option>
      </select>
      <button type="submit">Register</button>
    </form>
  );
}

export default Register;
