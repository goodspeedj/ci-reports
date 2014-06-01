function multiLineChart() {

    if (chartName === "fixTime") {
        var ideal_time = 43200000;
        var avg_time   = 72000000;
    }
    else {
        var ideal_time = 1800000; 
        var avg_time   = 2000000; 
    }
    

    // Define line colors
    var color;  

    // These are the x and y dimensions supplied by the calling chart
    var xValue, yValue;

    // The Y Scale axis
    var yScale;

    // Setup X time scale
    var main_x = d3.time.scale()
        .range([0, main_width-axis_offset]);

    var mini_x = d3.time.scale()
        .range([0, main_width-axis_offset]);

    var main_xAxis = d3.svg.axis()
        .scale(main_x)
        .ticks(5)
        .orient("bottom");

    var mini_xAxis = d3.svg.axis()
      .scale(mini_x)
      .ticks(10)
      .orient("bottom");

    // Setup Y axis
    if (chartName === "sitespeed") {
        var main_y = d3.scale.pow().exponent([2])
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

    // Setup Y axis
    //var main_y = d3.scale.linear()
    //    .range([main_height, 10]);

    var mini_y = d3.scale.linear()
        .range([mini_height, 0]);

    var main_yAxis = d3.svg.axis()
        .scale(main_y)
        .ticks(5)
        .tickFormat(function(d) { return yTickFormat(d) })
        .orient("left");



    function chart(selection) {
        selection.each(function(data) {


            // Add the date field to the data set
            data.forEach(function(d) {
                d.date = new Date(d._id.year, d._id.month-1, d._id.day);
            });


            // Create the axis domains
            main_x.domain(d3.extent(data, xValue));
            mini_x.domain(d3.extent(data, xValue));
            main_y.domain([0, d3.max(data, yValue)]);
            mini_y.domain([0, d3.max(data, yValue)]);

            var brush = d3.svg.brush()
                .x(mini_x)
                .on("brush", brushed);

            // Flatten out the data
            var nested = d3.nest()
                .key(dimKey)
                .entries(data);

            nested.forEach(function(d) {
                d.vis = "1";
            });

            // Add the X axis
            main.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + main_height + ")")
                .call(main_xAxis);

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

            // Add the ideal line
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
                .attr("y", main_y(ideal_time) + 5)
                .attr("fill", "#413839")
                .attr("font-size", "11px")
                .attr("font-family", "sans-serif")
                .text("2014 Target Avg");

            // Add the eComm avg fix time line
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

            // Add the Mini X axis
            mini.append("g")
                .attr("class", "x axis mini_axis")
                .attr("transform", "translate(0," + mini_height + ")")
                .call(mini_xAxis);

            // Create the main line elements
            var main_line = d3.svg.line()
                .interpolate("monotone")
                .x(function(d) { return main_x(xValue(d)); })
                .y(function(d) { return main_y(yValue(d)); });

            // Create the mini line elements
            var mini_line = d3.svg.line()
                .interpolate("monotone")
                .x(function(d) { return mini_x(xValue(d)); })
                .y(function(d) { return mini_y(yValue(d)); });

            var main_stream = main.selectAll(".main_stream")
                .data(nested)
              .enter().append("g")
                .attr("class", function(d) { return "main_stream"; });

            var mini_stream = mini.selectAll(".mini_stream")
                .data(nested)
              .enter().append("g")
                .attr("class", function(d) { return "mini_stream"; });

            mini_stream.append("path")
                .style("stroke", function(d) { return color(d.key); })
                .attr("class", function(d) { return d.key + " mini_lines"; })
                .attr("d", function(d) {
                    // Draw the lines or not depending on d.vis
                    if (d.vis === "1") {
                        return mini_line(d.values);
                    }
                    else {
                        return null;
                    }
                });

            // Draw the lines
            main_stream.append("path")
                .style("stroke", function(d) { return color(d.key); })
                .attr("clip-path", "url(#clip)")
                .attr("class", function(d) { return d.key + " main_lines"; })
                .attr("d", function(d) {
                    if (d.vis === "1") {
                        return main_line(d.values);
                    }
                    else {
                        return null;
                    }
                })
                .on("mouseover", function(d) {

                    // Make the line bold
                    d3.select(this).transition().duration(200)
                        .style("stroke-width", "5px");

                    // Fade out the other lines
                    var main_otherlines = $('path.main_lines').not("path." + d.key);
                    d3.selectAll(main_otherlines).transition().duration(200)
                        .style("opacity", .3)
                        .style("stroke-width", 1.5)
                        .style("stroke", "gray");

                    var mini_otherlines = $('path.mini_lines').not("path." + d.key);
                    d3.selectAll(mini_otherlines).transition().duration(200)
                        .style("opacity", .3)
                        .style("stroke-width", 1.5)
                        .style("stroke", "gray");

                    // Show tooltip
                    tooltip.transition().duration(200)
                        .style("opacity", .8);
                    tooltip
                        .html(d.key)
                          .style("left", (d3.event.pageX + 10) + "px")
                          .style("top", (d3.event.pageY - 25) + "px");
                })
                .on("mouseout", function(d) {

                    // Make the line normal again
                    d3.select(this).transition().duration(100)
                        .style("stroke-width", "2px");

                    // Make the other lines normal again
                    var main_otherlines = $('.main_lines').not("path." + d.key);
                    d3.selectAll(main_otherlines).transition().duration(100)
                        .style("opacity", 1)
                        .style("stroke-width", 2)
                        .style("stroke", function(d) { return color(d.key)});  

                    var mini_otherlines = $('.mini_lines').not("path." + d.key);
                    d3.selectAll(mini_otherlines).transition().duration(100)
                        .style("opacity", 1)
                        .style("stroke-width", 2)
                        .style("stroke", function(d) { return color(d.key)}); 

                    // Hide the tooltip
                    tooltip.transition().duration(500).style("opacity", 0);
                });

            mini.append("g")
                .attr("class", "x brush")
                .call(brush)
              .selectAll("rect")
                .attr("y", -10)
                .attr("height", mini_height + 15);

            // Add the text to the legend
            main_stream.append("text")
                .attr("class", "legendLabel")
                .attr("x", function(d) { return main_width-195; })
                .attr("y", function(d,i) { return main_height - legend_text_offset.height + (i*30); })
                .text( function (d) { return d.key; })
                .attr("font-size", "11px")
                .attr("fill", "black");
    
            // Add the colored rectangles to the legend
            main_stream.append("rect")
                .attr("height",10)
                .attr("width", 25)
                .attr("class", function(d) { return d.key; })
                .attr("x",main_width-235)
                .attr("y", function(d,i) { return main_height - legend_rect_offset.height + (i*30); })
                .attr("stroke", function(d) { return color(d.key);})
                .attr("fill",function(d) {
                    if(d.vis === "1") {
                        return color(d.key);
                    }
                    else {
                        return "white";
                    }
                })
                .on("mouseover", function(d) {
                    // Make the line bold
                    d3.select(this)
                        .style("stroke-width", "5px");

                    d3.select("path." + d.key).transition().duration(200)
                        .style("stroke-width", "5px");

                    var main_otherlines = $("path.main_lines").not("path." + d.key);
                    d3.selectAll(main_otherlines)
                        .style("opacity", .3)
                        .style("stroke-width", 1.5)
                        .style("stroke", "gray");

                    var mini_otherlines = $("path.mini_lines").not("path." + d.key);
                    d3.selectAll(mini_otherlines)
                        .style("opacity", .3)
                        .style("stroke-width", 1.5)
                        .style("stroke", "gray");
                })
                .on("mouseout", function(d) {
                    d3.select(this)
                        .style("stroke-width", "2px");

                    d3.select("path." + d.key).transition().duration(100)
                        .style("stroke-width", "2px");

                    var main_otherlines = $("path.main_lines").not("path." + d.key);
                    d3.selectAll(main_otherlines)
                        .style("opacity", 1)
                        .style("stroke-width", 2)
                        .style("stroke", function(d) { return color(d.key)});

                    var mini_otherlines = $("path.mini_lines").not("path." + d.key);
                    d3.selectAll(mini_otherlines)
                        .style("opacity", 1)
                        .style("stroke-width", 2)
                        .style("stroke", function(d) { return color(d.key)});
                })
                .on("click", function(d) {
                    if(d.vis === "1") {
                        d.vis = "0";
                    }
                    else {
                        d.vis = "1";
                    }
        
                    // Update the Y axis
                    maxY = getMaxY();

                    main_y.domain([0,maxY]);
                    mini_y.domain([0,maxY]);

                    main.select(".y.axis")
                        .transition()
                            .duration(800)
                        .call(main_yAxis);

                    main.selectAll(".ideal")
                        .transition()
                          .duration(500)
                        .attr("y", main_y(ideal_time))
                        .attr("y1", main_y(ideal_time))
                        .attr("y2", main_y(ideal_time));

                    main.selectAll(".avg")
                        .transition()
                          .duration(500)
                        .attr("y", main_y(avg_time))
                        .attr("y1", main_y(avg_time))
                        .attr("y2", main_y(avg_time));

                    // Update the lines
                    main_stream.select("path")
                        .transition()
                          .duration(500)
                        .attr("d", function(d) { 
                            if(d.vis === "1") { 
                                return main_line(d.values);
                            } 
                            else { 
                                return null;
                            } 
                        })

                    mini_stream.select("path")
                        .transition()
                          .duration(500)
                        .attr("d", function(d) {
                            if(d.vis === "1") {
                                return mini_line(d.values);
                            }
                            else {
                                return null;
                            }
                        })

                    // Update the legend
                    main_stream.select("rect")
                        .transition()
                          .duration(500)
                        .attr("fill",function(d) {
                            if (d.vis === "1") {
                                return color(d.key);
                            }
                            else {
                                return "white";
                            }
                        });
                });


            d3.selectAll(".metric-select").on("change", switchY);
            d3.selectAll("input").on("change", toggle);


            // Switch the Y axis metric value
            function switchY() {
                var selected = this.value;

                main_y.domain([0, d3.max(data, function(d) { return d[selected]; })]);
                mini_y.domain([0, d3.max(data, function(d) { return d[selected]; })]);

                main.select(".y.axis")
                    .transition()
                      .delay(1000)
                      .duration(1000)
                    .call(main_yAxis);



                main_line.y(function(d) { return main_y(d[selected]); });
                mini_line.y(function(d) { return mini_y(d[selected]); });

                var main_paths = d3.selectAll(".main_lines").data(nested);
                var mini_paths = d3.selectAll(".mini_lines").data(nested);
                
                main_paths
                    .transition()
                      .duration(750)
                      .delay(250)
                    .attr("d", function(d) { return main_line(d.values); });  

                mini_paths
                    .transition()
                      .duration(750)
                      .delay(250)
                    .attr("d", function(d) { return mini_line(d.values); }); 
            }


            // toggle the lines on or off
            function toggle() {
                if (this.value === "enable") {
                    nested.forEach(function(d) {
                      d.vis = "1";
                });

                maxY = getMaxY();
                main_y.domain([0,maxY]);
                mini_y.domain([0,maxY]);
                main.select(".y.axis").call(main_yAxis);

                main_stream.select("rect").transition()
                    .delay(function(d, i) { return i * 20; })
                    .attr("fill", function(d) { return color(d.key); });
        
                main_stream.select("path").transition()
                    .delay(function(d, i) { return i * 20; })
                    .attr("d", function(d) {
                        return main_line(d.values);
                    });

                mini_stream.select("path").transition()
                    .delay(function(d, i) { return i * 20; })
                    .attr("d", function(d) {
                        return mini_line(d.values);
                    });

            }
            else {
                nested.forEach(function(d) {
                  d.vis = "0";
                });
                main_stream.select("rect").transition()
                    .delay(function(d, i) { return i * 20; })
                    .attr("fill","white");

                main_stream.select("path").transition()
                    .delay(function(d, i) { return i * 20; })
                    .attr("d", function(d) {
                        return null;
                    });

                mini_stream.select("path").transition()
                    .delay(function(d, i) { return i * 20; })
                    .attr("d", function(d) {
                        return null;
                    });
            }

        }

            // Brush/select function
            function brushed() {
                main_x.domain(brush.empty() ? mini_x.domain() : brush.extent());

                var dataFiltered = nested.map(function(series) {
                    
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
                        dataStackSums[d.date] += yValue(d);
                    });
                });

                // Get the max from the stack
                var max = 0;
                Object.keys(dataStackSums).forEach(function(key) {
                    max = Math.max(max, dataStackSums[key]);
                });


                //main_y.domain([0, max]);

                main_stream.select("path").attr("d", function(d) {
                    if (d.vis === "1") {
                        return main_line(d.values);
                    }
                    else {
                        return null;
                    }   
                });

                main.select(".x.axis").call(main_xAxis);
                //main.select(".y.axis").transition().delay(500).call(main_yAxis);

                main.selectAll(".ideal")
                    .transition()
                      .duration(500)
                    .attr("y", main_y(ideal_time))
                    .attr("y1", main_y(ideal_time))
                    .attr("y2", main_y(ideal_time));

                main.selectAll(".avg")
                    .transition()
                      .duration(500)
                    .attr("y", main_y(avg_time))
                    .attr("y1", main_y(avg_time))
                    .attr("y2", main_y(avg_time));
            }  

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
  
    chart.yTickFormat = function(value) {
        if (!arguments.length) return yTickFormat;
        yTickFormat = value;
        return chart;
    }

    // Y axis scale
    chart.yScale = function(value) {
        if (!arguments.length) return yScale;
        yScale = value;
        return chart;
    }

    // Line colors
    chart.color = function(value) {
        if (!arguments.length) return color;
        color = value;
        return chart;
    }


    return chart;
}
