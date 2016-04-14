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

    var expressed;

    var csvData;

    var name;

    var labelContent;

    var mheight = 460;

    //chart specs
    var chartWidth = window.innerWidth *.7,
        chartHeight = 200,
        leftPadding = 25,
        rightPadding = 7,
        topBottomPadding =-7,
        chartInnerWidth = chartWidth - leftPadding - rightPadding,
        chartInnerHeight = chartHeight - topBottomPadding * 2,
        translate = "translate(" + leftPadding + "," + topBottomPadding + ")";

    var scaleMax = 11;




//////////////////////////////////////////////////
// change dataset when user selects a new value //
//////////////////////////////////////////////////

    //////////////////////////
    // education level data //
    //////////////////////////
        // load percetage of folks with some high school    
        $('#document').ready(function() 
        {
            expressed = attrArray[8];
            name = "who have completed some high school";
            labelContent = "Some High School";
            // console.log(expressed, csvData);
            
        });

        // load percetage of folks with some high school
        $('#shs').click(function() 
        {
            expressed = attrArray[8];
            name = "who have completed some high school";
            labelContent = "Some High School"; 
            changeAttribute(expressed, csvData);
        });

        // load percetage of folks with some high school
        $('#hsg').click(function() 
        {
            expressed = attrArray[12];
            name = "who are high school graduates";
            labelContent = "High School Graduates";
            changeAttribute(expressed, csvData);
        });

        // load percetage of folks with some high school
        $('#sc').click(function() 
        {
            expressed = attrArray[13];
            name = "who have completed some college";
            labelContent="Some College";
            changeAttribute(expressed, csvData);
        });

        // load percetage of folks with some high school
        $('#bd').click(function() 
        {
            expressed = attrArray[10];
            name = "who have obtained a bachelor's degree";
            labelContent="Bachelor's degree";
            changeAttribute(expressed, csvData);
        });     

        // load percetage of folks with some high school
        $('#gdopd').click(function() 
        {
            expressed = attrArray[11];
            name = "who have obtained a graduate or professional degree";
            labelContent="Graduate or Professional degree";
            changeAttribute(expressed, csvData);
        });

    //////////////////
    // poverty data //
    //////////////////




//////////////////////////////////////
// change the name of the statistic //
//////////////////////////////////////
    function setName () 
    {
        $('#educationStatistic').html(name)
    }



/////////////////////////////////////////
// change value of education statistic //
/////////////////////////////////////////

    function changePlaceholder()
    {
        $('#chosenEdStatistic').val(labelContent);
    };



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
    	var map = d3.select("#map")
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
            .defer(d3.csv, "data/newed.csv")
            .defer(d3.json, "data/wiscoNewEd.json")
            .await(callback);



        ///////////////////////
        // callback function //
        ///////////////////////

        function callback(error,csvReturned, wisco)
        {
        	
            csvData = csvReturned;

            var wisconsinCounties = topojson.feature(wisco, wisco.objects.wiscoNewEd).features;

            var colorScale = makeColorScale(csvData);

            wisconsinCounties = joinData(wisconsinCounties,csvData);

            var counties = map.selectAll('.counties')
                .data(wisconsinCounties)
                .enter()
                .append('path')
                .attr("class", function(d)
                {
                    return "counties " + d.properties.CTY_NAME;
                })
                .attr("d", path)
                .style("fill", function(d)
                {
                    return colorScale(d.properties[expressed]);
                })
                .on("mouseover", function(d)
                {
                    nm = d.properties.CTY_NAME;
                    val = d.properties[expressed];
                    highlight(nm, val);

                })
                .on("mouseout", function(d)
                {
                    nm = d.properties.CTY_NAME;
                    dehighlight(nm);
                })
                .on("mousemove", moveLabel);

                //add coordinated visualization to the map
                setChart(csvData, colorScale, wisco);
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
        
        scaleMax = d3.max(domainArray);
        scaleMax = scaleMax + 2;

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

    //create svg to hold chart
    var chart = d3.select("#chart")
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
                return "bars " + d.geography; 
            })
            .attr("width", chartInnerWidth / csvData.length - 1);


        updateBars(bars,csvData.length,colorScale);
    };




///////////////////////////////////////////////////
// change the attribute value based on selection //
///////////////////////////////////////////////////

    function changeAttribute(attribute, csvData)
    {
        //change the expressed attribute
        // expressed = attribute;
        //create svg to hold chart


        //recreate the color scale
        var colorScale = makeColorScale(csvData);

        //recolor enumeration units
        var counties = d3.selectAll(".counties")
            .transition()
            .duration(500)
            .style("fill", function(d)
            {
                return colorScale(d.properties[expressed]);
            });

        // //create bars for chart
        var bars = d3.selectAll(".bars")
            .sort(function(a, b)
            {
                return b[expressed]-a[expressed]
            })
            .transition()
            .delay(function (d, i)
            {
                return i * 5
            })
            .duration(10)
            .attr("class", function(d)
            {
                return "bars " + d.geography;
            })
            .attr("width", chartInnerWidth / csvData.length - 1);


            updateBars(bars,csvData.length,colorScale);
    };



//////////////////////////////////////////
// highlight enumeration units and bars //
//////////////////////////////////////////

    function highlight(counties, val)
    { 
        // console.log(counties)
        //change stroke
        var selected = d3.selectAll('.' + counties)
            .style(
            {
                "stroke": "#f40c4a",
                "stroke-width": "3"
            });

        setLabel(counties, val);
    };


    function dehighlight(counties)
    {
        var selected = d3.selectAll('.' + counties)
            .style(
            {
                "stroke": "none",
                "stroke-width": "0px"
            });

        d3.select(".infolabel")
        .remove();
    }



//////////////////////////
// create dynamic label //
//////////////////////////

    function setLabel(counties, val)
    {

        //label content
        var labelAttribute = "<h5>" + labelContent +
            "</h5><b>" + val + "%</b>";

        //create info label div
        var infolabel = d3.select("body")
            .append("div")
            .attr
            ({
                "class": "infolabel",
                "id": counties.counties + "_label"
            })
            .html(labelAttribute);


        var countyName = infolabel.append("div")
            .attr("class", "labelname")
            .html(counties.replace(/_/g,' ') + " County");
    };



////////////////////
// move the label //
////////////////////
    function moveLabel()
    {
        //get width of label
        var labelWidth = d3.select(".infolabel")
            .node()
            .getBoundingClientRect()
            .width;

        //use coordinates of mousemove event to set label coordinates
        var x1 = d3.event.clientX + 10,
            y1 = d3.event.clientY - 75,
            x2 = d3.event.clientX - labelWidth - 10,
            y2 = d3.event.clientY + 25;

        //horizontal label coordinate, testing for overflow
        var x = d3.event.clientX > window.innerWidth - labelWidth - 20 ? x2 : x1; 

        //vertical label coordinate, testing for overflow
        var y = d3.event.clientY < 75 ? y2 : y1; 

        d3.select(".infolabel")
            .style
            ({
                "left": x + "px",
                "top": y + "px"
            });
    };



///////////////////////////////////
// update the bars with new info //
///////////////////////////////////

    function updateBars(bars,n,colorScale, chart)
    {

        setScale(chart);

        var yScale = d3.scale.linear()
            .range([0, chartHeight]) 
            .domain([0, scaleMax]); 

        bars.attr("x", function(d, i)
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
        })
        .on("mouseover", function(d)
        {
            var nm = d.geography.split(' ');
            val = d[expressed];
            highlight(nm[0], val);
        })
        .on("mouseout", function(d)
        {
            var nm = d.geography.split(' ');
            dehighlight(nm[0])
        })
        .on("mousemove", moveLabel);
    };

////////////////////////////////
// set the scale of the chart //
////////////////////////////////

    function setScale(chart)
    {
        setName();
        changePlaceholder();
        d3.select('.axis')
        .remove();

        //create scale for chart
        var chartScale = d3.scale.linear()
            .range([chartHeight, 0]) 
            .domain([0, scaleMax]);

        //create vertical axis
        var yAxis = d3.svg.axis()
            .scale(chartScale)
            .orient("left");

        //position axis
        var axis = d3.select('.chart')
            .append("g")
            .attr("class", "axis")
            .attr("transform", translate)
            .call(yAxis);
    }

