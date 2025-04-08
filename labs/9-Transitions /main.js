
var margin = {top: 10, right: 10, bottom: 100, left: 100};
var width = 600;
var height = 400;

var flag = true;

var g = d3.select("#chart-area")
    .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
    .append("g")
        .attr("transform", "translate(" + margin.left + ", " + margin.top + ")");

var x = d3.scaleBand().range([0, width]).padding(0.2);
var y = d3.scaleLinear().range([height, 0]);

var xAxisCall = d3.axisBottom(x);
var yAxisCall = d3.axisLeft(y);

var xAxisGroup = g.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0, " + height + ")");

var yAxisGroup = g.append("g")
    .attr("class", "y-axis");

var yLabel = g.append("text")
    .attr("y", -60)
    .attr("x", -(height / 2))
    .attr("font-size", "20px")
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .text("Revenue");

d3.json("../data/revenues.json").then((data) => {
    data.forEach((d) => {
        d.revenue = +d.revenue;
        d.profit = +d.profit;
    });

    d3.interval(() => {
        var newData = flag ? data : data.slice(1);
        update(newData);
        flag = !flag;
    }, 1000);

    update(data);

}).catch((error) => {
    console.log(error);
});

function update(data) {
    var value = flag ? "revenue" : "profit";
    
    var label = flag ? "Revenue" : "Profit";
    yLabel.text(label);

    x.domain(data.map((d) => { return d.month; }));
    y.domain([0, d3.max(data, function(d) { return d[value] })])
    xAxisGroup.call(xAxisCall);
    yAxisGroup.call(yAxisCall);

    var bars = g.selectAll("rect").data(data)

    bars.exit().remove();

    bars.attr("x", (d) => { return x(d.month); })
        .attr("y", (d) => { return y(d[value]); })
        .attr("width", x.bandwidth)
        .attr("height",(d) => { return height - y(d[value])});

    bars.enter().append("rect")
        .attr("x", (d) => { return x(d.month); })
        .attr("y", (d) => { return y(d[value]); })
        .attr("width", x.bandwidth)
        .attr("height", (d) => { return height - y(d[value]); })
        .attr("fill", "yellow");

}
