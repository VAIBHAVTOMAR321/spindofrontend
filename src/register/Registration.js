import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Alert, Row, Col, InputGroup } from 'react-bootstrap';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import axios from 'axios';
import "../assets/css/registration.css";
import { Link } from 'react-router-dom';

// API base URL - updated to the production endpoint
const API_BASE_URL = 'https://mahadevaaya.com/spindo/spindobackend';
const DISTRICT_BLOCKS_API = `${API_BASE_URL}/api/district-blocks/`;

function Registration() {
  const [formData, setFormData] = useState({
    username: '',
    mobile_number: '',
    state: 'Uttarakhand',
    district: '',
    block: '',
    password: '',
    confirmPassword: ''
  });
  
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [serverResponse, setServerResponse] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    valid: false
  });
  
  // State for districts and blocks
  const [districts, setDistricts] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [districtLoading, setDistrictLoading] = useState(false);
  const [blockLoading, setBlockLoading] = useState(false);
  const [districtBlocksData, setDistrictBlocksData] = useState({});

  // Fetch all districts on component mount
  useEffect(() => {
    const fetchDistricts = async () => {
      setDistrictLoading(true);
      try {
        const response = await axios.get(DISTRICT_BLOCKS_API);
        
        // Extract districts from the response
        if (response.data.data && response.data.data.districts && Array.isArray(response.data.data.districts)) {
          const districtList = response.data.data.districts.map(item => item.district);
          setDistricts(districtList.sort());
          
          // Store the full district-blocks data for later use
          const dataMap = {};
          response.data.data.districts.forEach(item => {
            dataMap[item.district] = item.blocks || [];
          });
          setDistrictBlocksData(dataMap);
        }
      } catch (error) {
        console.error('Error fetching districts:', error);
        setDistricts([]);
      } finally {
        setDistrictLoading(false);
      }
    };
    
    fetchDistricts();
  }, []);

  // Fetch blocks when district changes
  useEffect(() => {
    if (formData.district && districtBlocksData[formData.district]) {
      // Use the stored blocks data
      setBlocks(districtBlocksData[formData.district].sort());
      // Clear block selection when district changes
      setFormData(prev => ({
        ...prev,
        block: ''
      }));
    } else {
      setBlocks([]);
    }
  }, [formData.district, districtBlocksData]);

  // Custom handler for username to prevent numbers
  const handleUsernameChange = (e) => {
    const { name, value } = e.target;
    
    // Remove any numbers from the input
    const textOnlyValue = value.replace(/[0-9]/g, '');
    
    // Update the form data with the cleaned value
    setFormData(prev => ({
      ...prev,
      [name]: textOnlyValue
    }));
    
    // Real-time validation for username
    if (textOnlyValue.length > 0 && !/^[a-zA-Z\s]+$/.test(textOnlyValue)) {
      setErrors(prev => ({
        ...prev,
        username: 'Username should only contain letters and spaces'
      }));
    } else {
      // Clear the error if valid
      if (errors.username) {
        setErrors(prev => ({
          ...prev,
          username: ''
        }));
      }
    }
  };

  // Custom handler for mobile number to ensure only digits and max 10
  const handleMobileChange = (e) => {
    const { name, value } = e.target;
    
    // Remove any non-digit characters
    const digitsOnlyValue = value.replace(/\D/g, '').substring(0, 10);
    
    // Update the form data with the cleaned value
    setFormData(prev => ({
      ...prev,
      [name]: digitsOnlyValue
    }));
    
    // Real-time validation for mobile number
    if (digitsOnlyValue.length > 0 && digitsOnlyValue.length < 10) {
      setErrors(prev => ({
        ...prev,
        mobile_number: 'Mobile number must be exactly 10 digits'
      }));
    } else {
      // Clear the error if valid
      if (errors.mobile_number && digitsOnlyValue.length === 10) {
        setErrors(prev => ({
          ...prev,
          mobile_number: ''
        }));
      }
    }
  };

  // Custom handler for password with live validation
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    
    // Update the form data
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Live password validation
    if (name === 'password') {
      const strength = {
        length: value.length >= 6,
        uppercase: /[A-Z]/.test(value),
        lowercase: /[a-z]/.test(value),
        number: /\d/.test(value),
        valid: value.length >= 6 && /[A-Z]/.test(value) && /[a-z]/.test(value) && /\d/.test(value)
      };
      setPasswordStrength(strength);
      
      // Update error message based on validation
      if (value.length > 0 && !strength.valid) {
        let errorMsg = 'Password must contain: ';
        const requirements = [];
        if (!strength.length) requirements.push('at least 6 characters');
        if (!strength.uppercase) requirements.push('one uppercase letter');
        if (!strength.lowercase) requirements.push('one lowercase letter');
        if (!strength.number) requirements.push('one number');
        errorMsg += requirements.join(', ');
        
        setErrors(prev => ({
          ...prev,
          password: errorMsg
        }));
      } else {
        setErrors(prev => ({
          ...prev,
          password: ''
        }));
      }
    }
    
    // Validate confirm password if it has a value
    if (name === 'password' && formData.confirmPassword) {
      if (value !== formData.confirmPassword) {
        setErrors(prev => ({
          ...prev,
          confirmPassword: 'Passwords do not match'
        }));
      } else {
        setErrors(prev => ({
          ...prev,
          confirmPassword: ''
        }));
      }
    }
    
    if (name === 'confirmPassword' && value) {
      if (value !== formData.password) {
        setErrors(prev => ({
          ...prev,
          confirmPassword: 'Passwords do not match'
        }));
      } else {
        setErrors(prev => ({
          ...prev,
          confirmPassword: ''
        }));
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Use custom handlers for specific fields
    if (name === 'username') {
      handleUsernameChange(e);
      return;
    }
    
    if (name === 'mobile_number') {
      handleMobileChange(e);
      return;
    }
    
    if (name === 'password' || name === 'confirmPassword') {
      handlePasswordChange(e);
      return;
    }
    
    // Default handler for other fields
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (!/^[a-zA-Z\s]+$/.test(formData.username)) {
      newErrors.username = 'Username should only contain letters and spaces';
    } else if (formData.username.trim().length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }
    
    // Mobile number validation
    if (!formData.mobile_number.trim()) {
      newErrors.mobile_number = 'Mobile number is required';
    } else if (!/^\d{10}$/.test(formData.mobile_number)) {
      newErrors.mobile_number = 'Mobile number must be exactly 10 digits';
    }
    
    // State validation - already set to Uttarakhand, no need to validate
    // State is pre-filled and read-only
    
    // District validation
    if (!formData.district.trim()) {
      newErrors.district = 'District is required';
    }
    
    // Block validation
    if (!formData.block.trim()) {
      newErrors.block = 'Block is required';
    }
    
    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (!passwordStrength.valid) {
      newErrors.password = 'Password does not meet all requirements';
    }
    
    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      // Create the payload as specified
      const payload = {
        username: formData.username,
        mobile_number: formData.mobile_number,
        state: formData.state,
        district: formData.district,
        block: formData.block,
        password: formData.password
      };
      
      // Make real API call to customer registration endpoint
      const response = await axios.post(
        `${API_BASE_URL}/api/customer/register/`,
        payload
      );
      
      setServerResponse(response.data);
      setRegistrationSuccess(true);
      setIsLoading(false);
      
      // Show success alert
      alert("Successfully registered!");
      
      // Remove the success message after showing the alert
      setTimeout(() => {
        setRegistrationSuccess(false);
        setServerResponse(null);
        resetForm();
      }, 1000);
    } catch (error) {
      console.error('Registration error:', error);
      // Handle different types of errors
      if (error.response) {
        // Server responded with error status (4xx, 5xx)
        setServerResponse({
          success: false,
          message: error.response.data?.message || 'Registration failed. Please try again.',
          error: error.response.data
        });
      } else if (error.request) {
        // No response received from server
        setServerResponse({
          success: false,
          message: 'No response from server. Please check your internet connection.'
        });
      } else {
        // Request setup error
        setServerResponse({
          success: false,
          message: 'Error setting up request. Please try again.'
        });
      }
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      mobile_number: '',
      state: 'Uttarakhand',
      district: '',
      block: '',
      password: '',
      confirmPassword: ''
    });
    setErrors({});
    setRegistrationSuccess(false);
    setServerResponse(null);
    setPasswordStrength({
      length: false,
      uppercase: false,
      lowercase: false,
      number: false,
      valid: false
    });
    setBlocks([]);
  };

  return (
    <div className="registration-page">
      <Container className='box-container'>
        <h2 className="text-center mb-4">Create Account</h2>
        <p className="text-center text-muted mb-4">Join us today by creating a new account</p>
        
        {serverResponse && !registrationSuccess && !serverResponse.success && (
          <Alert variant="danger" className="text-center">
            <Alert.Heading>Registration Failed!</Alert.Heading>
            <p>{serverResponse.message}</p>
            {serverResponse.error && (
              <div className="mt-2">
                <strong>Error details:</strong>
                <pre className="mt-1 text-left small">{JSON.stringify(serverResponse.error, null, 2)}</pre>
              </div>
            )}
          </Alert>
        )}

        {registrationSuccess && (
          <div className="success-message">
            <Alert variant="success" className="text-center">
              <Alert.Heading className='reg-fully'>Registration Successful!</Alert.Heading>
              <p>{serverResponse?.message || 'Your account has been created successfully.'}</p>
              {serverResponse?.data && (
                <div>
                  <hr />
                  <p className="mb-0">
                    {serverResponse.data.id && (
                      <React.Fragment>
                        <strong>User ID:</strong> {serverResponse.data.id}<br />
                      </React.Fragment>
                    )}
                    {serverResponse.data.username && (
                      <React.Fragment>
                        <strong>Username:</strong> {serverResponse.data.username}<br />
                      </React.Fragment>
                    )}
                    {serverResponse.data.mobile_number && (
                      <React.Fragment>
                        <strong>Mobile:</strong> {serverResponse.data.mobile_number}<br />
                      </React.Fragment>
                    )}
                    {(serverResponse.data.block || serverResponse.data.district || serverResponse.data.state) && (
                      <React.Fragment>
                        <strong>Location:</strong> {[serverResponse.data.block, serverResponse.data.district, serverResponse.data.state].filter(Boolean).join(', ')}
                      </React.Fragment>
                    )}
                  </p>
                </div>
              )}
            </Alert>
            <Button variant="primary" onClick={resetForm} className="w-100">
              Register Another Account
            </Button>
          </div>
        )}

        {!registrationSuccess && (!serverResponse || serverResponse.success) && (
           <Form onSubmit={handleSubmit}>
         <Row>
               <Col md={3} lg={3} sm={12}> 
            <Form.Group className="mb-3" controlId="formUsername">
              <Form.Label className='spi-label'>Username</Form.Label>
              <Form.Control
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                isInvalid={!!errors.username}
                placeholder="Enter your full name"
                className='spi-control'
              />
              <Form.Control.Feedback type="invalid">
                {errors.username}
              </Form.Control.Feedback>
              <Form.Text className="text-muted">
                Only letters and spaces are allowed
              </Form.Text>
            </Form.Group>
</Col>
 <Col md={3} lg={3} sm={12}> 
            <Form.Group className="mb-3" controlId="formMobile">
              <Form.Label className='spi-label'>Mobile Number <span className='api-star'>*</span></Form.Label>
              <Form.Control
                type="tel"
                name="mobile_number"
                value={formData.mobile_number}
                onChange={handleChange}
                isInvalid={!!errors.mobile_number}
                placeholder="Enter 10-digit mobile number"
                className='spi-control'
                maxLength={10}
              />
              <Form.Control.Feedback type="invalid">
                {errors.mobile_number}
              </Form.Control.Feedback>
              <Form.Text className="text-muted">
                Enter exactly 10 digits
              </Form.Text>
            </Form.Group>
</Col>
            
              <Col md={3} lg={3} sm={12}> 
                 <Form.Group className="mb-3" controlId="formState">
                   <Form.Label className='spi-label'>State <span className='api-star'>*</span></Form.Label>
                   <Form.Control
                     type="text"
                     name="state"
                     value={formData.state}
                     disabled
                     readOnly
                     className='spi-control'
                   />
                   <Form.Text className="text-muted">
                     Uttarakhand (Fixed)
                   </Form.Text>
                 </Form.Group>
               </Col>
               
              <Col md={3} lg={3} sm={12}> 
                 <Form.Group className="mb-3" controlId="formDistrict">
                   <Form.Label className='spi-label'>District <span className='api-star'>*</span></Form.Label>
                   <Form.Control
                     as="select"
                     name="district"
                     value={formData.district}
                     onChange={handleChange}
                     isInvalid={!!errors.district}
                     disabled={districtLoading}
                     className='spi-control'
                   >
                     <option value="">Select District</option>
                     {districts.map((dist, index) => (
                       <option key={index} value={dist}>{dist}</option>
                     ))}
                   </Form.Control>
                   <Form.Control.Feedback type="invalid">
                     {errors.district}
                   </Form.Control.Feedback>
                   {districtLoading && <Form.Text className="text-muted">Loading districts...</Form.Text>}
                 </Form.Group>
               </Col>
               
              <Col md={3} lg={3} sm={12}> 
                 <Form.Group className="mb-3" controlId="formBlock">
                   <Form.Label className='spi-label'>Block <span className='api-star'>*</span></Form.Label>
                   <Form.Control
                     as="select"
                     name="block"
                     value={formData.block}
                     onChange={handleChange}
                     isInvalid={!!errors.block}
                     disabled={!formData.district || blockLoading || blocks.length === 0}
                     className='spi-control'
                   >
                     <option value="">Select Block</option>
                     {blocks.map((blk, index) => (
                       <option key={index} value={blk}>{blk}</option>
                     ))}
                   </Form.Control>
                   <Form.Control.Feedback type="invalid">
                     {errors.block}
                   </Form.Control.Feedback>
                   {!formData.district && <Form.Text className="text-muted">Please select district first</Form.Text>}
                   {blockLoading && <Form.Text className="text-muted">Loading blocks...</Form.Text>}
                   {formData.district && blocks.length === 0 && !blockLoading && <Form.Text className="text-muted">No blocks available for this district</Form.Text>}
                 </Form.Group>
               </Col>
            
<Col md={3} lg={3} sm={12}> 
            <Form.Group className="mb-3" controlId="formPassword">
              <Form.Label className='spi-label'>Password <span className='api-star'>*</span></Form.Label>
              <InputGroup>
                <Form.Control
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  isInvalid={!!errors.password}
                  placeholder="Enter password"
                  className='spi-control'
                />
                <Button
                  variant="outline-secondary"
                  onClick={() => setShowPassword(!showPassword)}
                  className="password-toggle-btn"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </Button>
              </InputGroup>
              <Form.Control.Feedback type="invalid">
                {errors.password}
              </Form.Control.Feedback>
              {formData.password && (
                <div className="password-strength mt-2">
                  <small className="text-muted">Password must contain:</small>
                  <ul className="small mt-1">
                    <li className={passwordStrength.length ? 'text-success' : 'text-muted'}>
                      At least 6 characters
                    </li>
                    <li className={passwordStrength.uppercase ? 'text-success' : 'text-muted'}>
                      One uppercase letter
                    </li>
                    <li className={passwordStrength.lowercase ? 'text-success' : 'text-muted'}>
                      One lowercase letter
                    </li>
                    <li className={passwordStrength.number ? 'text-success' : 'text-muted'}>
                      One number
                    </li>
                  </ul>
                </div>
              )}
            </Form.Group>
</Col>
<Col md={3} lg={3} sm={12}>
            <Form.Group className="mb-4" controlId="formConfirmPassword">
              <Form.Label className='spi-label'>Confirm Password</Form.Label>
              <InputGroup>
                <Form.Control
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  isInvalid={!!errors.confirmPassword}
                  placeholder="Confirm password"
                  className='spi-control'
                />
                <Button
                  variant="outline-secondary"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="password-toggle-btn"
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </Button>
              </InputGroup>
              <Form.Control.Feedback type="invalid">
                {errors.confirmPassword}
              </Form.Control.Feedback>
            </Form.Group>
            </Col>
            <div className='text-center'>
            <Button 
              variant="primary" 
              type="submit" 
              className=" register-btn"
              disabled={isLoading}
            >
              {isLoading ? 'Creating Account...' : 'Register'}
            </Button>
</div>
            <div className="text-center mt-3">
              <span className="text-muted">Already have an account? </span>
              <Link to="/Login" className="text-primary text-decoration-none">Sign In</Link>
            </div>
               </Row>
          </Form>
       
        )}
      </Container>
    </div>
  );
}

export default Registration;