// Required modules
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Employee = require('../models/Employee');
const ses = require('../sesClient');

const fs = require('fs');  // Import the fs module
const csv = require('csv-parser');

const Service = require('../models/Service');
const Contact = require('../models/Contact');
const Booking = require('../models/Booking');
const BusinessDetail = require('../models/BusinessDetail'); // 
const Invoice = require('../models/Invoice'); // 

const Category = require('../models/Category');
const Product = require('../models/Product');
const Inventory = require('../models/Inventory');

const nodemailer = require('nodemailer');
const schedule = require('node-schedule');
const { DateTime } = require('luxon');
// const { sampleSize } = require('lodash');







// Register User
exports.register = async (req, res) => {
  const { name, email, password, role, business_id, bname } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: 'User already exists' });

    // Check if business_id already exists
    const existingBusiness = await User.findOne({ business_id });
    if (existingBusiness) return res.status(400).json({ error: 'Business ID already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password_hash: hashedPassword,
      role,
      business_id,
      business_name: bname || null,
      created_at: new Date()
    });

    await newUser.save();

     // Send Welcome Email
              try {
                const transporter = nodemailer.createTransport({
                  host: process.env.SMTP_HOST,
                  port: Number(process.env.SMTP_PORT),
                  secure: process.env.SMTP_SECURE === 'true',
                  auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
                  }
                });

                await transporter.sendMail({
                  from: `"Merchant Marvels App" <${process.env.SMTP_USER}>`,
                  to: email,
                  subject: 'Welcome to Merchant Marvels App!',
                  text: `Hi ${name},\n\nWelcome to Merchant Marvels App. Your account has been successfully created.\n\nBest regards,\nTeam`
                });

                console.log(`✅ Email sent to ${email}`);
              } catch (emailErr) {
                console.error('❌ Email sending failed:', emailErr.message);
                // Optionally do not block registration due to email issue
              }

    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};





// Login User
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(401).json({ error: 'Invalid password' });

    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
        business_id: user._id,
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        business_id: user.business_id,
        business_name: user.business_name,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get All Services
exports.getAllServices = async (req, res) => {
  try {
    const services = await Service.find();
    console.log('📦 Services from DB:', services); // <-- add this
    res.status(200).json(services);
  } catch (err) {
    console.error('❌ Error in getAllServices:', err);
    res.status(500).json({ error: 'Failed to retrieve services' });
  }
};



// Add New Service
exports.postService = async (req, res) => {
  const { name, price, duration_minutes, business_id } = req.body;

  // Check if all required fields are provided
  if (!name || !price || !duration_minutes || !business_id) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    // Check if a service with the same name and price already exists
    const existingService = await Service.findOne({ name, price });

    if (existingService) {
      // If a service with the same name and price exists, return an error
      return res.status(400).json({ error: 'Service with this name and price already exists' });
    }

    // If no existing service is found, create and save the new service
    const newService = new Service({ name, price, duration_minutes, business_id });
    await newService.save();

    res.status(201).json({ message: 'Service added successfully' });
  } catch (err) {
    console.error('Error adding service:', err);
    res.status(500).json({ error: 'Failed to add service' });
  }
};

// Delete Service by ID
exports.deleteService = async (req, res) => {
  try {
    await Service.findByIdAndDelete(req.params.id);
    res.json({ message: 'Service deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update Service
exports.updateService = async (req, res) => {
  const { name, price, duration_minutes, business_id } = req.body;

  try {
    await Service.findByIdAndUpdate(req.params.id, {
      name,
      price,
      duration_minutes,
      business_id,
    });
    res.json({ message: 'Service updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Bulk Delete Services
exports.bulkDeleteServices = async (req, res) => {
  const ids = req.body.ids;
  if (!Array.isArray(ids)) return res.status(400).json({ error: 'Invalid ID list' });

  try {
    await Service.deleteMany({ _id: { $in: ids } });
    res.json({ message: 'Services deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// // CSV Upload Method
// exports.uploadCsv = async (req, res) => {
//   const filePath = req.file?.path; // Use optional chaining to handle missing file
//   if (!filePath) {
//     return res.status(400).json({ error: 'No file uploaded' });
//   }

//   const services = [];
//   const errors = [];

//   try {
//     // Start reading and processing the CSV file
//     fs.createReadStream(filePath)
//       .pipe(csv())
//       .on('data', async (row) => {
//         // Process each row
//         const { name, price, duration_minutes, business_id } = row;

//         const result = await exports.postServiceHelper(name, price, duration_minutes, business_id);
//         if (result.error) {
//           // Collect errors for any failed entries
//           errors.push(`Error with service: ${name}, ${result.error}`);
//         } else {
//           services.push(result.message);
//         }
//       })
//       .on('end', async () => {
//         // Once file processing is done, delete the uploaded file
//         fs.unlinkSync(filePath);

//         // Respond with the result
//         if (errors.length > 0) {
//           return res.status(400).json({ message: 'Some services failed to upload', errors });
//         }

//         res.status(200).json({ message: 'CSV file processed successfully', services: services });
//       })
//       .on('error', (err) => {
//         console.error('Error reading CSV file:', err);
//         fs.unlinkSync(filePath); // Clean up the file on error
//         res.status(500).json({ error: 'Failed to process CSV file', details: err.message });
//       });
//   } catch (err) {
//     console.error('General error during CSV processing:', err);
//     res.status(500).json({ error: 'Internal server error during CSV upload', details: err.message });
//   }
// };

// CSV Upload Method
exports.uploadCsv = async (req, res) => {
  const filePath = req.file?.path;
  const type = req.body.type;

  if (!filePath) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  if (!['services', 'products', 'categories'].includes(type)) {
    fs.unlinkSync(filePath);
    return res.status(400).json({ error: 'Invalid type parameter' });
  }

  const results = [];
  const errors = [];

  try {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', async (row) => {
        let result;

        try {
          if (type === 'services') {
            const { name, price, duration_minutes, business_id } = row;
            result = await exports.postServiceHelper(name, price, duration_minutes, business_id);
          } else if (type === 'products') {
            const { name, unit, price_per_unit, category_id, business_id } = row;

              if (!category_id) {
                result = { error: 'Missing category_id for product: ' + name };
              } else {
                result = await postProductHelper(
                  name,
                  unit,
                  parseFloat(price_per_unit),
                  category_id, // we pass it directly as `category`
                  business_id
                );
              }
          } else if (type === 'categories') {
            const { name, description, business_id } = row;
            result = await postCategoryHelper(name, description, business_id);
          }

          if (result?.error) {
            errors.push(`Error with ${type.slice(0, -1)}: ${row.name}, ${result.error}`);
          } else {
            results.push(result.message);
          }
        } catch (innerErr) {
          errors.push(`Error processing row for ${row.name}: ${innerErr.message}`);
        }
      })
      .on('end', () => {
        fs.unlinkSync(filePath);
        if (errors.length > 0) {
          return res.status(400).json({ message: `Some ${type} failed to upload`, errors });
        }
        res.status(200).json({ message: `${type} CSV processed successfully`, results });
      })
      .on('error', (err) => {
        fs.unlinkSync(filePath);
        console.error('Stream error:', err);
        res.status(500).json({ error: 'Failed to read CSV', details: err.message });
      });

  } catch (err) {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error during CSV upload', details: err.message });
  }
};


// Helper function used by CSV processing to reuse logic
exports.postServiceHelper = async (name, price, duration_minutes, business_id) => {
  // Check if all required fields are provided
  if (!name || !price || !duration_minutes || !business_id) {
    return { error: 'All fields are required' };
  }

  // Check if a service with the same name and price already exists
  const existingService = await Service.findOne({ name, price });

  if (existingService) {
    return { error: 'Service with this name and price already exists' };
  }

  // If no existing service is found, create and save the new service
  const newService = new Service({ name, price, duration_minutes, business_id });
  await newService.save();

  return { message: 'Service added successfully' };
};

// Example helpers (you should implement similar to postServiceHelper)
const postProductHelper = async (name, unit, price_per_unit, category, business_id) => {
  try {
    const product = new Product({ name, unit, price_per_unit, category, business_id });
    await product.save();
    return { message: `Inserted product: ${name}` };
  } catch (err) {
    return { error: err.message };
  }
};

const postCategoryHelper = async (name, description, business_id) => {
  try {
    const category = new Category({ name, description, business_id });
    await category.save();
    return { message: `Inserted category: ${name}` };
  } catch (err) {
    return { error: err.message };
  }
};



// Employee backend start 



// Get All Employees
exports.getAllEmployees = async (req, res) => {
  try {
    const employees = await Employee.find()
      .populate('services_id')  // Optional: populate service details
      .populate('business_id'); // Optional: populate business (user) details

    console.log('👥 Employees from DB:', employees);
    res.status(200).json(employees);
  } catch (err) {
    console.error('❌ Error in getAllEmployees:', err);
    res.status(500).json({ error: 'Failed to retrieve employees' });
  }
};


exports.getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;

    const employee = await Employee.findById(id)
      .populate('services_id')    // Optional: show full service objects
      .populate('business_id');   // Optional: show related business info

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    console.log('👤 Employee fetched:', employee);
    res.status(200).json(employee);
  } catch (err) {
    console.error('❌ Error in getEmployeeById:', err);
    res.status(500).json({ error: 'Failed to retrieve employee' });
  }
};


// Add New Employee
// exports.postEmployee = async (req, res) => {
//   const { name, email, phone,   password, services_id, business_id } = req.body;

//   if (!name || !email || !password || !services_id || !business_id) {
//     return res.status(400).json({ error: 'All fields are required' });
//   }

//   try {
//     const existingEmployee = await Employee.findOne({ email });

//     if (existingEmployee) {
//       return res.status(400).json({ error: 'Employee with this email already exists' });
//     }

//     const newEmployee = new Employee({ name, email,phone, password, services_id, business_id });
//     await newEmployee.save();

//     res.status(201).json({ message: 'Employee added successfully' });
//   } catch (err) {
//     console.error('❌ Error adding employee:', err);
//     res.status(500).json({ error: 'Failed to add employee' });
//   }
// };

// Add New Employee
exports.postEmployee = async (req, res) => {
  const { name, email, phone, password, services_id, business_id } = req.body;

  if (!name || !email || !password || !services_id || !business_id) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const existingEmployee = await Employee.findOne({ email });
    if (existingEmployee) {
      return res.status(400).json({ error: 'Employee with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10); // 🔐 hash the password

    const newEmployee = new Employee({
      name,
      email,
      phone,
      password: hashedPassword, // use hashed password
      services_id,
      business_id
    });

    await newEmployee.save();
    res.status(201).json({ message: 'Employee added successfully' });

  } catch (err) {
    console.error('❌ Error adding employee:', err);
    res.status(500).json({ error: 'Failed to add employee' });
  }
};

// Update Employee
// exports.updateEmployee = async (req, res) => {
//   const { name, email,phone, password, services_id, business_id } = req.body;

//   try {
//     await Employee.findByIdAndUpdate(req.params.id, {
//       name,
//       email,
//       phone,
//       password,
//       services_id,
//       business_id,
//     });

//     res.json({ message: 'Employee updated' });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };


// old update employee
// exports.updateEmployee = async (req, res) => {
//   const { name, email, phone, password, services_id, business_id } = req.body;

//   try {
//     const updateFields = {
//       name,
//       email,
//       phone,
//       services_id,
//       business_id
//     };

//     // Only hash and update password if it's provided and not empty
//     if (password && password.trim() !== '') {
//       const hashedPassword = await bcrypt.hash(password, 10);
//       updateFields.password = hashedPassword;
//     }

//     await Employee.findByIdAndUpdate(req.params.id, updateFields);
//     res.json({ message: 'Employee updated' });

//   } catch (err) {
//     console.error('❌ Error updating employee:', err);
//     res.status(500).json({ error: err.message });
//   }
// };


exports.updateEmployee = async (req, res) => {
  const {
    name,
    email,
    phone,
    password,
    services_id,
    business_id,
    workingDays,
    workingHours,
    breaks
  } = req.body;

  try {
    const updateFields = {
      name,
      email,
      phone,
      services_id,
      business_id,
      workingDays
    };

    // ✅ Sanitize workingHours (remove nested _id)
    if (workingHours && typeof workingHours === 'object') {
      const sanitizedHours = {};
      for (const [day, val] of Object.entries(workingHours)) {
        sanitizedHours[day] = {
          opensAt: val.opensAt || '',
          closesAt: val.closesAt || ''
        };
      }
      updateFields.workingHours = sanitizedHours;
    }

    // ✅ Sanitize breaks (remove nested _id)
    if (breaks && typeof breaks === 'object') {
      const sanitizedBreaks = {};
      for (const [day, value] of Object.entries(breaks)) {
        sanitizedBreaks[day] = Array.isArray(value)
          ? value.map(b => ({ start: b.start || '', end: b.end || '' }))
          : [];
      }
      updateFields.breaks = sanitizedBreaks;
    }

    // ✅ Optional: update password if present
    if (password && password.trim() !== '') {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateFields.password = hashedPassword;
    }

    // ✅ Update employee
    const updated = await Employee.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.json({
      message: 'Employee updated successfully',
      employee: updated
    });

  } catch (err) {
    console.error('❌ Error updating employee:', err);
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
};

// Delete Employee by ID
exports.deleteEmployee = async (req, res) => {
  try {
    await Employee.findByIdAndDelete(req.params.id);
    res.json({ message: 'Employee deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Bulk Delete Employees
exports.bulkDeleteEmployees = async (req, res) => {
  const ids = req.body.ids;
  if (!Array.isArray(ids)) return res.status(400).json({ error: 'Invalid ID list' });

  try {
    await Employee.deleteMany({ _id: { $in: ids } });
    res.json({ message: 'Employees deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// Employee Login
exports.employeeLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const employee = await Employee.findOne({ email });

    if (!employee) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, employee.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: employee._id, role: 'employee' },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '7d' }
    );

    res.json({
      token,
      employee: {
        id: employee._id,
        name: employee.name,
        email: employee.email,
        phone: employee.phone,
        business_id: employee.business_id,
        services_id: employee.services_id,
      }
    });
  } catch (err) {
    console.error('❌ Error in employeeLogin:', err);
    res.status(500).json({ error: 'Server error' });
  }
};


// Employee Backend end 


// Booking and contact api start

exports.createBooking = async (req, res) => {
  const { serviceId, employeeId, bookingDateTime, contact } = req.body;

  try {
    if (!serviceId || !employeeId || !bookingDateTime || !contact?.name || !contact?.phone) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    let existingContact = await Contact.findOne({
      phone: contact.phone,
      business_id: service.business_id
    });

    if (!existingContact) {
      existingContact = await Contact.create({
        name: contact.name,
        phone: contact.phone,
        email: contact.email || '',
        business_id: service.business_id
      });
    }

    const booking = new Booking({
      serviceId,
      employeeId,
      bookingDateTime,
      contact: existingContact._id,
      business_id: service.business_id,
      created_at: new Date()
    });

    await booking.save();

    // Send Welcome Email
              try {
                const transporter = nodemailer.createTransport({
                  host: process.env.SMTP_HOST,
                  port: Number(process.env.SMTP_PORT),
                  secure: process.env.SMTP_SECURE === 'true',
                  auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
                  }
                });

                const formattedDateTime = new Date(bookingDateTime).toLocaleString('en-US', {
                  timeZone: 'America/New_York',
                  dateStyle: 'medium',
                  timeStyle: 'short'
                });


                 await transporter.sendMail({
                  from: `"Merchant Marvels App" <${process.env.SMTP_USER}>`,
                  to: contact.email,
                  subject: 'Booking Confirmed!',
                  text: `Hi ${contact.name},\n\nYour booking has been successfully confirmed for ${formattedDateTime}.\n\nThank you for choosing us!\n\nBest regards,\nTeam`
                });


                console.log(`✅ Email sent to ${contact.email}`);
              } catch (emailErr) {
                console.error('❌ Email sending failed:', emailErr.message);
                // Optionally do not block registration due to email issue
              }

    res.status(201).json({ message: 'Booking confirmed', booking });
  } catch (err) {
    console.error('❌ Error creating booking:', err);
    res.status(500).json({ error: 'Failed to create booking' });
  }
};


exports.getBookingsForEmployeeByDate = async (req, res) => {
  const { employeeId, date } = req.query;

  if (!employeeId || !date) {
    return res.status(400).json({ error: 'employeeId and date are required' });
  }

  try {
    const start = new Date(`${date}T00:00:00.000Z`);
    const end = new Date(`${date}T23:59:59.999Z`);

    const bookings = await Booking.find({
      employeeId,
      bookingDateTime: { $gte: start, $lte: end }
    });

    res.json(bookings);
  } catch (err) {
    console.error("Error fetching bookings:", err);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
};


// Get All bookings
// exports.getAllBookings = async (req, res) => {
//   try {
//     const getBookings = await Booking.find();
//     console.log('📦 Bookings from DB:', getBookings); // Use 'getBookings' instead of 'services'
//     res.status(200).json(getBookings); // Return 'getBookings' to the client
//   } catch (err) {
//     console.error('❌ Error in Bookings:', err);
//     res.status(500).json({ error: 'Failed to retrieve Bookings' });
//   }
// };

// Get All bookings
exports.getAllBookings = async (req, res) => {
  try {
    const { businessId, employeeId } = req.query;

    // Determine whether to filter by businessId or employeeId
    let filter = {};
    if (businessId) {
      filter.business_id = businessId; // Filter by businessId for admin
    } else if (employeeId) {
      filter.employeeId = employeeId; // Filter by employeeId for employee
    }

    // Fetch bookings based on filter
    const getBookings = await Booking.find(filter);
    console.log('📦 Bookings from DB:', getBookings); // Debugging output
    res.status(200).json(getBookings); // Return the bookings
  } catch (err) {
    console.error('❌ Error in Bookings:', err);
    res.status(500).json({ error: 'Failed to retrieve Bookings' });
  }
};




// Get Contact by ID
exports.getContactById = async (req, res) => {
  const { contactId } = req.query;
  if (!contactId) {
    return res.status(400).json({ error: 'contactId is required' });
  }

  try {
    const contact = await Contact.findById(contactId);
    if (!contact) return res.status(404).json({ error: 'Contact not found' });

    res.json(contact);
  } catch (err) {
    console.error('❌ Error fetching contact:', err);
    res.status(500).json({ error: 'Failed to fetch contact' });
  }
};

// Get All Contacts by Business ID
exports.getContactsByBusinessId = async (req, res) => {
  const { businessId } = req.query;

  if (!businessId) {
    return res.status(400).json({ error: 'businessId is required' });
  }

  try {
    const contacts = await Contact.find({ business_id: businessId }).sort({ created_at: -1 });
    res.status(200).json(contacts);
  } catch (err) {
    console.error('❌ Error fetching contacts:', err);
    res.status(500).json({ error: 'Failed to retrieve contacts' });
  }
};

// Create a new contact
exports.createContact = async (req, res) => {
  const { name, phone, email, business_id } = req.body;

  if (!name || !phone || !business_id) {
    return res.status(400).json({ error: 'Name, phone, and business_id are required' });
  }

  try {
    const newContact = new Contact({ name, phone, email, business_id });
    await newContact.save();
    res.status(201).json(newContact);
  } catch (err) {
    console.error('Error creating contact:', err);
    res.status(500).json({ error: 'Failed to create contact' });
  }
};

// Update Contact
exports.updateContact = async (req, res) => {
  const { id } = req.params;
  const { name, phone, email } = req.body;

  try {
    const updated = await Contact.findByIdAndUpdate(
      id,
      { name, phone, email },
      { new: true }
    );

    if (!updated) return res.status(404).json({ error: 'Contact not found' });

    res.status(200).json({ message: 'Contact updated', contact: updated });
  } catch (err) {
    console.error('❌ Error updating contact:', err);
    res.status(500).json({ error: 'Failed to update contact' });
  }
};

// Delete Contact
exports.deleteContact = async (req, res) => {
  const { id } = req.params;

  try {
    await Contact.findByIdAndDelete(id);
    res.json({ message: 'Contact deleted' });
  } catch (err) {
    console.error('❌ Error deleting contact:', err);
    res.status(500).json({ error: 'Failed to delete contact' });
  }
};

//Bulk upload contacts from CSV
exports.importContactsCsv = async (req, res) => {
  const businessId = req.body.business_id;
  if (!businessId) {
    return res.status(400).json({ error: 'Business ID is required' });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'No CSV file uploaded' });
  }

  const results = [];
  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', (data) => {
      if (data.name && data.phone) {
        results.push({
          name: data.name,
          phone: data.phone,
          email: data.email || '',
          business_id: businessId,
        });
      }
    })
    .on('end', async () => {
      try {
        await Contact.insertMany(results);
        res.status(200).json({ message: 'Contacts imported successfully', count: results.length });
      } catch (error) {
        console.error('Insert error:', error);
        res.status(500).json({ error: 'Error inserting contacts into database' });
      } finally {
        fs.unlinkSync(req.file.path); // Clean up file
      }
    });
};





// Get Service by ID
exports.getServiceById = async (req, res) => {
  const { serviceId } = req.query;
  if (!serviceId) {
    return res.status(400).json({ error: 'serviceId is required' });
  }

  try {
    const service = await Service.findById(serviceId);
    if (!service) return res.status(404).json({ error: 'Service not found' });

    res.json(service);
  } catch (err) {
    console.error('❌ Error fetching service:', err);
    res.status(500).json({ error: 'Failed to fetch service' });
  }
};


// booking and contact api end


// exports.saveBusinessDetail = async (req, res) => {
//   try {
//     const businessId = req.user?.id; // Get from auth middleware
//     const { owner, timezone, workingDays, workingHours } = req.body;

//     if (!businessId || !owner || !timezone || !workingDays || !workingHours) {
//       return res.status(400).json({ error: 'Missing required fields' });
//     }

//     const existing = await BusinessDetail.findOne({ businessId });
//     if (existing) {
//       await BusinessDetail.updateOne({ businessId }, { owner, timezone, workingDays, workingHours });
//       return res.status(200).json({ message: 'Business details updated successfully' });
//     }

//     const detail = new BusinessDetail({
//       businessId,
//       owner,
//       timezone,
//       workingDays,
//       workingHours
//     });

//     await detail.save();
//     res.status(201).json({ message: 'Business details saved successfully' });

//   } catch (err) {
//     console.error('❌ Error saving business detail:', err);
//     res.status(500).json({ error: 'Server error' });
//   }
// };

exports.saveBusinessDetail = async (req, res) => {
  try {
    const { businessId, owner, timezone, workingDays, workingHours } = req.body;

    if (!businessId || !owner || !timezone || !workingDays || !workingHours) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const existing = await BusinessDetail.findOne({ businessId });
    if (existing) {
      await BusinessDetail.updateOne({ businessId }, { owner, timezone, workingDays, workingHours });
      return res.status(200).json({ message: 'Business details updated successfully' });
    }

    const detail = new BusinessDetail({ businessId, owner, timezone, workingDays, workingHours });
    await detail.save();

    res.status(201).json({ message: 'Business details saved successfully' });
  } catch (err) {
    console.error('❌ Error saving business detail:', err);
    res.status(500).json({ error: 'Server error' });
  }
};


exports.getBusinessDetail = async (req, res) => {
  const businessId = req.query.businessId;
  if (!businessId) {
    return res.status(400).json({ error: 'businessId is required' });
  }

  try {
    const detail = await BusinessDetail.findOne({ businessId });
    if (!detail) return res.status(404).json({ error: 'Business detail not found' });

    res.status(200).json(detail);
  } catch (err) {
    console.error('Error fetching business detail:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updateBusinessDetail = async (req, res) => {
  console.log("🔍 Incoming PUT /auth/business-detail body:", req.body);

  const { businessId, disabledDates } = req.body;

  if (!businessId) {
    return res.status(400).json({ error: 'businessId is required' });
  }

  try {
    const update = {};

    if (Array.isArray(disabledDates)) {
      update.disabledDates = disabledDates;
    }

    const updated = await BusinessDetail.findOneAndUpdate(
      { businessId },
      { $set: update },
      { new: true, upsert: false }
    );

    if (!updated) {
      return res.status(404).json({ error: 'Business detail not found' });
    }

    res.status(200).json(updated);
  } catch (err) {
    console.error('Error updating business detail:', err);
    res.status(500).json({ error: 'Server error' });
  }
};


// extra
// exports.saveBusinessDetail = async (req, res) => {
//   const { businessId, owner, timezone, workingDays, workingHours } = req.body;
//   if (!businessId) return res.status(400).json({ error: 'businessId is required' });

//   try {
//     const updated = await BusinessDetail.findOneAndUpdate(
//       { businessId },
//       { owner, timezone, workingDays, workingHours },
//       { upsert: true, new: true }
//     );

//     res.json({ message: 'Business detail saved', data: updated });
//   } catch (err) {
//     console.error('❌ Error saving business detail:', err);
//     res.status(500).json({ error: 'Failed to save business detail' });
//   }
// };

exports.updateEmployeeDisabledDates = async (req, res) => {
  console.log("🔍 Incoming PUT /auth/updateEmployee body:", req.body);

  const { employeeId, disabledDates } = req.body;

  if (!employeeId) {
    return res.status(400).json({ error: 'employeeId is required' });
  }

  try {
    const update = {};

    if (Array.isArray(disabledDates)) {
      update.disabledDates = disabledDates;
    }

    const updated = await Employee.findByIdAndUpdate(
      employeeId,
      { $set: update },
      { new: true, upsert: false }
    );

    if (!updated) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.status(200).json(updated);
  } catch (err) {
    console.error('Error updating employee detail:', err);
    res.status(500).json({ error: 'Server error' });
  }
};


exports.updateBookingStatus = async (req, res) => {
  const { bookingId, status } = req.body;

  if (!bookingId) {
    return res.status(400).json({ error: 'Booking ID and status are required.' });
  }

  try {
    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      { status },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found.' });
    }

    res.json({ message: 'Status updated.', booking });
  } catch (err) {
    console.error('Error updating status:', err);
    res.status(500).json({ error: 'Server error.' });
  }
}

exports.updateBookingServices = async (req, res) => {
  const { bookingId, services, status } = req.body;

  if (!bookingId || !Array.isArray(services) || !status) {
    return res.status(400).json({ error: 'bookingId, services, and status are required.' });
  }

  try {
    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      {
        $set: {
          additionalServices: services.filter(Boolean),
          status: status,
        },
      },
      { new: true }
    );

    if (!updatedBooking) {
      return res.status(404).json({ error: 'Booking not found.' });
    }

    return res.json({ message: 'Booking updated successfully.', booking: updatedBooking });
  } catch (err) {
    console.error('❌ Failed to update booking:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }

}


// exports.createInvoice = async (req, res) => {
//   try {
//     const {
//       bookingId,
//       contactId,
//       businessId,
//       employeeId,
//       serviceIds,
//       miscItems,
//       taxPercent = 0,
//       tipAmount = 0,
//       serviceTotal,
//       miscTotal,
//       paymentMethod,
//       status
//     } = req.body;

//     // Optional: Perform basic manual validation here
//     if (!businessId) return res.status(400).json({ error: 'Missing businessId' });
//     if (!bookingId) return res.status(400).json({ error: 'Missing bookingId' });
//     if (!contactId) return res.status(400).json({ error: 'Missing contactId' });
//     if (!employeeId) return res.status(400).json({ error: 'Missing employeeId' });
//     if (!serviceIds || serviceIds.length === 0) return res.status(400).json({ error: 'At least one service must be selected' });


//     // Create invoice object
//     const invoice = new Invoice({
//       bookingId,
//       contactId,
//       businessId,
//       employeeId,
//       serviceIds,
//       miscItems,
//       taxPercent,
//       tipAmount,
//       serviceTotal,
//       miscTotal,
//       paymentMethod,
//       status
//     });

//     await invoice.save();

//     res.status(201).json({ message: 'Invoice created successfully', invoice });

//   } catch (err) {
//     console.error('❌ Error creating invoice:', err.message, err.stack);

//     if (err.name === 'ValidationError') {
//       return res.status(400).json({ error: 'Validation failed.', details: err.errors });
//     }

//     res.status(500).json({ error: 'Failed to create invoice.', details: err.message });
//   }
// };

// exports.createInvoice = async (req, res) => {
//   try {
//     const {
//       bookingId,
//       contactId,
//       businessId,
//       employeeId,
//       serviceIds,
//       miscItems,
//       taxPercent = 0,
//       tipAmount = 0,
//       serviceTotal,
//       miscTotal,
//       products = [], // <-- new field
//       paymentMethod,
//       status
//     } = req.body;

//     // Basic validation
//     if (!businessId) return res.status(400).json({ error: 'Missing businessId' });
//     if (!bookingId) return res.status(400).json({ error: 'Missing bookingId' });
//     if (!contactId) return res.status(400).json({ error: 'Missing contactId' });
//     if (!employeeId) return res.status(400).json({ error: 'Missing employeeId' });
//     if (!serviceIds || serviceIds.length === 0) return res.status(400).json({ error: 'At least one service must be selected' });

//     // Validate and calculate productsTotal
//     let productsTotal = 0;
//     const cleanedProducts = products.map(prod => {
//       const { productId, name, price_per_unit, quantity } = prod;

//       if (!productId || !name || !price_per_unit || !quantity) {
//         throw new Error('Each product must have productId, name, price_per_unit, and quantity');
//       }

//       const total = price_per_unit * quantity;
//       productsTotal += total;

//       return {
//         productId,
//         name,
//         price_per_unit,
//         quantity,
//         total
//       };
//     });

//     // Create invoice object
//     const invoice = new Invoice({
//       bookingId,
//       contactId,
//       businessId,
//       employeeId,
//       serviceIds,
//       miscItems,
//       taxPercent,
//       tipAmount,
//       serviceTotal,
//       miscTotal,
//       products: cleanedProducts,
//       productsTotal,
//       paymentMethod,
//       status
//     });

//     await invoice.save();

//     res.status(201).json({ message: 'Invoice created successfully', invoice });

//   } catch (err) {
//     console.error('❌ Error creating invoice:', err.message, err.stack);

//     if (err.name === 'ValidationError') {
//       return res.status(400).json({ error: 'Validation failed.', details: err.errors });
//     }

//     res.status(500).json({ error: 'Failed to create invoice.', details: err.message });
//   }
// };



exports.createInvoice = async (req, res) => {
  try {
    const {
      bookingId,
      contactId,
      businessId,
      employeeId,
      serviceIds,
      miscItems,
      taxPercent = 0,
      tipAmount = 0,
      serviceTotal,
      miscTotal,
      products = [],
      paymentMethod,
      status
    } = req.body;

    // Basic validation
    if (!businessId) return res.status(400).json({ error: 'Missing businessId' });
    if (!bookingId) return res.status(400).json({ error: 'Missing bookingId' });
    if (!contactId) return res.status(400).json({ error: 'Missing contactId' });
    if (!employeeId) return res.status(400).json({ error: 'Missing employeeId' });
    if (!serviceIds || serviceIds.length === 0) return res.status(400).json({ error: 'At least one service must be selected' });

    // Fetch business to check inventoryEnabled setting
    const user = await User.findById(businessId);
    if (!user) return res.status(404).json({ error: 'Business user not found' });

    // Validate and calculate productsTotal
    let productsTotal = 0;
    const cleanedProducts = [];

    for (const prod of products) {
      const { productId, name, price_per_unit, quantity } = prod;

      if (!productId || !name || !price_per_unit || !quantity) {
        return res.status(400).json({ error: 'Each product must have productId, name, price_per_unit, and quantity' });
      }

      const total = price_per_unit * quantity;
      productsTotal += total;

      cleanedProducts.push({
        productId,
        name,
        price_per_unit,
        quantity,
        total
      });

      // Inventory validation if enabled
      if (user.inventoryEnabled) {
        const inv = await Inventory.findOne({ business_id: businessId, product: productId });

        if (!inv || inv.quantity_in_stock < quantity) {
          const available = inv ? inv.quantity_in_stock : 0;
          return res.status(400).json({
            error: `Insufficient stock for ${name}. Requested: ${quantity}, Available: ${available}`
          });
        }
      }
    }

    // Save invoice
    const invoice = new Invoice({
      bookingId,
      contactId,
      businessId,
      employeeId,
      serviceIds,
      miscItems,
      taxPercent,
      tipAmount,
      serviceTotal,
      miscTotal,
      products: cleanedProducts,
      productsTotal,
      paymentMethod,
      status
    });

    await invoice.save();

    // Deduct inventory if enabled
    if (user.inventoryEnabled) {
      for (const prod of cleanedProducts) {
        await Inventory.findOneAndUpdate(
          { business_id: businessId, product: prod.productId },
          {
            $inc: { quantity_in_stock: -prod.quantity },
            $set: { last_updated: new Date() }
          }
        );
      }
    }

    

    res.status(201).json({ message: 'Invoice created successfully', invoice });

  } catch (err) {
    console.error('❌ Error creating invoice:', err.message, err.stack);

    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: 'Validation failed.', details: err.errors });
    }

    res.status(500).json({ error: 'Failed to create invoice.', details: err.message });
  }
};


// create inovice with email notification
// exports.createInvoice = async (req, res) => {
//   try {
//     const {
//       bookingId,
//       contactId,
//       businessId,
//       employeeId,
//       serviceIds,
//       miscItems,
//       taxPercent = 0,
//       tipAmount = 0,
//       serviceTotal,
//       miscTotal,
//       products = [],
//       paymentMethod,
//       status,
//       email,  // For sending email
//       name    // For sending email
//     } = req.body;

//     // Basic validation
//     if (!businessId) return res.status(400).json({ error: 'Missing businessId' });
//     if (!bookingId) return res.status(400).json({ error: 'Missing bookingId' });
//     if (!contactId) return res.status(400).json({ error: 'Missing contactId' });
//     if (!employeeId) return res.status(400).json({ error: 'Missing employeeId' });
//     if (!serviceIds || serviceIds.length === 0) {
//       return res.status(400).json({ error: 'At least one service must be selected' });
//     }

//     // Fetch business user to check inventory settings
//     const user = await User.findById(businessId);
//     if (!user) return res.status(404).json({ error: 'Business user not found' });

//     // Validate and calculate product totals
//     let productsTotal = 0;
//     const cleanedProducts = [];

//     for (const prod of products) {
//       const { productId, name, price_per_unit, quantity } = prod;

//       if (!productId || !name || !price_per_unit || !quantity) {
//         return res.status(400).json({ error: 'Each product must have productId, name, price_per_unit, and quantity' });
//       }

//       const total = price_per_unit * quantity;
//       productsTotal += total;

//       cleanedProducts.push({
//         productId,
//         name,
//         price_per_unit,
//         quantity,
//         total
//       });

//       // Inventory validation
//       if (user.inventoryEnabled) {
//         const inv = await Inventory.findOne({ business_id: businessId, product: productId });

//         if (!inv || inv.quantity_in_stock < quantity) {
//           const available = inv ? inv.quantity_in_stock : 0;
//           return res.status(400).json({
//             error: `Insufficient stock for ${name}. Requested: ${quantity}, Available: ${available}`
//           });
//         }
//       }
//     }

//     // Create and save invoice
//     const invoice = new Invoice({
//       bookingId,
//       contactId,
//       businessId,
//       employeeId,
//       serviceIds,
//       miscItems,
//       taxPercent,
//       tipAmount,
//       serviceTotal,
//       miscTotal,
//       products: cleanedProducts,
//       productsTotal,
//       paymentMethod,
//       status
//     });

//     await invoice.save();

//     // Deduct inventory if enabled
//     if (user.inventoryEnabled) {
//       for (const prod of cleanedProducts) {
//         await Inventory.findOneAndUpdate(
//           { business_id: businessId, product: prod.productId },
//           {
//             $inc: { quantity_in_stock: -prod.quantity },
//             $set: { last_updated: new Date() }
//           }
//         );
//       }
//     }

//     // Send Welcome Email (if email & name provided)
//     if (email && name) {
//       try {
//         const transporter = nodemailer.createTransport({
//           host: process.env.SMTP_HOST,
//           port: Number(process.env.SMTP_PORT),
//           secure: process.env.SMTP_SECURE === 'true',
//           auth: {
//             user: process.env.SMTP_USER,
//             pass: process.env.SMTP_PASS
//           }
//         });

//         await transporter.sendMail({
//           from: `"Merchant Marvels App" <${process.env.SMTP_USER}>`,
//           to: email,
//           subject: 'Welcome to Merchant Marvels!',
//           text: `Hello ${name},

// Welcome to Merchant Marvels! We're excited to have you on board.

// Your invoice has been successfully created, and we're here to support your business every step of the way.

// If you have any questions, feel free to reach out.

// Best regards,
// The Merchant Marvels Team`,
//           html: `
//             <p>Hello <strong>${name}</strong>,</p>
//             <p>Welcome to <strong>Merchant Marvels</strong>! We're excited to have you on board.</p>
//             <p>Your invoice has been successfully created, and we're here to support your business every step of the way.</p>
//             <p>If you have any questions, feel free to reach out.</p>
//             <br />
//             <p>Best regards,<br />The Merchant Marvels Team</p>
//           `
//         });

//         console.log(`✅ Welcome email sent to ${email}`);
//       } catch (emailErr) {
//         console.error('❌ Failed to send welcome email:', emailErr.message);
//         // Do not block invoice creation due to email failure
//       }
//     }

//     // Success response
//     res.status(201).json({
//       message: 'Invoice has been successfully created.',
//       invoice: {
//         id: invoice._id,
//         bookingId: invoice.bookingId,
//         contactId: invoice.contactId,
//         businessId: invoice.businessId,
//         employeeId: invoice.employeeId,
//         serviceIds: invoice.serviceIds,
//         miscItems: invoice.miscItems,
//         taxPercent: invoice.taxPercent,
//         tipAmount: invoice.tipAmount,
//         serviceTotal: invoice.serviceTotal,
//         miscTotal: invoice.miscTotal,
//         products: invoice.products,
//         productsTotal: invoice.productsTotal,
//         paymentMethod: invoice.paymentMethod,
//         status: invoice.status,
//         createdAt: invoice.createdAt
//       }
//     });

//   } catch (err) {
//     console.error('❌ Error creating invoice:', err.message, err.stack);

//     if (err.name === 'ValidationError') {
//       return res.status(400).json({ error: 'Validation failed.', details: err.errors });
//     }

//     res.status(500).json({ error: 'Failed to create invoice.', details: err.message });
//   }
// };




exports.getInvoicesByBusinessId = async (req, res) => {
  const { businessId } = req.query;

  if (!businessId) {
    return res.status(400).json({ error: 'businessId is required' });
  }

  try {
    const invoices = await Invoice.find({ businessId });

    if (!invoices || invoices.length === 0) {
      return res.status(404).json({ error: 'No invoices found for this business' });
    }

    res.json(invoices);
  } catch (err) {
    console.error('❌ Error fetching invoices:', err);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
};


// ================= Category =================
exports.getCategoriesByBusinessId = async (req, res) => {
  try {
    const { businessId } = req.params;

    if (!businessId) {
      return res.status(400).json({ error: 'Business ID is required' });
    }

    const categories = await Category.find({ business_id: businessId });

    if (!categories.length) {
      return res.status(404).json({ message: 'No categories found for this business' });
    }

    return res.status(200).json({ categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};




exports.createCategory = async (req, res) => {
   console.log('📦 Incoming body:', req.body);
  const { name, description, business_id  } = req.body;

  if (!name || !business_id) {
    return res.status(400).json({ error: 'Name and businessId are required' });
  }

  try {
    const newCategory = await Category.create({
      name,
      description,
     business_id // ✅ Correct field for the schema
    });

    res.status(201).json(newCategory);
  } catch (err) {
    console.error('Error creating category:', err);
    res.status(500).json({ error: 'Failed to create category' });
  }
};


exports.updateCategory = async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;

  try {
    const updated = await Category.findByIdAndUpdate(
      id,
      { name, description },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    console.error('Error updating category:', err);
    res.status(500).json({ error: 'Failed to update category' });
  }
};

exports.deleteCategory = async (req, res) => {
  const { id } = req.params;

  try {
    await Category.findByIdAndDelete(id);
    res.json({ message: 'Category deleted' });
  } catch (err) {
    console.error('Error deleting category:', err);
    res.status(500).json({ error: 'Failed to delete category' });
  }
};


// ================= Product =================

exports.getProductsByBusinessId = async (req, res) => {
  try {
    const { businessId } = req.params;

    if (!businessId) {
      return res.status(400).json({ error: 'Business ID is required' });
    }

    const products = await Product.find({ business_id: businessId }).populate('category');

    if (!products.length) {
      return res.status(404).json({ message: 'No products found for this business' });
    }

    return res.status(200).json({ products });
  } catch (error) {
    console.error('Error fetching products:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.createProduct = async (req, res) => {
  console.log('🛒 Incoming product body:', req.body);
  const { name, category, unit, price_per_unit, business_id } = req.body;

  if (!name || !category || !unit || price_per_unit === undefined || !business_id) {
    return res.status(400).json({ error: 'All fields and business_id are required' });
  }

  try {
    const newProduct = await Product.create({
      name,
      category,
      unit,
      price_per_unit,
      business_id, // aligned field name
    });

    res.status(201).json(newProduct);
  } catch (err) {
    console.error('Error creating product:', err);
    res.status(500).json({ error: 'Failed to create product' });
  }
};

exports.updateProduct = async (req, res) => {
  const { id } = req.params;
  const { name, category, unit, price_per_unit } = req.body;

  try {
    const updated = await Product.findByIdAndUpdate(
      id,
      { name, category, unit, price_per_unit },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(500).json({ error: 'Failed to update product' });
  }
};

exports.deleteProduct = async (req, res) => {
  const { id } = req.params;

  try {
    await Product.findByIdAndDelete(id);
    res.json({ message: 'Product deleted' });
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({ error: 'Failed to delete product' });
  }
};


// 🔍 Search Products by name and business_id
exports.searchProducts = async (req, res) => {
  const { query, businessId } = req.query;

  if (!query || !businessId) {
    return res.status(400).json({ error: 'Both query and businessId are required' });
  }

  try {
    const regex = new RegExp(query, 'i'); // case-insensitive regex
    const products = await Product.find({
      business_id: businessId,
      name: regex
    }).select('_id name price_per_unit');

    res.status(200).json(products);
  } catch (err) {
    console.error('❌ Error in searchProducts:', err);
    res.status(500).json({ error: 'Failed to search products' });
  }
};

// Inventory Backend apis

// GET inventory for business
exports.getInventoryByBusiness = async (req, res) => {
  try {
    const { businessId } = req.params;

    const inventory = await Inventory.find({ businessId });
    res.status(200).json({ inventory });
  } catch (err) {
    console.error('Error fetching inventory:', err);
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
};

// POST: sync inventory with all products (add missing ones)
exports.syncInventory = async (req, res) => {
  try {
    const { businessId, productIds, defaultQuantity = 1 } = req.body;

    if (!businessId || !Array.isArray(productIds)) {
      return res.status(400).json({ error: 'Missing businessId or productIds' });
    }

    // Fetch existing inventory records
    const existing = await Inventory.find({ business_id: businessId });
    const existingProductIds = new Set(existing.map(item => item.product.toString()));

    // Find products not in inventory yet
    const newEntries = productIds
      .filter(id => !existingProductIds.has(id))
      .map(id => ({
        business_id: businessId,
        product: id,
        quantity_in_stock: defaultQuantity,
        last_updated: new Date()
      }));

    if (newEntries.length > 0) {
      await Inventory.insertMany(newEntries);
    }

    // Fetch updated inventory
    const fullInventory = await Inventory.find({ business_id: businessId });

    res.status(200).json({
      message: 'Inventory synced successfully',
      added: newEntries.length,
      inventory: fullInventory
    });
  } catch (err) {
    console.error('❌ Error syncing inventory:', err);
    res.status(500).json({ error: 'Failed to sync inventory' });
  }
};

// PUT: update quantity of a product
exports.updateInventoryQuantity = async (req, res) => {
  try {
    const { businessId, productId, quantity } = req.body;

    if (!businessId || !productId || typeof quantity !== 'number') {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const updated = await Inventory.findOneAndUpdate(
      { business_id: businessId, product: productId },
      {
        quantity_in_stock: quantity,
        last_updated: new Date()
      },
      { new: true, upsert: true }
    );

    res.status(200).json({ message: 'Quantity updated', inventory: updated });
  } catch (err) {
    console.error('Error updating quantity:', err);
    res.status(500).json({ error: 'Failed to update quantity' });
  }
};


// GET current inventoryEnabled status
exports.getInventoryStatus = async (req, res) => {
  const { businessId } = req.params;
  const user = await User.findById(businessId);
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ inventoryEnabled: user.inventoryEnabled || false });
};

// PUT toggle inventoryEnabled
exports.updateInventoryStatus = async (req, res) => {
  const { businessId } = req.params;
  const { inventoryEnabled } = req.body;
  const user = await User.findByIdAndUpdate(
    businessId,
    { inventoryEnabled },
    { new: true }
  );
  res.json({ inventoryEnabled: user.inventoryEnabled });
};


// Send Mail Normal 
exports.sendMail = async (req, res) => {
  const { to, subject, text } = req.body;

  if (!to || !subject || !text) {
    return res.status(400).json({ error: 'Missing email, subject or message body' });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for 587
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    await transporter.sendMail({
      from: `"Merchant Marvels App" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text
    });

    res.status(200).json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('Email error:', error);
    res.status(500).json({ error: 'Failed to send email', details: error.message });
  }
};

// Send Mail schedule  
// exports.sendMail = async (req, res) => {
//   const { to, subject, text, scheduledTime } = req.body;

//   if (!to || !subject || !text || !scheduledTime) {
//     return res.status(400).json({ error: 'Missing required fields: to, subject, text, or scheduledTime' });
//   }

//   // Convert scheduledTime (ISO string) to Eastern Time and then to JS Date
//   const scheduledDateTime = DateTime.fromISO(scheduledTime, { zone: 'America/New_York' });

//   // Check if the time is valid and in the future (in EST)
//   if (!scheduledDateTime.isValid) {
//     return res.status(400).json({ error: 'Invalid scheduled time format' });
//   }

//   if (scheduledDateTime.toMillis() <= Date.now()) {
//     return res.status(400).json({ error: 'Scheduled time must be in the future' });
//   }

//   const transporter = nodemailer.createTransport({
//     host: process.env.SMTP_HOST,
//     port: process.env.SMTP_PORT,
//     secure: process.env.SMTP_SECURE === 'true',
//     auth: {
//       user: process.env.SMTP_USER,
//       pass: process.env.SMTP_PASS
//     }
//   });

//   schedule.scheduleJob(scheduledDateTime.toJSDate(), async () => {
//     try {
//       await transporter.sendMail({
//         from: `"Merchant Marvels App" <${process.env.SMTP_USER}>`,
//         to,
//         subject,
//         text
//       });
//       console.log(`✅ Scheduled email sent to ${to}`);
//     } catch (error) {
//       console.error('❌ Scheduled email error:', error);
//     }
//   });

//   res.status(200).json({ message: 'Email scheduled successfully' });
// };



exports.requestPasswordReset = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const token = crypto.randomBytes(32).toString('hex');
    const expiry = Date.now() + 60 * 60 * 1000; // 1 hour

    user.reset_token = token;
    user.reset_token_expiry = expiry;
    await user.save();

    const resetLink = `https://yourfrontend.com/reset-password?token=${token}`;

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    await transporter.sendMail({
      from: `"Support" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Password Reset Request',
      html: `<p>Click below to reset your password:</p><a href="${resetLink}">${resetLink}</a>`
    });

    res.json({ message: 'Reset link sent to email' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};


// amazon ses mail
exports.sendSesEmail = async (req, res) => {
  const { to, subject, text } = req.body;

  if (!to || !subject || !text) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const params = {
    Source: 'admin@ringenioussolutions.com', // Replace with your verified email in SES
    Destination: {
      ToAddresses: [to],
    },
    Message: {
      Subject: {
        Charset: 'UTF-8',
        Data: subject,
      },
      Body: {
        Text: {
          Charset: 'UTF-8',
          Data: text,
        },
        Html: {
          Charset: 'UTF-8',
          Data: `<p>${text}</p>`, // Optional HTML version
        },
      },
    },
  };

  try {
    const result = await ses.sendEmail(params).promise();
    console.log('Email sent:', result);
    res.status(200).json({ message: 'Email sent successfully!' });
  } catch (error) {
    console.error('SES Error:', error);
    res.status(500).json({ message: 'Failed to send email.', error });
  }
};



