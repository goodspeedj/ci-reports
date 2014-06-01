function tableChart() {

    var main_width, main_height;

    function chart(selection) {

        console.log(main_height);

        selection.each(function(data) {

            // Add the date field to the data set
            data.result.forEach(function(d) {
                d.date = new Date(d._id.year, d._id.month-1, d._id.day);
            });

            table.append("table")
              .append("class", "dataTble")
              .data(data)
              .enter().append("tr");

        }

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

}