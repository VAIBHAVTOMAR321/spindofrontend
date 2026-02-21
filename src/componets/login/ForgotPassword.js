import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Modal, Button } from 'react-bootstrap';
import "../../assets/css/login.css";

const ForgotPassword = () => {
  // State for Step 1: Mobile Input
  const [step, setStep] = useState(1); // 1: Mobile, 2: OTP, 3: Password Reset
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('customer');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // UI State
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const navigate = useNavigate();

  // Validation Functions
  const validatePhone = (phoneNumber) => {
    const phoneRegex = /^\d{10}$/;
    return phoneRegex.test(phoneNumber);
  };

  const validatePassword = (password) => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  };

  // Step 1: Send OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!phone.trim()) {
      setError('Mobile number is required');
      return;
    }

    if (!validatePhone(phone)) {
      setError('Mobile number must be 10 digits');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('https://mahadevaaya.com/spindo/spindobackend/api/send-otp/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone: phone }),
      });

      const data = await response.json();

      if (!response.ok) {
        let errorMsg = data.message || `Request failed with status ${response.status}`;
        if (data.errors && typeof data.errors === 'object') {
          errorMsg = Object.entries(data.errors)
            .map(([field, msgs]) => {
              return Array.isArray(msgs) ? msgs.join(', ') : msgs;
            })
            .join(' | ');
        }
        throw new Error(errorMsg);
      }

      if (data.success === true) {
        alert('OTP sent successfully to your phone');
        setShowOtpModal(true);
        setStep(2);
      } else {
        throw new Error(data.message || 'Failed to send OTP');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while sending OTP');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!otp.trim()) {
      setError('OTP is required');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('https://mahadevaaya.com/spindo/spindobackend/api/verify-otp/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          phone: phone,
          otp: otp 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        let errorMsg = data.message || `Request failed with status ${response.status}`;
        if (data.errors && typeof data.errors === 'object') {
          errorMsg = Object.entries(data.errors)
            .map(([field, msgs]) => {
              return Array.isArray(msgs) ? msgs.join(', ') : msgs;
            })
            .join(' | ');
        }
        throw new Error(errorMsg);
      }

      if (data.success === true) {
        setSuccessMessage('OTP verified successfully');
        setShowOtpModal(false);
        setOtp('');
        setStep(3);
      } else {
        throw new Error(data.message || 'OTP verification failed');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while verifying OTP');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!newPassword.trim()) {
      setError('New password is required');
      return;
    }

    if (!validatePassword(newPassword)) {
      setError('Password must be at least 8 characters with uppercase, lowercase, number, and special character');
      return;
    }

    if (!confirmPassword.trim()) {
      setError('Confirm password is required');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('https://mahadevaaya.com/spindo/spindobackend/api/reset/password/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          phone: phone,
          role: role,
          new_password: newPassword
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        let errorMsg = data.message || `Request failed with status ${response.status}`;
        if (data.errors && typeof data.errors === 'object') {
          errorMsg = Object.entries(data.errors)
            .map(([field, msgs]) => {
              return Array.isArray(msgs) ? msgs.join(', ') : msgs;
            })
            .join(' | ');
        }
        setError(errorMsg);
        setSuccessMessage('');
        return;
      }

      if (data.success === true) {
        setSuccessMessage(data.message || 'Password reset successfully! Redirecting to login...');
        setError('');
        setTimeout(() => {
          navigate('/Login', { replace: true });
        }, 2000);
      } else {
        setError(data.message || 'Password reset failed');
        setSuccessMessage('');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while resetting password');
      setSuccessMessage('');
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleCloseModal = () => {
    setShowOtpModal(false);
  };

  return (
    <Container className='login-box-two'>
      <Container className='login-con'>
        <div className="login-container">
          <div className="login-background"></div>
          <div className="login-box">
            <div className="login-header">
              <h1>Forgot Password</h1>
            </div>

            {/* Display error message if it exists */}
            {error && <div className="error-message">{error}</div>}
            {successMessage && <div className="success-message">{successMessage}</div>}

            {/* Step 1: Mobile Number Input */}
            {step === 1 && (
              <form onSubmit={handleSendOtp} className="login-form">
                <div className="form-group">
                  <label htmlFor="role">Select Role</label>
                  <select
                    id="role"
                    value={role}
                    onChange={e => setRole(e.target.value)}
                    disabled={isLoading}
                  >
                    <option value="customer">Customer</option>
                    <option value="admin">Admin</option>
                    <option value="staffadmin">Staff Admin</option>
                    <option value="vendor">Vendor</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="phone">Mobile Number</label>
                  <input
                    type="text"
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter 10-digit mobile number"
                    disabled={isLoading}
                    maxLength="10"
                  />
                </div>
                <div className="d-flex justify-content-center">
                  <button type="submit" className="login-button" disabled={isLoading}>
                    {isLoading ? (
                      <div className="loading-spinner">
                        <div className="spinner"></div>
                        <span>Sending OTP...</span>
                      </div>
                    ) : (
                      'Send OTP'
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Step 3: Reset Password Form */}
            {step === 3 && (
              <form onSubmit={handleResetPassword} className="login-form">
                <div className="form-group">
                  <label htmlFor="newPassword">New Password</label>
                  <div className="password-input-container">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="newPassword"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={togglePasswordVisibility}
                      disabled={isLoading}
                    >
                      <i className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
                    </button>
                  </div>
                  <small className="password-hint">Min 8 chars, uppercase, lowercase, number, special char (@$!%*?&)</small>
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm Password</label>
                  <div className="password-input-container">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm password"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={toggleConfirmPasswordVisibility}
                      disabled={isLoading}
                    >
                      <i className={`fas ${showConfirmPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
                    </button>
                  </div>
                </div>

                <div className="d-flex justify-content-center">
                  <button type="submit" className="login-button" disabled={isLoading}>
                    {isLoading ? (
                      <div className="loading-spinner">
                        <div className="spinner"></div>
                        <span>Resetting...</span>
                      </div>
                    ) : (
                      'Change Password'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </Container>

      {/* OTP Modal */}
      <Modal show={showOtpModal} onHide={handleCloseModal} centered backdrop="static" keyboard={false}>
        <Modal.Header closeButton>
          <Modal.Title>Verify OTP</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <form onSubmit={handleVerifyOtp}>
            {error && <div className="error-message">{error}</div>}
            <div className="form-group">
              <label htmlFor="otp">Enter OTP</label>
              <input
                type="text"
                id="otp"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter 6-digit OTP"
                disabled={isLoading}
                maxLength="6"
                autoFocus
              />
            </div>
            <div className="d-flex gap-2 justify-content-end">
              <Button 
                variant="secondary" 
                onClick={handleCloseModal}
                disabled={isLoading}
              >
                Back
              </Button>
              <Button 
                variant="primary" 
                onClick={handleVerifyOtp}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Verifying...
                  </>
                ) : (
                  'Verify OTP'
                )}
              </Button>
            </div>
          </form>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default ForgotPassword;
