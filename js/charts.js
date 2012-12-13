function renderSeverityCountGraph() {
  renderGraph('severity');
}

function renderDefectTrendGraph() {
  renderGraph('trends');
}

function renderGraph(graph_type) {
  if (graph_type == 'severity') {
    var data = '{"data":[["severity","count"],["p1",2],["p2",10],["p3",33]],"title":"severity count","x":"severity","y":"defect count","legend":"none","name":"severity"}';
    data = $.parseJSON(data);
    drawStackedColumn(data);
  } else if (graph_type == 'trends') {
    var data = '{"data":[["day","closed","open","new"],["nov 24",3,5,6],["nov 25",2,4,8],["nov 26",3,5,10]],"title":"defect trend","x":"day","y":"defect count","position":"right","name":"trends"}';
    data = $.parseJSON(data);
    drawStackedColumn(data);
  }
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