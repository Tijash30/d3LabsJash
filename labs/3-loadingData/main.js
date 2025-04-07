
d3.csv("../data/ages.csv").then((data)=> {

	console.log(data);

});

d3.json("../data/ages.json").then((data)=> {

	data.forEach((d)=>{

		d.age = +d.age;

	});

	console.log(data);
    var svg = d3.select("#chart-area").append("svg")
	    .attr("width", 400)
	    .attr("height", 400);

    var circle = svg.selectAll("circle")
        .data(data);

    circle.enter()
        .append("circle")
        .attr("cx", function(d,i) {
            return 50 + i * 50;
        })
        .attr("cy", 200)
        .attr("r", function(d) {
            return d.age;
        })
        .attr("fill", "steelblue");

}).catch((error)=> {

    console.log(error);
    
});
