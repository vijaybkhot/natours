/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';

// Signing up users with API
export const signup = async (name, email, password, confirmPassword) => {
  try {
    const res = await axios({
      method: 'POST',
      url: '/api/v1/users/signup',
      data: {
        name: name,
        email: email,
        password: password,
        passwordConfirm: confirmPassword,
        role: 'user',
      },
    });

    if (res.data.status === 'success') {
      showAlert('success', 'Account created successfully!');
      window.setTimeout(() => {
        location.assign('/login'); // Redirecting to the login page after successful signup
      }, 1500);
    }
  } catch (err) {
    showAlert('error', err.response.data.message); // Show error message if signup fails
  }
};

// Function to validate name, email, and password fields
export const validateFields = (name, email, password, passwordConfirm) => {
  // Validate name (only letters and spaces)
  const nameRegex = /^[a-zA-Z\s]+$/;
  if (!nameRegex.test(name)) {
    showAlert(
      'error',
      'Name must only contain alphabetic characters and spaces',
    );
    return false;
  }

  // Validate email (using a simple regex for now, it could be expanded for more thorough validation)
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
  if (!emailRegex.test(email)) {
    showAlert('error', 'Please enter a valid email address');
    return false;
  }

  // Validate password (minimum 8 characters)
  if (password.length < 8) {
    showAlert('error', 'Password must be at least 8 characters long');
    return false;
  }

  // Validate password confirmation
  if (password !== passwordConfirm) {
    showAlert('error', 'Passwords do not match');
    return false;
  }

  return true;
};
