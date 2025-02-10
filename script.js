document.addEventListener('DOMContentLoaded', () => {
    const map = L.map('map').setView([53.8008, -1.5491], 12);
    let userLocation = null;
    let nearestGritBinLat = null;
    let nearestGritBinLon = null;
    let directionsLayer = null; // Store the directions layer
    const directionsCache = {};

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Add Directions button
    const directionsButton = L.control({position: 'bottomleft'});
    directionsButton.onAdd = function (map) {
        this._div = L.DomUtil.create('div', 'directions-button');
        this._div.innerHTML = '<button>Directions</button>';
        this._div.firstChild.addEventListener('click', () => {
            if (userLocation && nearestGritBinLat && nearestGritBinLon) {
                getDirections(nearestGritBinLat, nearestGritBinLon);
            }
        });
        return this._div;
    };
    directionsButton.addTo(map);


    // Add Help button
    const helpButton = L.control({position: 'bottomleft'});
    helpButton.onAdd = function (map) {
        this._div = L.DomUtil.create('div', 'help-button');
        this._div.innerHTML = '<button>Help</button>';
        this._div.firstChild.addEventListener('click', () => {
            document.getElementById('help-popup').style.display = 'block';
        });
        return this._div;
    };
    helpButton.addTo(map);

    // Close button for help popup
    document.querySelector('#help-popup .close-button').addEventListener('click', () => {
        document.getElementById('help-popup').style.display = 'none';
    });


    getLocation();

    function getLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    userLocation = [position.coords.latitude, position.coords.longitude];
                    map.setView(userLocation, 15);
                    findGritBins(position.coords.latitude, position.coords.longitude);
                },
                (error) => {
                    console.error("Geolocation error:", error);
                    displayLocationError();

                }
            );
        } else {
            displayLocationError();
        }
    }


    function displayLocationError() {
        // Simplified error display, directly on the map.  Could be a styled div.
        const errorDiv = L.DomUtil.create('div', 'location-error');
        errorDiv.innerHTML = 'Location services are unavailable.';
        errorDiv.style.backgroundColor = 'white';
        errorDiv.style.padding = '10px';
        errorDiv.style.border = '1px solid red';
        map.getContainer().appendChild(errorDiv); // Append to the map container
    }


    async function findGritBins(latitude, longitude) {
        const overpassUrl = 'https://overpass-api.de/api/interpreter';
        const query = `
            [out:json];
            node["amenity"="grit_bin"](around:8047,${latitude},${longitude});
            out;
        `;

        try {
            const response = await fetch(overpassUrl, {
                method: 'POST',
                body: `data=${encodeURIComponent(query)}`
            });

            if (!response.ok) {
                throw new Error(`Overpass API error: ${response.status}`);
            }

            const data = await response.json();

            if (data.elements.length === 0) {
                displayMessage("No grit bins found within 5 miles.");
                return;
            }

            let nearestDistance = Infinity;


            data.elements.forEach(element => {
                const gritBinLat = element.lat;
                const gritBinLon = element.lon;
                L.marker([gritBinLat, gritBinLon]).addTo(map);

                // Calculate distance
                const distance = calculateDistance(latitude, longitude, gritBinLat, gritBinLon);
                if (distance < nearestDistance) {
                    nearestDistance = distance;
                    nearestGritBinLat = gritBinLat;
                    nearestGritBinLon = gritBinLon;
                }
            });

        } catch (error) {
            console.error("Error fetching grit bins:", error);
            displayMessage("Error fetching grit bin data.");
        }
    }

    function calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371e3; // Earth's radius in meters
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c; // Distance in meters
    }


    async function getDirections(gritBinLat, gritBinLon) {
        if (!userLocation) {
            displayMessage("User location not available.");
            return;
        }

        const userLat = userLocation[0];
        const userLon = userLocation[1];
        const cacheKey = `${userLat},${userLon}-${gritBinLat},${gritBinLon}`;

        if (directionsCache[cacheKey]) {
            console.log("Using cached directions");
            // Remove existing layer if it exists
            if (directionsLayer) {
                map.removeLayer(directionsLayer);
            }
            directionsLayer = directionsCache[cacheKey];
            directionsLayer.addTo(map);
            return;
        }

        const osrmUrl = `http://router.project-osrm.org/route/v1/driving/${userLon},${userLat};${gritBinLon},${gritBinLat}?overview=full&geometries=geojson`;

        try {
            const response = await fetch(osrmUrl);
            if (!response.ok) {
                throw new Error(`OSRM API error: ${response.status}`);
            }
            const data = await response.json();

            if (data.routes && data.routes.length > 0) {
                // Remove existing layer if it exists
                if (directionsLayer) {
                    map.removeLayer(directionsLayer);
                }
                directionsLayer = L.geoJSON(data.routes[0].geometry, {
                    style: {
                        color: 'blue',
                        weight: 5
                    }
                });
                directionsLayer.addTo(map);

                directionsCache[cacheKey] = directionsLayer; // Cache the layer

            } else {
                displayMessage("No route found.");
            }

        } catch (error) {
            console.error("Error fetching directions:", error);
            displayMessage("Error fetching directions.");
        }
    }

    function displayMessage(message) {
        // Generic message display, similar to displayLocationError
        const messageDiv = L.DomUtil.create('div', 'info-message');
        messageDiv.innerHTML = message;
        messageDiv.style.backgroundColor = 'white';
        messageDiv.style.padding = '10px';
        messageDiv.style.border = '1px solid black';
        map.getContainer().appendChild(messageDiv);

        // Remove the message after a few seconds
        setTimeout(() => {
            map.getContainer().removeChild(messageDiv);
        }, 5000);
    }
});
