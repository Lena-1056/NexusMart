import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import DeliveryDashboard from './DeliveryDashboard';
import Login from './Login';
import Register from './Register';

function ProtectedRoute({ children }) {
  const courier = JSON.parse(localStorage.getItem('courier'));
  return courier ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DeliveryDashboard />
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;
