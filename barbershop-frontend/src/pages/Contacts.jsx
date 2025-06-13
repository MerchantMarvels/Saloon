import React, { useEffect, useState } from 'react';
import API from '../api';
import Papa from 'papaparse';
import exampleCsv from '../assets/Sample_Contact_CSV.csv';
import './contacts.css';

function Contacts() {
  const [contacts, setContacts] = useState([]);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '' });

  const user = JSON.parse(localStorage.getItem('user'));
  const businessId = user?.user?.id || user?.id;

  useEffect(() => {
    fetchContacts();
  }, [businessId]);

  const fetchContacts = async () => {
    try {
      const res = await API.get(`/auth/contacts?businessId=${businessId}`);
      setContacts(res.data);
    } catch (err) {
      setError('Failed to load contacts.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this contact?')) {
      try {
        await API.delete(`/auth/contacts/${id}`);
        setContacts(contacts.filter(c => c._id !== id));
      } catch (err) {
        alert('Failed to delete contact');
      }
    }
  };

  const handleEdit = (contact) => {
    setEditingContact(contact);
    setFormData({ name: contact.name, phone: contact.phone, email: contact.email });
    setShowModal(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingContact) {
        const res = await API.put(`/auth/contacts/${editingContact._id}`, formData);
        const updated = contacts.map(c => c._id === editingContact._id ? res.data.contact : c);
        setContacts(updated);
      } else {
        const res = await API.post(`/auth/contacts`, { ...formData, business_id: businessId });
        setContacts([...contacts, res.data]);
      }
      setShowModal(false);
    } catch (err) {
      alert('Failed to save contact');
    }
  };

  const handleCsvUpload = async (e) => {
    if (!e.target.files?.length) return alert("Please select a CSV file.");
    const file = e.target.files[0];
    const data = new FormData();
    data.append('file', file);
    data.append('business_id', businessId);

    try {
      const res = await API.post('/auth/contacts/import', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      alert(`Imported ${res.data.count} contacts`);
      fetchContacts();
      setShowCsvModal(false);
    } catch (err) {
      console.error(err);
      alert('Failed to upload contacts');
    }
  };

  return (
    <div className="contacts-container">
      <div className="contacts-header">
        <h2>Contact List</h2>
        <div className="contact-actions">
          <button onClick={() => { setShowModal(true); setEditingContact(null); setFormData({ name: '', phone: '', email: '' }); }}>
            + Add Contact
          </button>
          <button onClick={() => setShowCsvModal(true)}>
            Import Contacts
          </button>
        </div>
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <table className="contacts-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Phone</th>
            <th>Email</th>
            <th>Created At</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {contacts.map((c) => (
            <tr key={c._id}>
              <td>{c.name}</td>
              <td>{c.phone}</td>
              <td>{c.email || '-'}</td>
              <td>{new Date(c.created_at).toLocaleString()}</td>
              <td>
                <button onClick={() => handleEdit(c)}>Edit</button>
                <button onClick={() => handleDelete(c._id)} style={{ marginLeft: 10 }}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ADD/EDIT MODAL */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>{editingContact ? 'Edit Contact' : 'Add Contact'}</h3>
            <form onSubmit={handleSave}>
              <label>Name</label>
              <input name="name" value={formData.name} onChange={handleChange} required />
              <label>Phone</label>
              <input name="phone" value={formData.phone} onChange={handleChange} required />
              <label>Email</label>
              <input name="email" value={formData.email} onChange={handleChange} />
              <div className="modal-actions">
                <button type="submit">Save</button>
                <button type="button" onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* IMPORT CSV MODAL */}
      {/* {showCsvModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Import Contacts via CSV</h3>
            <input type="file" accept=".csv" onChange={handleCsvUpload} />
            <a href={exampleCsv} download style={{ marginTop: '10px', display: 'block' }}>
              Download Example CSV
            </a>
            <div className="modal-actions">
              <button onClick={() => setShowCsvModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )} */}

      {showCsvModal && (
  <div className="modal-overlay">
    <div className="modal">
      <h3>Import Contacts via CSV</h3>

      <input
        type="file"
        accept=".csv"
        onChange={(e) => setSelectedFile(e.target.files[0])}
      />

      <a href={exampleCsv} download style={{ marginTop: '10px', display: 'block' }}>
        Download Example CSV
      </a>

      <div className="modal-actions">
        <button
          onClick={async () => {
            if (!selectedFile) return alert('Please select a file first.');
            const data = new FormData();
            data.append('file', selectedFile);
            data.append('business_id', businessId);

            try {
              const res = await API.post('/auth/contacts/import', data, {
                headers: { 'Content-Type': 'multipart/form-data' },
              });
              alert(`Imported ${res.data.count} contacts`);
              fetchContacts();
              setShowCsvModal(false);
              setSelectedFile(null);
            } catch (err) {
              console.error(err);
              alert('Failed to upload contacts');
            }
          }}
        >
          Import
        </button>
        <button onClick={() => { setShowCsvModal(false); setSelectedFile(null); }}>
          Cancel
        </button>
      </div>
    </div>
  </div>
)}

    </div>
  );
}

export default Contacts;
