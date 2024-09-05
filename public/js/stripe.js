/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';

// Section 212 - Processing payments on the front end
const stripe = require('stripe')(
  'sk_test_51PuvHeGI88eGVDeXyteg8TzFseebBo7ufhlo1ITtIsDh9exTj0r1xWMh2t8PhQlCJvGAPP72tb1WX2OWKPKQhkYW00KcwvuPpe',
);

export const bookTour = async (tourId) => {
  try {
    // 1) Get the checkout session from our API
    const session = await axios(
      `http://127.0.0.1:8000/api/v1/bookings/checkout-session/${tourId}`,
    ); // Get session id using axios
    // 2) Create checkout form + charge the credit card

    // await stripe.redirectToCheckout({
    //   sessionId: session.data.session.id,
    // });    // Deparcated code
    window.location.href = session.data.session.url;
  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};
