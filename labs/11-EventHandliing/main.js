
var margin = {top: 50, right: 200, bottom: 50, left: 100};
var width = 960 - margin.left - margin.right;
var height = 500 - margin.top - margin.bottom;

// Crear el div para el slider en la parte superior
const sliderDiv = d3.select("body")
    .append("div")
    .attr("id", "slider-container")
    .style("width", (width + margin.left + margin.right) + "px")
    .style("margin", "10px auto")
    .style("text-align", "center");

// Añadir el slider
const slider = sliderDiv.append("input")
    .attr("type", "range")
    .attr("id", "year-slider")
    .attr("min", 0)
    .attr("step", 1)
    .style("width", "80%");

// Añadir etiqueta para mostrar el año actual
const sliderLabel = sliderDiv.append("span")
    .attr("id", "year-label")
    .style("margin-left", "10px")
    .text("Year: ");

// Crear el SVG para la visualización
var svg = d3.select("body").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var xScale = d3.scaleLog().domain([142, 150000]).range([0, width]);
var yScale = d3.scaleLinear().domain([0, 90]).range([height, 0]);
var area = d3.scaleLinear().domain([2000, 1400000000]).range([25 * Math.PI, 1500 * Math.PI]);

var xAxis = d3.axisBottom(xScale).tickValues([400, 4000, 40000]).tickFormat(d => "$" + d);
var yAxis = d3.axisLeft(yScale);

svg.append("g").attr("transform", "translate(0," + height + ")").call(xAxis);
svg.append("g").call(yAxis);
svg.append("text").attr("transform", "rotate(-90)").attr("x", -height / 2).attr("y", -50)
    .attr("text-anchor", "middle").text("LIFE EXPECTANCY (YEARS)");
svg.append("text").attr("x", width / 2).attr("y", height + 40)
    .attr("text-anchor", "middle").text("GDP PER CAPITA ($)");
var yearLabel = svg.append("text").attr("x", width - 100).attr("y", height - 10)
    .attr("font-size", "24px").attr("font-weight", "bold").attr("fill", "black");

// Tooltip
var tip = d3.tip()
    .attr('class', 'd3-tip')
    .html((d) => {
        var text = "<strong>Country:</strong> <span style='color:red'>" + d.country + "</span><br>";
        text += "<strong>Continent:</strong> <span style='color:red;text-transform:capitalize'>" + d.continent + "</span><br>";
        text += "<strong>Life Expectancy:</strong> <span style='color:red'>" + d3.format(".2f")(d.life_exp) + "</span><br>";
        text += "<strong>GDP Per Capita:</strong> <span style='color:red'>" + d3.format("$,.0f")(d.income) + "</span><br>";
        text += "<strong>Population:</strong> <span style='color:red'>" + d3.format(",.0f")(d.population) + "</span><br>";
        return text;
    });

svg.call(tip);

let formattedData;
let interval;
let time = 0;

d3.json("../data/data.json").then(data => {
    formattedData = data.map(yearObj => {
        return {
            year: yearObj.year,
            countries: yearObj.countries.filter(country => (country.income && country.life_exp)).map(country => ({
                ...country,
                income: +country.income,
                life_exp: +country.life_exp,
                population: +country.population
            }))
        };
    });
    
    // Configurar el slider con el número correcto de años
    slider.attr("max", formattedData.length - 1)
          .attr("value", 0);
    
    // Actualizar el texto del label del slider
    sliderLabel.text("Year: " + formattedData[0].year);
    
    const continents = [...new Set(formattedData.flatMap(d => d.countries.map(c => c.continent)))];
    const color = d3.scaleOrdinal().domain(continents).range(d3.schemePastel1);

    function update(dataForYear) {
        const continent = d3.select("#continent-select").property("value");

        let data = dataForYear.countries;
        if (continent !== "all") {
            data = data.filter(d => d.continent.toLowerCase() === continent.toLowerCase());
        }

        const circles = svg.selectAll("circle").data(data, d => d.country);

        circles.enter().append("circle")
            .attr("class", "enter")
            .attr("fill", d => color(d.continent))
            .attr("cx", d => xScale(d.income))
            .attr("cy", d => yScale(d.life_exp))
            .attr("r", 0)
            .on("mouseover", tip.show)
            .on("mouseout", tip.hide)
            .merge(circles)
            .transition().duration(1000)
            .attr("cx", d => xScale(d.income))
            .attr("cy", d => yScale(d.life_exp))
            .attr("r", d => Math.sqrt(area(d.population) / Math.PI));

        circles.exit().remove();

        yearLabel.text(dataForYear.year);
        sliderLabel.text("Year: " + dataForYear.year);
        slider.property("value", time);
    }

    const legend = svg.append("g").attr("transform", "translate(" + (width + 20) + ", 50)");
    continents.forEach((continent, i) => {
        legend.append("rect").attr("x", 0).attr("y", i * 25).attr("width", 20).attr("height", 20).attr("fill", color(continent));
        legend.append("text").attr("x", 30).attr("y", i * 25 + 15)
            .text(continent).attr("font-size", "14px").attr("alignment-baseline", "middle");
    });

    function step() {
        time = (time < formattedData.length - 1) ? time + 1 : 0;
        update(formattedData[time]);
    }

    d3.select("#play-button").on("click", function () {
        var button = d3.select(this);
        if (button.text() === "Play") {
            button.text("Pause");
            interval = setInterval(step, 1000);
        } else {
            button.text("Play");
            clearInterval(interval);
        }
    });

    d3.select("#reset-button").on("click", function () {
        if (interval) {
            clearInterval(interval);
            d3.select("#play-button").text("Play");
        }
        time = 0;
        update(formattedData[0]);
    });

    d3.select("#continent-select").on("change", function () {
        update(formattedData[time]);
    });
    
    // Evento para el slider
    slider.on("input", function() {
        // Pausar la animación si está en ejecución
        if (interval) {
            clearInterval(interval);
            d3.select("#play-button").text("Play");
        }
        
        // Actualizar el índice de tiempo y la visualización
        time = +this.value;
        update(formattedData[time]);
    });
    
    update(formattedData[0]);

}).catch(error => {
    console.error("Error al cargar los datos:", error);
});
