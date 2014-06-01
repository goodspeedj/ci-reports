function stackedBarChart() {

    var ideal_time = 43200000;
    var thirty_avg = 49743024.22088353;
    var avg_time   = 54442875.80642504;

    // Default bar colors
    var colors;

    // These are the x and y dimensions supplied by the calling chart
    var xValue, yValue, zValue;


    // y is the fix time scal on the Y axis
    var main_y  = d3.scale.linear().range([main_height, 0] );
    var mini_y  = d3.scale.linear().range([mini_height, 0] );

    // Z is the dimension (i.e.: portfolio) scale on the X axis
    var main_z = d3.scale.ordinal();
    var mini_z = d3.scale.ordinal();

    // Define the Y axis
    var main_yAxis = d3.svg.axis()
        .scale(main_y)
        .tickFormat(function(d) { return yTickFormat(d) })
        .orient("left");



    function chart(selection) {
        selection.each(function(data) {

            var len = 0;

            // This adds new elements to the data object
            data.forEach(function(d) {
                d.portfolio = dimKey(d);
                d.date = new Date(d._id.year, d._id.month-1, d._id.day);
                len++;
            });

            // This is needed to get the y0 and y1 values required for the stacked chart
            var nestByDate = d3.nest()
                .key(function(d) { return xValue(d); })
                .sortValues(function(a,b) { return ((a.buildFixTime < b.buildFixTime)
                    ? -1
                    : 1);
                    return 0;} )
                .entries(data);

            

            // Calc the y0 and y1 values (start and end points of the stacked bars)
            nestByDate.forEach(function(d) {
                var y0 = 0;
                var y1 = 0;
                d.vis = "1";
                d.values.forEach(function(d) {

                    // y0 is the y axis start of the bar
                    d.y0 = y0 + y1;

                    // y1 is the y axis end of the bar
                    d.y1 = y1 = yValue(d);

                    // d.vis controls whether bars are visible or not
                    d.vis = "1";
                });
            });


            // Define the X axis scale and domain
            var main_x = d3.time.scale().range([0, main_width - axis_offset - (main_width/len/2)]);

            main_x.domain([
                d3.min(data, function(d) { return xValue(d).setDate(xValue(d).getDate() - 1); }), 
                d3.max(data, function(d) { return xValue(d).setDate(xValue(d).getDate() + 2); })
            ]);

            var mini_x = d3.time.scale().range(main_x.range()).domain(main_x.domain());


            // y axis domain (ie: time)
            main_y.domain([0, d3.max(data, function(d) { return yValue(d); })]);
            mini_y.domain([0, d3.max(data, function(d) { return yValue(d); })]);

            // Create brush for mini graph
            var brush = d3.svg.brush()
                .x(mini_x)
                .on("brush", brushed);

            // flatten out the data
            var nested = d3.nest()
                .key(dimKey)
                .entries(data);

            // Add the vis element to the nested data structure
            nested.forEach(function(d) {
                d.vis = "1";
            });

            // Define the X axis
            var main_xAxis = d3.svg.axis()
                .scale(main_x)
                .ticks(10)
                .orient("bottom");

            var mini_xAxis = d3.svg.axis()
                .scale(mini_x)
                .ticks(10)
                .orient("bottom");

            // Add the X axis
            main.append("g")
                .attr("class", "x axis")
                .attr("clip-path", "url(#clip)")
                .attr("transform", "translate(0," + main_height + ")")
                .call(main_xAxis);

            mini.append("g")
                .attr("class", "x axis mini_axis")
                .attr("clip-path", "url(#clip)")
                .attr("transform", "translate(0," + mini_height + ")")
                .call(mini_xAxis);

            // Add the brush
            mini.append("g")
                .attr("class", "x brush")
                .call(brush)
              .selectAll("rect")
                .attr("y", -10)
                .attr("height", mini_height + 15);

            // Add the Y axis
            main.append("g")
                .attr("class", "y axis")
                .attr("transform", "translate(0,0)")
                .call(main_yAxis)
              .append("text")
                .attr("transform", "rotate(-90)")
                .attr("y", 6)
                .attr("dy", ".71em")
                .style("text-anchor", "end")
                .text(yLabel)
                .attr("class","y_label");

            // Create the main bars
            var bar = main.selectAll(".bars")
                .data(nestByDate)
              .enter().append("g")
                .attr("clip-path", "url(#clip)");

            bar.selectAll("rect")
                .data(function(d) { return d.values; })
              .enter().append("rect")
                .attr("class", dimKey)
                .attr("width", function(d) { return main_width/len; })
                .attr("x", function(d) { return main_x(xValue(d).setDate(xValue(d).getDate() - 1)) - (main_width/len)/2; })
                .attr("y", function(d) { return main_y(d.y1); })
                .attr("fill", function(d) { return colors(zValue(d)); } )
                .attr("height", function(d) { return main_y(d.y0) - main_y(d.y1); })
                .on("mouseover", function(d) {
                    var otherbars = $('rect').not('rect.' + d.portfolio);
                    d3.selectAll(otherbars).transition().duration(200).style("opacity", .4);

                    tooltip.transition().duration(200)
                        .style("opacity", .8);
                    tooltip
                        .html(d.portfolio)
                          .style("left", (d3.event.pageX + 10) + "px")
                          .style("top", (d3.event.pageY - 25) + "px");
                })
                .on("mouseout", function(d) {
                    var otherbars = $('rect').not('rect.' + d.portfolio);
                    d3.selectAll(otherbars).transition().duration(200).style("opacity", 1);

                    tooltip.transition().duration(500).style("opacity", 0);
           
                });

            // Create the mini bars
            var mini_bar = mini.selectAll(".mini_bars")
                .data(nestByDate)
              .enter().append("g")
                .attr("class", function(d) { return d.key + "-group mini_bar"; });

            mini_bar.selectAll("rect")
                .data(function(d) { return d.values; })
              .enter().append("rect")
                .attr("class", dimKey)
                .attr("width", function(d) { return main_width/len; })
                .attr("x", function(d) { return mini_x(xValue(d)) - (main_width/len)/2; })
                .attr("y", function(d) { return mini_y(d.y1); })
                .attr("fill", function(d) { return colors(zValue(d)); } )
                .attr("height", function(d) { return mini_y(d.y0) - mini_y(d.y1); });

            // Add the ideal fix time line
            var ideal_line = main.append("line")
                .attr("class", "ideal")
                .attr("x1", 0)
                .attr("y1", main_y(ideal_time))    
                .attr("x2", main_width-main_margin.right - legend_text_offset.width)
                .attr("y2", main_y(ideal_time))
                .attr("stroke-width", 1)
                .attr("stroke-dasharray", "5,5")
                .attr("stroke", "#413839");

            main.append("text")
                .attr("class", "ideal")
                .attr("x", main_width-main_margin.right - legend_text_offset.width + 10)
                .attr("y", main_y(ideal_time) + 8)
                .attr("fill", "#413839")
                .attr("font-size", "11px")
                .attr("font-family", "sans-serif")
                .text("2014 Target Avg");

            /* Add the eComm avg fix time line
            var avg_line = main.append("line")
                .attr("class", "avg")
                .attr("x1", 0)
                .attr("y1", main_y(avg_time))    
                .attr("x2", main_width-main_margin.right - legend_text_offset.width)
                .attr("y2", main_y(avg_time))
                .attr("stroke-width", 1)
                .attr("stroke-dasharray", "10,10")
                .attr("stroke", "#413839");

            main.append("text")
                .attr("class", "avg")
                .attr("x", main_width-main_margin.right - legend_text_offset.width + 10)
                .attr("y", main_y(avg_time))
                .attr("fill", "#413839")
                .attr("font-size", "11px")
                .attr("font-family", "sans-serif")
                .text("eComm YTD Avg");
            */

            // 30 day average
            var thirty_line = main.append("line")
                .attr("class", "avg")
                .attr("x1", 0)
                .attr("y1", main_y(thirty_avg))    
                .attr("x2", main_width-main_margin.right - legend_text_offset.width)
                .attr("y2", main_y(thirty_avg))
                .attr("stroke-width", 1)
                .attr("stroke-dasharray", "10,10")
                .attr("stroke", "#413839");

            main.append("text")
                .attr("class", "avg")
                .attr("x", main_width-main_margin.right - legend_text_offset.width + 10)
                .attr("y", main_y(thirty_avg))
                .attr("fill", "#413839")
                .attr("font-size", "11px")
                .attr("font-family", "sans-serif")
                .text("eComm 30 day average");

            // Add the legend
            var legend = main.selectAll(".legendLabel")
                .data(nested)
              .enter().append("g")
                .attr("class", "legendLabel")
                .attr("transform", function(d,i) { return "translate(0," + i * 20 + ")"; });

            legend.append("text")
                .attr("class", "legendLabel")
                .attr("x", function(d) { return main_width - legend_text_offset.width; })
                .attr("y", function(d,i) { return main_height - legend_text_offset.height + (i * legend_interval); })
                .text( function (d) { return d.key; })
                .attr("font-size", "11px")
                .attr("fill", "black");

            legend.append("rect")
                .attr("height",10)
                .attr("width", 25)
                .attr("x",main_width - legend_rect_offset.width)
                .attr("y", function(d,i) { return main_height - legend_rect_offset.height + (i * legend_interval); })
                .attr("class", function(d) { return d.key; })
                .attr("stroke", function(d) { return colors(d.key);})
                .attr("fill", function(d) {
                    if(d.vis === "1") {
                        return colors(d.key);
                    }
                    else {
                        return "white";
                    }
                })
                .on("mouseover", function(d) {

                    // Make the line bold
                    d3.select(this)
                        .style("stroke-width", "4px");
                })
                .on("mouseout", function(d) {
                    d3.select(this)
                        .style("stroke-width", "2px");
                })
                .on("click", function(d) { 
                    
                    if(d.vis === "1") {
                        d.vis = "0";
                        d.values.forEach(function(d) {
                            d.vis = "0";
                        });
                    }
                    else{
                        d.vis = "1";
                        d.values.forEach(function(d) {
                            d.vis = "1";
                        });
                    }

                    // update the Y axis
                    maxY=getMaxY(nested);
                    main_y.domain([0,maxY]);
                    mini_y.domain([0,maxY]);

                    main.select(".y.axis")
                        .transition()
                          .duration(800)
                        .call(main_yAxis);

                    // Update the ideal dashed line
                    main.selectAll(".ideal")
                        .transition()
                          .duration(500)
                        .attr("y", main_y(ideal_time))
                        .attr("y1", main_y(ideal_time))
                        .attr("y2", main_y(ideal_time));

                    // Update the avg dashed line
                    main.selectAll(".avg")
                        .transition()
                          .duration(500)
                        .attr("y", main_y(avg_time))
                        .attr("y1", main_y(avg_time))
                        .attr("y2", main_y(avg_time));                    

                    // Update the legend 
                    legend.select("rect").transition()
                        .attr("fill-opacity", function(d) {
                            if (d.vis === "1") {
                                return "1.0";
                            }
                            else {
                                return "0.0";
                            }
                        });

                    // show or hide the bars
                    updateStack();

                    bar.selectAll("rect")
                        .transition()
                          .duration(300)
                        .attr("y", function(d) { return main_y(d.y1); })
                        .attr("height", function(d) { return main_y(d.y0) - main_y(d.y1); });

                    mini_bar.selectAll("rect")
                        .transition()
                          .duration(300)
                        .attr("y", function(d) { return mini_y(d.y1); })
                        .attr("height", function(d) { return mini_y(d.y0) - mini_y(d.y1); });
                });



            // Get the max Y value
            function getMaxY() {
                var maxY = -1;
                
                nested.forEach(function(d) {
                    if (d.vis === "1") {
                        d.values.forEach(function(d) {
                            if (yValue(d) > maxY){
                                maxY = yValue(d);
                            }
                        });
                    }
                });
                return maxY;
            } 


            function brushed() {

                main_x.domain(brush.empty() ? mini_x.domain() : brush.extent());

                // Calculate how many days are in the brush
                if (brush.empty()) {

                    bar.selectAll("rect")
                      .attr("width", function(d) { return main_width/len; })
                      .attr("x", function(d) { return main_x(xValue(d)) - (main_width/len)/2; });
                }
                else {
                    var diff = Math.abs(brush.extent()[1] - brush.extent()[0]);
                    var days = Math.round(diff / (1000*60*60*24));

                    if (days === 0) {
                        days = 1;
                    }

                    bar.selectAll("rect")
                      .attr("width", function(d) { return main_width/days/2; })
                      .attr("x", function(d) { return main_x(xValue(d)) - (main_width/days); });
                }
                
                var dataFiltered = data.filter(function(d, i) {
                    if ( (d.date >= main_x.domain()[0]) && (d.date <= main_x.domain()[1]) ) {
                        return yValue(d);
                    }
                });
                
                main_y.domain([0, d3.max(dataFiltered.map(function(d) { console.log(d); return yValue(d); }))]);

                main.select(".x.axis").call(main_xAxis);
                main.select(".y.axis").call(main_yAxis);
                
                main.selectAll(".ideal")
                    .transition()
                      .duration(500)
                    .attr("y", main_y(ideal_time))
                    .attr("y1", main_y(ideal_time))
                    .attr("y2", main_y(ideal_time));

                main.selectAll(".avg")
                    .transition()
                      .duration(500)
                    .attr("y", main_y(thirty_avg))
                    .attr("y1", main_y(thirty_avg))
                    .attr("y2", main_y(thirty_avg));
            }


            // This function updates the y0 and y1 values after sections are enabled or disabled
            function updateStack() {
                nestByDate.forEach(function(d) {
                    var y0 = 0;
                    var y1 = 0;
                    d.values.forEach(function(d) {
                        if (d.vis === "1") {
                            // y0 is the y axis start of the bar
                            d.y0 = y0 + y1;

                            // y1 is the y axis end of the bar
                            d.y1 = y1 = yValue(d);
                        }
                        else {
                            d.y0 = 0;
                            d.y1 = 0;
                        }
                    });
                });   
            }
        });
    }

    // Get/set main_margin
    chart.main_margin = function(value) {
        if (!arguments.length) return main_margin;
        main_margin = value;
        return chart;
    }

    // Get/set mini_margin
    chart.mini_margin = function(value) {
        if (!arguments.length) return mini_margin;
        mini_margin = value;
        return chart;
    }

    // Get/set main_width
    chart.main_width = function(value) {
        if (!arguments.length) return main_width;
        main_width = value;
        return chart;
    }

    // Get/set main_height
    chart.main_height = function(value) {
        if (!arguments.length) return main_height;
        main_height = value;
        return chart;
    }

    // Get/set mini_height
    chart.mini_height = function(value) {
        if (!arguments.length) return mini_height;
        mini_height = value;
        return chart;
    }

    // Get/set the X value
    chart.x = function(value) {
        if (!arguments.length) return xValue;
        xValue = value;
        return chart;
    }

    // Get/set the Y value
    chart.y = function(value) {
        if (!arguments.length) return yValue;
        yValue = value;
        return chart;
    }

    // Get/set the Z value
    chart.z = function(value) {
        if (!arguments.length) return zValue;
        zValue = value;
        return chart;
    }

    // Get/set the Y axis label
    chart.yLabel = function(value) {
        if (!arguments.length) return yLabel;
        yLabel = value;
        return chart;
    }

    // Get/set the dimension key
    chart.dimKey = function(value) {
        if (!arguments.length) return dimKey;
        dimKey = value;
        return chart;
    }
  
    // Get/set the Y tick format
    chart.yTickFormat = function(value) {
        if (!arguments.length) return yTickFormat;
        yTickFormat = value;
        return chart;
    }

    // Get/set bar colors
    chart.colors = function(value) {
        if (!arguments.length) return colors;
        colors = value;
        return chart;
    }


    return chart;
}
