import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Register from './pages/Register';
import Login from './pages/Login';
import Index from './pages';
import EmployeeLogin from './pages/employeeLogin'; // Assuming you have an Employees component
// import ContactForm from './pages/sendEmail'; 
// import SendEmail from './pages/emailApi'; // Assuming you have an Employees component
import Booking from './pages/booking'; // Assuming you have an Employees component
import AddBusinessDetail from './pages/AddBusinessDetail'; // Assuming you have an Employees component
import UpdateBusinessDetail from './pages/UpdateBusinessDetail'; // Assuming you have an Employees component
import SendEmail from './pages/SendEmail'; // Assuming you have an Employees component
import ResetPasswordRequest from './pages/ResetPasswordRequest'; // Assuming you have a ResetPasswordRequest component
import SendsesEmail from './pages/emailApi'; // Assuming you have an Employees component





function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/Emplogin" element={<EmployeeLogin />} />
        {/* <Route path="/email" element={<ContactForm />} /> */}
        <Route path="/emailApi" element={<SendsesEmail />} />
        <Route path="/booking" element={<Booking />} />
        <Route path="/booking/:businessId" element={<Booking />} />
        <Route path="/business_detail" element={<AddBusinessDetail />} />
        <Route path="/ubd" element={<UpdateBusinessDetail />} />
        <Route path="/send-mail" element={<SendEmail />} />
        <Route path="/reset-password" element={<ResetPasswordRequest />} />
        {/* Add Home or Dashboard later */}
      </Routes>
    </Router>
  );
}

export default App;



