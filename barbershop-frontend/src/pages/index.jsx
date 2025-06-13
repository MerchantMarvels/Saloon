import React, { useEffect, useState } from 'react';
import './index.css';
import { FaUserCircle } from 'react-icons/fa';
import Services from './service';
import Employees from './employee';
import { useNavigate } from 'react-router-dom';
import AllBookingsPage from './calendar';
import Dashboard from './dashboard'; // Assuming you have an Employees component
import Revenue from './Revenue';
import Products from './Products'; // Assuming you have a Products component
import Contacts from './Contacts'; // Assuming you have a Contacts component

function Index() {
  const [token, setToken] = useState('');
  const [user, setUser] = useState(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [activeView, setActiveView] = useState('dashboard');
  const navigate = useNavigate();

  // useEffect(() => {
  //   const storedToken = localStorage.getItem('token');
  //   const storedUser = localStorage.getItem('user');

  //   if (storedToken) setToken(storedToken);
  //   if (storedUser) setUser(JSON.parse(storedUser));

    
  // }, []);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken) setToken(storedToken);
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setUser(user);

      // Save role and id to localStorage
      localStorage.setItem('role', user.role);  // Ensure 'role' is saved
      localStorage.setItem('id', user.role === 'admin' ? user.id : user.business_id);  // Save 'businessId' for admin and 'employeeId' for employee
    }
  }, []); // Runs once when the component mounts

  const toggleUserDetails = () => setShowUserDetails(!showUserDetails);

  const handleLogout = () => {
    setToken('');
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };
  const handleDeatails = () => {
    navigate('/ubd');
  };

  const renderView = () => {
    switch (activeView) {
      case 'services': return <Services />;
      case 'team': return <Employees />;
      case 'calendar': return <AllBookingsPage />;
      case 'Revenue': return <Revenue />;
      case 'Products': return <Products />;
      case 'contacts': return <Contacts />; 
      default: return <Dashboard />;
    }
  };

  return (
    <div className="dashboard-container">
      <div className="top-bar">
        <div className="user-icon" onClick={toggleUserDetails}>
          <FaUserCircle size={24} />
        </div>
        {showUserDetails && user && (
          <div className="user-details">
            {user.role === 'admin' ? (
              <>
                <p><strong>Admin Name:</strong> {user.name}</p>
                <p><strong>Business ID:</strong> {user.id}</p>
                <p><strong>Business Name:</strong> {user.business_name}</p>
                <p><strong>Role:</strong> {user.role}</p>
              </>
            ) : (
              <>
                <p><strong>Employee ID:</strong> {user.id}</p>
                <p><strong>Name:</strong> {user.name}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Business ID:</strong> {user.business_id}</p>
                <p><strong>Role:</strong> {user.role}</p>
              </>
            )}
            <button onClick={handleLogout} className="logout-button">Logout</button>
            <button onClick={handleDeatails} className="logout-button">Update Details</button>
          </div>
        )}
      </div>

      <div className="main-layout">
        <div className="sidebar">
          <ul>
            <li onClick={() => setActiveView('dashboard')}>Dashboard</li>
            <li onClick={() => setActiveView('services')}>Services</li>
            <li onClick={() => setActiveView('calendar')}>Calendar</li>
            <li onClick={() => setActiveView('Revenue')}>Revenue</li>
            <li onClick={() => setActiveView('Products')}>Products</li>
             <li onClick={() => setActiveView('contacts')}>Contacts</li>
            {user?.role === 'admin' && (
              <li onClick={() => setActiveView('team')}>Team</li>
              
              
            )}
          </ul>
        </div>

        <div className="content">
          {renderView()}
        </div>
      </div>
    </div>
  );
}

export default Index;
