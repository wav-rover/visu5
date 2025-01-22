document.addEventListener("DOMContentLoaded", () => {

    const margin = { top: 0, right: 20, bottom: 10, left: 30 };
    const width = 500 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    const svg = d3.select("#visualization-3")
        .append("svg")
        .attr("width", "100%")
        .attr("height", "100%")
        .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    function formatDate(date) {
        return date.toISOString().split('T')[0];
    }

    const startDate = new Date(new Date().getFullYear(), 0, 1);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() - 2);

    const startDateLastYear = new Date(startDate);
    startDateLastYear.setFullYear(startDateLastYear.getFullYear() - 1);
    const endDateLastYear = new Date(endDate);
    endDateLastYear.setFullYear(endDateLastYear.getFullYear() - 1);

    const apiUrls = {
        thisYear: `https://archive-api.open-meteo.com/v1/archive?latitude=-75.05435&longitude=0&start_date=${formatDate(startDate)}&end_date=${formatDate(endDate)}&hourly=temperature_2m`,
        lastYear: `https://archive-api.open-meteo.com/v1/archive?latitude=-75.05435&longitude=0&start_date=${formatDate(startDateLastYear)}&end_date=${formatDate(endDateLastYear)}&hourly=temperature_2m`
    };

    function calculateAverage(data) {
        return data.reduce((sum, val) => sum + val, 0) / data.length;
    }

    Promise.all([
        fetch(apiUrls.thisYear).then(response => response.json()),
        fetch(apiUrls.lastYear).then(response => response.json())
    ]).then(([thisYearData, lastYearData]) => {
        const data = [
            {
                year: (new Date().getFullYear() - 1).toString(),
                temperature: calculateAverage(lastYearData.hourly.temperature_2m)
            },
            {
                year: new Date().getFullYear().toString(),
                temperature: calculateAverage(thisYearData.hourly.temperature_2m)
            }
        ];

        const x = d3.scaleBand()
            .range([0, width])
            .padding(0.3)
            .domain(data.map(d => d.year));

        const y = d3.scaleLinear()
            .range([height, 0])
            .domain([
                Math.min(0, d3.min(data, d => d.temperature) - 1),
                d3.max(data, d => d.temperature) + 1
            ]);

        svg.append("g")
            .call(d3.axisTop(x))
            .selectAll("text")
            .style("font-size", "10px")
            .style("margin-top", "-10px")
            .style("fill", "var(--accent)");

        svg.append("g")
            .call(d3.axisLeft(y))
            .selectAll("text")
            .style("font-size", "10px")
            .style("fill", "var(--accent)");

        svg.selectAll(".domain, .tick line")
            .style("stroke", "var(--border)");

        const bars = svg.selectAll(".bar")
            .data(data)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", d => x(d.year))
            .attr("y", d => y(Math.max(0, d.temperature)))
            .attr("width", x.bandwidth())
            .attr("height", d => Math.abs(y(d.temperature) - y(0)))
            .attr("fill", "var(--primary)")
            .attr("rx", 10);

        const tooltip = d3.select("body")
            .append("div")
            .attr("class", "tooltip")
            .style("opacity", 0)
            .style("position", "absolute")
            .style("background-color", "var(--secondary)")
            .style("border", "1px solid var(--border)")
            .style("padding", "10px")
            .style("border-radius", "5px")
            .style("color", "var(--accent)");

        bars.on("mouseover", function(event, d) {

            tooltip.transition()
                .duration(200)
                .style("opacity", 1);
            tooltip.html(`Année: ${d.year}<br>Température moyenne: ${d.temperature.toFixed(1)}°C`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function() {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });

    }).catch(error => {
        console.error("Erreur lors du chargement des données:", error);
        document.getElementById("visualization-3").innerHTML = "Erreur lors du chargement des données";
    });
});