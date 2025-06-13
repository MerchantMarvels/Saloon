import React, { useState } from 'react';
import './AddBusinessDetail.css';
import API from '../api'; // make sure this is already imported

const timezones = ['EST', 'CST', 'MST', 'PST'];
const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const AddBusinessDetail = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    timezone: '',
    workingDays: [],
    hours: {}
  });

  const handleNext = () => setStep((prev) => Math.min(prev + 1, 4));
  const handleBack = () => setStep((prev) => Math.max(prev - 1, 1));

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

  // const handleSubmit = async () => {
  //   const businessId = localStorage.getItem('id');
  //   const token = localStorage.getItem('token');
  
  //   if (!businessId || !token) {
  //     alert('User not authenticated');
  //     return;
  //   }
  
  //   const payload = {
  //     businessId,
  //     owner: {
  //       firstName: formData.firstName,
  //       lastName: formData.lastName,
  //       phone: formData.phone,
  //     },
  //     timezone: formData.timezone,
  //     workingDays: formData.workingDays,
  //     workingHours: formData.hours,
  //   };
  
  //   try {
  //     // const response = await API.post('/business-detail', payload, {
  //     //   headers: { Authorization: `Bearer ${token}` }
  //     // });
  //     await API.post('auth/business-detail', payload, {
  //       headers: { Authorization: `Bearer ${token}` }
  //     });
  //     alert('Business detail saved!');
  //   } catch (err) {
  //     console.error('❌ API error:', err);
  //     alert('Failed to save business details');
  //   }
  // };

  const handleSubmit = async () => {
    const businessId = localStorage.getItem('id');
  
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
      await API.post('auth/business-detail', payload);
      alert('Business detail saved!');
    } catch (err) {
      console.error('❌ API error:', err?.response?.data || err);
      alert('Failed to save business details');
    }
  };
  
  return (
    <div className="form-container">
      <div className="step-navigation">
        {[1, 2, 3, 4].map(n => (
          <div key={n} className={`step ${step === n ? 'active' : ''}`} onClick={() => setStep(n)}>{n}</div>
        ))}
      </div>

      {step === 1 && (
        <div className="step-content">
          <input placeholder="First Name" onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} />
          <input placeholder="Last Name" onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} />
          <input placeholder="Phone" onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
        </div>
      )}

      {step === 2 && (
        <div className="step-content">
          <label>Select Timezone</label>
          <select onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}>
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
            if (e.target.checked) {
              setFormData((prev) => ({ ...prev, workingDays: [...daysOfWeek] }));
            } else {
              setFormData((prev) => ({ ...prev, workingDays: [] }));
            }
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
        {step > 1 && <button onClick={handleBack}>Back</button>}
        {step < 4 && <button onClick={handleNext}>Next</button>}
        {step === 4 && <button onClick={handleSubmit}>Submit</button>}
      </div>
    </div>
  );
};

export default AddBusinessDetail;
