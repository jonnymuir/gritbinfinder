> [!quote]
> **user**: Write a technical design brief based on [GritBinFinder](../README.md), the aim of this should be a brief that can be used with an LLM to write the code for the website, there should be two parts, one being a conventions file that will list coding conventions and design principles that should be followed, and another should be a series of prompts to build the app in stages.  Ask me any questions if need any clarification about anything before proceeding.
> 

**ai**: Okay, I understand the project. Here's a technical design brief for the GritBinFinder application, split into conventions and a series of prompts for an LLM. Before I proceed, I have a few clarifying questions:

1.  **Routing API:** Which routing API should be used for directions? (e.g., OpenRouteService, GraphHopper, Google Maps Directions API). The choice of API will affect the specific code implementation.
2.  **Caching:** You mention caching directions to avoid repeated API calls. Should this be a simple in-memory JavaScript cache (session-based), or something more persistent like `localStorage` or `IndexedDB`? Session-based is simpler.
3.  **UI Framework:** While you specify HTML, CSS, and JavaScript, would you prefer to use a specific front-end framework or library (e.g., React, Vue, Svelte) or keep it to vanilla JavaScript? Vanilla JS is assumed if not specified.
4.  **Mapping Library:** Which mapping library should be used? (e.g., Leaflet, OpenLayers, Google Maps JavaScript API). Leaflet is a popular choice for OpenStreetMap data.
5.  **Styling:** Are there any specific styling preferences, such as a particular color scheme or CSS framework (e.g., Bootstrap, Tailwind CSS)?
6. **Error Handling:** Besides location permissions, are there any other error handling cases we should specifically consider (Overpass API errors, network errors)?
7. **Postcode Lookup:** If the user enters a postcode, we need a way to geocode that to latitude/longitude. Should we use a specific API for this, or do we have a preferred method?

Once these are clarified, I can tailor the prompts more precisely. However, here's a draft based on common assumptions:

---

## GritBinFinder Technical Design Brief

### Part 1: Conventions and Design Principles

This document outlines the coding conventions and design principles for the GritBinFinder web application.

**1. General Principles:**

*   **Simplicity:** Favor simple, readable, and maintainable code over complex solutions.
*   **Modularity:** Structure code into logical modules (e.g., map handling, API interaction, UI components).
*   **Accessibility:** Ensure the application is accessible to users with disabilities, following WCAG guidelines where possible.
*   **Responsiveness:** The application must be fully responsive and work correctly on various screen sizes (mobile, tablet, desktop).
*   **Performance:** Optimize for performance, minimizing network requests and ensuring fast loading times.

**2. Coding Conventions:**

*   **Language:**  Use modern JavaScript (ES6+).
*   **Style:** Follow a consistent coding style. Use a linter (e.g., ESLint) and a formatter (e.g., Prettier) to enforce style consistency.
*   **Comments:**  Use clear and concise comments to explain non-obvious code sections.
*   **Error Handling:** Implement robust error handling, including user-friendly error messages.  Specifically handle:
    *   Location permission denial.
    *   Overpass API request failures.
    *   Routing API request failures (if applicable).
    *   Network connectivity issues.
    *   Postcode lookup failures
*   **Naming:** Use descriptive and consistent names for variables, functions, and classes.  Favor camelCase for variables and functions, and PascalCase for classes.
* **Asynchronous Operations:** Use `async/await` for handling asynchronous operations (e.g., API calls).

**3. Design Principles:**

*   **User Interface:**
    *   Clean and uncluttered design.
    *   Intuitive user flow.
    *   Use of appropriate UI elements (buttons, pop-up windows, etc.).
    *   Clear visual hierarchy.
*   **Mapping:**
    *   Use a suitable mapping library (Leaflet is recommended) to display the map and markers.
    *   Provide clear markers for grit bins.
    *   Implement smooth map interactions (zooming, panning).
* **Data Handling:**
    * Fetch grit bin data from the Overpass API.
    * Cache the directions data *in the session* to avoid unnecessary API calls.

**4. Technology Stack (Assumptions):**

*   **Frontend:** HTML, CSS, Vanilla JavaScript (no framework).
*   **Mapping:** Leaflet.js.
*   **Routing:** *To be specified by user (e.g., OpenRouteService).*
*   **Geocoding (Postcode Lookup):** *To be specified by user (e.g., a free geocoding API).*
*   **Overpass API:** For retrieving grit bin data.

### Part 2: LLM Prompts (Building in Stages)

These prompts are designed to be given to an LLM in sequence, building the application incrementally.

**Stage 1: Basic HTML Structure and Map Display**

>   Create an HTML file named `index.html` for the GritBinFinder application. Include the necessary CSS and JavaScript links (including Leaflet.js from a CDN).  Set up a basic HTML structure with a `div` element with the id "map" to hold the map. The map should fill the entire viewport. Initialize a Leaflet map centered on Leeds (latitude 53.8008, longitude -1.5491) with a default zoom level of 12. Use OpenStreetMap as the base layer. Add a title to the page.

**Stage 2: Location Handling (Geolocation and Postcode)**

>   Modify the JavaScript code to add a function `getLocation()`. This function should first attempt to get the user's location using the browser's Geolocation API.  If successful, center the map on the user's location and call a function `findGritBins(latitude, longitude)` (which we'll define later).  If geolocation is denied or fails, display a pop-up window (a simple `div` styled as a modal) prompting the user to enter a postcode.  Include an input field and a "Submit" button in the pop-up.  When the "Submit" button is clicked, call a function `geocodePostcode(postcode)` (which we'll define later) with the entered postcode.

**Stage 3: Geocoding Postcode (Placeholder)**

> Create an *asynchronous* JavaScript function `geocodePostcode(postcode)`. For now, this function should just log the postcode to the console.  We'll fill in the actual geocoding logic later. *Include error handling to gracefully handle an empty postcode.*

**Stage 4: Overpass API Integration (Placeholder)**

>   Create an *asynchronous* JavaScript function `findGritBins(latitude, longitude)`. This function will use the Overpass API to find grit bins. For now, this function should just log the latitude and longitude to the console.

**Stage 5: Geocoding Postcode (Implementation)**

>   Implement the `geocodePostcode(postcode)` function. Use a geocoding API (e.g., a free API like Postcodes.io or a placeholder API call) to convert the postcode to latitude and longitude.  If the geocoding is successful, call `findGritBins(latitude, longitude)` with the result. If the geocoding fails, display an appropriate error message to the user in the pop-up. *Handle potential API errors.*

**Stage 6: Overpass API Integration (Implementation)**

>   Implement the `findGritBins(latitude, longitude)` function. Construct an Overpass API query to find grit bins (amenity=grit_bin) within a 5-mile (8047 meters) radius of the given latitude and longitude.  Use the `fetch` API to make the request to the Overpass API. Parse the JSON response. For each grit bin found, add a marker to the Leaflet map at the grit bin's location. *Handle potential API errors, displaying a message on the map if no grit bins are found or if there's an API error.*

**Stage 7: Routing (Placeholder)**

> Add a button to the map in the bottom-left corner with the label "Directions". When this button is clicked, call a function `getDirections(gritBinLat, gritBinLon)` (which we'll implement later). For now, have `getDirections` log a message to the console indicating that directions are being calculated. Assume `gritBinLat` and `gritBinLon` will be the coordinates of the *nearest* grit bin (we'll calculate that later).

**Stage 8: UI - Help Button**

> Add another button to the map in the bottom-left corner, next to the "Directions" button, with the label "Help". When clicked, this button should display a pop-up window (similar to the postcode pop-up) containing a brief explanation of the site and a link to an "About" page (create a simple `about.html` page with placeholder content).

**Stage 9: Nearest Grit Bin and Routing (Implementation)**

>   Modify the `findGritBins` function to, after adding markers, calculate the distance from the user's location to each grit bin. Find the nearest grit bin. Store the nearest grit bin's coordinates in variables (e.g., `nearestGritBinLat`, `nearestGritBinLon`).
>
> Implement the getDirections function, when called, use the stored nearestGritBinLat and nearestGritBinLon. Make a call to a routing API (e.g. OpenRouteService). Pass the users location and the *nearest* grit bin location. On a successful response, draw the route on the map using a Leaflet polyline. *Cache the directions result in a JavaScript object to prevent repeated API calls.* Only call the routing API if the directions haven't been cached. If cached, use the existing polyline. *Handle potential routing API errors.*

**Stage 10: Final Touches and Refinements**

> Review the entire application. Ensure all requirements are met. Refine the styling, error handling, and user experience. Add any necessary comments. Test thoroughly on different browsers and devices. Add appropriate error handling. Make the website look visually appealing.

This detailed brief, along with your answers to the clarifying questions, should provide a solid foundation for an LLM to generate the code for the GritBinFinder application. Remember to iterate on the prompts and provide feedback to the LLM as needed.


> [!quote]
> **user**: To answer the questions:
> 1. use https://project-osrm.org/
> 2. just simple session based is fine
> 3. Stick with vanilla js
> 4. Stick with leaflet
> 5. No preference
> 6. Yeah, handle errors from the openstreemap api and the leaflet / project-osrm api
> 7. choose the most popular option here, but lets park that is it complicated at this point and pick it up in phese 2
> 

**ai**: Okay, excellent. With those clarifications, I can refine the brief slightly. Here's the updated version, incorporating your choices:

## GritBinFinder Technical Design Brief (Revised)

### Part 1: Conventions and Design Principles

*(No changes from the previous version, as the principles remain the same.)*

**1. General Principles:**

*   **Simplicity:** Favor simple, readable, and maintainable code over complex solutions.
*   **Modularity:** Structure code into logical modules (e.g., map handling, API interaction, UI components).
*   **Accessibility:** Ensure the application is accessible to users with disabilities, following WCAG guidelines where possible.
*   **Responsiveness:** The application must be fully responsive and work correctly on various screen sizes (mobile, tablet, desktop).
*   **Performance:** Optimize for performance, minimizing network requests and ensuring fast loading times.

**2. Coding Conventions:**

*   **Language:**  Use modern JavaScript (ES6+).
*   **Style:** Follow a consistent coding style. Use a linter (e.g., ESLint) and a formatter (e.g., Prettier) to enforce style consistency.
*   **Comments:**  Use clear and concise comments to explain non-obvious code sections.
*   **Error Handling:** Implement robust error handling, including user-friendly error messages.  Specifically handle:
    *   Location permission denial.
    *   Overpass API request failures.
    *   Routing API request failures (OSRM).
    *   Network connectivity issues.
*   **Naming:** Use descriptive and consistent names for variables, functions, and classes.  Favor camelCase for variables and functions, and PascalCase for classes.
* **Asynchronous Operations:** Use `async/await` for handling asynchronous operations (e.g., API calls).

**3. Design Principles:**

*   **User Interface:**
    *   Clean and uncluttered design.
    *   Intuitive user flow.
    *   Use of appropriate UI elements (buttons, pop-up windows, etc.).
    *   Clear visual hierarchy.
*   **Mapping:**
    *   Use a suitable mapping library (Leaflet) to display the map and markers.
    *   Provide clear markers for grit bins.
    *   Implement smooth map interactions (zooming, panning).
* **Data Handling:**
    * Fetch grit bin data from the Overpass API.
    * Cache the directions data *in the session* to avoid unnecessary API calls.

**4. Technology Stack:**

*   **Frontend:** HTML, CSS, Vanilla JavaScript (no framework).
*   **Mapping:** Leaflet.js.
*   **Routing:** OSRM (Project OSRM).
*   **Geocoding (Postcode Lookup):** *To be addressed in a later phase.*
*   **Overpass API:** For retrieving grit bin data.

### Part 2: LLM Prompts (Building in Stages) - Revised

The main changes here are specifying OSRM and removing the postcode geocoding steps for now.

**Stage 1: Basic HTML Structure and Map Display**

>   Create an HTML file named `index.html` for the GritBinFinder application. Include the necessary CSS and JavaScript links (including Leaflet.js from a CDN).  Set up a basic HTML structure with a `div` element with the id "map" to hold the map. The map should fill the entire viewport. Initialize a Leaflet map centered on Leeds (latitude 53.8008, longitude -1.5491) with a default zoom level of 12. Use OpenStreetMap as the base layer. Add a title to the page.

**Stage 2: Location Handling (Geolocation Only)**

>   Modify the JavaScript code to add a function `getLocation()`. This function should attempt to get the user's location using the browser's Geolocation API.  If successful, center the map on the user's location and call a function `findGritBins(latitude, longitude)` (which we'll define later).  If geolocation is denied or fails, display a user-friendly message on the map (e.g., "Location services are unavailable. Please use the postcode search feature later."). *Do not implement postcode functionality at this stage.*

**Stage 3: Overpass API Integration (Placeholder)**

>   Create an *asynchronous* JavaScript function `findGritBins(latitude, longitude)`. This function will use the Overpass API to find grit bins. For now, this function should just log the latitude and longitude to the console.

**Stage 4: Overpass API Integration (Implementation)**

>   Implement the `findGritBins(latitude, longitude)` function. Construct an Overpass API query to find grit bins (amenity=grit_bin) within a 5-mile (8047 meters) radius of the given latitude and longitude.  Use the `fetch` API to make the request to the Overpass API. Parse the JSON response. For each grit bin found, add a marker to the Leaflet map at the grit bin's location. *Handle potential API errors, displaying a message on the map if no grit bins are found or if there's an API error.*

**Stage 5: Routing (Placeholder)**

> Add a button to the map in the bottom-left corner with the label "Directions". When this button is clicked, call a function `getDirections(gritBinLat, gritBinLon)` (which we'll implement later). For now, have `getDirections` log a message to the console indicating that directions are being calculated. Assume `gritBinLat` and `gritBinLon` will be the coordinates of the *nearest* grit bin (we'll calculate that later).

**Stage 6: UI - Help Button**

> Add another button to the map in the bottom-left corner, next to the "Directions" button, with the label "Help". When clicked, this button should display a pop-up window (a simple `div` styled as a modal) containing a brief explanation of the site and a link to an "About" page (create a simple `about.html` page with placeholder content).

**Stage 7: Nearest Grit Bin and Routing (Implementation)**

>   Modify the `findGritBins` function to, after adding markers, calculate the distance from the user's location to each grit bin. Find the nearest grit bin. Store the nearest grit bin's coordinates in variables (e.g., `nearestGritBinLat`, `nearestGritBinLon`).
>
> Implement the `getDirections` function. When called, use the stored `nearestGritBinLat` and `nearestGritBinLon`. Make a call to the OSRM API (Project OSRM, using the `http://router.project-osrm.org/route/v1/driving/` endpoint). Construct the URL with the user's location and the *nearest* grit bin location as waypoints. On a successful response, draw the route on the map using a Leaflet polyline. *Cache the directions result in a JavaScript object to prevent repeated API calls.* Only call the OSRM API if the directions haven't been cached. If cached, use the existing polyline. *Handle potential OSRM API errors, displaying a suitable message to the user.* The URL should be like: `http://router.project-osrm.org/route/v1/driving/{userLon},{userLat};{gritBinLon},{gritBinLat}?overview=false`

**Stage 8: Final Touches and Refinements**

> Review the entire application. Ensure all requirements are met. Refine the styling, error handling, and user experience. Add any necessary comments. Test thoroughly on different browsers and devices. Add appropriate error handling. Make the website look visually appealing.

This revised brief focuses on the core functionality, deferring the postcode lookup to a later phase. This makes the initial development more manageable. The prompts are now more precise regarding the OSRM API usage.

