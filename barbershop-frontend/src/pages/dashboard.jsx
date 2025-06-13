// DashboardStats.jsx

import React, { useEffect, useState } from 'react';
import API from '../api';
import './dashboard.css';
import { useParams, useNavigate } from 'react-router-dom';
import AllBookingsPage from './calendar'; // Import calendar component

const DashboardStats = () => {
    const [stats, setStats] = useState({
        totalBookings: 0,
        totalRevenue: 0,
        totalReserved: 0,
        monthlyStats: [],
    });
    const [recentBookings, setRecentBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [user, setUser] = useState(null);

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        const role = storedUser?.role;
        const userId = storedUser?.id;
        const businessId = role === 'admin' ? userId : storedUser?.business_id;
        const employeeId = role === 'employee' ? userId : null;

        if (!role || (!businessId && !employeeId)) {
            setError('Role or ID not found in localStorage');
            setLoading(false);
            return;
        }

        const fetchDashboardData = async () => {
            try {
                setUser(storedUser);
                localStorage.setItem('role', role);
                localStorage.setItem('id', businessId);
                if (employeeId) {
                    localStorage.setItem('empid', employeeId);
                }

                let url = '';
                if (role === 'admin') {
                    url = `/auth/getAllBookings?businessId=${businessId}`;
                } else if (role === 'employee') {
                    url = `/auth/getAllBookings?employeeId=${employeeId}`;
                } else {
                    setError('Invalid role');
                    setLoading(false);
                    return;
                }

                const response = await API.get(url);
                const allBookings = response.data;

                const totalRevenue = allBookings.length * 560;
                const monthly = new Array(12).fill(0);
                allBookings.forEach((b) => {
                    const m = new Date(b.bookingDateTime).getMonth();
                    monthly[m]++;
                });

                const recent = [...allBookings]
                    .sort((a, b) => new Date(b.bookingDateTime) - new Date(a.bookingDateTime))
                    .slice(0, 5);

                const contactCache = new Map();
                const serviceCache = new Map();
                const employeeMap = new Map();
                const empRes = await API.get('/auth/employees');
                empRes.data.forEach((emp) => employeeMap.set(emp._id, emp.name));

                for (let booking of recent) {
                    try {
                        if (!contactCache.has(booking.contact)) {
                            const res = await API.get(`/auth/getContactById?contactId=${booking.contact}`);
                            contactCache.set(booking.contact, res.data.name || 'Unknown');
                        }
                        if (!serviceCache.has(booking.serviceId)) {
                            const res = await API.get(`/auth/getServiceById?serviceId=${booking.serviceId}`);
                            serviceCache.set(booking.serviceId, res.data.name || 'Unknown Service');
                        }
                    } catch {
                        contactCache.set(booking.contact, 'Unknown');
                        serviceCache.set(booking.serviceId, 'Unknown Service');
                    }

                    booking.contactName = contactCache.get(booking.contact);
                    booking.serviceName = serviceCache.get(booking.serviceId);
                    booking.employeeName = employeeMap.get(booking.employeeId) || 'Unknown Employee';
                }

                setStats({
                    totalBookings: allBookings.length,
                    totalRevenue,
                    totalReserved: allBookings.length,
                    monthlyStats: monthly,
                });

                setRecentBookings(recent);
            } catch (err) {
                console.error('❌ Error loading dashboard:', err);
                setError('Failed to fetch dashboard data');
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

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

    return (
        <div className="dashboard">
            <div className="head-bar">
                <h2>Admin Dashboard</h2>
                <button onClick={handleBookingRedirect} className="go-to-booking-btn">
                    Go to Booking Page
                </button>
            </div>

            <div className="stat-boxes">
                <StatCard label="New Booking" value={stats.totalBookings} percentage="+20%" color="blue" />
                <StatCard label="Total Revenue" value={`$${stats.totalRevenue}`} percentage="+20%" color="red" />
                <StatCard label="Total Reserved" value={`${stats.totalReserved}/100`} percentage="+20%" color="blue" />
            </div>

            <RecentBookings data={recentBookings} />

            <div className="calendar-wrapper">
                <h4>Booking Calendar</h4>
                <AllBookingsPage />
            </div>
        </div>
    );
};

const StatCard = ({ label, value, percentage, color }) => (
    <div className="stat-card">
        <h4>{label}</h4>
        <p>{value}</p>
        <span style={{ color }}>{percentage}</span>
    </div>
);

const RecentBookings = ({ data }) => (
    <div className="recent-bookings">
        <h4>Recent Bookings</h4>
        <table>
            <thead>
                <tr>
                    <th>Booking Name</th>
                    <th>Employee</th>
                    <th>Service</th>
                    <th>Date</th>
                    <th>Time</th>
                </tr>
            </thead>
            <tbody>
                {data.map((b, idx) => {
                    const dateObj = new Date(b.bookingDateTime);
                    const formattedDate = dateObj.toLocaleDateString();
                    const formattedTime = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    return (
                        <tr key={idx}>
                            <td>{b.contactName}</td>
                            <td>{b.employeeName}</td>
                            <td>{b.serviceName}</td>
                            <td>{formattedDate}</td>
                            <td>{formattedTime}</td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    </div>
);

export default DashboardStats;
