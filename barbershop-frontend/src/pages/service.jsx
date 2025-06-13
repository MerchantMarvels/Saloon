import React, { useEffect, useState } from 'react';
import API from '../api';
import './services.css';
import Papa from 'papaparse';
import exampleCsv from '../assets/service.csv'; // Example CSV file path
import { useNavigate } from 'react-router-dom'; 

function Services() {
  const [services, setServices] = useState([]);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', price: '', duration_minutes: '' });
  const [editingId, setEditingId] = useState(null);
  const [selected, setSelected] = useState([]);
  const [showCsvModal, setShowCsvModal] = useState(false);

  const user = JSON.parse(localStorage.getItem('user'));
  const isAdmin = user?.role === 'admin';

  const navigate = useNavigate();

  const handleBookingRedirect = () => {
    const userData = JSON.parse(localStorage.getItem('user'));
    const businessId = userData?.user?.id || userData?.id;

    if (businessId) {
      navigate(`/booking/${businessId}`);
    } else {
      alert('Business ID not found.');
    }
  };

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await API.get('/auth/services');
        setServices(res.data);
      } catch (err) {
        console.error('Error fetching services:', err);
        setError('Failed to load services. Please try again later.');
      }
    };
    fetchServices();
  }, []);

  const handleCsvUpload = async (e) => {
    e.preventDefault();

    if (!e.target.files || e.target.files.length === 0) {
      alert("No file selected. Please select a CSV file.");
      return;
    }

    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await API.post('/auth/uploadCsv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      alert('CSV uploaded successfully!');
      console.log(response.data);
    } catch (err) {
      console.error('Error uploading CSV:', err);
      const errorMessage = err.response?.data?.error || 'Error uploading CSV';
      alert(errorMessage);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'duration_minutes' && value % 5 !== 0 && value !== '') return;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        business_id: user?.user?.id || user?.id,
      };

      let updatedServices;
      if (editingId) {
        await API.put(`/auth/services/${editingId}`, payload);
        updatedServices = services.map(service =>
          service._id === editingId ? { ...service, ...payload } : service
        );
      } else {
        const res = await API.post('/auth/postService', payload);
        updatedServices = [...services, res.data];
        alert('New service added!');
      }

      setServices(updatedServices);
      setShowModal(false);

      const res = await API.get('/auth/services');
      setServices(res.data);
    } catch (err) {
      alert('Failed to save service: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleEdit = (service) => {
    setFormData({
      name: service.name,
      price: service.price,
      duration_minutes: service.duration_minutes,
    });
    setEditingId(service._id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this service?')) {
      try {
        await API.delete(`/auth/services/${id}`);
        setServices(services.filter(service => service._id !== id));
      } catch (err) {
        alert('Failed to delete service: ' + (err.response?.data?.error || err.message));
      }
    }
  };

  const toggleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleAll = (e) => {
    if (e.target.checked) {
      setSelected(services.map((s) => s._id));
    } else {
      setSelected([]);
    }
  };

  const handleBulkDelete = async () => {
    if (window.confirm('Delete selected services?')) {
      try {
        await API.post('/auth/services/bulk-delete', { ids: selected });
        setServices(services.filter(service => !selected.includes(service._id)));
        setSelected([]);
      } catch (err) {
        alert('Failed to delete services: ' + (err.response?.data?.error || err.message));
      }
    }
  };

  return (
    <div className="services-container">
      <div className="services-header">

      <button onClick={handleBookingRedirect} className="go-to-booking-btn">
        Go to Booking Page
      </button>
        
        <h2>All Services</h2>
        {isAdmin && (
          <div>
            <button
              className="add-service-btn"
              onClick={() => {
                setShowModal(true);
                setFormData({ name: '', price: '', duration_minutes: '' });
                setEditingId(null);
              }}
            >
              + Add Service
            </button>
            {selected.length > 0 && (
              <button className="csv-upload-btn" onClick={handleBulkDelete}>Bulk Delete</button>
            )}
            <button
              className="csv-upload-btn"
              onClick={() => setShowCsvModal(true)}
            >
              Upload CSV
            </button>
          </div>
        )}
      </div>

      {error ? (
        <p style={{ color: 'red' }}>{error}</p>
      ) : (
        <table className="services-table">
          <thead>
            <tr>
              {isAdmin && <th><input type="checkbox" onChange={toggleAll} /></th>}
              <th>ID</th>
              <th>Business ID</th>
              <th>Service Name</th>
              <th>Duration (min)</th>
              <th>Price ($)</th>
              {isAdmin && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {services.map((service) => (
              <tr key={service._id}>
                {isAdmin && (
                  <td>
                    <input
                      type="checkbox"
                      checked={selected.includes(service._id)}
                      onChange={() => toggleSelect(service._id)}
                    />
                  </td>
                )}
                <td>{service._id}</td>
                <td>{service.business_id}</td>
                <td>{service.name}</td>
                <td>{service.duration_minutes}</td>
                <td>$ {parseFloat(service.price).toFixed(2)}</td>
                {isAdmin && (
                  <td>
                    <button onClick={() => handleEdit(service)}>Edit</button>
                    <button onClick={() => handleDelete(service._id)}>Delete</button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showCsvModal && isAdmin && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Upload CSV File</h3>
            <form>
              <input
                type="file"
                accept=".csv"
                onChange={handleCsvUpload}
              />
              <div className="modal-actions">
                <button type="submit">Upload</button>
                <button type="button" onClick={() => setShowCsvModal(false)}>Cancel</button>
              </div>
            </form>
            <a href={exampleCsv} download>Download Example CSV</a>
          </div>
        </div>
      )}

      {showModal && isAdmin && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>{editingId ? 'Edit Service' : 'Add New Service'}</h3>
            <form onSubmit={handleSubmit}>
              <label>Service Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
              <label>Price ($)</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                required
                min="0"
                step="0.01"
              />
              <label>Duration (minutes - multiple of 5)</label>
              <input
                type="number"
                name="duration_minutes"
                value={formData.duration_minutes}
                onChange={handleInputChange}
                required
                min="5"
                step="5"
              />
              <div className="modal-actions">
                <button type="submit">Save</button>
                <button type="button" onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Services;
