function renderSeverityCountGraph() {
  renderGraph('severity');
}

function renderDefectTrendGraph() {
  renderGraph('trend');
}

function renderGraph(name) {
  var config = new Config();
  $.ajax({
    type: "GET",
    url:  config.REST + "graphs/" + name,
    success: function(xhr) {
      drawStackedColumn(xhr);
    },
    dataType: "json"
  });
}

function drawStackedColumn(input) {
  var chart = $('<div/>', {
    id: input['name'] + '_chart',
    class: 'content_box chart'
  });
  $('div.content_box_container').after(chart);

  // Create and populate the data table.
  var data = google.visualization.arrayToDataTable(input["data"]);

  var options = {
    title: input["title"],
    titleTextStyle: { color: "#ffffff" },
    width: 600,
    height: 400,
    fontName: "sans-serif",
    vAxis: { title: input["y"], gridlines: { color: "#005994" },
      textStyle: { color: "#ffffff" }, titleTextStyle: { color: "#ffffff" } },
    hAxis: { title: input["x"], textStyle: { color: "#ffffff" },
      titleTextStyle: { color: "#ffffff" } },
    backgroundColor: { fill: "transparent" },
    colors: [ "#0ae0ea", "#005994", "#55ff42" ],
    legend: { textStyle: { color: "#ffffff" }, position: input["legend"] },
    isStacked: true
  };

  // Create and draw the visualization.
  var visualization = new google.visualization.ColumnChart(
    document.getElementById(input['name'] + "_chart")).
    draw( data, options );

}
