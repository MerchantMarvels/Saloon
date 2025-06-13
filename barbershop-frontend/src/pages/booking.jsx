import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import API from '../api';
import moment from 'moment-timezone';
import './booking.css';

function Booking() {
  const [services, setServices] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [userContact, setUserContact] = useState({ name: '', email: '', phone: '' });
  const [bookedSlots, setBookedSlots] = useState([]);
  const [workingDays, setWorkingDays] = useState([]);
  const [workingHours, setWorkingHours] = useState({});
  const [disabledDates, setDisabledDates] = useState([]);
  const [step, setStep] = useState(1);
  const carouselRef = useRef(null);
  const [breaks, setBreaks] = useState({});

  const { businessId: urlBusinessId } = useParams();
  const localUser = JSON.parse(localStorage.getItem('user'));
  const businessId = localUser?.user?.id || localUser?.id || urlBusinessId;

  const scrollDates = (direction) => {
    const scrollAmount = 4 * 110;
    carouselRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  const timeSlots = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
    "16:00", "16:30", "17:00"
  ];

  const formatTime = (time) =>
    moment.tz(`2025-01-01T${time}`, "America/New_York").format("hh:mm A");

  useEffect(() => {
    if (businessId) {
      API.get(`/auth/services?businessId=${businessId}`)
        .then(res => setServices(res.data))
        .catch(err => console.error("Failed to fetch services", err));

      API.get(`/auth/business-detail?businessId=${businessId}`)
        .then(res => {
          // setWorkingDays(res.data.workingDays || []);
          // setWorkingHours(res.data.workingHours || {});
          setDisabledDates(res.data.disabledDates || []); // ✅ add this line
        })
        .catch(err => console.error("Failed to fetch business details", err));
    }
  }, [businessId]);

  useEffect(() => {
    if (selectedService) {
      API.get('/auth/employees')
        .then(res => {
          const filtered = res.data.filter(emp => {
            return Array.isArray(emp.services_id) &&
              emp.services_id.some(s => {
                const id = typeof s === 'object' ? s?.$oid || s?._id : s;
                return id === selectedService._id;
              });
          });
          setEmployees(filtered);
        })
        .catch(err => {
          console.error("Error fetching employees:", err);
          setEmployees([]);
        });
    }
  }, [selectedService]);

  useEffect(() => {
    if (selectedEmployee && selectedDate) {
      API.get(`/auth/bookings?employeeId=${selectedEmployee._id}&date=${selectedDate}`)
        .then(res => {
          const booked = res.data.map(booking =>
            moment(booking.bookingDateTime).tz("America/New_York").format("HH:mm")
          );
          setBookedSlots(booked);
        })
        .catch(err => {
          console.error("Failed to fetch booked time slots:", err);
          setBookedSlots([]);
        });
    }
  }, [selectedEmployee, selectedDate]);

  //   useEffect(() => {
  //   if (selectedEmployee) {
  //     API.get(`/auth/employees/${selectedEmployee._id}`) // assumes route returns employee object with disabledDates
  //       .then(res => {
  //         setDisabledDates(res.data.disabledDates || []);
  //       })
  //       .catch(err => {
  //         console.error("Failed to fetch employee disabled dates:", err);
  //         setDisabledDates([]);
  //       });
  //   }
  // }, [selectedEmployee]);

  useEffect(() => {
    if (selectedEmployee) {
      API.get(`/auth/employees/${selectedEmployee._id}`)
        .then(res => {
          const data = res.data;
          setDisabledDates(data.disabledDates || []);
          setWorkingDays(data.workingDays || []);
          setWorkingHours(data.workingHours || {});
          setBreaks(data.breaks || {});
        })
        .catch(err => {
          console.error("Failed to fetch employee working details:", err);
          setDisabledDates([]);
          setWorkingDays([]);
          setWorkingHours({});
          setBreaks({});
        });
    }
  }, [selectedEmployee]);


  const handleBookingConfirm = () => {
    const bookingDateTime = moment.tz(`${selectedDate}T${selectedTime}`, "America/New_York").toISOString();
    const payload = {
      serviceId: selectedService._id,
      employeeId: selectedEmployee._id,
      bookingDateTime,
      contact: { ...userContact }
    };

    API.post('/auth/bookings', payload)
      .then(() => {
        alert('🎉 Booking Confirmed!');
        setStep(1);
        setSelectedService(null);
        setSelectedEmployee(null);
        setSelectedDate('');
        setSelectedTime('');
        setUserContact({ name: '', phone: '', email: '' });
      })
      .catch(err => {
        const errorMessage = err.response?.data?.error || err.message;
        alert('❌ Booking failed: ' + errorMessage);
      });
  };

  return (
    <div className="booking-wrapper">
      <h2>Book Your Appointment</h2>
      <div className="step-header">
        {[1, 2, 3, 4].map(n => (
          <React.Fragment key={n}>
            <div className={`step-number ${step === n ? 'active' : ''}`}>{n}</div>
            <span>{["Service", "Barber", "Date & Time", "Confirm"][n - 1]}</span>
          </React.Fragment>
        ))}
      </div>
      <hr className="step-divider" />

      {step === 1 && (
        <>
          <h3>Choose a Service</h3>
          <div className="service-grid">
            {services.map(service => (
              <div
                key={service._id}
                className={`service-card ${selectedService?._id === service._id ? 'selected' : ''}`}
                onClick={() => setSelectedService(service)}
              >
                <div className="service-name">{service.name}</div>
                <div className="service-details">
                  <span>${service.price}</span>
                  <span>{service.duration_minutes} min</span>
                </div>
              </div>
            ))}
          </div>
          <div className="navigation-buttons">
            <button disabled>Back</button>
            <button disabled={!selectedService} onClick={() => setStep(2)}>Continue</button>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <h3>Choose a Barber</h3>
          <div className="service-grid">
            {employees.map(emp => (
              <div
                key={emp._id}
                className={`service-card ${selectedEmployee?._id === emp._id ? 'selected' : ''}`}
                onClick={() => setSelectedEmployee(emp)}
              >
                <div className="service-name">{emp.name}</div>
                <div className="service-details">
                  <span>{emp.specialty || "All Services"}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="navigation-buttons">
            <button onClick={() => setStep(1)}>Back</button>
            <button disabled={!selectedEmployee} onClick={() => setStep(3)}>Continue</button>
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <h3>Choose Date & Time</h3>
          <div className="datetime-selection">
            <div>
              <label>Select Date</label>
              <div className="carousel-wrapper">
                <button className="arrow-btn left" onClick={() => scrollDates('left')}>{'<'}</button>
                <div className="date-carousel" ref={carouselRef}>
                  {Array.from({ length: 30 }).map((_, index) => {
                    const date = moment().tz("America/New_York").add(index, 'days');
                    const dateStr = date.format("YYYY-MM-DD");
                    const dayName = date.format('dddd');
                    // const isDisabled = !workingDays.includes(dayName);
                    const isWeekendOrBlocked = !workingDays.includes(dayName) || disabledDates.includes(dateStr);

                    return (
                      <button
                        key={dateStr}
                        className={`date-btn ${selectedDate === dateStr ? 'selected' : ''}`}
                        onClick={() => {
                          if (!isWeekendOrBlocked) {
                            setSelectedDate(dateStr);
                            setSelectedTime('');
                          }
                        }}
                        disabled={isWeekendOrBlocked}
                      >
                        {date.format("ddd, MMM D")}
                      </button>
                    );
                  })}
                </div>
                <button className="arrow-btn right" onClick={() => scrollDates('right')}>{'>'}</button>
              </div>
            </div>
            <div>
              <label>Available Time Slots</label>
              <div className="time-slot-grid">
                {selectedDate && (() => {
                  const dayName = moment(selectedDate).format('dddd');
                  const dayHours = workingHours[dayName] || {};
                  const openTime = dayHours.opensAt || "09:00";
                  const closeTime = dayHours.closesAt || "17:00";

                  const openMoment = moment.tz(`${selectedDate}T${openTime}`, "America/New_York");
                  const closeMoment = moment.tz(`${selectedDate}T${closeTime}`, "America/New_York");

                  const slots = [];
                  const slotDuration = 30; // in minutes

                  while (openMoment < closeMoment) {
                    const slot = openMoment.format("HH:mm");
                    slots.push(slot);
                    openMoment.add(slotDuration, 'minutes');
                  }

                  return slots.map(time => {
                    const isBooked = bookedSlots.includes(time);

                    // Filter if the slot is during a break
                    const breakList = breaks[dayName] || [];
                    const isBreak = breakList.some(b => {
                      const breakStart = moment(b.start, "HH:mm");
                      const breakEnd = moment(b.end, "HH:mm");
                      const slotMoment = moment(time, "HH:mm");
                      return slotMoment.isSameOrAfter(breakStart) && slotMoment.isBefore(breakEnd);
                    });

                    return (
                      <button
                        key={time}
                        className={`time-slot-btn ${selectedTime === time ? 'selected' : ''}`}
                        onClick={() => setSelectedTime(time)}
                        disabled={isBooked || isBreak}
                      >
                        {formatTime(time)}
                      </button>
                    );  
                  });
                })()}
              </div>
            </div>
          </div>
          <div className="navigation-buttons">
            <button onClick={() => setStep(2)}>Back</button>
            <button disabled={!selectedDate || !selectedTime} onClick={() => setStep(4)}>Continue</button>
          </div>
        </>
      )}

      {step === 4 && (
        <>
          <h3>Review & Confirm</h3>
          <div className="confirm-section">
            <div className="info-box">
              <h4>Appointment Details</h4>
              <p><strong>Date & Time:</strong> {moment.tz(`${selectedDate}T${selectedTime}`, "America/New_York").format('MMMM D, YYYY h:mm A')}</p>
            </div>
            <div className="info-box">
              <h4>Service</h4>
              <p>{selectedService.name} with {selectedEmployee.name}</p>
              <p><strong>Total:</strong> ${selectedService.price}</p>
            </div>
            <div className="info-box">
              <h4>Contact Info</h4>
              <input type="text" placeholder="Full Name" value={userContact.name} onChange={e => setUserContact({ ...userContact, name: e.target.value })} />
              <input type="text" placeholder="Phone" value={userContact.phone} onChange={e => setUserContact({ ...userContact, phone: e.target.value })} />
              <input type="email" placeholder="Email" value={userContact.email} onChange={e => setUserContact({ ...userContact, email: e.target.value })} />
            </div>
          </div>
          <div className="navigation-buttons">
            <button onClick={() => setStep(3)}>Back</button>
            <button className="confirm-btn" disabled={!userContact.name || !userContact.phone || !userContact.email} onClick={handleBookingConfirm}>
              Confirm Booking
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default Booking;
