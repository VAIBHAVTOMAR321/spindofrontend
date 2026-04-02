import React, { useState } from 'react';
import { Modal, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import axios from 'axios';

// API base URL
const API_BASE_URL = 'https://mahadevaaya.com/spindo/spindobackend/api';

const VendorRegistrationModal = ({ show, onHide, onLoginRedirect }) => {
  // Modal step states: 'mobile' | 'otp' | 'register'
  const [step, setStep] = useState('mobile');
  
  // Form data
  const [formData, setFormData] = useState({
    mobile_number: '',
    username: '',
    password: '',
    confirmPassword: ''
  });
  
  // OTP data
  const [otp, setOtp] = useState('');
  
  // UI states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    valid: false
  });

  // Reset modal state
  const resetModal = () => {
    setStep('mobile');
    setFormData({
      mobile_number: '',
      username: '',
      password: '',
      confirmPassword: ''
    });
    setOtp('');
    setError('');
    setSuccess('');
    setPasswordStrength({
      length: false,
      uppercase: false,
      lowercase: false,
      number: false,
      valid: false
    });
    setRegisteredNumbers([]);
  };

  // Handle modal close
  const handleClose = () => {
    resetModal();
    onHide();
  };

  // Handle mobile number input
  const handleMobileChange = (e) => {
    const digitsOnly = e.target.value.replace(/\D/g, '').substring(0, 10);
    setFormData(prev => ({ ...prev, mobile_number: digitsOnly }));
    setError('');
  };

  // Handle username input - prevent numbers
  const handleUsernameChange = (e) => {
    const textOnly = e.target.value.replace(/[0-9]/g, '');
    setFormData(prev => ({ ...prev, username: textOnly }));
    setError('');
  };

  // Handle password with validation
  const handlePasswordChange = (e) => {
    const { value } = e.target;
    setFormData(prev => ({ ...prev, password: value }));
    
    const strength = {
      length: value.length >= 6,
      uppercase: /[A-Z]/.test(value),
      lowercase: /[a-z]/.test(value),
      number: /\d/.test(value),
      valid: value.length >= 6 && /[A-Z]/.test(value) && /[a-z]/.test(value) && /\d/.test(value)
    };
    setPasswordStrength(strength);
    setError('');
  };

  // Handle confirm password
  const handleConfirmPasswordChange = (e) => {
    setFormData(prev => ({ ...prev, confirmPassword: e.target.value }));
    setError('');
  };

  // Handle OTP input
  const handleOtpChange = (e) => {
    const digitsOnly = e.target.value.replace(/\D/g, '').substring(0, 6);
    setOtp(digitsOnly);
    setError('');
  };

// State to store registered numbers from API
  const [registeredNumbers, setRegisteredNumbers] = useState([]);

  // Step 1: Check if mobile exists and send OTP
  const handleMobileSubmit = async (e) => {
    e.preventDefault();
    
    // Validate mobile
    if (!formData.mobile_number || formData.mobile_number.length !== 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // First, get the list of registered numbers from the API
      const checkResponse = await axios.get(
        `${API_BASE_URL}/ven-reg-mobile/`
      );

      // Extract the registered numbers from the API response
      let registeredNums = [];
      if (checkResponse.data && checkResponse.data.mobile_number) {
        registeredNums = checkResponse.data.mobile_number;
        setRegisteredNumbers(registeredNums);
      }

      // Check if the entered number is in the registered list
      if (registeredNums.includes(formData.mobile_number)) {
        setError('Vendor with this number already registered, please login');
        setIsLoading(false);
        return;
      }

      // If not registered, send OTP
      const sendOtpResponse = await axios.post(
        `${API_BASE_URL}/send-otp/`,
        { phone: formData.mobile_number }
      );

      if (sendOtpResponse.data.status === true || sendOtpResponse.data.success) {
        setStep('otp');
        setSuccess(`OTP sent to ${formData.mobile_number}`);
      } else {
        setError(sendOtpResponse.data.message || 'Failed to send OTP. Please try again.');
      }
    } catch (err) {
      console.error('Mobile check error:', err);
      if (err.response) {
        // If the API returns 404, it might mean no vendors registered yet, try sending OTP
        if (err.response.status === 404) {
          try {
            const sendOtpResponse = await axios.post(
              `${API_BASE_URL}/send-otp/`,
              { mobile_number: formData.mobile_number }
            );
            if (sendOtpResponse.data.status === true || sendOtpResponse.data.success) {
              setStep('otp');
              setSuccess(`OTP sent to ${formData.mobile_number}`);
            } else {
              setError(sendOtpResponse.data.message || 'Failed to send OTP. Please try again.');
            }
          } catch (otpErr) {
            setError(otpErr.response?.data?.message || 'Failed to send OTP. Please try again.');
          }
        } else {
          setError(err.response?.data?.message || 'Failed to check mobile number. Please try again.');
        }
      } else {
        setError('Network error. Please check your connection.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleOtpSubmit = async (e) => {
    e.preventDefault();

    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const verifyResponse = await axios.post(
        `${API_BASE_URL}/verify-otp/`,
        {
          phone: formData.mobile_number,
          otp: otp
        }
      );

      if (verifyResponse.data.status === true || verifyResponse.data.success) {
        setStep('register');
        setSuccess('OTP verified successfully');
      } else {
        setError(verifyResponse.data.message || 'Invalid OTP. Please try again.');
      }
    } catch (err) {
      console.error('OTP verification error:', err);
      setError(err.response?.data?.message || 'Invalid OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Complete registration
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {};

    // Validate username
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (!/^[a-zA-Z\s]+$/.test(formData.username)) {
      newErrors.username = 'Username should only contain letters';
    } else if (formData.username.trim().length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    // Validate password
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (!passwordStrength.valid) {
      newErrors.password = 'Password must contain uppercase, lowercase, and number';
    }

    // Validate confirm password
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(newErrors).length > 0) {
      setError(newErrors.username || newErrors.password || newErrors.confirmPassword);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const payload = {
        username: formData.username,
        mobile_number: formData.mobile_number,
        password: formData.password
      };

      // Use correct field name for vendor registration API
      payload.mobile_number = formData.mobile_number;

      const response = await axios.post(
        `${API_BASE_URL}/vendor-reg/`,
        payload
      );

      if (response.data.status === true || response.data.success) {
        setSuccess('Registration successful! Please login.');
        setTimeout(() => {
          handleClose();
          if (onLoginRedirect) {
            onLoginRedirect();
          }
        }, 2000);
      } else {
        setError(response.data.message || 'Registration failed. Please try again.');
      }
    } catch (err) {
      console.error('Registration error:', err);
      if (err.response?.data?.errors) {
        const errorMessages = Object.entries(err.response.data.errors)
          .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
          .join('; ');
        setError(errorMessages);
      } else {
        setError(err.response?.data?.message || 'Registration failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Go back to mobile step
  const handleBackToMobile = () => {
    setStep('mobile');
    setOtp('');
    setSuccess('');
    setError('');
  };

  return (
    <Modal show={show} onHide={handleClose} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          {step === 'mobile' && 'Vendor Registration'}
          {step === 'otp' && 'Verify OTP'}
          {step === 'register' && 'Complete Registration'}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {/* Error Alert */}
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Success Alert */}
        {success && step === 'otp' && (
          <Alert variant="success" dismissible onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        {/* Step 1: Mobile Number Entry */}
        {step === 'mobile' && (
          <Form onSubmit={handleMobileSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Mobile Number</Form.Label>
              <Form.Control
                type="tel"
                placeholder="Enter 10-digit mobile number"
                value={formData.mobile_number}
                onChange={handleMobileChange}
                maxLength={10}
                disabled={isLoading}
              />
              <Form.Text className="text-muted">
                Enter exactly 10 digits
              </Form.Text>
            </Form.Group>
            
            <div className="d-flex gap-2">
              <Button variant="secondary" onClick={handleClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={isLoading || formData.mobile_number.length !== 10}>
                {isLoading ? (
                  <>
                    <Spinner size="sm" className="me-2" />
                    Checking...
                  </>
                ) : (
                  'Send OTP'
                )}
              </Button>
            </div>
          </Form>
        )}

        {/* Step 2: OTP Verification */}
        {step === 'otp' && (
          <Form onSubmit={handleOtpSubmit}>
            <Alert variant="info" className="mb-3">
              <div>OTP sent to: <strong>{formData.mobile_number}</strong></div>
              <Button 
                variant="link" 
                size="sm" 
                className="p-0 mt-2"
                onClick={handleBackToMobile}
              >
                Change number
              </Button>
            </Alert>

            <Form.Group className="mb-3">
              <Form.Label>Enter OTP</Form.Label>
              <Form.Control
                type="tel"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={handleOtpChange}
                maxLength={6}
                disabled={isLoading}
              />
              <Form.Text className="text-muted">
                Enter the 6-digit OTP sent to your mobile
              </Form.Text>
            </Form.Group>

            <div className="d-flex gap-2">
              <Button variant="secondary" onClick={handleBackToMobile} disabled={isLoading}>
                Back
              </Button>
              <Button variant="primary" type="submit" disabled={isLoading || otp.length !== 6}>
                {isLoading ? (
                  <>
                    <Spinner size="sm" className="me-2" />
                    Verifying...
                  </>
                ) : (
                  'Verify OTP'
                )}
              </Button>
            </div>
          </Form>
        )}

        {/* Step 3: Complete Registration */}
        {step === 'register' && (
          <Form onSubmit={handleRegisterSubmit}>
            <Alert variant="success" className="mb-3">
              OTP verified successfully! Please complete your registration.
            </Alert>

            <div className="mb-2 text-muted small">
              Mobile: <strong>{formData.mobile_number}</strong>
            </div>

            <Form.Group className="mb-3">
              <Form.Label>Username</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter your full name"
                value={formData.username}
                onChange={handleUsernameChange}
                disabled={isLoading}
              />
              <Form.Text className="text-muted">
                Only letters and spaces are allowed
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Password</Form.Label>
              <div className="input-group">
                <Form.Control
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  value={formData.password}
                  onChange={handlePasswordChange}
                  disabled={isLoading}
                />
                <Button
                  variant="outline-secondary"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </Button>
              </div>
            </Form.Group>

            {/* Password Strength Indicators */}
            <div className="mb-3 small">
              <div className="password-requirements">
                <div className={passwordStrength.length ? 'text-success' : 'text-muted'}>
                  {passwordStrength.length ? '✓' : '✗'} At least 6 characters
                </div>
                <div className={passwordStrength.uppercase ? 'text-success' : 'text-muted'}>
                  {passwordStrength.uppercase ? '✓' : '✗'} One uppercase letter
                </div>
                <div className={passwordStrength.lowercase ? 'text-success' : 'text-muted'}>
                  {passwordStrength.lowercase ? '✓' : '✗'} One lowercase letter
                </div>
                <div className={passwordStrength.number ? 'text-success' : 'text-muted'}>
                  {passwordStrength.number ? '✓' : '✗'} One number
                </div>
              </div>
            </div>

            <Form.Group className="mb-3">
              <Form.Label>Confirm Password</Form.Label>
              <div className="input-group">
                <Form.Control
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm password"
                  value={formData.confirmPassword}
                  onChange={handleConfirmPasswordChange}
                  disabled={isLoading}
                />
                <Button
                  variant="outline-secondary"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </Button>
              </div>
            </Form.Group>

            <div className="d-flex gap-2">
              <Button variant="secondary" onClick={handleBackToMobile} disabled={isLoading}>
                Back
              </Button>
              <Button 
                variant="primary" 
                type="submit" 
                disabled={isLoading || !passwordStrength.valid || formData.password !== formData.confirmPassword}
              >
                {isLoading ? (
                  <>
                    <Spinner size="sm" className="me-2" />
                    Registering...
                  </>
                ) : (
                  'Register'
                )}
              </Button>
            </div>
          </Form>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default VendorRegistrationModal;