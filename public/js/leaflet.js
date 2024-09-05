/* eslint-disable */
// const L = require('leaflet');

export const displayMap = (locations) => {
  // Set up the map container's dimensions once the DOM content is fully loaded
  document.addEventListener('DOMContentLoaded', function () {
    const mapElement = document.getElementById('map');
    if (mapElement) {
      mapElement.style.width = '100%'; // Set the width of the map container to 100% of its parent element
      mapElement.style.height = '100%'; // Set the height of the map container to 100% of its parent element
    }
  });

  // Initialize the map with a default center at [0, 0] and zoom level 7
  // Also, disable scrollWheelZoom to prevent zooming in/out with the mouse scroll
  const map = L.map('map', {
    center: [0, 0], // Center the map at latitude 0, longitude 0
    zoom: 7, // Set the initial zoom level to 7
    scrollWheelZoom: false, // Disable zoom on scroll to improve the user experience
  });

  // Add a tile layer to the map, which provides the map's appearance

  // Example: Using the default Leaflet OpenStreetMap style
  // Uncomment the following lines if you prefer using the default style
  /*
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);
*/

  // Example: Using a custom Mapbox style
  // This Mapbox tile layer provides a different style using the provided access token and style URL
  L.tileLayer(
    'https://api.mapbox.com/styles/v1/vijay111991/cm09xjvku016201qr1mjif2sz/tiles/256/{z}/{x}/{y}@2x?access_token=pk.eyJ1IjoidmlqYXkxMTE5OTEiLCJhIjoiY20wOXd0NWptMXQ4ZzJqbmNuamVqbTh4bCJ9.O3z1UjnIn47b747SIJO4wA',
    {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors', // Attribution for the map data source
    },
  ).addTo(map); // Add the tile layer to the map

  // Create a LatLngBounds object, which will be used to fit all markers within the map view
  const bounds = L.latLngBounds(); // Initialize an empty bounds object

  // Iterate over each location and add a marker for it on the map
  locations.forEach((loc, index) => {
    // Reverse the coordinates from [longitude, latitude] to [latitude, longitude] as Leaflet expects them in this order
    const reversedCoordinates = [loc.coordinates[1], loc.coordinates[0]];

    // Create a marker element for custom styling
    const el = document.createElement('div');
    el.className = 'marker'; // Add a CSS class for styling the marker

    // Create a custom icon using the marker element
    const customIcon = L.divIcon({
      className: 'custom-marker', // CSS class for styling the icon
      html: el.outerHTML, // Use the outerHTML of the div element to create the icon
      iconSize: [50, 50], // Set the size of the icon to 50x50 pixels
      iconAnchor: [25, 50], // Set the anchor point of the icon (bottom-center of the icon)
    });

    // Create a marker at the reversed coordinates with the custom icon
    const marker = L.marker(reversedCoordinates, { icon: customIcon })
      .bindPopup(`<p>Day ${loc.day}: ${loc.description}</p>`) // Bind a popup with information about the location
      .addTo(map); // Add the marker to the map

    // Extend the bounds of the map to include the current location
    bounds.extend(reversedCoordinates);
  });

  // Adjust the map view to fit all markers within the bounds, with padding and animation
  map.fitBounds(bounds, {
    padding: [100, 100], // Add padding around the bounds to provide spacing from the edges
    animate: true, // Enable animation for a smoother transition
    duration: 2.0, // Duration of the animation in seconds
    noMoveStart: false, // Allow triggering of map move events during the transition
  });
};
