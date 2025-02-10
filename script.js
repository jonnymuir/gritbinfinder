document.addEventListener('DOMContentLoaded', () => {
    const map = L.map('map').setView([53.8008, -1.5491], 12);
    let userLocation = null;
    let nearestGritBinLat = null;
    let nearestGritBinLon = null;
    let directionsLayer = null; // Store the directions layer
    const directionsCache = {};
    let gritBinMarkers = []; // Array to store grit bin markers

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

    // Add Search This Area button
    const searchAreaButton = L.control({position: 'bottomleft'});
    searchAreaButton.onAdd = function (map) {
        this._div = L.DomUtil.create('div', 'search-area-button');
        this._div.innerHTML = '<button>Search This Area</button>';
        this._div.firstChild.addEventListener('click', searchCurrentArea);
        return this._div;
    };
    searchAreaButton.addTo(map);

    // Close button for directions panel
    document.querySelector('#directions-panel .close-button').addEventListener('click', closeDirectionsPanel);


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


    async function findGritBins(latitude, longitude, bounds = null) {
        const overpassUrl = 'https://overpass-api.de/api/interpreter';
        let query;

        if (bounds) {
            // Use bounding box
            query = `
                [out:json];
                node["amenity"="grit_bin"](${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()});
                out;
            `;
        } else {
            // Use around
            query = `
                [out:json];
                node["amenity"="grit_bin"](around:8047,${latitude},${longitude});
                out;
            `;
        }

        try {
            const response = await fetch(overpassUrl, {
                method: 'POST',
                body: `data=${encodeURIComponent(query)}`
            });

            if (!response.ok) {
                throw new Error(`Overpass API error: ${response.status}`);
            }

            const data = await response.json();
            clearGritBinMarkers(); // Clear existing markers

            if (data.elements.length === 0) {
                displayMessage("No grit bins found in this area.");
                return;
            }

            let nearestDistance = Infinity;
            let currentNearestGritBinLat = null;
            let currentNearestGritBinLon = null;


            data.elements.forEach(element => {
                const gritBinLat = element.lat;
                const gritBinLon = element.lon;
                const marker = L.marker([gritBinLat, gritBinLon]);
                gritBinMarkers.push(marker); // Store marker
                marker.addTo(map);

                // Calculate distance only if user location is available
                if(userLocation) {
                    const distance = calculateDistance(userLocation[0], userLocation[1], gritBinLat, gritBinLon);
                    if (distance < nearestDistance) {
                        nearestDistance = distance;
                        currentNearestGritBinLat = gritBinLat;
                        currentNearestGritBinLon = gritBinLon;
                    }
                }
            });

            // Update nearest grit bin only if user location is available
            if (userLocation) {
                nearestGritBinLat = currentNearestGritBinLat;
                nearestGritBinLon = currentNearestGritBinLon;
            }

        } catch (error) {
            console.error("Error fetching grit bins:", error);
            displayMessage("Error fetching grit bin data.");
        }
    }

    function clearGritBinMarkers() {
        gritBinMarkers.forEach(marker => {
            map.removeLayer(marker);
        });
        gritBinMarkers = []; // Reset the array
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
            directionsLayer = directionsCache[cacheKey].layer; // Access the .layer property
            directionsLayer.addTo(map);
            showDirections(directionsCache[cacheKey].instructions); // Show cached directions

            return;
        }

        const osrmUrl = `http://router.project-osrm.org/route/v1/driving/${userLon},${userLat};${gritBinLon},${gritBinLat}?overview=full&geometries=geojson&steps=true`; // Request steps

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

                // Extract and display step-by-step instructions
                const steps = data.routes[0].legs[0].steps;
                const instructions = steps.map((step, index) => {
                    //Corrected instruction retrieval
                    return {
                      distance: step.distance,
                      instruction: `${step.maneuver.verbal_pre_transition_instruction} ${step.maneuver.modifier ? `(${step.maneuver.modifier})` : ''}`.trim(),
                    };
                });


                directionsCache[cacheKey] = {
                    layer: directionsLayer,
                    instructions: instructions
                }; // Cache layer and instructions
                showDirections(instructions);

                directionsLayer.on('click', () => {
                    showDirections(instructions);
                });

            } else {
                displayMessage("No route found.");
            }

        } catch (error) {
            console.error("Error fetching directions:", error);
            displayMessage("Error fetching directions.");
        }
    }
    function showDirections(instructions) {
        const directionsContent = document.getElementById('directions-content');
        directionsContent.innerHTML = ''; // Clear previous directions

        const ol = document.createElement('ol');
        instructions.forEach(instruction => {
            const li = document.createElement('li');
            li.textContent = `${instruction.instruction} (${instruction.distance} m)`;
            ol.appendChild(li);
        });
        directionsContent.appendChild(ol);
        document.getElementById('directions-panel').classList.add('open');
    }

    function closeDirectionsPanel() {
        document.getElementById('directions-panel').classList.remove('open');
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

    function searchCurrentArea() {
        const bounds = map.getBounds();
        findGritBins(null, null, bounds);
    }
});
