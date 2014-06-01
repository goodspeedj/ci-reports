var chart = stackedBarChart()
    .x(function(d) { return d.date; })
    .y(function(d) { return d.buildFixTime; })
    .z(function(d) { return d.portfolio; })
    .yLabel("Build Fix Time (Hours)")
    .dimKey(function(d) { return d._id.portfolio; })
    .yTickFormat(function(d) { return d3.round((d / 1000 / 60 / 60), 0); })
    .colors(d3.scale.ordinal().range(["#5D5CD6","#FF7236","#5FD664","#D64041","#C53AD6"]));

d3.json('data/fix_time_by_portfolio.json', function(data) {
    d3.select("#graph")
        .datum(data)
        .call(chart);
});
