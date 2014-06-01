function stackedAreaChart() {

    var ideal_time = 7200000;

    // parsed date
    var parseDate = d3.time.format("%Y-%m-%d");

    // The label for the Y axis
    var yLabel = "Duration";

    // These are the x and y dimensions supplied by the calling chart
    var xValue, yValue;

    // The stack area categories supplied by the calling chart
    var categories;

    // The colors of the stack area supplied by the calling chart
    var stackColors;

    // The Y Scale axis
    var yScale;

    // Setup X time scale
    var main_x = d3.time.scale()
        .range([0, main_width - axis_offset]);

    var mini_x = d3.time.scale()
        .range([0, main_width - axis_offset]);

    var main_xAxis = d3.svg.axis()
        .scale(main_x)
        .ticks(10)
        .orient("bottom");

    var mini_xAxis = d3.svg.axis()
      .scale(mini_x)
      .ticks(10)
      .orient("bottom");

    // Setup Y axis
    if (chartName === "unitTest") {
        var main_y = d3.scale.sqrt()
            .range([main_height, 10]);

        var mini_y = d3.scale.sqrt()
            .range([mini_height, 10]);
    }
    else {
        var main_y = d3.scale.linear()
            .range([main_height, 10]);

        var mini_y = d3.scale.linear()
            .range([mini_height, 10]);   
    }

    var main_yAxis = d3.svg.axis()
        .scale(main_y)
        .tickFormat(function(d) { return yTickFormat(d) })
        .ticks(5)
        .orient("left");

    // Z scale is the different categories (i.e.: build success, fail, unstable)
    var z = d3.scale.ordinal();

    // Create the area stack
    var stack = d3.layout.stack()
              .offset("zero")
              .values(function(d) { return d.values; })
              .x(function(d) { return xValue(d); })
              .y(function(d) { return yValue(d); });

    // Define the area
    var main_area = d3.svg.area()
              .interpolate("cardinal")
              .x(function(d) { return main_x(xValue(d)); })
              .y0(function(d) { return main_y(d.y0); })
              .y1(function(d) { return main_y(d.y0 + d.y); });

    var mini_area = d3.svg.area()
              .interpolate("cardinal")
              .x(function(d) { return mini_x(xValue(d)); })
              .y0(function(d) { return mini_y(d.y0); })
              .y1(function(d) { return mini_y(d.y0 + d.y); });


    function chart(selection) {
        selection.each(function(data) {

            // Loop through the data and add elements
            data.forEach(function(d) {
                d.date = new Date(d._id.year, d._id.month-1, d._id.day);
                d.vis = "1";
            });

            // Create the brush for the mini chart
            var brush = d3.svg.brush()
                .x(mini_x)
                .on("brush", brushed);


            // Get the data into the right format - categories are passed in from calling chart
            var dataSeries = categories.map(function(type) {
                var dataObj = {};
                dataObj.key = type;
                dataObj.vis = "1";

                dataObj.values = data.map(function(d) {
                    return { date: d.date, total: d[type] };  
                });

                return dataObj;
            });

            // Create the layers
            var layers = stack(dataSeries);

            // Set the x and y domains
            main_x.domain(d3.extent(data, function(d) { return xValue(d); }));
            main_y.domain([0, d3.max(data, function(d) { 
                if(d.vis === "1") {
                    var total = 0;
                    categories.forEach(function(type) {
                        total = total + d[type];
                    })
                    return total;  
                }
                else return null;                
            })]);

            mini_x.domain(d3.extent(data, function(d) { return xValue(d); }));
            mini_y.domain([0, d3.max(data, function(d) { 
                var total = 0;
                categories.forEach(function(type) {
                    total = total + d[type];
                })
                return total; 
            })]);

            z.domain(categories).range(stackColors);

            // Add the line paths
            var main_layer = main.selectAll(".layer")
                .data(layers)
              .enter().append("g");

            main_layer.append("path")
                .attr("clip-path", "url(#clip)")
                .attr("class", function(d) { return d.key + " layer"; })
                .attr("d", function(d) { 
                    if(d.vis === "1") {
                        return main_area(d.values);
                    }
                    else {
                        return null;
                    }
                })
                .style("fill", function(d, i) { return z(i); })
                .on("mouseover", function(d) {

                    // Fade out the other layers
                    var otherlayers = $('path.layer').not("path." + d.key);
                    d3.selectAll(otherlayers).transition().duration(200)
                        .style("opacity", .5);

                    // Show tooltip
                    tooltip.transition().duration(200)
                        .style("opacity", .8);
                    tooltip
                        .html(d.key)
                          .style("left", (d3.event.pageX + 10) + "px")
                          .style("top", (d3.event.pageY - 25) + "px");
                })
                .on("mouseout", function(d) {

                    // Make the other lines normal again
                    var otherlayers = $('.layer').not("path." + d.key);
                    d3.selectAll(otherlayers).transition().duration(100)
                        .style("opacity", 1)
                        .style("fill", function(d) { return z(d.key)});   

                    // Hide the tooltip
                    tooltip.transition().duration(500).style("opacity", 0);
                });
                    

            var mini_layer = mini.selectAll(".mini-layer")
                .data(layers)
              .enter().append("g");


            mini_layer.append("path")
                .attr("class", "mini-layer")
                .attr("d", function(d) { 
                    if(d.vis === "1") {
                        return mini_area(d.values);
                    }
                    else {
                        return null;
                    }
                })
                .style("fill", function(d, i) { return z(i); });

            // Add the X and Y axis
            main.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + main_height + ")")
                .call(main_xAxis);

            mini.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + mini_height + ")")
                .call(mini_xAxis);

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

            mini.append("g")
                .attr("class", "x brush")
                .call(brush)
              .selectAll("rect")
                .attr("y", -10)
                .attr("height", mini_height + 15);

            // Add the legend
            var legend = main.selectAll(".legendLabel")
                .data(dataSeries)
              .enter().append("g")
                .attr("class", "legendLabel")
                .attr("transform", function(d,i) { return "translate(0," + i * 20 + ")"; });

            legend.append("text")
                .attr("class", "legendLabel")
                .attr("x", function(d) { return main_width - legend_text_offset.width; })
                .attr("y", function(d,i) { return main_height - legend_text_offset.height + (i * legend_interval); })
                .text( function (d, i) { return d.key; })
                //.attr("font-family", "sans-serif")
                .attr("font-size", "11px")
                .attr("fill", "black");

            legend.append("rect")
                .attr("height",10)
                .attr("width", 25)
                .attr("x",main_width - legend_rect_offset.width)
                .attr("y", function(d,i) { return main_height - legend_rect_offset.height + (i * legend_interval); })
                .attr("class", function(d) { return d.key; })
                .attr("stroke", function(d) { return z(d.key);})
                .attr("fill", function(d) { 
                    if(d.vis === "1") {
                        return z(d.key); 
                    }
                    else {
                        return "white";
                    }
                    
                })
                .on("mouseover", function(d) {
                    // Make the line bold
                    d3.select(this)
                        .style("stroke-width", "5px");

                    // Fade out the other layers
                    var otherlayers = $('path.layer').not("path." + d.key);
                    d3.selectAll(otherlayers)
                        .style("opacity", .5);
                })
                .on("mouseout", function(d) {
                    d3.select(this)
                        .style("stroke-width", "2px");

                    // Make the other lines normal again
                    var otherlayers = $('.layer').not("path." + d.key);
                    
                    d3.selectAll(otherlayers)
                        .style("opacity", 1)
                        .style("fill", function(d) { return z(d.key)});

                })
               .on("click", function(d) {

                    if(d.vis === "1") {
                        d.vis = "0";
                    }
                    else {
                        d.vis = "1";
                    }



                    var updatedData = dataSeries.filter(function(d) {
                        if(d.vis === "1"){
                            return d;
                        }
                        else return null;
                    });

                    maxY = getMaxY(updatedData);
                    main_y.domain([0, maxY]);
                    mini_y.domain([0,maxY]);

                    main.select(".y.axis")
                        .transition()
                          .duration(800)
                        .call(main_yAxis);

                    stack(updatedData);

                    var main_sel = main_layer
                        .select(".layer");
                        //.data(newLayer);

                    main_sel
                        .attr("class", function(d) { return d.key + " layer"; })
                        .transition()
                          .duration(200)
                        .style("fill", function(d, i) { 
                            if(d.vis === "1") {
                                return z(i);   
                            }
                            else return null;
                        })
                        .attr("d", function(d) { 
                            if(d.vis === "1") {
                                return main_area(d.values); 
                            }
                            else return null;
                        });

                    var mini_sel = mini_layer.select(".mini-layer");

                    mini_sel
                        .attr("class", function(d) { return d.key + " mini-layer"; })
                        .style("fill", function(d, i) { 
                            if(d.vis === "1") {
                                return z(i);   
                            }
                            else return null;
                        })
                        .attr("d", function(d) { 
                            if(d.vis === "1") {
                                return mini_area(d.values); 
                            }
                            else return null;
                        });
                    //    .transition()
                    //      .duration(500)
                    //    .attr("d", function(d) { return mini_area(d.values); });

                    legend.select("rect")
                        .transition()
                          .duration(500)
                        .attr("fill",function(d) {
                            if (d.vis=="1") {
                                return z(d.key);
                            }
                            else {
                                return "white";
                            }
                        });
                }); 

            // Get the max Y value
            function getMaxY(data) {
                
                var totals = [];

                data.forEach(function(d) {
                    if (d.vis === "1") {
                        for (var i = 0; i < categories.length; i++) {
                            var maxY = -1;
                            d.values.forEach(function(d) {
                                if (yValue(d) > maxY){
                                    maxY = yValue(d);
                                }
                            });
                            
                        }
                        totals.push(maxY);
                    }
                });

                var grandTotal = 0;
                $.each(totals, function() {
                    grandTotal += this;
                });
                return grandTotal;
            } 


            // Brush/select function
            function brushed() {
                main_x.domain(brush.empty() ? mini_x.domain() : brush.extent());

                /* filter the data to update the Y axis
                 * If the brush is very small this can produce a main graph with no data.  For example if the brush
                 * is from 1/1/2014 9:00:00 to 1/1/2014 11:00:00 the d.date will have a value of 1/1/2014 00:00:00
                 * which means it will not fall into the if case.
                 */
                var dataFiltered = dataSeries.map(function(series) {
                    
                    return series.values.filter(function(d) {
                        if(series.vis === "1") {
                            if((d.date >= main_x.domain()[0]) && (d.date <= main_x.domain()[1])) {
                                return yValue(d);
                            }
                        }
                    });
                });

                // Arange the filtered data into stacks
                var dataStackSums = {};
                dataFiltered.forEach(function(series) {

                    series.forEach(function(d) {
                        if (!dataStackSums[d.date]) { 
                            dataStackSums[d.date] = 0; 
                        }
                        dataStackSums[d.date] += d.total;
                    });
                });

                // Get the max from the stack
                var max = 0;
                Object.keys(dataStackSums).forEach(function(key) {
                    max = Math.max(max, dataStackSums[key]);
                });

                // re-calculate the Y domain
                main_y.domain([0, max]);

                // Re-draw the layers
                main.selectAll(".layer").attr("d", function(d) { 
                    if (d.vis === "1") {
                        return main_area(d.values);
                    }
                    else {
                        return null;
                    }           
                });

                main.select(".x.axis").call(main_xAxis);
                main.select(".y.axis").transition().delay(500).call(main_yAxis);
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

    chart.x = function(value) {
        if (!arguments.length) return xValue;
        xValue = value;
        return chart;
    }

    chart.y = function(value) {
        if (!arguments.length) return yValue;
        yValue = value;
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
  
    // Y axis tick format
    chart.yTickFormat = function(value) {
        if (!arguments.length) return yTickFormat;
        yTickFormat = value;
        return chart;
    }


    // Stack area categories
    chart.categories = function(value) {
        if (!arguments.length) return categories;
        categories = value;
        return chart;
    }

    // Stack area colors
    chart.stackColors = function(value) {
        if (!arguments.length) return stackColors;
        stackColors = value;
        return chart;
    }

    // Y axis scale
    chart.yScale = function(value) {
        if (!arguments.length) return yScale;
        yScale = value;
        return chart;
    }

    return chart;
}
