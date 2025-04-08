
var margin = {top: 50, right: 200, bottom: 50, left: 100};
var width = 960 - margin.left - margin.right;
var height = 500 - margin.top - margin.bottom;

var svg = d3.select("body").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var xScale = d3.scaleLog()
    .domain([142, 150000])
    .range([0, width]);

var yScale = d3.scaleLinear()
    .domain([0, 90])
    .range([height, 0]);

var area = d3.scaleLinear()
    .domain([2000, 1400000000])
    .range([25 * Math.PI, 1500 * Math.PI]);


var xAxis = d3.axisBottom(xScale)
    .tickValues([400, 4000, 40000])
    .tickFormat(d => "$" + d);

var yAxis = d3.axisLeft(yScale);

svg.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);

svg.append("g")
    .call(yAxis);

svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -50)
    .attr("text-anchor", "middle")
    .text("LIFE EXPECTANCY (YEARS)");

svg.append("text")
    .attr("x", width / 2)
    .attr("y", height + 40)
    .attr("text-anchor", "middle")
    .text("GDP PER CAPITA ($)");

var yearLabel = svg.append("text")
    .attr("x", width - 100)
    .attr("y", height - 10)
    .attr("font-size", "24px")
    .attr("font-weight", "bold")
    .attr("fill", "black");

d3.json("../data/data.json").then(data => {

    const formattedData = data.map(yearObj => {
        return {
            year: yearObj.year,
            countries: yearObj.countries.filter(country => {
                var dataExists = (country.income && country.life_exp);
                return dataExists;
            }).map(country => {
                return {
                    ...country,
                    income: +country.income,
                    life_exp: +country.life_exp,
                    population: +country.population
                };
            })
        };
    });

    const continents = [...new Set(
        formattedData.flatMap(d => d.countries.map(c => c.continent))
    )];

    const color = d3.scaleOrdinal()
        .domain(continents)
        .range(d3.schemePastel1);

    function update(dataForYear) {
        const circles = svg.selectAll("circle")
            .data(dataForYear.countries, d => d.country);

        circles.enter()
            .append("circle")
            .attr("cx", d => xScale(d.income))
            .attr("cy", d => yScale(d.life_exp))
            .attr("r", d => Math.sqrt(area(d.population) / Math.PI))
            .attr("fill", d => color(d.continent))
            .merge(circles)
            .transition().duration(1000)
            .attr("cx", d => xScale(d.income))
            .attr("cy", d => yScale(d.life_exp))
            .attr("r", d => Math.sqrt(area(d.population) / Math.PI));

        circles.exit().remove();

        yearLabel.text(dataForYear.year);
    }

    const legend = svg.append("g")
        .attr("transform", "translate(" + (width + 20) + ", 50)");

    continents.forEach((continent, i) => {
        legend.append("rect")
            .attr("x", 0)
            .attr("y", i * 25)
            .attr("width", 20)
            .attr("height", 20)
            .attr("fill", color(continent));

        legend.append("text")
            .attr("x", 30)
            .attr("y", i * 25 + 15)
            .text(continent)
            .attr("font-size", "14px")
            .attr("alignment-baseline", "middle");
    });

    let yearIndex = 0;
    setInterval(() => {
        update(formattedData[yearIndex]);
        yearIndex = (yearIndex + 1) % formattedData.length;
    }, 1000);

    update(formattedData[0]);

}).catch((error) => {
    console.error("Error al cargar los datos:", error);
});
