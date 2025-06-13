const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const multer = require('multer');  // Import multer to handle file uploads


// Set up multer to handle CSV file uploads (with file size limit)
const upload = multer({ 
    dest: 'uploads/', 
    limits: { fileSize: 10 * 1024 * 1024 } // Limit the file size to 10MB (you can adjust this value)
  });

// Auth Routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Service Routes
router.get('/services', authController.getAllServices);
router.post('/postService', authController.postService);
router.delete('/services/:id', authController.deleteService);
router.put('/services/:id', authController.updateService);
router.post('/services/bulk-delete', authController.bulkDeleteServices);
// POST /uploadCsv - Upload CSV and process
router.post('/uploadCsv', upload.single('file'), authController.uploadCsv);

router.get('/employees', authController.getAllEmployees);
router.post('/employees', authController.postEmployee);
router.put('/employees/:id', authController.updateEmployee);
router.get('/employees/:id', authController.getEmployeeById);
router.delete('/employees/:id', authController.deleteEmployee);
router.post('/employees/bulk-delete', authController.bulkDeleteEmployees);
router.post('/employee-login', authController.employeeLogin);
router.post('/bookings', authController.createBooking);
router.get('/bookings', authController.getBookingsForEmployeeByDate);
router.get('/getAllBookings', authController.getAllBookings);

// Contact  Routes
router.post('/contacts', authController.createContact);
router.get('/getContactById', authController.getContactById);
router.get('/contacts', authController.getContactsByBusinessId);
router.put('/contacts/:id', authController.updateContact);
router.delete('/contacts/:id', authController.deleteContact);
router.post('/contacts/import', upload.single('file'), authController.importContactsCsv);


router.get('/getServiceById', authController.getServiceById);
router.post('/business-detail', authController.saveBusinessDetail);
// router.post('/business-detail', verifyToken, authController.saveBusinessDetail);
router.get('/business-detail', authController.getBusinessDetail);
router.put('/business-detail', authController.updateBusinessDetail);
router.put('/updateEmployee', authController.updateEmployeeDisabledDates);
router.put('/updateBookingStatus', authController.updateBookingStatus);
router.put('/updateBookingServices', authController.updateBookingServices);
router.post('/createInvoice', authController.createInvoice);
router.get('/invoices', authController.getInvoicesByBusinessId);

// Category Routes
router.get('/categories/:businessId', authController.getCategoriesByBusinessId);
router.post('/categories', authController.createCategory);
router.put('/categories/:id', authController.updateCategory);
router.delete('/categories/:id', authController.deleteCategory);

router.get('/products/search', authController.searchProducts);

// Product Routes
// router.get('/products', authController.getProductsByBusinessId);
// router.post('/products', authController.createProduct);
// router.put('/products/:id', authController.updateProduct);
// router.delete('/products/:id', authController.deleteProduct);

router.get('/products/:businessId', authController.getProductsByBusinessId);
router.post('/products', authController.createProduct);
router.put('/products/:id', authController.updateProduct);
router.delete('/products/:id', authController.deleteProduct);

// Inventory routes
router.get('/inventory/:businessId', authController.getInventoryByBusiness);
router.post('/inventory/sync', authController.syncInventory);
router.put('/inventory', authController.updateInventoryQuantity);

router.get('/inventory/status/:businessId', authController.getInventoryStatus);
router.put('/inventory/status/:businessId', authController.updateInventoryStatus);

router.post('/send-email', authController.sendMail);
router.post('/request-reset', authController.requestPasswordReset);
router.post('/send-ses-email', authController.sendSesEmail);



module.exports = router;
