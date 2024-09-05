/* eslint-disable */

// Access the data attribute and parse it
const mapElement = document.getElementById('map');
const locations = JSON.parse(mapElement.getAttribute('data-locations'));
// const mapboxAccessToken = mapElement.getAttribute('data-access-token');
// const mapboxStyleUrl = mapElement.getAttribute('data-style-url');

// console.log('Locations:', locations);
// console.log('L:', L);

// // Initialize Mapbox with the access token
// mapboxgl.accessToken = mapboxAccessToken;

// const map = new mapboxgl.Map({
//   container: 'map',
//   style: mapboxStyleUrl,
//   center: [-74.03466657394192, 40.715237551557045],
//   zoom: 6,
//   interactive: true,
//   scrollZoom: false,
// });

const bounds = new mapboxgl.LngLatBounds();

locations.forEach((loc) => {
  // Create a marker
  const el = document.createElement('div'); // The marker image to be shown on the map for each location
  el.className = 'marker';

  // Add the marker
  new mapboxgl.Marker({
    element: el,
    anchor: 'bottom', // Bottom of the pin will point to the exact gps location
  })
    .setLngLat(loc.coordinates)
    .addTo(map);

  // Add popup
  new mapboxgl.Popup({
    offset: 30,
  })
    .setLngLat(loc.coordinates)
    .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
    .addTo(map);

  // Extend the map bounds to include the current location
  bounds.extend(loc.coordinates);
});

map.fitBounds(bounds, {
  padding: {
    top: 200,
    bottom: 150,
    left: 100,
    right: 100,
  },
});
