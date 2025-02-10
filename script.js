document.addEventListener('DOMContentLoaded', () => {
    const map = L.map('map').setView([53.8008, -1.5491], 12);
    let userLocation = null;
    let nearestGritBinLat = null;
    let nearestGritBinLon = null;
    let routingControl = null; // Store the routing control instance
    const directionsCache = {};
    let gritBinMarkers = []; // Array to store grit bin markers
    let userMarker = null; // Store the user's location marker

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> | Directions from <a href="http://project-osrm.org/">OSRM</a>',
    }).addTo(map);

    // Add Directions button (modified for LRM)
    const directionsButton = L.control({ position: 'bottomleft' });
    directionsButton.onAdd = function (map) {
        this._div = L.DomUtil.create('div', 'directions-button');
        this._div.innerHTML = '<button>Directions</button>';
        this._div.firstChild.addEventListener('click', () => {
            if (userLocation && nearestGritBinLat && nearestGritBinLon) {
                setWaypoints();
            }
        });
        return this._div;
    };
    directionsButton.addTo(map);

    // Add Help button
    const helpButton = L.control({ position: 'bottomleft' });
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
    const searchAreaButton = L.control({ position: 'bottomleft' });
    searchAreaButton.onAdd = function (map) {
        this._div = L.DomUtil.create('div', 'search-area-button');
        this._div.innerHTML = '<button>Search This Area</button>';
        this._div.firstChild.addEventListener('click', searchCurrentArea);
        return this._div;
    };
    searchAreaButton.addTo(map);

    // Pre-load some icons
    function createIcon(color) {
        return new L.Icon({
            iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        });
    }

    var greenIcon = createIcon('green');
    var blueIcon = createIcon('blue');
    var redIcon = createIcon('red');

    getLocation();

    function getLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    userLocation = [position.coords.latitude, position.coords.longitude];
                    map.setView(userLocation, 15);

                    // Add user location marker (only if it doesn't exist)
                    if (!userMarker) {
                        userMarker = L.marker(userLocation, { icon: redIcon }).addTo(map);
                    }

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
        const errorDiv = L.DomUtil.create('div', 'location-error');
        errorDiv.innerHTML = 'Location services are unavailable.';
        errorDiv.style.backgroundColor = 'white';
        errorDiv.style.padding = '10px';
        errorDiv.style.border = '1px solid red';
        map.getContainer().appendChild(errorDiv);
    }

    async function findGritBins(latitude, longitude, bounds = null) {
        const overpassUrl = 'https://overpass-api.de/api/interpreter';
        let query;

        if (bounds) {
            query = `
                [out:json];
                node["amenity"="grit_bin"](${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()});
                out;
            `;
        } else {
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
            clearGritBinMarkers();

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
                gritBinMarkers.push(marker);
                marker.addTo(map);

                if (userLocation) {
                    const distance = calculateDistance(userLocation[0], userLocation[1], gritBinLat, gritBinLon);
                    if (distance < nearestDistance) {
                        nearestDistance = distance;
                        currentNearestGritBinLat = gritBinLat;
                        currentNearestGritBinLon = gritBinLon;
                    }
                }
            });

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
        gritBinMarkers = [];
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
        return R * c;
    }

    function setWaypoints() {
        if (!userLocation || !nearestGritBinLat || !nearestGritBinLon) {
            return; // Should not happen, but check for safety
        }

        const userLatLng = L.latLng(userLocation[0], userLocation[1]);
        const gritBinLatLng = L.latLng(nearestGritBinLat, nearestGritBinLon);
        const cacheKey = `${userLocation[0]},${userLocation[1]}-${nearestGritBinLat},${nearestGritBinLon}`;

        if (directionsCache[cacheKey]) {
            // Use cached route
            console.log("Using cached directions");
            if (routingControl) {
                routingControl.setWaypoints(directionsCache[cacheKey].waypoints);
                // No need to re-add the control, just update waypoints
            }
            return;
        }

        if (!routingControl) {
            // Create routing control only if it doesn't exist
            routingControl = L.Routing.control({
                waypoints: [userLatLng, gritBinLatLng],
                routeWhileDragging: false, // Disable rerouting while dragging
                router: L.Routing.osrmv1({
                    serviceUrl: 'http://router.project-osrm.org/route/v1'
                }),
                show: true,
            }).addTo(map);

            routingControl.on('routesfound', (e) => {
                // Cache the route
                directionsCache[cacheKey] = {
                    waypoints: [userLatLng, gritBinLatLng],
                    routes: e.routes
                };
            });

        } else {
            // If control exists, just set new waypoints
            routingControl.setWaypoints([userLatLng, gritBinLatLng]);
        }
    }

    function displayMessage(message) {
        const messageDiv = L.DomUtil.create('div', 'info-message');
        messageDiv.innerHTML = message;
        messageDiv.style.backgroundColor = 'white';
        messageDiv.style.padding = '10px';
        messageDiv.style.border = '1px solid black';
        map.getContainer().appendChild(messageDiv);

        setTimeout(() => {
            map.getContainer().removeChild(messageDiv);
        }, 5000);
    }

    function searchCurrentArea() {
        const bounds = map.getBounds();
        findGritBins(null, null, bounds);
    }
});
