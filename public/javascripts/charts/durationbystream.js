var chartName = "buildDuration";

var chart = multiLineChart()
	.x(function(d) { return d.date; })
	.y(function(d) { return d.buildDuration; })
  	.yLabel("Build Duration (Minutes)")
  	.dimKey(function(d) { return d._id.stream; })
  	.yTickFormat(function(d) { return d3.round((d / 1000 / 60), 0); })
  	.color(d3.scale.category20());

d3.json('data/duration_by_stream.json', function(data) {
	d3.select("#graph")
		.datum(data)
		.call(chart);
});
