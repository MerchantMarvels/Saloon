import React, { useState } from 'react';
import API from '../api';
import { useNavigate } from 'react-router-dom';

function EmployeeLogin() {
  const [form, setForm] = useState({ email: '', password: '' });
  const navigate = useNavigate();

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post('/auth/employee-login', form); // ← Your API endpoint

      const { token, employee } = res.data;

      // Store token and simplified employee details
      localStorage.setItem('token', token);
      localStorage.setItem(
        'user',
        JSON.stringify({
          id: employee.id,
          name: employee.name,
          email: employee.email,
          business_id: employee.business_id,
          role: 'employee',
        })
      );

      alert('Employee login successful');
      navigate('/'); // Redirect to the dashboard
    } catch (err) {
      alert('Login failed: ' + (err.response?.data?.error || 'Unknown error'));
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Employee Login</h2>
      <input
        name="email"
        type="email"
        placeholder="Email"
        value={form.email}
        onChange={handleChange}
        required
      />
      <input
        name="password"
        type="password"
        placeholder="Password"
        value={form.password}
        onChange={handleChange}
        required
      />
      <button type="submit">Login</button>
    </form>
  );
}

export default EmployeeLogin;
