document.addEventListener("DOMContentLoaded", () => {
    const buttons = document.querySelectorAll('.btn-custom');
    let dataLoaded = false;
    const margin = { top: 0, right: 20, bottom: 20, left: 30 }
    const width = 900 - margin.left - margin.right
    const height = 340 - margin.top - margin.bottom
  
    let start_date, end_date

    function stopAnimation() {
      if (dataLoaded) {
          setTimeout(() => {
              buttons.forEach(btn => btn.classList.add('stop-animation'));
          }, 1700);
      }
  }

    function updateDates(days) {
      const today = new Date()
      end_date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 2)
      start_date = new Date(end_date)
      start_date.setDate(start_date.getDate() - days + 1)
    }
  
    updateDates(7) 
  
    const svg = d3
      .select("#visualization")
      .append("svg")
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`)
  
    const x = d3.scaleTime().range([0, width])
    const y = d3.scaleLinear().range([height, 0])
  
    const xAxis = d3.axisBottom(x).ticks(d3.timeDay.every(1)).tickFormat(d3.timeFormat("%d/%m"))
  
    const yAxis = d3.axisLeft(y).ticks(10)
    const tooltipLine = svg
    .append("line")
    .attr("class", "tooltip-line")
    .attr("stroke", "#999")
    .attr("stroke-width", 1)
    .attr("stroke-solid", "3,3")
    .style("opacity", 0)
    .style("transition", "opacity 0.2s")
    svg.append("g").attr("class", "x-axis").attr("transform", `translate(0,${height})`).call(xAxis)
  
    svg.append("g").attr("class", "y-axis").call(yAxis)
  
    const path = svg.append("path")
    .attr("class", "graph-line") 
    .attr("fill", "none")
    .attr("stroke", "#2596be")
    .attr("stroke-width", 2);
    
    const tooltip = d3
      .select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("opacity", 0)
      .style("transition", "opacity 0.2s")
  
    const formatDate = d3.timeFormat("%Y-%m-%d")
  
    function updateGraph(days) {
      updateDates(days)
      const formattedStartDate = formatDate(start_date)
      const formattedEndDate = formatDate(end_date)
  
      fetch(
        `https://archive-api.open-meteo.com/v1/archive?latitude=-75.05435&longitude=0&start_date=${formattedStartDate}&end_date=${formattedEndDate}&hourly=temperature_2m`,
      )
        .then((response) => response.json())
        .then((data) => {
          const weatherData = data.hourly.time.map((time, i) => ({
            date: new Date(time),
            temperature: data.hourly.temperature_2m[i],
          }))
  
          x.domain(d3.extent(weatherData, (d) => d.date))
          y.domain([d3.min(weatherData, (d) => d.temperature) - 1, d3.max(weatherData, (d) => d.temperature) + 1])
  
          svg.select(".x-axis").call(xAxis)
          svg.select(".y-axis").call(yAxis)
  
          const line = d3
            .line()
            .x((d) => x(d.date))
            .y((d) => y(d.temperature))
            .curve(d3.curveMonotoneX)
  
          path.datum(weatherData).transition().duration(750).attr("d", line)
  
          const points = svg.selectAll(".point").data(weatherData)
  
          points.exit().remove()
  
          points
            .enter()
            .append("circle")
            .attr("class", "point")
            .attr("r", 4)
            .attr("fill", "#2596be")
            .attr("opacity", 0)
            .merge(points)
            .transition()
            .duration(750)
            .attr("cx", (d) => x(d.date))
            .attr("cy", (d) => y(d.temperature))
  
          let isMouseOver = true
  
          const overlay = svg.append("rect")
            .attr("class", "overlay")
            .attr("width", width)
            .attr("height", height)
            .style("fill", "none")
            .style("pointer-events", "all")
  
          overlay
            .on("mouseover", () => {
              isMouseOver = true
              tooltipLine.style("opacity", 1)
              tooltip.style("opacity", 1)
            })
            .on("mouseout", () => {
              isMouseOver = false
              if (!isMouseOver) {
                tooltipLine.style("opacity", 0)
                tooltip.style("opacity", 0)
                svg.selectAll(".point").attr("opacity", 0)
              }
            })
            .on("mousemove", (event) => {
              if (!isMouseOver) return
  
              const [xPos] = d3.pointer(event)
              const xDate = x.invert(xPos)
  
              const bisect = d3.bisector((d) => d.date).left
              const index = bisect(weatherData, xDate, 1)
              const d0 = weatherData[index - 1]
              const d1 = weatherData[index]
              const d = xDate - d0.date > d1.date - xDate ? d1 : d0
  
              tooltipLine.attr("x1", x(d.date)).attr("x2", x(d.date)).attr("y1", 0).attr("y2", height).style("opacity", 1)
  
              tooltip
                .html(`Date: ${d3.timeFormat("%d/%m/%Y %H:%M")(d.date)}<br/>Température: ${d.temperature.toFixed(1)}°C`)
                .style("left", `${event.pageX + 10}px`)
                .style("top", `${event.pageY - 28}px`)
                .style("opacity", 1)
  
              svg.selectAll(".point").attr("opacity", 0)
  
              svg.select(`.point[cx="${x(d.date)}"]`).attr("opacity", 1)
              
            })
  
          const total = weatherData.reduce((acc, curr) => acc + curr.temperature, 0)
          const average = total / weatherData.length
          document.getElementById("moyTemperature").textContent = average.toFixed(1) + "°C";
          dataLoaded = true;
          stopAnimation();
        })
        .catch((error) => {
          console.error("Erreur lors du chargement des données:", error);
          document.getElementById("visualization").innerHTML = "Erreur lors du chargement des données";
          dataLoaded = false;
          buttons.forEach(btn => btn.classList.remove('stop-animation'));
      })
    }
    updateGraph(7)
  
    document.getElementById("periodSelect").addEventListener("change", function () {
      updateGraph(Number.parseInt(this.value))
    })
  })