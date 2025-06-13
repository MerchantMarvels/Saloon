import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AddBusinessDetail.css';
import API from '../api';
import './UpdateBusinessDetail.css';
import Employees from './employee';



const timezones = ['EST', 'CST', 'MST', 'PST'];
const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];


const UpdateBusinessDetail = () => {
   const navigate = useNavigate();
  const [step, setStep] = useState(1);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    timezone: '',
    workingDays: [],
    hours: {}
  });
  const [loading, setLoading] = useState(true);

  const businessId = localStorage.getItem('id');

  useEffect(() => {
    
    const fetchBusinessDetails = async () => {
      if (!businessId) return;

      try {
        const res = await API.get(`/auth/business-detail?businessId=${businessId}`);
        const detail = res.data;

        setFormData({
          firstName: detail.owner?.firstName || '',
          lastName: detail.owner?.lastName || '',
          phone: detail.owner?.phone || '',
          timezone: detail.timezone || '',
          workingDays: detail.workingDays || [],
          hours: detail.workingHours || {}
        });
      } catch (err) {
        console.error('❌ Failed to fetch business details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBusinessDetails();
  }, [businessId]);

  const toggleDay = (day) => {
    setFormData((prev) => {
      const updatedDays = prev.workingDays.includes(day)
        ? prev.workingDays.filter(d => d !== day)
        : [...prev.workingDays, day];
      return { ...prev, workingDays: updatedDays };
    });
  };

  const updateHours = (day, field, value) => {
    setFormData((prev) => ({
      ...prev,
      hours: {
        ...prev.hours,
        [day]: {
          ...(prev.hours[day] || {}),
          [field]: value
        }
      }
    }));
  };

  const handleSubmit = async () => {
    if (!businessId) {
      alert('User not authenticated');
      return;
    }

    const payload = {
      businessId,
      owner: {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
      },
      timezone: formData.timezone,
      workingDays: formData.workingDays,
      workingHours: formData.hours,
    };

    try {
      await API.post('/auth/business-detail', payload);
      alert('Business details updated!');
    } catch (err) {
      console.error('❌ API error:', err?.response?.data || err);
      alert('Failed to update business details');
    }
  };

  if (loading) return <div className="form-container">Loading business details...</div>;

  return (
    <div className="update-form-container">
      <div className="form-container">
        <div className="link"> <button onClick={() => navigate('/')}>Home</button></div>
      
      <div className="step-navigation">
        {[1, 2, 3, 4].map(n => (
          <div key={n} className={`step ${step === n ? 'active' : ''}`} onClick={() => setStep(n)}>{n}</div>
        ))}
      </div>

      {step === 1 && (
        <div className="step-content">
           <label>Add Owner Details</label>
          <input
            value={formData.firstName}
            placeholder="First Name"
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
          />
          <input
            value={formData.lastName}
            placeholder="Last Name"
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
          />
          <input
            value={formData.phone}
            placeholder="Phone"
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
        </div>
      )}

      {step === 2 && (
        <div className="step-content">
          <label>Select Timezone</label>
          <select value={formData.timezone} onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}>
            <option value="">-- Select --</option>
            {timezones.map(tz => <option key={tz} value={tz}>{tz}</option>)}
          </select>
        </div>
      )}

      {step === 3 && (
        <div className="step-content">
          <label>Select Working Days</label>
          <div>
            <label>
              <input
                type="checkbox"
                checked={formData.workingDays.length === daysOfWeek.length}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    workingDays: e.target.checked ? [...daysOfWeek] : []
                  }));
                }}
              />
              Select All Days
            </label>
          </div>
          <div className="days-grid">
            {daysOfWeek.map(day => (
              <label key={day}>
                <input
                  type="checkbox"
                  checked={formData.workingDays.includes(day)}
                  onChange={() => toggleDay(day)}
                />
                {day}
              </label>
            ))}
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="step-content">
          <div>
            <strong>Apply Same Time to All</strong>
            <input
              type="time"
              onChange={(e) => {
                const opensAt = e.target.value;
                const updatedHours = { ...formData.hours };
                formData.workingDays.forEach(day => {
                  updatedHours[day] = {
                    ...(updatedHours[day] || {}),
                    opensAt
                  };
                });
                setFormData((prev) => ({ ...prev, hours: updatedHours }));
              }}
              placeholder="Opens at"
            />
            <input
              type="time"
              onChange={(e) => {
                const closesAt = e.target.value;
                const updatedHours = { ...formData.hours };
                formData.workingDays.forEach(day => {
                  updatedHours[day] = {
                    ...(updatedHours[day] || {}),
                    closesAt
                  };
                });
                setFormData((prev) => ({ ...prev, hours: updatedHours }));
              }}
              placeholder="Closes at"
            />
          </div>

          {formData.workingDays.map(day => (
            <div key={day} className="hours-row">
              <strong>{day}</strong>
              <input
                type="time"
                value={formData.hours[day]?.opensAt || ''}
                onChange={(e) => updateHours(day, 'opensAt', e.target.value)}
              />
              <input
                type="time"
                value={formData.hours[day]?.closesAt || ''}
                onChange={(e) => updateHours(day, 'closesAt', e.target.value)}
              />
            </div>
          ))}
        </div>
      )}

      <div className="navigation-buttons">
        {step > 1 && <button onClick={() => setStep(step - 1)}>Back</button>}
        {step < 4 && <button onClick={() => setStep(step + 1)}>Next</button>}
        {step === 4 && <button onClick={handleSubmit}>Save</button>}
      </div>
      </div>
      
    </div>

 
  );
};

export default UpdateBusinessDetail;
