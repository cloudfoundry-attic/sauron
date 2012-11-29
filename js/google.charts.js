REST = "http://192.168.174.134/";
//
// getSeverityCount
//
function getSeverityCount() {
  getGraph("severity");
} // getSeverityCount


//
// getDefectTrend
//
function getDefectTrend() {
  getGraph("trend");
} // getDefectTrend


//
// getGraph
//
function getGraph(name) {

  $.ajax({

    type: "GET",
    url: REST + "graphs/" + name,
    success: function(xhr) {
      drawStackedColumn(xhr);
    },
    dataType: "json"

  });

} // getGraph


//
// drawSeverityCount
//
function drawSeverityCount() {
  getSeverityCount();
} // drawSeverityCount


//
// drawDefectTrend
//
function drawDefectTrend() {
  getDefectTrend();
} // drawDefectTrend


//
// drawStackedColumn
//
function drawStackedColumn(input) {

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
    document.getElementById(input['name'] + "_div")).
    draw( data, options );

} // drawStackedColumn

