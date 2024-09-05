/* eslint-disable */
import '@babel/polyfill';
import { displayMap } from './leaflet';
import { login, logout } from './login';
import { updateSettings } from './updateSettings';
import { bookTour } from './stripe'; // Section 212 - Processing payments on the frontend

// DOM Elements
const mapElement = document.getElementById('map');
const loginForm = document.querySelector('.form--login');
const logOutBtn = document.querySelector('.nav__el--logout');
const userDataForm = document.querySelector('.form-user-data');
const passwordUpdateForm = document.querySelector('.form-user-password');
const bookBtn = document.getElementById('book-tour'); // Section 212 - Processing payments on the front end

// Delegation
if (mapElement) {
  // Access the data attribute from the HTML element with the id 'map' and parse it to get the locations
  const locations = JSON.parse(mapElement.getAttribute('data-locations'));
  displayMap(locations);
}

if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // Values
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    login(email, password);
  });
}

if (logOutBtn) logOutBtn.addEventListener('click', logout);

// Section 196 - Updating User data with our API - User data
if (userDataForm) {
  userDataForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // Section 203 - Adding Image uploads to file
    // Values
    const form = new FormData();
    form.append('name', document.querySelector('#name').value);
    form.append('email', document.querySelector('#email').value);
    form.append('photo', document.querySelector('#photo').files[0]);

    updateSettings(form, 'data');
  });
}

// Section 197 - Updating User data with our API - Password
if (passwordUpdateForm) {
  passwordUpdateForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // Values
    const passwordCurrent = document.querySelector('#password-current').value;
    const newPassword = document.querySelector('#password').value;
    const newPasswordConfirm =
      document.querySelector('#password-confirm').value;

    updateSettings(
      {
        passwordCurrent: passwordCurrent,
        newPassword: newPassword,
        newPasswordConfirm: newPasswordConfirm,
      },
      'password',
    );
  });
}

// Section 212 - Processing payments on the front end
if (bookBtn) {
  bookBtn.addEventListener('click', (e) => {
    e.target.textContent = 'Processing...'; // Change button text content
    const tourId = e.target.dataset.tourId; //
    bookTour(tourId);
  });
}
