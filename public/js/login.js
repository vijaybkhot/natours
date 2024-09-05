/* eslint-disable */

// Section 191:
import axios from 'axios'; // Axios import is working. Hence, CDN link in login.pug not used
import { showAlert } from './alerts';

// Section 189 - Logging in users with our API
export const login = async (email, password) => {
  try {
    const res = await axios({
      method: 'POST',
      url: 'http://127.0.0.1:8000/api/v1/users/login',
      data: {
        email: email,
        password: password,
      },
    });
    // Section 190 - Logging in users with our API
    if (res.data.status === 'success') {
      showAlert('success', 'Logged in Successfully!');
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

export const logout = async () => {
  try {
    const res = await axios({
      method: 'GET',
      url: 'http://127.0.0.1:8000/api/v1/users/logout',
    });

    // Check if the response indicates success
    if (res.data.status === 'success') {
      // Reload the page to reflect the logout status
      window.location.reload(true);
    } else {
      // Handle unexpected success status
      showAlert('error', 'Error logging out! Try again');
    }
  } catch (err) {
    // Handle network or server errors
    showAlert('error', 'Error logging out! Try again');
  }
};
