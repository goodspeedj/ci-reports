function stackedGroupedBarChart() {

    var ideal_time = 7200000;
    var avg_time   = 72000000;

    // Default bar colors
    var colors;

    // These are the x and y dimensions supplied by the calling chart
    var x0Value, x1Value, yValue;

    // x0 is the time scale on the X axis
    var main_x0 = d3.scale.ordinal().rangeRoundBands([0, main_width - axis_offset], 0.2); 
    var mini_x0 = d3.scale.ordinal().rangeRoundBands([0, main_width - axis_offset], 0.2);

    // x1 is the portfolio scale on the X axis
    var main_x1 = d3.scale.ordinal();
    var mini_x1 = d3.scale.ordinal();

    // y is the fix time scal on the Y axis
    var main_y  = d3.scale.linear().range([main_height, 0] );
    var mini_y  = d3.scale.linear().range([mini_height, 0] );

    // xZoom is the scale for the brush/zoom 
    var main_xZoom = d3.scale.linear().range([0, main_width - axis_offset]).domain([0, main_width - axis_offset]);

    // Define the Y axis
    var main_yAxis = d3.svg.axis()
        .scale(main_y)
        .tickFormat(function(d) { return yTickFormat(d) })
        .orient("left");



    function chart(selection) {
        selection.each(function(data) {

            // This adds new elements to the data object
            data.result.forEach(function(d) {
                d.portfolio = dimKey(d);
                d.date = new Date(d._id.year, d._id.month-1, d._id.day);
            });

            // This is needed to get the y0 and y1 values required for the stacked chart
            var nestByDate = d3.nest()
                .key(function(d) { return x0Value(d); })
                .entries(data.result);

            // Calc the y0 and y1 values (start and end points of the stacked bars)
            nestByDate.forEach(function(d) {
                var y0 = 0;
                var y1 = 0;
                d.vis = "1";
                d.values.forEach(function(d) {

                    // y0 is the y axis start of the bar
                    d.y0 = y0 + y1;

                    // y1 is the y axis end of the bar
                    d.y1 = yValue(d);

                    // d.vis controls whether bars are visible or not
                    d.vis = "1";
                });
            });

            
            // x0 is the first x axis group domain (ie: date)
            main_x0.domain(data.result.map( function(d) { return x0Value(d); } )
                  .sort(d3.ascending));
            mini_x0.domain(data.result.map( function(d) { return x0Value(d); } )
                  .sort(d3.ascending));

            // x1 is the second x axis group domain (ie: portfolio, stream)
            main_x1.domain(data.result.map( function(d) { return x1Value(d); } )
                  .sort(d3.ascending))
                  .rangeRoundBands([0, main_x0.rangeBand() ], 0);
            mini_x1.domain(data.result.map( function(d) { return x1Value(d); } )
                  .sort(d3.ascending))
                  .rangeRoundBands([0, main_x0.rangeBand() ], 0);

            // y axis domain (ie: time)
            main_y.domain([0, d3.max(data.result, function(d) { return yValue(d); })]);
            mini_y.domain([0, d3.max(data.result, function(d) { return yValue(d); })]);

            // Define the X axis
            var main_xAxis = d3.svg.axis()
                .scale(main_x0)
                .tickFormat(dateFormat)
                .tickValues(main_x0.domain().filter(function(d, i) { return !(i % 3); }))
                .orient("bottom");

            // Define the X mini axis
            var mini_xAxis = d3.svg.axis()
                .scale(mini_x0)
                .tickFormat(dateFormat)
                .tickValues(main_x0.domain().filter(function(d, i) { return !(i % 3); }))
                .orient("bottom");

            // Create brush for mini graph
            var brush = d3.svg.brush()
                .x(mini_x0)
                .on("brush", brushed);

            // flatten out the data
            var nested = d3.nest()
                .key(dimKey)
                .entries(data.result);

            // Add the vis element to the nested data structure
            nested.forEach(function(d) {
                d.vis = "1";
            });

            // Add the X axis
            main.append("g")
                .attr("class", "x axis")
                .attr("clip-path", "url(#clip)")
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

            // Add the mini x axis
            mini.append("g")
                .attr("class", "x axis mini_axis")
                .attr("transform", "translate(0," + mini_height + ")")
                .call(mini_xAxis);

            mini.append("g")
                .attr("class", "x brush")
                .call(brush)
              .selectAll("rect")
                .attr("y", -10)
                .attr("height", mini_height + 15);

            // Create the bars
            var bar = main.selectAll(".bars")
                .data(nested)
              .enter().append("g")
                .attr("class", function(d) { return d.key + "-group bar"; })
                .attr("fill", function(d) { return colors(d.key); } )
                .attr("clip-path", "url(#clip)")
                .on("mouseover", function(d) {
                    var otherbars = $('rect').not('rect.' + d.key);
                    d3.selectAll(otherbars).transition().duration(200).style("opacity", .4);

                    tooltip.transition().duration(200)
                        .style("opacity", .8);
                    tooltip
                        .html(d.key)
                          .style("left", (d3.event.pageX + 10) + "px")
                          .style("top", (d3.event.pageY - 25) + "px");
                })
                .on("mouseout", function(d) {
                    var otherbars = $('rect').not('rect.' + d.key);
                    d3.selectAll(otherbars).transition().duration(200).style("opacity", 1);

                    tooltip.transition().duration(500).style("opacity", 0);
           
                });

            bar.selectAll("rect")
                .data(function(d) { return d.values; })
              .enter().append("rect")
                .attr("class", dimKey)
                .attr("transform", function(d) { return "translate(" + main_x0(x0Value(d)) + ",0)"; })
                .attr("width", function(d) { return main_x1.rangeBand(); })
                .attr("x", function(d) { return main_x1(x1Value(d)); })
                .attr("y", function(d) { return main_y(yValue(d)); })
                .attr("height", function(d) { return main_height - main_y(yValue(d)); });

            // Create the bars
            var mini_bar = mini.selectAll(".mini_bars")
                .data(nested)
              .enter().append("g")
                .attr("class", function(d) { return d.key + "-group mini_bar"; })
                .attr("fill", function(d) { return colors(d.key); } );

            mini_bar.selectAll("rect")
                .data(function(d) { return d.values; })
              .enter().append("rect")
                .attr("class", dimKey)
                .attr("transform", function(d) { return "translate(" + mini_x0(x0Value(d)) + ",0)"; })
                .attr("width", function(d) { return mini_x1.rangeBand(); })
                .attr("x", function(d) { return mini_x1(x1Value(d)); })
                .attr("y", function(d) { return mini_y(yValue(d)); })
                .attr("height", function(d) { return mini_height - mini_y(yValue(d)); });

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
                .attr("y", main_y(ideal_time))
                .attr("fill", "#413839")
                .attr("font-size", "11px")
                .attr("font-family", "sans-serif")
                .text("Ideal");

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
                .text("eComm Avg");

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
                    
                    // Show or hide the bars
                    main.selectAll("." + d.key + "-group")
                        .transition()
                          .duration(500)
                        .attr("fill-opacity", function(d) {
                            if (d.vis === "1") {
                                return "1.0";
                            }
                            else {
                                return "0.0";
                            }
                        });

                    mini.selectAll("." + d.key + "-group")
                        .transition()
                          .duration(500)
                        .attr("fill-opacity", function(d) {
                            if (d.vis === "1") {
                                return "1.0";
                            }
                            else {
                                return "0.0";
                            }
                        });
                    

                    // Change the transition calc based on the type of chart
                    if ($('input[name=orientation]:checked').val() === 'grouped') {
                        bar.selectAll("rect").transition()
                            .attr("y", function(d) { return main_y(yValue(d)); })
                            .attr("height", function(d) { return main_height - main_y(yValue(d)); });

                        mini_bar.selectAll("rect").transition()
                            .attr("y", function(d) { return mini_y(yValue(d)); })
                            .attr("height", function(d) { return mini_height - mini_y(yValue(d)); });
                    }
                    else {

                        // This is needed for the y0 and y1 values required for the stacked chart
                        updateStack();

                        bar.selectAll("rect").transition()
                            .attr("y", function(d) { return main_y(d.y1); })
                            .attr("height", function(d) { return main_y(d.y0) - main_y(d.y1); });

                        mini_bar.selectAll("rect").transition()
                            .attr("y", function(d) { return mini_y(d.y1); })
                            .attr("height", function(d) { return mini_y(d.y0) - mini_y(d.y1); });
                    }

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
                });
   
            d3.selectAll(".orientation").on("change", orientation);  

            // Change the orientation of the graph
            function orientation() {
                if (this.value === "grouped") {
                    transitionGrouped();
                }
                else {
                    transitionStacked();
                }
            }

            // Switch to a grouped bar orientation
            function transitionGrouped() {
                bar.selectAll("rect").transition()
                    .duration(300)
                    .delay(function(d, i) { return i * 10; })
                    .attr("transform", function(d) { return "translate(" + main_x0(x0Value(d)) + ",0)"; })
                    .attr("width", function(d) { return main_x1.rangeBand(); })
                    .attr("x", function(d) { return main_x1(x1Value(d)); })
                  .transition()
                    .attr("y", function(d) { return main_y(yValue(d)); })
                    .attr("height", function(d) { return main_height - main_y(yValue(d)); });    

                mini_bar.selectAll("rect").transition()
                    .duration(300)
                    .delay(function(d, i) { return i * 10; })
                    .attr("transform", function(d) { return "translate(" + mini_x0(x0Value(d)) + ",0)"; })
                    .attr("width", function(d) { return mini_x1.rangeBand(); })
                    .attr("x", function(d) { return mini_x1(x1Value(d)); })
                  .transition()
                    .attr("y", function(d) { return mini_y(yValue(d)); })
                    .attr("height", function(d) { return mini_height - mini_y(yValue(d)); });  
            }

            // Switch to a stacked orientation
            function transitionStacked() {
                updateStack();

                bar.selectAll("rect").transition()
                    .duration(300)
                    .delay(function(d, i) { return i * 10; })
                    .attr("transform", function(d) { return "translate(" + main_x1(x0Value(d)) + ",0)"; })
                    .attr("width", function(d) { return main_x0.rangeBand(); })
                    .attr("x", function(d) { return main_x0(x0Value(d)); })
                  .transition()
                    .attr("y", function(d) { return main_y(d.y1); })
                    .attr("height", function(d) { return main_y(d.y0) - main_y(d.y1); });

                mini_bar.selectAll("rect").transition()
                    .duration(300)
                    .delay(function(d, i) { return i * 10; })
                    .attr("transform", function(d) { return "translate(" + mini_x1(x0Value(d)) + ",0)"; })
                    .attr("width", function(d) { return mini_x0.rangeBand(); })
                    .attr("x", function(d) { return mini_x0(x0Value(d)); })
                  .transition()
                    .attr("y", function(d) { return mini_y(d.y1); })
                    .attr("height", function(d) { return mini_y(d.y0) - mini_y(d.y1); });
            }

            // This function updates the y0 and y1 values after sections are enabled or disabled
            function updateStack() {
                nestByDate.forEach(function(d) {
                    var y0 = 0;
                    var y1 = 0;
                    d.values.forEach(function(d) {
                        if (d.vis === "1") {
                            d.y0 = y0 + y1;
                            y1 = yValue(d);
                            d.y1 = y1;
                        }
                    });
                });   
            }

            function brushed() {
                var originalRange = main_xZoom.range();
                main_xZoom.domain(brush.empty() ? 
                             originalRange: 
                             brush.extent() );

                main_x0.rangeRoundBands( [
                    main_xZoom(originalRange[0]),
                    main_xZoom(originalRange[1])
                    ], 0.2);


                main_x1.rangeRoundBands([0, main_x0.rangeBand()], 0);

                //console.log(main_xZoom.domain()[0]);
                //console.log(main_xZoom.domain()[1]);

                //console.log(nested);

                /* filter the data to update the Y axis
                var dataFiltered = data.result.filter(function(d) {
                    if((d.date >= main_xZoom.domain()[0]) && (d.date <= main_xZoom.domain()[1])) {
                        return yValue(d);
                    }
                });
		*/

                //console.log(dataFiltered);


                if ($('input[name=orientation]:checked').val() === 'grouped') {
                    bar.selectAll("rect")
                        .attr("transform", function (d) {
                            return "translate(" + main_x0(x0Value(d)) + ",0)";
                        })
                        .attr("width", function (d) {
                            return main_x1.rangeBand();
                        })
                        .attr("x", function (d) {
                            return main_x1(x1Value(d));
                        });
                }
                else {
                    bar.selectAll("rect")
                        .attr("transform", function (d) {
                            return "translate(" + main_x0(x0Value(d)) + ",0)";
                        })
                        .attr("width", function (d) {
                            return main_x0.rangeBand();
                        })
                        .attr("x", function (d) {
                            return main_x1(x0Value(d));
                        });
                }



                //main_y.domain([0, d3.max(dataFiltered.map(function(d) { return yValue(d); }))]);

                main.select("g.x.axis").call(main_xAxis);
                //main.select(".y.axis").transition().delay(500).call(main_yAxis);
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

    // Get/set the X0 value
    chart.x0 = function(value) {
        if (!arguments.length) return x0Value;
        x0Value = value;
        return chart;
    }

    // Get/set the X1 value
    chart.x1 = function(value) {
        if (!arguments.length) return x1Value;
        x1Value = value;
        return chart;
    }

    // Get/set the Y value
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
