// Chart dimensions
var main_margin = {top: 20, right: 120, bottom: 300, left: 40},
    mini_margin = {top: 585, right: 80, bottom: 20, left: 40},
    main_width  = 1300 - main_margin.left - main_margin.right,
    main_height = 550 - main_margin.top - main_margin.bottom,
    mini_height = 650 - mini_margin.top - mini_margin.bottom;

// Define some offsets
var axis_offset        = 315,
    legend_offset      = 195,
    legend_text_offset = {height: 518, width: 195},
    legend_rect_offset = {height: 525, width: 235},
    legend_interval    = 40;

// The label for the Y axis
var yLabel = "Duration";

// The dimension key
var dimKey;

// The date format
var dateFormat = d3.time.format("%b %d");

// The Y tick format
var yTickFormat; 


// Define main svg element in #graph
var svg = d3.select("#graph").append("svg")
    .attr("width", main_width + main_margin.left + main_margin.right)
    .attr("height", main_height + main_margin.top + main_margin.bottom);

// Add the clip path
svg.append("defs").append("clipPath")
    .attr("id", "clip")
  .append("rect")
    .attr("width", main_width - axis_offset)
    .attr("height", main_height);

var main = svg.append("g")
    .attr("transform", "translate(" + main_margin.left + "," + main_margin.top + ")");

//var mini = svg.append("g")
//    .attr("transform", "translate(" + mini_margin.left + "," + mini_margin.top + ")");

// Create the tooltip div
var tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);