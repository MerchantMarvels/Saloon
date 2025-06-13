import React, { useEffect, useState } from 'react';
import API from '../api';
import { useParams } from 'react-router-dom';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, setHours, setMinutes } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = {
  'en-US': require('date-fns/locale/en-US'),
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const AllBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState('week');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [contactDetails, setContactDetails] = useState(null);
  const [serviceDetails, setServiceDetails] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [workingDays, setWorkingDays] = useState([]);
  const [workingHours, setWorkingHours] = useState({});
  const [services, setServices] = useState([]);
  const [disabledDates, setDisabledDates] = useState([]);
  const [disabledDateInput, setDisabledDateInput] = useState('');
  const [employees, setEmployees] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('all');

  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [productSearchResults, setProductSearchResults] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);


  const [isCheckoutMode, setIsCheckoutMode] = useState(false);
  const [addedServices, setAddedServices] = useState([]);

  const [miscItems, setMiscItems] = useState([]);
  const [taxPercent, setTaxPercent] = useState(0);
  const [tipAmount, setTipAmount] = useState(0);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const [inventoryMap, setInventoryMap] = useState({});
const [inventoryEnabled, setInventoryEnabled] = useState(false);



  const { businessId: urlBusinessId } = useParams();
  const empbusinessid = localStorage.getItem('employeeId');
  const localUser = JSON.parse(localStorage.getItem('user'));
  const businessId = localUser?.user?.id || localUser?.id || urlBusinessId;
  const timeZone = 'America/New_York';

  const handleAddService = (serviceId) => {
    if (!addedServices.includes(serviceId)) {
      setAddedServices([...addedServices, serviceId]);
    }
  };

  const calculateTotalPrice = () => {
    // Ensure the original service price is always included
    const originalService = services.find((s) => s._id === selectedEvent.serviceId);
    const originalPrice = originalService?.price || 0;

    const extraServiceIds = addedServices.filter(id => id !== selectedEvent.serviceId);
    const extraTotal = extraServiceIds.reduce((total, serviceId) => {
      const service = services.find((s) => s._id === serviceId);
      return total + (service?.price || 0);
    }, 0);

    return originalPrice + extraTotal;
  };


  // const handleUpdateBooking = async () => {
  //   try {
  //     await API.put('/auth/updateBookingServices', {
  //       bookingId: selectedEvent.id,
  //       services: addedServices,
  //       status: 'Billed',
  //     });

  //     alert('Booking updated and billed!');
  //     setShowModal(false);
  //     setIsCheckoutMode(false);
  //   } catch (err) {
  //     console.error('Failed to update booking:', err);
  //     alert('Failed to update booking.');
  //   }
  // };

  const handleUpdateBooking = async () => {
    setShowPaymentModal(true);
  };

  const handleAddMiscItem = () => {
    setMiscItems([...miscItems, { name: '', price: 0 }]);
  };

  const handleMiscItemChange = (index, key, value) => {
    const updated = [...miscItems];
    updated[index][key] = key === 'price' ? parseFloat(value) || 0 : value;
    setMiscItems(updated);
  };

  const calculateServiceTotal = () => {
    const original = services.find((s) => s._id === selectedEvent.serviceId)?.price || 0;
    const extras = addedServices
      .filter(id => id !== selectedEvent.serviceId)
      .reduce((sum, id) => {
        const s = services.find(svc => svc._id === id);
        return sum + (s?.price || 0);
      }, 0);
    return original + extras;
  };

  const calculateMiscTotal = () => {
    return miscItems.reduce((sum, item) => sum + item.price, 0);
  };

  const calculateTax = () => {
    const subtotal = calculateServiceTotal() + calculateMiscTotal() + calculateProductTotal();
    return subtotal * (parseFloat(taxPercent) / 100);
  };

  const calculateTotalBill = () => {
    return calculateServiceTotal() + calculateMiscTotal() + calculateProductTotal() + calculateTax() + parseFloat(tipAmount || 0);
  };

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const role = localStorage.getItem('role');
        const storedUser = localStorage.getItem('user');

        if (storedUser) {
          const user = JSON.parse(storedUser);
          setUser(user);
          localStorage.setItem('role', user.role);
          localStorage.setItem('id', user.role === 'admin' ? user.id : user.business_id);
          localStorage.setItem('empid', user.role === 'employee' ? user.id : null);
        }

        const id = localStorage.getItem('id');
        const empid = localStorage.getItem('empid');

        if (!role || (!id && !empid)) {
          setError('Role or ID not found in localStorage');
          setLoading(false);
          return;
        }

        let url = '';
        if (role === 'admin') {
          url = `/auth/getAllBookings?businessId=${id}`;
        } else if (role === 'employee') {
          url = `/auth/getAllBookings?employeeId=${empid}`;
        } else {
          setError('Invalid role');
          setLoading(false);
          return;
        }

        const response = await API.get(url);
        const data = response.data;

        // const parsed = data.map((booking) => ({
        //   id: booking._id || booking._id?.$oid,
        //   serviceId: booking.serviceId || booking.serviceId?.$oid,
        //   employeeId: booking.employeeId || booking.employeeId?.$oid,
        //   contactId: booking.contact || booking.contact?.$oid,
        //   businessId: booking.business_id || booking.business_id?.$oid,
        //   date: new Date(booking.bookingDateTime || booking.bookingDateTime?.$date?.$numberLong),
        //   createdAt: new Date(booking.created_at || booking.created_at?.$date?.$numberLong),
        // }));

        const parsed = data.map((booking) => ({
          id: booking._id || booking._id?.$oid,
          serviceId: booking.serviceId || booking.serviceId?.$oid,
          employeeId: booking.employeeId || booking.employeeId?.$oid,
          // employeeId: booking.employeeId?._id || booking.employeeId,
          contactId: booking.contact || booking.contact?.$oid,
          businessId: booking.business_id || booking.business_id?.$oid,
          date: new Date(booking.bookingDateTime || booking.bookingDateTime?.$date?.$numberLong),
          createdAt: new Date(booking.created_at || booking.created_at?.$date?.$numberLong),
          status: booking.status || 'pending',
        }));


        setBookings(parsed);
      } catch (err) {
        console.error('❌ Error fetching bookings:', err);
        setError('Failed to fetch bookings');
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  useEffect(() => {
    const role = localStorage.getItem('role');
    const empId = localStorage.getItem('empid');

    if (businessId) {
      API.get(`/auth/services?businessId=${empbusinessid}`)
        .then(res => setServices(res.data))
        .catch(err => console.error("Failed to fetch services", err));

      API.get(`/auth/employees?businessId=${empbusinessid}`)
        .then(res => setEmployees(res.data))
        .catch(err => console.error("Failed to fetch employees", err));

      API.get(`/auth/business-detail?businessId=${empbusinessid}`)
        .then(async res => {
          const businessDisabled = res.data.disabledDates || [];
          if (role === 'employee' && empId) {
            const empRes = await API.get(`/auth/employees/?id=${empId}`);
            const empData = empRes.data;

            setWorkingDays(empData.workingDays || []);
            setWorkingHours(empData.workingHours || {});

            const employeeDisabled = empData.disabledDates || [];
            const businessDisabled = res.data.disabledDates || [];

            const combined = [...new Set([...businessDisabled, ...employeeDisabled])];
            setDisabledDates(combined);
          } else {
            setWorkingDays(res.data.workingDays || []);
            setWorkingHours(res.data.workingHours || {});
            const businessDisabled = res.data.disabledDates || [];
            setDisabledDates(businessDisabled);
          }


          if (role === 'employee' && empId) {
            const empRes = await API.get(`/auth/employees/?id=${empId}`);
            const employeeDisabled = empRes.data.disabledDates || [];

            const combined = [...new Set([...businessDisabled, ...employeeDisabled])];
            setDisabledDates(combined);
          } else {
            setDisabledDates(businessDisabled);
          }
        })
        .catch(err => console.error("Failed to fetch business details", err));
    }
  }, [businessId]);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!productSearchTerm) {
        setProductSearchResults([]);
        return;
      }

      try {
        const res = await API.get(`/auth/products/search?query=${productSearchTerm}&businessId=${businessId}`);
        setProductSearchResults(res.data);
      } catch (err) {
        console.error("❌ Failed to search products:", err);
      }
    };

    fetchProducts();
  }, [productSearchTerm, businessId]);

  useEffect(() => {
  const fetchInventoryData = async () => {
    try {
      const [invRes, statusRes] = await Promise.all([
        API.get(`/auth/inventory?businessId=${businessId}`),
        API.get(`/auth/inventory/status/${businessId}`)
      ]);

      const invMap = {};
      invRes.data.forEach(item => {
        invMap[item.product] = item.quantity_in_stock;
      });

      setInventoryMap(invMap);
      setInventoryEnabled(statusRes.data.inventoryEnabled);
    } catch (err) {
      console.error("Failed to load inventory:", err);
    }
  };

  fetchInventoryData();
}, [businessId]);


  const handleAddProduct = (product) => {
    const exists = selectedProducts.find(p => p._id === product._id);
    if (!exists) {
      setSelectedProducts([...selectedProducts, { ...product, quantity: 1 }]);
    }
  };

  const handleProductQuantityChange = (productId, quantity) => {
    setSelectedProducts(prev =>
      prev.map(p =>
        p._id === productId ? { ...p, quantity: parseInt(quantity) || 1 } : p
      )
    );
  };

  const handleRemoveProduct = (productId) => {
    setSelectedProducts(prev => prev.filter(p => p._id !== productId));
  };

  const calculateProductTotal = () => {
    return selectedProducts.reduce((total, p) => total + (p.price_per_unit * p.quantity), 0);
  };


  const handleDisableDate = async () => {
    if (!disabledDateInput) return;

    try {
      if (selectedEmployeeId === 'all') {
        const updatedDates = [...new Set([...disabledDates, disabledDateInput])];
        await API.put(`/auth/business-detail`, {
          businessId,
          disabledDates: updatedDates,
        });
        setDisabledDates(updatedDates);
      } else {
        await API.put(`/auth/updateEmployee`, {
          employeeId: selectedEmployeeId,
          disabledDates: [disabledDateInput],
        });
      }

      setDisabledDateInput('');
    } catch (error) {
      console.error("❌ Failed to update disabled dates:", error);
    }
  };

  const handleSelectEvent = async (event) => {
    setSelectedEvent(event);
    setShowModal(true);
    setContactDetails(null);
    setServiceDetails(null);

    try {
      const [contactRes, serviceRes] = await Promise.all([
        API.get(`/auth/getContactById?contactId=${event.contactId}`),
        API.get(`/auth/getServiceById?serviceId=${event.serviceId}`)
      ]);
      setContactDetails(contactRes.data);
      setServiceDetails(serviceRes.data);
    } catch (err) {
      console.error('Error fetching contact or service details:', err);
    }
  };

  const getTimeBoundsForDay = (date) => {
    const dayName = format(date, 'EEEE');
    const dayHours = workingHours?.[dayName];

    if (dayHours?.opensAt && dayHours?.closesAt) {
      const [startHour, startMinute] = dayHours.opensAt.split(':').map(Number);
      const [endHour, endMinute] = dayHours.closesAt.split(':').map(Number);

      const baseDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

      const min = setHours(setMinutes(new Date(baseDate), startMinute), startHour);
      const max = setHours(setMinutes(new Date(baseDate), endMinute), endHour);
      return { min, max };
    }

    const baseDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const min = setHours(setMinutes(new Date(baseDate), 0), 0);
    const max = setHours(setMinutes(new Date(baseDate), 59), 23);
    return { min, max };
  };

  if (loading) return <p>Loading bookings...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  // const events = bookings.map((booking) => {
  //   const startDate = toZonedTime(booking.date, timeZone);
  //   return {
  //     title: `Booking ID: ${booking.id}`,
  //     start: startDate,
  //     end: new Date(startDate.getTime() + 15 * 60 * 1000),
  //     allDay: false,
  //     contactId: booking.contactId,
  //     serviceId: booking.serviceId,
  //   };
  // });

  const events = bookings.map((booking) => {
    const startDate = toZonedTime(booking.date, timeZone);
    return {
      title: `Booking ID: ${booking.id}`,
      start: startDate,
      end: new Date(startDate.getTime() + 15 * 60 * 1000),
      allDay: false,
      contactId: booking.contactId,
      serviceId: booking.serviceId,
      status: booking.status,
      id: booking.id,
      employeeId: booking.employeeId,
    };
  });

  const updateBookingStatus = async (newStatus) => {
    if (newStatus === 'checkout') {
      setIsCheckoutMode(true);
      setAddedServices([selectedEvent.serviceId]); // original service
      return;
    }

    try {
      await API.put('/auth/updateBookingStatus', {
        bookingId: selectedEvent.id,
        status: newStatus,
      });

      // Update in local state
      setBookings((prev) =>
        prev.map((b) =>
          b.id === selectedEvent.id ? { ...b, status: newStatus } : b
        )
      );

      setSelectedEvent((prev) => ({ ...prev, status: newStatus }));
    } catch (err) {
      console.error("Failed to update booking status:", err);
      alert("Error updating booking status");
    }
  };

  // const handleCashPayment = async () => {

  //   const id = localStorage.getItem('id');
  //   try {
  //     const invoiceData = {

  //       bookingId: selectedEvent.id,
  //       contactId: selectedEvent.contactId,
  //       businessId: id,
  //       employeeId: selectedEvent.employeeId,
  //       serviceIds: addedServices,
  //       miscItems,
  //       taxPercent: parseFloat(taxPercent),
  //       tipAmount: parseFloat(tipAmount),
  //       serviceTotal: calculateServiceTotal(),
  //       miscTotal: calculateMiscTotal(),
  //       taxAmount: calculateTax(),
  //       totalAmount: calculateTotalBill(),
  //       paymentMethod: 'cash',
  //       status: 'Paid',
  //       createdAt: new Date(),
  //     };

  //     await API.post('/auth/createInvoice', invoiceData);

  //     alert('Invoice created and payment recorded.');
  //     setShowPaymentModal(false);
  //     setShowModal(false);
  //     setIsCheckoutMode(false);
  //   } catch (err) {
  //     console.error('❌ Failed to create invoice:', err);
  //     alert('Failed to create invoice.');
  //   }
  // };

  const handleCashPayment = async () => {
    const id = localStorage.getItem('id');
    try {
      // Prepare product data for invoice
      const productsForInvoice = selectedProducts.map(p => ({
        productId: p._id,
        name: p.name,
        price_per_unit: p.price_per_unit,
        quantity: p.quantity,
        total: p.price_per_unit * p.quantity,
      }));

      const invoiceData = {
        bookingId: selectedEvent.id,
        contactId: selectedEvent.contactId,
        businessId: id,
        employeeId: selectedEvent.employeeId,
        serviceIds: addedServices,
        miscItems,
        taxPercent: parseFloat(taxPercent),
        tipAmount: parseFloat(tipAmount),
        serviceTotal: calculateServiceTotal(),
        miscTotal: calculateMiscTotal(),
        products: productsForInvoice,
        productsTotal: calculateProductTotal(),
        paymentMethod: 'cash',
        status: 'Paid',
        createdAt: new Date(),
      };

      await API.post('/auth/createInvoice', invoiceData);

      alert('Invoice created and payment recorded.');
      setShowPaymentModal(false);
      setShowModal(false);
      setIsCheckoutMode(false);
    } catch (err) {
      console.error('❌ Failed to create invoice:', err);
      alert('Failed to create invoice.');
    }
  };






  return (
    <div>
      <h2>All Bookings</h2>

      <div>
        <h3>Disable Specific Booking Dates</h3>
        <div>
          <label htmlFor="employeeSelect"><strong>Apply Disabled Date To:</strong></label>
          <select
            id="employeeSelect"
            value={selectedEmployeeId}
            onChange={(e) => setSelectedEmployeeId(e.target.value)}
          >
            <option value="all">All Employees</option>
            {employees.map(emp => (
              <option key={emp._id?.$oid || emp._id} value={emp._id?.$oid || emp._id}>
                {emp.name}
              </option>
            ))}
          </select>
        </div>

        <input
          type="date"
          value={disabledDateInput}
          onChange={(e) => setDisabledDateInput(e.target.value)}
        />
        <button onClick={handleDisableDate}>Disable Date</button>


      </div>

      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        timeslots={2}
        defaultView="month"
        messages={{ time: "Time (EST)" }}
        view={currentView}
        onView={setCurrentView}
        views={['month', 'week', 'day']}
        toolbar={true}
        style={{ height: 600 }}
        step={15}
        getNow={() => new Date()}
        min={new Date(1970, 1, 1, 0, 0)}
        max={new Date(1970, 1, 1, 23, 59)}
        onSelectEvent={handleSelectEvent}
        dayPropGetter={(date) => {
          const dayName = format(date, 'EEEE');
          const dateStr = format(date, 'yyyy-MM-dd');

          const isDisabledDate = disabledDates.includes(dateStr);
          const isNotWorkingDay = workingDays.length > 0 && !workingDays.includes(dayName);

          if (isDisabledDate || isNotWorkingDay) {
            return {
              className: 'rbc-day-disabled',
              style: { backgroundColor: 'rgba(255, 0, 0, 0.1)' },
            };
          }
          return {};
        }}
        slotPropGetter={(date) => {
          const { min, max } = getTimeBoundsForDay(date);
          if (date < min || date >= max) {
            return {
              style: {
                backgroundColor: 'rgba(255, 220, 40, .15)',
                color: '#ccc',
              },
            };
          }
          return {};
        }}
      />

      {showModal && selectedEvent && (
        <div style={modalStyle.overlay}>
          <div style={modalStyle.modal}>
            {isCheckoutMode ? (
              <>
                {!showPaymentModal ? (
                  <>
                    <h3>Billing</h3>

                    <p><strong>Original Service:</strong> {serviceDetails?.name} - ${serviceDetails?.price}</p>

                    <label>Add Extra Services:</label>
                    <select
                      multiple
                      value={addedServices}
                      onChange={(e) => {
                        const selected = Array.from(e.target.selectedOptions).map(opt => opt.value);
                        setAddedServices(selected);
                      }}
                      style={{ width: '100%', height: '100px' }}
                    >
                      {services.map((svc) => (
                        <option key={svc._id} value={svc._id}>
                          {svc.name} - ${svc.price}
                        </option>
                      ))}
                    </select>

                    <h4>Miscellaneous Items:</h4>
                    <button onClick={handleAddMiscItem} style={{ marginBottom: '0.5rem' }}>+ Add Item</button>
                    {miscItems.map((item, index) => (
                      <div key={index} style={{ display: 'flex', marginBottom: '0.5rem' }}>
                        <input
                          type="text"
                          placeholder="Item Name"
                          value={item.name}
                          onChange={(e) => handleMiscItemChange(index, 'name', e.target.value)}
                          style={{ flex: 2, marginRight: 5 }}
                        />
                        <input
                          type="number"
                          placeholder="Price"
                          value={item.price}
                          onChange={(e) => handleMiscItemChange(index, 'price', e.target.value)}
                          style={{ flex: 1 }}
                        />
                      </div>
                    ))}

                    <div style={{ marginTop: '1rem' }}>
                      <label>Tax (% on service total):</label>
                      <input
                        type="number"
                        value={taxPercent}
                        onChange={(e) => setTaxPercent(e.target.value)}
                        style={{ width: '100%' }}
                      />
                    </div>

                    <div style={{ marginTop: '0.5rem' }}>
                      <label>Tip ($ flat):</label>
                      <input
                        type="number"
                        value={tipAmount}
                        onChange={(e) => setTipAmount(e.target.value)}
                        style={{ width: '100%' }}
                      />
                    </div>

                    <div>
                      <h4>Search Products</h4>
                      <input
                        type="text"
                        placeholder="Search product by name..."
                        value={productSearchTerm}
                        onChange={(e) => setProductSearchTerm(e.target.value)}
                        style={{ width: '100%', marginBottom: '0.5rem' }}
                      />
                      {productSearchResults.map((product) => (
                        <div key={product._id} style={{ marginBottom: '0.3rem' }}>
                          <span>{product.name} - ${product.price_per_unit}</span>
                          <button style={{ marginLeft: '0.5rem' }} onClick={() => handleAddProduct(product)}>Add</button>
                        </div>
                      ))}

                      <h4>Selected Products</h4>
                      {selectedProducts.map(product => (
                        <div key={product._id} style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <span style={{ flex: 2 }}>{product.name} - ${product.price_per_unit}</span>
                          <input
                            type="number"
                            min="1"
                            value={product.quantity}
                            onChange={(e) => handleProductQuantityChange(product._id, e.target.value)}
                            style={{ width: '60px', marginLeft: '0.5rem', marginRight: '0.5rem' }}
                          />
                          <button onClick={() => handleRemoveProduct(product._id)}>Remove</button>
                        </div>
                      ))}
                    </div>


                    <div style={{ marginTop: '1rem' }}>
                      <p><strong>Service Total:</strong> ${calculateServiceTotal().toFixed(2)}</p>
                      <p><strong>Products Total:</strong> ${calculateProductTotal().toFixed(2)}</p>
                      <p><strong>Miscellaneous:</strong> ${calculateMiscTotal().toFixed(2)}</p>
                      <p><strong>Tax:</strong> ${calculateTax().toFixed(2)}</p>
                      <p><strong>Tip:</strong> ${parseFloat(tipAmount || 0).toFixed(2)}</p>
                      <p><strong>Grand Total:</strong> ${calculateTotalBill().toFixed(2)}</p>

                    </div>

                    <button onClick={handleUpdateBooking} style={{ backgroundColor: '#4CAF50', color: '#fff', marginRight: 10 }}>
                      Continue to Payment
                    </button>
                    <button onClick={() => { setIsCheckoutMode(false); setShowModal(false); }}>
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <h3>Select Payment Method</h3>

                    <button
                      onClick={handleCashPayment}
                      style={{ backgroundColor: '#4CAF50', color: 'white', marginRight: 10 }}
                    >
                      Cash
                    </button>
                    <button disabled style={{ backgroundColor: '#ccc', color: '#666' }}>
                      Card (Coming Soon)
                    </button>

                    <button
                      onClick={() => setShowPaymentModal(false)}
                      style={{ marginTop: '1rem' }}
                    >
                      Back to Billing
                    </button>
                  </>
                )}
              </>
            ) : (
              <>
                <h3>Booking Details</h3>
                <p><strong>{selectedEvent.title}</strong></p>
                <p><strong>Start:</strong> {selectedEvent.start.toString()}</p>
                <p><strong>End:</strong> {selectedEvent.end.toString()}</p>

                {contactDetails ? (
                  <>
                    <h4>Contact Details</h4>
                    <p><strong>Name:</strong> {contactDetails.name}</p>
                    <p><strong>Email:</strong> {contactDetails.email}</p>
                  </>
                ) : (
                  <p>Loading contact details...</p>
                )}

                {serviceDetails ? (
                  <>
                    <h4>Service Details</h4>
                    <p><strong>Name:</strong> {serviceDetails.name}</p>
                    <p><strong>Price:</strong> ${serviceDetails.price}</p>
                  </>
                ) : (
                  <p>Loading service details...</p>
                )}

                <p><strong>Status:</strong> {selectedEvent.status}</p>

                <div style={{ marginTop: '1rem' }}>
                  <button onClick={() => updateBookingStatus('checkout')} style={{ backgroundColor: '#4CAF50', color: 'white', marginRight: 10 }}>
                    Checkout
                  </button>
                  <button onClick={() => updateBookingStatus('no_show')} style={{ backgroundColor: '#f44336', color: 'white', marginRight: 10 }}>
                    No Show
                  </button>
                  <button onClick={() => setShowModal(false)}>Close</button>
                </div>
              </>
            )}


          </div>
        </div>
      )}
    </div>
  );
};

const modalStyle = {
  overlay: {
    position: 'fixed',
    top: 0, left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    background: '#fff',
    padding: 20,
    borderRadius: 8,
    width: 600,
    boxShadow: '0 5px 15px rgba(0,0,0,0.3)',
  },
};

export default AllBookingsPage;
