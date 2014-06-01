var chartName = "passFail";

var chart = stackedAreaChart()
    .x(function(d) { return d.date; })
    .y(function(d) { return d.total; })
    .yLabel("Total Number")
    .dimKey(function(d) { return d._id.buildResult; })
    .yTickFormat(function(d) { return d3.round(d); })
    .categories(["Aborted","Success","Unstable","Failure"])
    .stackColors(["#C0C0C0","#6FB200","#FCE338","#EF3434"]);

d3.json('data/passfail-eservice.json', function(data) {
    d3.select("#graph")
        .datum(data)
        .call(chart);
});
