import React, { useEffect, useState } from 'react';
import API from '../api';
import './Revenue.css'; // Make sure to create this CSS file

const Revenue = () => {
    const [user, setUser] = useState(null);
    const [businessId, setBusinessId] = useState(null);
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [serviceRevenue, setServiceRevenue] = useState(0);
    const [miscRevenue, setMiscRevenue] = useState(0);
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [revenueByEmployee, setRevenueByEmployee] = useState({});
    const [revenueByService, setRevenueByService] = useState({});
    const [employeeNames, setEmployeeNames] = useState({});
    const [serviceNames, setServiceNames] = useState({});
    const [activeTab, setActiveTab] = useState('total');
    const [fromDate, setFromDate] = useState('2025-05-01');
    const [toDate, setToDate] = useState('2025-05-21');

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                setUser(parsedUser);
                const id = parsedUser.role === 'admin' ? parsedUser.id : parsedUser.business_id;
                localStorage.setItem('id', id);
                setBusinessId(id);
            } catch (error) {
                console.error('❌ Failed to parse user:', error);
            }
        }
    }, []);

    useEffect(() => {
        const fetchInvoices = async () => {
            if (!businessId) return;

            setLoading(true);

            try {
                const res = await API.get(`/auth/invoices?businessId=${businessId}`);
                const data = res.data;

                let serviceRev = 0;
                let miscRev = 0;
                const empRevenue = {};
                const svcRevenue = {};
                const employeeSet = new Set();

                const filteredData = data.filter(inv => {
                    const createdAt = new Date(inv.createdAt);
                    return createdAt >= new Date(fromDate) && createdAt <= new Date(toDate);
                });

                filteredData.forEach(inv => {
                    serviceRev += inv.serviceTotal || 0;
                    miscRev += inv.miscTotal || 0;

                    if (inv.employeeId) {
                        empRevenue[inv.employeeId] = (empRevenue[inv.employeeId] || 0) + inv.serviceTotal + inv.miscTotal;
                        employeeSet.add(inv.employeeId);
                    }

                    if (Array.isArray(inv.serviceIds)) {
                        inv.serviceIds.forEach(serviceId => {
                            svcRevenue[serviceId] = (svcRevenue[serviceId] || 0) + inv.serviceTotal;
                        });
                    }
                });

                setInvoices(filteredData);
                setServiceRevenue(serviceRev);
                setMiscRevenue(miscRev);
                setTotalRevenue(serviceRev + miscRev);
                setRevenueByEmployee(empRevenue);
                setRevenueByService(svcRevenue);

                // Fetch employee names
                const empRes = await API.get('/auth/employees');
                const employeeMap = {};
                empRes.data.forEach(emp => {
                    employeeMap[emp._id] = emp.name;
                });
                const names = {};
                Array.from(employeeSet).forEach(id => {
                    names[id] = employeeMap[id] || `employee ${id}`;
                });
                setEmployeeNames(names);

                // Fetch service names
                const svcRes = await API.get('/auth/services');
                const serviceMap = {};
                svcRes.data.forEach(svc => {
                    serviceMap[svc._id] = svc.name;
                });
                setServiceNames(serviceMap);

            } catch (err) {
                console.error('❌ Error fetching data:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchInvoices();
    }, [businessId, fromDate, toDate]);

    if (loading) return <div className="revenue-container">Loading revenue data... (Business ID: {businessId})</div>;

    return (
        <div className="revenue-container">
            <h2>Business Revenue</h2>

            <div className="date-filter">
                <label>From: <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} /></label>
                <label>To: <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} /></label>
            </div>

            <div className="tabs">
                <button onClick={() => setActiveTab('total')} className={activeTab === 'total' ? 'active' : ''}>Total</button>
                <button onClick={() => setActiveTab('employee')} className={activeTab === 'employee' ? 'active' : ''}>Employee-wise</button>
                <button onClick={() => setActiveTab('service')} className={activeTab === 'service' ? 'active' : ''}>Service-wise</button>
            </div>

            {activeTab === 'total' && (
                <div className="tab-content">
                    <p><strong>Total Revenue:</strong> ${totalRevenue}</p>
                    <p><strong>Service Revenue:</strong> ${serviceRevenue}</p>
                    <p><strong>Misc Revenue:</strong> ${miscRevenue}</p>
                </div>
            )}

            {activeTab === 'employee' && (
                <div className="tab-content">
                    <ul>
                        {Object.entries(revenueByEmployee).map(([empId, rev]) => (
                            <li key={empId}>{employeeNames[empId] || empId}: ${rev}</li>
                        ))}
                    </ul>
                </div>
            )}

            {activeTab === 'service' && (
                <div className="tab-content">
                    <ul>
                        {Object.entries(revenueByService).map(([svcId, rev]) => (
                            <li key={svcId}>{serviceNames[svcId] || `Service ${svcId}`}: ${rev}</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default Revenue;
