
d3.json("../data/buildings.json").then((data)=> {

	data.forEach((d)=>{

		d.height = d.height;

	});

	console.log(data);
    var svg = d3.select("#chart-area").append("svg")
	    .attr("width", 1000)
	    .attr("height", 1000);

    var rect = svg.selectAll("rect")
        .data(data);
    
    rect.enter()
        .append("rect")
        .attr("x", function(d, i) {
            return i * 60 + 20;
        })
        .attr("y", function(d) {
            return 0; 
        })
        .attr("width", 40)
        .attr("height", function(d) {
            return d.height;
        })
        .attr("fill", "red");


}).catch((error)=> {

    console.log(error);
    
});
