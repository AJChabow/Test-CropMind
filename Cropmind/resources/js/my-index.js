let polygonLabels = new Map();

function getPolygonCentroid(poly) {
  const path = poly.getPath();
  let x = 0;
  let y = 0;
  let len = path.getLength();

  for (let i = 0; i < len; i++) {
    const latLng = path.getAt(i);
    x += latLng.lat();
    y += latLng.lng();
  }

  return new google.maps.LatLng(x / len, y / len);
}

function addLabelAtCentroid(poly, name, map) {
  const centroid = getPolygonCentroid(poly);
  const label = new google.maps.InfoWindow({
    content: '<div contenteditable="true">' + name + '</div>',
    position: centroid
  });

  // Open the label with the provided map instance
  label.open(map);
  polygonLabels.set(poly, label);

  // Add listeners to update the label position when the polygon is edited
  google.maps.event.addListener(poly.getPath(), 'set_at', () => {
    updateLabelPosition(poly, map);
  });
  google.maps.event.addListener(poly.getPath(), 'insert_at', () => {
    updateLabelPosition(poly, map);
  });
}

function updateLabelPosition(polygon, map) {
  const centroid = getPolygonCentroid(polygon);
  const label = polygonLabels.get(polygon);
  if (label) {
    label.setPosition(centroid);
    label.open(map); // Ensure the label is opened with the map instance
  }
}

function initMap() {
  const map = new google.maps.Map(document.getElementById("map"), {
    center: {
      lat: -34.397,
      lng: 150.644
    },
    zoom: 8,
  });
  const drawingManager = new google.maps.drawing.DrawingManager({
    drawingMode: google.maps.drawing.OverlayType.MARKER,
    drawingControl: true,
    drawingControlOptions: {
      position: google.maps.ControlPosition.TOP_CENTER,
      drawingModes: [
        google.maps.drawing.OverlayType.POLYGON,
      ],
    },
    polygonOptions: {
      editable: true,
      draggable: true,
      fillColor: '#FFFFFF',
      strokeColor: '#000000'
    },
  });

  let selectedPolygon = null;
  document.getElementById('saveDataBtn').addEventListener('click', function() {
    const allPolygonsData = [];

    polygonLabels.forEach((label, polygon) => {
      const vertices = polygon.getPath().getArray().map(latlng => ({
        lat: latlng.lat(),
        lng: latlng.lng()
      }));
      const area = google.maps.geometry.spherical.computeArea(polygon.getPath());
      const labelText = label.getContent().replace(/<[^>]+>/g, ''); // Strip HTML tags

      allPolygonsData.push({
        label: labelText,
        vertices: vertices,
        area: area
      });
    });

    // Convert the data to a JSON string
    const jsonData = JSON.stringify(allPolygonsData);
    console.log(jsonData); // For demonstration purposes; you can send this data to your server

    // Optional: send the data to the server
    // sendDataToServer(jsonData);
  });

  function sendDataToServer(data) {
    // Implement your code to send data to the server, e.g., using fetch API
    // fetch('YOUR_SERVER_ENDPOINT', { method: 'POST', body: data, ... });
  }
  // Assuming you have initialized the DrawingManager as drawingManager
  google.maps.event.addListener(drawingManager, 'overlaycomplete', function(event) {
    if (event.type == 'polygon') {
      // Add a click listener to each polygon
      google.maps.event.addListener(event.overlay, 'click', function() {
        if (selectedPolygon === this) {
          // Deselect if the same polygon is clicked again
          //  reset the style
          selectedPolygon.setOptions({
            fillColor: '#FFFFFF',
            strokeColor: '#000000'
          });
          selectedPolygon = null;
        } else {
          if (selectedPolygon) {
            // reset the style of the previously selected polygon
            selectedPolygon.setOptions({
              fillColor: '#FFFFFF',
              strokeColor: '#000000'
            });
          }
          selectedPolygon = this;
          //  change the style of the selected polygon
          selectedPolygon.setOptions({
            fillColor: '#FF0000',
            strokeColor: '#FF0000'
          });
        }
      });
    }
    // Prompt the user to name the polygon
    const polygonName = prompt("Please enter a name for the Irrigation Zone:", "Zone 1");
    if (polygonName != null && polygonName !== "") {
      addLabelAtCentroid(event.overlay, polygonName, map);
    }
    // Optional: switch back to non-drawing mode after a polygon is drawn
    drawingManager.setDrawingMode(null);
  });

  //Keydown listener
  document.addEventListener('keydown', function(event) {
    if ((event.key === 'Delete') && selectedPolygon) {
      event.preventDefault(); // Prevent the default action of the keys

      // Remove the label associated with the polygon
      const label = polygonLabels.get(selectedPolygon);
      if (label) {
        label.close(); // Close the label
        polygonLabels.delete(selectedPolygon); // Remove the label from the map
      }

      // Remove the selected polygon from the map
      selectedPolygon.setMap(null);
      selectedPolygon = null; // Reset the reference
    }
  });

  drawingManager.setMap(map);
}

window.initMap = initMap;
