// Section 196: Updating User data with our API
import axios from 'axios'; // Axios import is working. Hence, CDN link in login.pug not used
import { showAlert } from './alerts';

// Section 196 - Updating User data with our API
// Section 197 - Updating User data with our API
// Type is either password or data
export const updateSettings = async (data, type) => {
  try {
    const url =
      type === 'password'
        ? '/api/v1/users/updateMyPassword'
        : '/api/v1/users/updateMe';
    // Section 222 - Preparing App for deployment - Delete the host in the url above. This works only if the api and the website are using the same url

    const res = await axios({
      method: 'PATCH',
      url: url,
      //   data: {
      //     email: newEmail,
      //     name: newName,
      //   },
      data: data,
    });

    if (res.data.status === 'success') {
      showAlert('success', ` ${type.toUpperCase()} updated Successfully!`);
      window.setTimeout(() => {
        // location.assign('/me');
        location.reload();
      }, 1500);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};
