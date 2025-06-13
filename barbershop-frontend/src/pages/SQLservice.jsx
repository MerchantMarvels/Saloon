import React, { useEffect, useState } from 'react';
import API from '../api';
import './services.css';

function Services() {
  const [services, setServices] = useState([]);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', price: '', duration_minutes: '' });
  const [editingId, setEditingId] = useState(null);
  const [selected, setSelected] = useState([]);

  const user = JSON.parse(localStorage.getItem('user'));

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
        business_id: user.id,
      };
      if (editingId) {
        await API.put(`/auth/services/${editingId}`, payload);
      } else {
        await API.post('/auth/postService', payload);
      }
      setShowModal(false);
      window.location.reload();
    } catch (err) {
      alert('Failed to save service: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleEdit = (service) => {
    setFormData(service);
    setEditingId(service.id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this service?')) {
      await API.delete(`/auth/services/${id}`);
      window.location.reload();
    }
  };

  const toggleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleAll = (e) => {
    if (e.target.checked) {
      setSelected(services.map((s) => s.id));
    } else {
      setSelected([]);
    }
  };

  const handleBulkDelete = async () => {
    if (window.confirm('Delete selected services?')) {
      await API.post('/auth/services/bulk-delete', { ids: selected });
      window.location.reload();
    }
  };

 

  return (
    <div className="services-container">
      <div className="services-header">
        <h2>All Services</h2>
        <div>
          <button className="add-service-btn" onClick={() => {
            setShowModal(true);
            setFormData({ name: '', price: '', duration_minutes: '' });
            setEditingId(null);
          }}>
            + Add Service
          </button>
          {selected.length > 0 && (
            <>
              <button onClick={handleBulkDelete}>Bulk Delete</button>
            </>
          )}
        </div>
      </div>

      {error ? (
        <p style={{ color: 'red' }}>{error}</p>
      ) : (
        <table className="services-table">
          <thead>
            <tr>
              <th><input type="checkbox" onChange={toggleAll} /></th>
              <th>ID</th>
              <th>Business ID</th>
              <th>Service Name</th>
              <th>Duration (min)</th>
              <th>Price ($)</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {services.map((service) => (
              <tr key={service.id}>
                <td><input type="checkbox" checked={selected.includes(service.id)} onChange={() => toggleSelect(service.id)} /></td>
                <td>{service.id}</td>
                <td>{service.business_id}</td>
                <td>{service.name}</td>
                <td>{service.duration_minutes}</td>
                <td>$ {parseFloat(service.price).toFixed(2)}</td>
                <td>
                  <button onClick={() => handleEdit(service)}>Edit</button>
                  <button onClick={() => handleDelete(service.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>{editingId ? 'Edit Service' : 'Add New Service'}</h3>
            <form onSubmit={handleSubmit}>
              <label>Service Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleInputChange} required />

              <label>Price ($)</label>
              <input type="number" name="price" value={formData.price} onChange={handleInputChange} required min="0" step="0.01" />

              <label>Duration (minutes - multiple of 5)</label>
              <input type="number" name="duration_minutes" value={formData.duration_minutes} onChange={handleInputChange} required min="5" step="5" />

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
