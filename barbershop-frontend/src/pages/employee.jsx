import React, { useEffect, useState } from "react";
import API from "../api";
import "./services.css";
import Select from "react-select";
import "./employee.css";

function Employees() {
  const [employees, setEmployees] = useState([]);
  const [services, setServices] = useState([]);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState(0);
  const [editingId, setEditingId] = useState(null);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const [workingHourErrors, setWorkingHourErrors] = useState({});
  const [breakHourErrors, setBreakHourErrors] = useState({});

  const [businessSchedule, setBusinessSchedule] = useState({ workingDays: [], workingHours: {} });


  const daysOfWeek = [
    "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday",
  ];

  const [formState, setFormState] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    services_id: [],
    workingDays: [],
    workingHours: {},
    breaks: {},
    globalWorkingStart: "",
    globalWorkingEnd: "",
    globalBreakStart: "",
    globalBreakEnd: "",
  });

  const user = JSON.parse(localStorage.getItem("user"));
  const businessId = user?.user?.id || user?.id;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleServiceChange = (selectedOptions) => {
    setFormState((prev) => ({
      ...prev,
      services_id: selectedOptions.map((opt) => opt.value),
    }));
  };

  const toggleDay = (day) => {
    setFormState((prev) => ({
      ...prev,
      workingDays: prev.workingDays.includes(day)
        ? prev.workingDays.filter((d) => d !== day)
        : [...prev.workingDays, day],
    }));
  };

  // const updateHours = (day, field, value) => {
  //   setFormState((prev) => ({
  //     ...prev,
  //     workingHours: {
  //       ...prev.workingHours,
  //       [day]: {
  //         ...(prev.workingHours[day] || {}),
  //         [field === "start" ? "opensAt" : "closesAt"]: value,
  //       },
  //     },
  //   }));
  // };


  const updateHours = (day, field, value) => {
  const newHours = {
    ...(formState.workingHours[day] || {}),
    [field === "start" ? "opensAt" : "closesAt"]: value,
  };

  // Validate against business hours
  const businessHours = businessSchedule.workingHours[day];
  let errorMsg = "";

  if (businessHours) {
    const { opensAt, closesAt } = newHours;
    if (
      opensAt &&
      closesAt &&
      (opensAt < businessHours.opensAt || closesAt > businessHours.closesAt)
    ) {
      errorMsg = `Must be between ${businessHours.opensAt} - ${businessHours.closesAt}`;
    }
  }

  setFormState((prev) => ({
    ...prev,
    workingHours: {
      ...prev.workingHours,
      [day]: newHours,
    },
  }));

  setWorkingHourErrors((prev) => ({
    ...prev,
    [day]: errorMsg,
  }));
};

  const updateBreaks = (day, field, value) => {
  const existing = formState.breaks[day]?.[0] || {};
  const updatedBreak = { ...existing, [field]: value };

  const businessHours = businessSchedule.workingHours[day];
  let errorMsg = "";

  if (businessHours) {
    const { start, end } = updatedBreak;
    if (
      start &&
      end &&
      (start < businessHours.opensAt || end > businessHours.closesAt)
    ) {
      errorMsg = `Break must be within ${businessHours.opensAt} - ${businessHours.closesAt}`;
    }
  }

  setFormState((prev) => ({
    ...prev,
    breaks: {
      ...prev.breaks,
      [day]: [updatedBreak],
    },
  }));

  setBreakHourErrors((prev) => ({
    ...prev,
    [day]: errorMsg,
  }));
};

  const validateWorkingHours = () => {
  const errors = {};

  formState.workingDays.forEach((day) => {
    const empHours = formState.workingHours[day];
    const businessHours = businessSchedule.workingHours[day];

    if (!empHours || !businessHours) return;

    if (empHours.opensAt < businessHours.opensAt || empHours.closesAt > businessHours.closesAt) {
      errors[day] = `Must be between ${businessHours.opensAt} - ${businessHours.closesAt}`;
    }
  });

  setWorkingHourErrors(errors);
  return Object.keys(errors).length === 0;
};

const applyWorkingHours = () => {
  const updated = {};
  const errors = {};

  formState.workingDays.forEach((day) => {
    const businessHours = businessSchedule.workingHours[day];

    if (!businessHours) return;

    const globalStart = formState.globalWorkingStart;
    const globalEnd = formState.globalWorkingEnd;

    const isStartValid = globalStart >= businessHours.opensAt;
    const isEndValid = globalEnd <= businessHours.closesAt;

    if (!isStartValid || !isEndValid) {
      errors[day] = `Must be between ${businessHours.opensAt} - ${businessHours.closesAt}`;
    } else {
      updated[day] = {
        opensAt: globalStart,
        closesAt: globalEnd,
      };
    }
  });

  setWorkingHourErrors(errors);

  // If any day has an error, block update
  if (Object.keys(errors).length === 0) {
    setFormState((prev) => ({
      ...prev,
      workingHours: updated,
    }));
  }
};

const applyBreaksToAll = () => {
  const errors = {};
  const updated = {};

  formState.workingDays.forEach((day) => {
    const businessHours = businessSchedule.workingHours[day];
    if (!businessHours) return;

    const breakStart = formState.globalBreakStart;
    const breakEnd = formState.globalBreakEnd;

    const isStartValid = breakStart >= businessHours.opensAt;
    const isEndValid = breakEnd <= businessHours.closesAt;

    if (!isStartValid || !isEndValid) {
      errors[day] = `Break must be within ${businessHours.opensAt} - ${businessHours.closesAt}`;
    } else {
      updated[day] = [{ start: breakStart, end: breakEnd }];
    }
  });

  setBreakHourErrors(errors);

  if (Object.keys(errors).length === 0) {
    setFormState((prev) => ({ ...prev, breaks: updated }));
  }
};




  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...formState,
      business_id: businessId,
    };

    try {
      setLoading(true);
      if (editingId) {
        await API.put(`/auth/employees/${editingId}`, payload);
        alert("Employee updated");
      } else {
        await API.post("/auth/employees", payload);
        alert("Employee added");
      }

      const refreshed = await API.get("/auth/employees");
      setEmployees(refreshed.data);
      setShowModal(false);
      setEditingId(null);
      setFormState({
        name: "",
        email: "",
        phone: "",
        password: "",
        services_id: [],
        workingDays: [],
        workingHours: {},
        breaks: {},
        globalWorkingStart: "",
        globalWorkingEnd: "",
        globalBreakStart: "",
        globalBreakEnd: "",
      });
      setStep(0);
    } catch (err) {
      alert("Error saving employee: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (emp) => {
    setEditingId(emp._id);
    setFormState({
      name: emp.name,
      email: emp.email,
      phone: emp.phone || "",
      password: "",
      services_id: emp.services_id.map((id) =>
        typeof id === "object" ? id._id : id
      ),
      workingDays: emp.workingDays || [],
      workingHours: emp.workingHours || {},
      breaks: emp.breaks || {},
      globalWorkingStart: "",
      globalWorkingEnd: "",
      globalBreakStart: "",
      globalBreakEnd: "",
    });
    setStep(0);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this employee?")) {
      try {
        await API.delete(`/auth/employees/${id}`);
        setEmployees(employees.filter((e) => e._id !== id));
      } catch (err) {
        alert("Error deleting employee: " + err.message);
      }
    }
  };

  const handleBulkDelete = async () => {
    if (window.confirm("Delete selected employees?")) {
      try {
        await API.post("/auth/employees/bulk-delete", { ids: selected });
        setEmployees(employees.filter((e) => !selected.includes(e._id)));
        setSelected([]);
      } catch (err) {
        alert("Bulk delete failed: " + err.message);
      }
    }
  };

  const toggleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleAll = (e) => {
    setSelected(e.target.checked ? employees.map((e) => e._id) : []);
  };

  useEffect(() => {
    const fetchBusinessSchedule = async () => {
      try {
        const res = await API.get(`/auth/business-detail?businessId=${businessId}`);
        setBusinessSchedule({
          workingDays: res.data.workingDays || [],
          workingHours: res.data.workingHours || {},
        });
      } catch (err) {
        console.error("Failed to load business schedule", err);
      }
    };
    if (businessId) fetchBusinessSchedule();
  }, [businessId]);


  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await API.get("/auth/employees");
        setEmployees(res.data);
      } catch (err) {
        setError("Failed to load employees");
        console.error(err);
      }
    };
    fetchEmployees();
  }, []);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await API.get("/auth/services");
        const filtered = res.data.filter((s) => s.business_id === businessId);
        setServices(filtered);
      } catch (err) {
        console.error("Error loading services:", err);
      }
    };
    if (businessId) fetchServices();
  }, [businessId]);

  return (
    <div className="services-container">
      <div className="services-header">
        <h2>Employees</h2>
        <div>
          <button
            onClick={() => {
              setShowModal(true);
              setFormState({
                name: "",
                email: "",
                phone: "",
                password: "",
                services_id: [],
                workingDays: [],
                workingHours: {},
                breaks: {},
                globalWorkingStart: "",
                globalWorkingEnd: "",
                globalBreakStart: "",
                globalBreakEnd: "",
              });
              setEditingId(null);
              setStep(0);
            }}
          >
            + Add Employee
          </button>
          {selected.length > 0 && (
            <button className="csv-upload-btn" onClick={handleBulkDelete}>
              Bulk Delete
            </button>
          )}
        </div>
      </div>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <table className="services-table">
        <thead>
          <tr>
            <th><input type="checkbox" onChange={toggleAll} /></th>
            <th>ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Services</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((emp) => (
            <tr key={emp._id}>
              <td>
                <input
                  type="checkbox"
                  checked={selected.includes(emp._id)}
                  onChange={() => toggleSelect(emp._id)}
                />
              </td>
              <td>{emp._id}</td>
              <td>{emp.name}</td>
              <td>{emp.email}</td>
              <td>{emp.phone || "-"}</td>
              <td>
                {Array.isArray(emp.services_id)
                  ? emp.services_id.map((s) => s.name || s).join(", ")
                  : ""}
              </td>
              <td>
                <button onClick={() => handleEdit(emp)}>Edit</button>
                <button onClick={() => handleDelete(emp._id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal multi-step-modal">
            <h3>{editingId ? "Edit Employee" : "Add New Employee"}</h3>

            <div className="step-indicator">
              {["Details", "Working Days", "Working Hours", "Breaks"].map(
                (label, index) => (
                  <span
                    key={index}
                    className={`step ${step === index ? "active" : ""}`}
                  >
                    {label}
                  </span>
                )
              )}
            </div>

            <form onSubmit={handleSubmit}>
              {step === 0 && (
                <>
                  <label>Name</label>
                  <input name="name" value={formState.name} onChange={handleInputChange} required />
                  <label>Email</label>
                  <input name="email" type="email" value={formState.email} onChange={handleInputChange} required />
                  <label>Phone</label>
                  <input name="phone" value={formState.phone} onChange={handleInputChange} />
                  <label>Password</label>
                  <input name="password" type="password" value={formState.password} onChange={handleInputChange} required={!editingId} />
                  <label>Services</label>
                  <Select
                    isMulti
                    options={services.map((s) => ({ label: s.name, value: s._id }))}
                    value={services.filter((s) => formState.services_id.includes(s._id)).map((s) => ({ label: s.name, value: s._id }))}
                    onChange={handleServiceChange}
                  />
                </>
              )}

              {step === 1 && (
                <>
                  <label><strong>Step 1: Select Working Days</strong></label>
                  <div className="days-grid">
                    {daysOfWeek.filter((day) => businessSchedule.workingDays.includes(day)).map((day) => (

                      <label key={day}>
                        <input type="checkbox" checked={formState.workingDays.includes(day)} onChange={() => toggleDay(day)} />
                        {day}
                      </label>
                    ))}
                  </div>
                </>
              )}

            {step === 2 && (
  <>
    <label><strong>Step 2: Set Working Hours</strong></label>

    <div className="global-time-inputs">
      <span>Global Start:</span>
      <input
        type="time"
        value={formState.globalWorkingStart}
        onChange={(e) => setFormState((prev) => ({ ...prev, globalWorkingStart: e.target.value }))}
      />
      <span>Global End:</span>
      <input
        type="time"
        value={formState.globalWorkingEnd}
        onChange={(e) => setFormState((prev) => ({ ...prev, globalWorkingEnd: e.target.value }))}
      />
    </div>

    <button
      type="button"
      className="btn secondary"
      onClick={applyWorkingHours}
      disabled={!formState.globalWorkingStart || !formState.globalWorkingEnd}
    >
      Apply to All
    </button>

    {formState.workingDays.length === 0 ? (
      <p style={{ color: "gray", marginTop: "1rem" }}>
        No days selected. Please select working days in Step 1.
      </p>
    ) : (
      formState.workingDays.map((day) => (
        <div key={day} className="day-input-row">
          <span>{day}</span>
         <input
  type="time"
  value={formState.workingHours[day]?.opensAt || ""}
  onChange={(e) => updateHours(day, "start", e.target.value)}
/>
<input
  type="time"
  value={formState.workingHours[day]?.closesAt || ""}
  onChange={(e) => updateHours(day, "end", e.target.value)}
/>
          {workingHourErrors[day] && (
            <p style={{ color: "red", marginTop: "0.3rem" }}>
              {workingHourErrors[day]}
            </p>
          )}
        </div>
      ))
    )}

  </>
)}




              {step === 3 && (
  <>
    <label><strong>Step 3: Set Break Hours</strong></label>

    <div className="global-time-inputs">
      <span>Break Start:</span>
      <input
        type="time"
        value={formState.globalBreakStart}
        onChange={(e) =>
          setFormState((prev) => ({ ...prev, globalBreakStart: e.target.value }))
        }
      />
      <span>Break End:</span>
      <input
        type="time"
        value={formState.globalBreakEnd}
        onChange={(e) =>
          setFormState((prev) => ({ ...prev, globalBreakEnd: e.target.value }))
        }
      />
    </div>

    <button
      type="button"
      className="btn secondary"
      onClick={applyBreaksToAll}
      disabled={!formState.globalBreakStart || !formState.globalBreakEnd}
    >
      Apply to All
    </button>

    {formState.workingDays.map((day) => (
      <div key={day} className="day-input-row">
        <span>{day}</span>
        <input
          type="time"
          value={formState.breaks[day]?.[0]?.start || ""}
          onChange={(e) => updateBreaks(day, "start", e.target.value)}
        />
        <input
          type="time"
          value={formState.breaks[day]?.[0]?.end || ""}
          onChange={(e) => updateBreaks(day, "end", e.target.value)}
        />
        {breakHourErrors[day] && (
          <p style={{ color: "red", marginTop: "0.3rem" }}>{breakHourErrors[day]}</p>
        )}
      </div>
    ))}
  </>
)}

              <div className="modal-actions">
                {step > 0 && <button type="button" className="btn secondary" onClick={() => setStep((prev) => prev - 1)}>Back</button>}
                {step < 3 && <button type="button" className="btn primary" onClick={() => setStep((prev) => prev + 1)}>Next</button>}
                {step === 3 && <button type="submit" className="btn success" disabled={loading}>{loading ? "Saving..." : "Save"}</button>}
                <button type="button" className="btn danger" onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Employees;
