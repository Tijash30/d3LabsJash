
d3.json("../data/buildings.json").then((data)=> {

	data.forEach((d)=>{

        d.name = d.name
		d.height = d.height;

	});

	console.log(data);
    var svg = d3.select("#chart-area").append("svg")
	    .attr("width", 500)
	    .attr("height", 500);

    var rect = svg.selectAll("rect")
        .data(data);
    
    const x = d3.scaleBand()
        .domain(data.map(d => d.name))
        .range([0, 400])
        .paddingInner(0.3)
        .paddingOuter(0.3);
    
    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.height)])
        .range([400, 0]);
    
    const color = d3.scaleOrdinal()
        .domain(data.map(d => d.name))
        .range(d3.schemeSet3);
    
    rect.enter()
        .append("rect")
        .attr("x", function(d) {
            return x(d.name);
        })
        .attr("y", function(d) {
            return y(d.height); 
        })
        .attr("width", x.bandwidth())
        .attr("height", function(d) {
            return 400 - y(d.height);
        })
        .attr("fill", function(d) {
            color(d.name)
        });


}).catch((error)=> {

    console.log(error);
    
});
