import React, { useEffect, useState } from 'react';

function Index() {
  const [token, setToken] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Get token from localStorage
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken) setToken(storedToken);
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <h1>Welcome to the Dashboard</h1>

      {token ? (
        <>
          <p><strong>Your token:</strong></p>
          <pre>{token}</pre>
        </>
      ) : (
        <p>No token found</p>
      )}

      {user ? (
        <div style={{ marginTop: '20px' }}>
          <h2>User Info</h2>
          <p><strong>Name:</strong> {user.name}</p>
          <p><strong>Business ID:</strong> {user.business_id}</p>
          <p><strong>Business Name:</strong> {user.business_name}</p>
          <p><strong> Role :</strong> {user.role}</p>
        </div>
      ) : (
        <p>No user info found</p>
      )}
    </div>
  );
}

export default Index;
