/* eslint-disable */

// Section 191:
import axios from 'axios'; // Axios import is working. Hence, CDN link in login.pug not used
import { showAlert } from './alerts';

// Section 189 - Logging in users with our API
export const login = async (email, password) => {
  try {
    const res = await axios({
      method: 'POST',
      url: '/api/v1/users/login', // Section 222 - Preparing App for deployment - Delete the host. This works only if the api and the website are using the same url
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
      url: '/api/v1/users/logout',
      withCredentials: true,
    });

    // Check if the response indicates success
    if (res.data.status === 'success') {
      // Reload the page to reflect the logout status
      showAlert('success', 'Logged out Successfully!');
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    } else {
      // Handle unexpected success status
      showAlert('error', 'Error logging out! Try again');
    }
  } catch (err) {
    // Handle network or server errors
    showAlert('error', 'Error logging out! Try again');
  }
};
