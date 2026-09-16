var map = L.map('map').setView([40.878, -77.800], 8);

const mapboxKey = 'pk.eyJ1IjoieWp0aSIsImEiOiJjbXR1amNmYm0wbDYxMndvaXN4eTJvMDRkIn0.bNNFtykpp1aHpvlsFUJ3YA'
const mapboxStyle = 'mapbox/dark-v11'

L.tileLayer(`https://api.mapbox.com/styles/v1/${mapboxStyle}/tiles/512/{z}/{x}/{y}{r}?access_token=${mapboxKey}`, {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

const response = await fetch ("js/pa_pres_results.geojson");
const data = await response.json();

function getCandidateColor(candidate) {
    if (candidate === "DONALD J TRUMP") {
        return "#ff0101";
    }
    if (candidate === "JOSEPH R BIDEN JR") {
        return "#007ef3";
    }
}

function getVoteOpacity(candidatevotes, totalvotes) {
    const voteShare = (candidatevotes - (totalvotes - candidatevotes)) / totalvotes;
    return voteShare * 2;
}

const dataLayer = L.geoJSON(data, {
    pointToLayer: (feature, latlng) =>
        L.circleMarker(latlng, {
            stroke: false,
            border: "#ebebeb",
            radius: 6,
            fillOpacity: 1
        }),

            style: (feature) => {
                const properties = feature.properties;

                return {
                    fillColor: getCandidateColor(properties.candidate),
                    fillOpacity: getVoteOpacity(
                        properties.candidatevotes,
                        properties.totalvotes
                    ),
                    color: "#ffffff",
                    weight: 1
                };
    },
    onEachFeature: (feature, layer) => {
        const properties = feature.properties;

        const tooltipClass =
            properties.candidate === "DONALD J TRUMP"
                ? "tooltip-trump"
                : "tooltip-biden";

        const logo =
        properties.candidate === "DONALD J TRUMP"
            ? "img/republican.svg"
            : "img/democrat.svg";

        const voteShare =
            properties.candidatevotes / properties.totalvotes * 100;

        layer.bindTooltip(`
            <div class="tooltip-content">
                <img class="party-logo" src="${logo}" alt="">

                <h1>${properties.name} County</h1><br>
                <h2>VOTE SHARE</h2><br>
                <h3>${voteShare.toFixed(0)}%</h3>
            </div>
        `, {
            className: tooltipClass
        });
    },
    interactive: true,
});

dataLayer.addTo(map);

var legend = L.control({position: 'bottomright'});

legend.onAdd = function (map) {
    var div = L.DomUtil.create('div', 'info legend');
    var categories = ['Republican', 'Democrat'];
    var colors = ['#ff0101', '#007ef3'];

    div.innerHTML += '<h2>Map Legend</h2>';

    // Loop through categories to generate HTML rows with color blocks
    for (var i = 0; i < categories.length; i++) {
        div.innerHTML += 
            '<i style="background:' + colors[i] + '"></i> ' + 
            categories[i] + '<br>';
    }

    return div;
};

legend.addTo(map);