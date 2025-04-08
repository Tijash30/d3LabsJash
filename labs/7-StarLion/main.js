
d3.json("../data/revenues.json").then((data) => {
    data.forEach((d) => {
        d.month = d.month;
        d.revenue = d.revenue;
    });
    console.log(data);
    
    var margin = {top: 10, right: 10, bottom: 100, left: 100};
    var width = 600;
    var height = 400;

    var svg = d3.select("body")
        .append("svg")
        .attr("width", width + margin.right + margin.left)
        .attr("height", height + margin.top + margin.bottom);
        
    var g = svg.append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);
    
    const x = d3.scaleBand()
        .domain(data.map(d => d.month))  
        .range([0, width]) 
        .paddingInner(0.3)
        .paddingOuter(0.3);
    
    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.revenue)])  
        .range([height, 0]);
    
    const color = d3.scaleOrdinal()
        .domain(data.map(d => d.month)) 
        .range(d3.schemeSet3);
    
    var rect = g.selectAll("rect")
        .data(data);
    
    rect.enter()
        .append("rect")
        .attr("x", d => x(d.month))  
        .attr("y", d => y(d.revenue))  
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(d.revenue))  
        .attr("fill", "yellow");  
    
    var xAxis = d3.axisBottom(x);
    g.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(xAxis)
        .selectAll("text")
        .attr("transform", "rotate(-40)")
        .attr("x", -5)
        .attr("y", 10)
        .attr("text-anchor", "end");
    
    var yAxis = d3.axisLeft(y)
        .ticks(10)
        .tickFormat(d => "$" + d);  
        
    g.append("g")
        .call(yAxis);
    
    g.append("text")
        .attr("x", width / 2)
        .attr("y", height + 60)
        .attr("text-anchor", "middle")
        .text("Month");  
    
    g.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -(height / 2))
        .attr("y", -60)
        .attr("text-anchor", "middle")
        .text("Revenue (dIIs.)");  

}).catch((error) => {
    console.log(error);
});
