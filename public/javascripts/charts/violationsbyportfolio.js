var chart = stackedBarChart()
    .x(function(d) { return d.date; })
    .y(function(d) { return d.violations; })
    .z(function(d) { return d.portfolio; })
    .yLabel("Average number of Violations")
    .dimKey(function(d) { return d._id.portfolio; })
    .yTickFormat(function(d) { return d3.round((d), 1); })
    .colors(d3.scale.ordinal().range(["#D64041","#FF7236","#5D5CD6","#5FD664","#C53AD6"]));

d3.json('data/violations_by_portfolio.json', function(data) {
    d3.select("#graph")
        .datum(data)
        .call(chart);
});