var chartName = "fixTime";

var chart = multiLineChart()
    .x(function(d) { return d.date; })
    .y(function(d) { return d.buildFixTime; })
    .yLabel("Build Fix Time (Hours)")
    .dimKey(function(d) { return d._id.stream; })
    .yTickFormat(function(d) { return d3.round((d / 1000 / 60 / 60), 1); })
    .color(d3.scale.category20());

d3.json('data/fix_time_by_stream.json', function(data) {
    d3.select("#graph")
        .datum(data)
        .call(chart);
});
