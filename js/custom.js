/////////////
// globals //
/////////////
    var attrArray = [
                    "earnings_bachelors_degree", 
                    "earnings_graduate_professional", 
                    "earnings_high_school_graduate", 
                    "earnings_less_than_high_school_graduate", 
                    "earnings_some_college", 
                    "geography", 
                    "id", 
                    "id2", 
                    "pop_25_9th_12th_grade_no_diploma", 
                    "pop_25_associates_degree", 
                    "pop_25_bachelors_degree", 
                    "pop_25_graduate_or_professional_degree", 
                    "pop_25_high_school_graduate", 
                    "pop_25_some_college_no_degree", 
                    "population_25_less_than_9th_grade", 
                    "poverty_bachelors_degree_or_higher", 
                    "poverty_high_school_graduate",
                    "poverty_some_college_or_associates_degree",
                    "tot_population_25",
                    "total_high_school_graduate_or_higher"
                    ];

    var expressed = attrArray[10]; //initial attribute

    var mheight = 460;

    

/////////////////////////////////
// create the map on page load //
/////////////////////////////////

    window.onload = setMap();

////////////////////
// create the map //
////////////////////

    function setMap()
    {
    	// set up map width and height
    	var width = window.innerWidth * .5,
    		height = mheight;

    	// create the map
    	var map = d3.select("body")
    		.append("svg")
    		.attr("class", "map")
    		.attr("width", width)
    		.attr("height", height);

        //create title for chart
        var mapTitle = map.append("text")
            .attr("x", 130)
            .attr("y", 20)
            .attr("class", "chartTitle")
            .text("Percentage of Folks With Bachelors Degrees by County");

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
            .defer(d3.csv, "data/newed.csv")
            .defer(d3.json, "data/wiscoNewEd.json") //load choropleth spatial data
            .await(callback);

        ///////////////////////
        // callback function //
        ///////////////////////

        function callback(error,csvData, wisco)
        {
        	var wisconsinCounties = topojson.feature(wisco, wisco.objects.wiscoNewEd).features;

            var colorScale = makeColorScale(csvData);

            wisconsinCounties = joinData(wisconsinCounties,csvData);

            var counties = map.selectAll('.counties')
                .data(wisconsinCounties)
                .enter()
                .append('path')
                .attr("class", function(d)
                {
                    return "counties " + d.properties.id2;
                })
                .attr("d", path)
                .style("fill", function(d)
                {
                    return colorScale(d.properties[expressed]);
                });

                //add coordinated visualization to the map
                setChart(csvData, colorScale);
        };
    };


//////////////////////////////////////////////
// join the data in the csv to the topojson //
//////////////////////////////////////////////

    function joinData(wisconsinCounties, csvData)
    {
        //loop through csv to assign each set of csv attribute values
        for (var i=0; i<csvData.length; i++)
        {
            var csvRegion = csvData[i];
            var csvKey = csvRegion.id2; 

            //loop through geojson 
            for (var a=0; a<wisconsinCounties.length; a++)
            {

                var geojsonProps = wisconsinCounties[a].properties; 
                var geojsonKey = geojsonProps.id2; 

                if (geojsonKey == csvKey)
                {

                    //assign attributes and values
                    attrArray.forEach(function(attr)
                    {
                        var val = parseFloat(csvRegion[attr]); 
                        geojsonProps[attr] = val; 
                    });
                };
            };
        };

        return wisconsinCounties;
    };


//////////////////////////
// create a color scale //
//////////////////////////

    function makeColorScale(data)
    {
        var colorClasses = 
        [
            "#eff3ff",
            "#bdd7e7",
            "#6baed6",
            "#3182bd",
            "#08519c"
        ];

        //create color scale
        var colorScale = d3.scale.threshold()
            .range(colorClasses);

        //create array of values for expressed attribute
        var domainArray = [];

        for (var i=0; i<data.length; i++)
        {
            var val = parseFloat(data[i][expressed]);
            domainArray.push(val);
        };

        //use ckmeans clustering algorithm to create natural breaks
        var clusters = ss.ckmeans(domainArray, 5);

        //reset domain array to cluster minimums
        domainArray = clusters.map(function(d)
        {
            return d3.min(d);
        });

        //remove first value from domain array to create class breakpoints
        domainArray.shift();

        //assign array of last 4 cluster minimums as domain
        colorScale.domain(domainArray);

        return colorScale;
    };


////////////////////////
// create a bar chart //
////////////////////////

    function setChart(csvData, colorScale)
    {
        //chart specs
        var chartWidth = window.innerWidth * 0.425,
            chartHeight = mheight,
            leftPadding = 25,
            rightPadding = 7,
            topBottomPadding =-7,
            chartInnerWidth = chartWidth - leftPadding - rightPadding,
            chartInnerHeight = chartHeight - topBottomPadding * 2,
            translate = "translate(" + leftPadding + "," + topBottomPadding + ")";

        //create svg to hold chart
        var chart = d3.select("body")
            .append("svg")
            .attr("width", chartWidth)
            .attr("height", chartHeight)
            //.attr("margin-bottom", bottomPadding)
            .attr("class", "chart");

        //create chart background
        var chartBackground = chart.append("rect")
            .attr("class", "chartBackground")
            .attr("width", chartInnerWidth)
            .attr("height", chartInnerHeight)
            .attr("transform", translate);

        //create a scale to size bars
        var yScale = d3.scale.linear()
            .range([0, chartHeight]) // what the fuck is this
            .domain([0, 29.6]); // what the fuck is this

        //create scale for chart
        var chartScale = d3.scale.linear()
            .range([chartHeight, 0]) // what the fuck is this
            .domain([0, 29.6]);


        //create bars for chart
        var bars = chart.selectAll(".bars")
            .data(csvData)
            .enter()
            .append("rect")
            .sort(function(a, b)
            {
                return b[expressed]-a[expressed]
            })
            .attr("class", function(d)
            {
                return "bars " + d.id2;
            })
            .attr("width", chartInnerWidth / csvData.length - 1)
            .attr("x", function(d, i)
            {
                return (i * (chartInnerWidth / csvData.length)) + leftPadding;
            })
            .attr("height", function(d)
            {
                return yScale(parseFloat(d[expressed]));
            })
            .attr("y", function(d)
            {
                return (chartHeight - yScale(parseFloat(d[expressed]))) + topBottomPadding;
            })
            .style("fill", function(d)
            {
                return colorScale(d[expressed]);
            });

        //create title for chart
        var chartTitle = chart.append("text")
            .attr("x", 130)
            .attr("y", 20)
            .attr("class", "chartTitle")
            .text("Percentage of Folks With Bachelors Degrees by County");

        //create vertical axis
        var yAxis = d3.svg.axis()
            .scale(chartScale)
            .orient("left");

        //position axis
        var axis = chart.append("g")
            .attr("class", "axis")
            .attr("transform", translate)
            .call(yAxis);
    };