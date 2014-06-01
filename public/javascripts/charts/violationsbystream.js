var chartName = "violations";

var chart = multiLineChart()
    .x(function(d) { return d.date; })
    .y(function(d) { return d.violations; })
    .yLabel("Average number of Violations")
    .dimKey(function(d) { return d._id.stream; })
    .yTickFormat(function(d) { return d3.round((d), 1); })
    .color(d3.scale.category20());

d3.json('data/violations_by_stream.json', function(data) {
    d3.select("#graph")
        .datum(data)
        .call(chart);
});
