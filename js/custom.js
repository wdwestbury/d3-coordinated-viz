// custom js for coordinatedd3 viz

//begin script when window loads
window.onload = setMap();

function setMap()
{
	// set up map width and height
	var width = 960,
		height = 460;

	// create the map
	var map = d3.select("body")
		.append("svg")
		.attr("class", "map")
		.attr("width", width)
		.attr("height", height);

	// create a projection
	var projection = d3.geo.albers()
		.center([0, 37.78])
		.rotate([90, -7, 0])
		.parallels([36.77, 48.78])
		.scale(5000.03)
		.translate([width / 2, height / 2]);

    var path = d3.geo.path()
        .projection(projection);


    //use queue.js to parallelize asynchronous data loading
    d3_queue.queue()
        .defer(d3.json, "data/wiscoGeo.json") //load choropleth spatial data
        .await(callback);

    function callback(error, wisco)
    {
    	var wisconsinCounties = topojson.feature(wisco, wisco.objects.wiscoGeo).features;

    	var counties = map.selectAll('.counties')
    		.data(wisconsinCounties)
    		.enter()
    		.append('path')
    		.attr("class", "counties")
    		.attr("d", path);

        // console.log(error);
        // console.log(wisco);
     	console.log(wisconsinCounties);
    };
};