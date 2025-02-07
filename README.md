# Grit Bin Finder

Given the recent spate of cold weather in the uk, I was having a conversation with a colleague about the fact he only just realised you can use local grit bins to get grit for your path/drive, this lead to asking about where the nearest grit bin is and how they didn't realise where it was.  After looking at [open street map](https://wiki.openstreetmap.org/wiki/Tag:amenity%3Dgrit_bin) it turns out that there is a tag for girt bins in there and that could be used to locate them.  The timing of this idea landed well with some Mutual Mentoring I was participating in, so we decided to continue with this project together, both building the app using AI, and presenting it to a wider audience.

An example of grit bins on overpass turbo can be found [here](https://overpass-turbo.eu/s/1Yon)

## Design Brief
The app should be and modern html site that will rendered equally well on both mobile and desktop devices, javascript and css should be used also.

The main user journey should be as follows:
- The user visits gribinfinder.co.uk and is presented with a map, that by default is centred on Leeds.
- The user will be prompted to allow location permissions so their location can be used, if they decline they can enter a post code.  This should be handled via a pop-up window in the app.
- Once a location is determined the map is re-centered on the location and the grit bins within a 5 mile radius are found and plotted on the map.  The overpass turbo api should be used to retrieve the results.
- There should be a button in the bottom left corner of the map that allows the user to toggle directions to the nearest grit bin, clicking this the first time will make the call to the routing api and display the directions which will be cached to avoid calling the api again during this session.
- There should also be a help button in the bottom left of the map that pops open a windows explaining briefly what the site does, along with a link out to more information hosted on the about page

See [GritBinFinderLLMDesignBrief](doc/GritBinFinderLLMDesignBrief.md)