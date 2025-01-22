document.addEventListener("DOMContentLoaded", () => {
    const buttons = document.querySelectorAll('.btn-custom');
    let dataLoaded = false;
    function stopAnimation() {
        if (dataLoaded) {
            setTimeout(() => {
                buttons.forEach(btn => btn.classList.add('stop-animation'));
            }, 1700);
        }
    }
    const margin = { top: 30, right: 30, bottom: 30, left: 30 }
    const width = 500 - margin.left - margin.right
    const height = 300 - margin.top - margin.bottom

    const svg = d3
        .select("#visualization-2")
        .append("svg")
        .attr("width", "100%")
        .attr("height", "100%")
        .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
        .append("g")
        .attr("transform", `translate(${(width + margin.left + margin.right) / 2},${(height + margin.top + margin.bottom) / 2})`)

    const formatDate = d3.timeFormat("%Y-%m-%d")
    const radius = Math.min(width, height) / 2

    function createRadarAxes(levels) {
        const axes = svg.selectAll(".radar-axes").data(levels)
            .enter().append("circle")
            .attr("class", "radar-axes")
            .attr("r", d => (radius * d) / levels.length)
            .attr("fill", "none")
            .attr("stroke", "#2a2a2a")
            .attr("stroke-width", 0.5)
    }

    function createAxisLabels(maxValue, numAxes) {
        const angles = d3.range(0, numAxes).map(d => (d * 2 * Math.PI) / numAxes)

        const axisLines = svg.selectAll(".axis-line")
            .data(angles)
            .enter()
            .append("line")
            .attr("class", "axis-line")
            .attr("x1", 0)
            .attr("y1", 0)
            .attr("x2", d => radius * Math.cos(d - Math.PI / 2))
            .attr("y2", d => radius * Math.sin(d - Math.PI / 2))
            .attr("stroke", "#2a2a2a")
            .attr("stroke-width", 0.5)

        const labels = svg.selectAll(".axis-label")
            .data(angles)
            .enter()
            .append("text")
            .attr("class", "axis-label")
            .attr("x", d => (radius + 20) * Math.cos(d - Math.PI / 2))
            .attr("y", d => (radius + 20) * Math.sin(d - Math.PI / 2))
            .attr("text-anchor", "middle")
            .attr("dy", "0.35em")
            .attr("fill", "#636363")
            .attr("font-size", "10px")
    }

    const tooltip = d3
        .select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0)

    function updateGraph(date) {
        const formattedDate = formatDate(date)

        fetch(
            `https://archive-api.open-meteo.com/v1/archive?latitude=-75.05435&longitude=0&start_date=${formattedDate}&end_date=${formattedDate}&hourly=windspeed_10m`
        )
            .then((response) => response.json())
            .then((data) => {
                const groupedData = []
                for (let i = 0; i < data.hourly.time.length; i += 3) {
                    const windspeed = data.hourly.windspeed_10m[i]
                    const time = new Date(data.hourly.time[i])
                    groupedData.push({ time, windspeed })
                }

                const maxValue = d3.max(groupedData, d => d.windspeed)
                const numAxes = groupedData.length
                const angleSlice = (Math.PI * 2) / numAxes

                const levels = d3.range(1, 6)
                createRadarAxes(levels)
                createAxisLabels(maxValue, numAxes)

                svg.selectAll(".axis-label")
                    .data(groupedData)
                    .text(d => d3.timeFormat("%H:00")(d.time))

                const rScale = d3.scaleLinear()
                    .domain([0, maxValue])
                    .range([0, radius])

                const radarLine = d3.lineRadial()
                    .radius(d => rScale(d.windspeed))
                    .angle((d, i) => i * angleSlice)
                    .curve(d3.curveLinearClosed)

                svg.selectAll(".radar-path").remove()

                const radarPath = svg.append("path")
                    .datum(groupedData)
                    .attr("class", "radar-path")
                    .attr("d", radarLine)
                    .attr("fill", "#2596be")
                    .attr("fill-opacity", 0.3)
                    .attr("stroke", "#2596be")
                    .attr("stroke-width", 2)

                const dots = svg.selectAll(".radar-dot")
                    .data(groupedData)

                dots.exit().remove()

                const newDots = dots.enter()
                    .append("circle")
                    .attr("class", "radar-dot")

                dots.merge(newDots)
                    .attr("r", 4)
                    .attr("fill", "#2596be")
                    .attr("cx", (d, i) => rScale(d.windspeed) * Math.cos(angleSlice * i - Math.PI / 2))
                    .attr("cy", (d, i) => rScale(d.windspeed) * Math.sin(angleSlice * i - Math.PI / 2))
                    .on("mouseover", function (event, d) {
                        d3.select(this)
                            .attr("r", 6)
                            .attr("fill", "#1a6985")

                        tooltip
                            .style("opacity", 1)
                            .html(`Heure: ${d3.timeFormat("%H:00")(d.time)}<br>Vitesse: ${d.windspeed.toFixed(1)} km/h`)
                            .style("left", (event.pageX + 10) + "px")
                            .style("top", (event.pageY - 28) + "px")
                    })
                    .on("mouseout", function () {
                        d3.select(this)
                            .attr("r", 4)
                            .attr("fill", "#2596be")

                        tooltip.style("opacity", 0)
                    })

                const total = groupedData.reduce((acc, curr) => acc + curr.windspeed, 0)
                const average = total / groupedData.length
                document.getElementById("moyVitesse").textContent = average.toFixed(1) + " km/h";

                dataLoaded = true;
                stopAnimation();
            })
            .catch((error) => {
                console.error("Erreur lors du chargement des données:", error);
                document.getElementById("visualization-2").innerHTML = "Erreur lors du chargement des données";
                dataLoaded = false;
                buttons.forEach(btn => btn.classList.remove('stop-animation'));
            })
    }

    const datePicker = document.getElementById("datePicker");
    const today = new Date();
    const maxDate = new Date(today);
    maxDate.setDate(today.getDate() - 2);
    datePicker.max = formatDate(maxDate);
    datePicker.value = formatDate(maxDate);

    datePicker.addEventListener("change", (event) => {
        const selectedDate = new Date(event.target.value);
        updateGraph(selectedDate);
    });

    updateGraph(maxDate);
});