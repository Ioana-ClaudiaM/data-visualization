class BarChartSVG {
    #container;
    #pibData = null;
    #popDataAll = null;
    #svDataAll = null;
    #data = null;

    constructor(container) {
        this.#container = container;
        this.#data = null;
        this.#initializeTooltip();
    }

    #initializeTooltip() {
        const tooltip = document.createElement('div');
        tooltip.id = 'tooltip';
        tooltip.style.position = 'absolute';
        tooltip.style.display = 'none';
        tooltip.style.backgroundColor = 'rgba(0,0,0,0.7)';
        tooltip.style.color = 'white';
        tooltip.style.padding = '10px';
        tooltip.style.borderRadius = '5px';
        tooltip.style.boxShadow = '0px 0px 10px rgba(0,0,0,0.5)';
        tooltip.style.fontFamily = 'Arial, sans-serif';
        tooltip.style.fontSize = '12px';
        tooltip.style.zIndex = '1000';
        document.body.appendChild(tooltip);
    }

    setChartData(pibData, popData, svData) {
        this.#pibData = pibData;
        this.#popDataAll = popData;
        this.#svDataAll = svData;
    }

    setData(data) {
        this.#data = data;
    }

    #drawBars(chartGroup, width, height) {
        if (!this.#data || !Array.isArray(this.#data) || this.#data.length === 0) {
            console.error('Invalid data for drawing bars.');
            return;
        }
    
        const barWidth = (width / this.#data.length) - 10;  
        const maxValoare = Math.max(...this.#data.map(d => d.valoare));
        
        if (maxValoare === 0) {
            console.error('Max value is zero.');
            return;
        }
    
        const x = i => (width / this.#data.length) * i;
        const y = val => height - (val / maxValoare * height);
    
        chartGroup.selectAll('rect')
            .data(this.#data)
            .enter()
            .append('rect')
            .attr('x', (d, i) => {
                const posX = x(i);
                if (posX < 0 || posX > width) console.error(`Bar x position out of bounds: ${posX}`);
                return posX;
            })
            .attr('y', d => {
                const posY = y(d.valoare);
                if (posY < 0 || posY > height) console.error(`Bar y position out of bounds: ${posY}`);
                return posY;
            })
            .attr('width', barWidth)
            .attr('height', d => height - y(d.valoare))
            .attr('fill', (d, i) => d3.schemeTableau10[i % 10])
            .attr('stroke', 'black')
            .attr('stroke-width', '1px')
            .on('mouseover', (event, d) => this.#handleMouseOver(event, d))
            .on('mouseout', this.#handleMouseOut);
    }
    
    #drawTrendLine(chartGroup, width, height) {
        const n = this.#data.length;
        const sumX = this.#data.reduce((sum, d, i) => sum + i, 0);
        const sumY = this.#data.reduce((sum, d) => sum + d.valoare, 0);
        const sumXY = this.#data.reduce((sum, d, i) => sum + i * d.valoare, 0);
        const sumX2 = this.#data.reduce((sum, d, i) => sum + i * i, 0);

        const a = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const b = (sumY - a * sumX) / n;

        chartGroup.append('line')
            .attr('x1', 0)
            .attr('y1', height - (a * 0 + b) / Math.max(...this.#data.map(d => d.valoare)) * height)
            .attr('x2', width)
            .attr('y2', height - (a * (this.#data.length - 1) + b) / Math.max(...this.#data.map(d => d.valoare)) * height)
            .attr('stroke', 'blue')
            .attr('stroke-width', 2)
            .attr('stroke-dasharray', '4 2');
    }

    #drawAxes(svg, width, height, margin) {
        const xAxis = svg.append('g')
            .attr('transform', `translate(0,${height})`);
    
        xAxis.append('line')
            .attr('x1', 0)
            .attr('y1', 0)
            .attr('x2', width)
            .attr('y2', 0)
            .attr('stroke', 'black')
            .attr('stroke-width', '2px');
    
        xAxis.selectAll('text')
            .data(this.#data)
            .enter()
            .append('text')
            .attr('x', (d, i) => (width / this.#data.length) * i + (width / this.#data.length) / 2)
            .attr('y', 30)
            .attr('text-anchor', 'middle')
            .attr('fill', 'black')
            .attr('style', 'font-weight:bold;font-family:Arial;font-size:12px;')
            .text(d => d.an);
    
        const yAxis = svg.append('g')
            .attr('transform', `translate(0,0)`);
    
        yAxis.append('line')
            .attr('x1', 0)
            .attr('y1', 0)
            .attr('x2', 0)
            .attr('y2', height)
            .attr('stroke', 'black')
            .attr('stroke-width', '2px');
    
        const yAxisLabelCount = 5;
        for (let i = 0; i < yAxisLabelCount; i++) {
            const labelValue = (Math.max(...this.#data.map(d => d.valoare)) / (yAxisLabelCount - 1)) * i;
            yAxis.append('text')
                .attr('x', -10)
                .attr('y', height - (labelValue / Math.max(...this.#data.map(d => d.valoare)) * height))
                .attr('text-anchor', 'end')
                .attr('fill', 'black')
                .attr('style', 'font-weight:bold;font-family:Arial;')
                .attr('alignment-baseline', 'middle')
                .text(labelValue.toFixed(2));
        }
    }
    
    #drawTitle(svg, width, margin) {
        svg.append('text')
            .attr('x', (width + margin.left + margin.right) / 2 - 50)
            .attr('y', margin.top - 80 )
            .attr('text-anchor', 'middle')
            .attr('fill', 'black')
            .attr('style', 'font-weight:bold;font-family:Arial;font-size:18px;')
            .text('Graficul de tip bară');
    }

    #drawAdditionalInfo(svg, width, height, margin) {
        const statistics = this.#calculateStatistics();
        const infoGroup = svg.append('g')
            .attr('transform', `translate(${width + margin.left + 20},${margin.top})`);

        infoGroup.append('rect')
            .attr('x', -10)
            .attr('y', -10)
            .attr('width', 220)
            .attr('height', 180)
            .attr('fill', 'white')
            .attr('stroke', 'black')
            .attr('stroke-width', 1);

        infoGroup.append('text')
            .attr('x', 10)
            .attr('y', 20)
            .attr('fill', 'black')
            .attr('style', 'font-weight:bold;font-family:Arial;font-size:14px;')
            .text('Statistici:');

        infoGroup.append('text')
            .attr('x', 10)
            .attr('y', 40)
            .attr('fill', 'black')
            .attr('style', 'font-weight:bold;font-family:Arial;font-size:12px;')
            .text(`Medie: ${statistics.mean.toFixed(2)}`);

        infoGroup.append('text')
            .attr('x', 10)
            .attr('y', 60)
            .attr('fill', 'black')
            .attr('style', 'font-weight:bold;font-family:Arial;font-size:12px;')
            .text(`Medie Ponderată: ${statistics.weightedMean.toFixed(2)}`);

        infoGroup.append('text')
            .attr('x', 10)
            .attr('y', 80)
            .attr('fill', 'black')
            .attr('style', 'font-weight:bold;font-family:Arial;font-size:12px;')
            .text(`Varianță: ${statistics.variance.toFixed(2)}`);

        infoGroup.append('text')
            .attr('x', 10)
            .attr('y', 100)
            .attr('fill', 'black')
            .attr('style', 'font-weight:bold;font-family:Arial;font-size:12px;')
            .text(`Deviație Standard: ${Math.sqrt(statistics.variance).toFixed(2)}`);
    }

    #calculateStatistics() {
        const n = this.#data.length;
        const sum = this.#data.reduce((sum, d) => sum + d.valoare, 0);
        const mean = sum / n;
        const weightedMean = this.#data.reduce((sum, d, i) => sum + (d.valoare * (i + 1)), 0) / (n * (n + 1) / 2);
        const variance = this.#data.reduce((sum, d) => sum + (d.valoare - mean) ** 2, 0) / n;
        const values = this.#data.map(d => d.valoare);
        const total = values.reduce((acc, val) => acc + val, 0);
        const count = values.length;
        const coverage = this.#calculateCoverage();
        return {
            mean,
            weightedMean,
            variance,
            coverage,
            total,
            count
        };
    }

    #calculateCoverage() {
        const totalEntries = this.#data.length;
        const completeEntries = this.#data.filter(d => d.valoare != null && d.valoare !== undefined).length;
        return (completeEntries / totalEntries) * 100;
    }

    #updateInterpretation() {
        if (!this.#data || !Array.isArray(this.#data) || this.#data.length === 0) {
            console.error('Invalid data for interpretation.');
            return '';
        }

        const statistics = this.#calculateStatistics();
        const growthRate = ((this.#data[this.#data.length - 1].valoare - this.#data[0].valoare) / this.#data[0].valoare) * 100;
        const meanValue = statistics.mean;
        const lastValue = this.#data[this.#data.length - 1].valoare;
        const trend = lastValue > meanValue ? 'în creștere' : 'în scădere';

        let interpretation = '';

        interpretation+="<h3> Interpretări economice ale valorilor</h3>"
        if (growthRate > 100) {
            interpretation += `<span>Rata de Creștere: ${growthRate.toFixed(2)}%</span> - Creștere foarte rapidă; indicator al unei performanțe excelente sau al unei expansiuni accelerate.<br>`;
        } else if (growthRate > 50) {
            interpretation += `<span>Rata de Creștere: ${growthRate.toFixed(2)}%</span> - Creștere solidă; performanță bună, dar nu la fel de accelerată.<br>`;
        } else {
            interpretation += `<span>Rata de Creștere: ${growthRate.toFixed(2)}%</span> - Creștere lentă; poate indica o performanță modestă sau o stagnare.<br>`;
        }

        if (meanValue > 100) {
            interpretation += `<span>Valoarea Medie: ${meanValue.toFixed(2)}</span> - Valoare medie mare; indicator al unei performanțe deasupra mediei.<br>`;
        } else if (meanValue > 50) {
            interpretation += `<span>Valoarea Medie: ${meanValue.toFixed(2)}</span> - Valoare medie moderată; performanță decentă.<br>`;
        } else {
            interpretation += `<span>Valoarea Medie: ${meanValue.toFixed(2)}</span> - Valoare medie mică; poate indica o performanță sub medie.<br>`;
        }

        if (lastValue > 100) {
            interpretation += `<span>Ultima Valoare: ${lastValue.toFixed(2)}</span>  - Performanță excelentă; indicator al unei valori foarte bune recente.<br>`;
        } else if (lastValue > 50) {
            interpretation += `<span>Ultima Valoare: ${lastValue.toFixed(2)}</span>  - Performanță decentă; valoare recentă bună, dar nu extraordinară.<br>`;
        } else {
            interpretation += `<span>Ultima Valoare: ${lastValue.toFixed(2)}</span> - Performanță slabă; valoare recentă sub medie.<br>`;
        }

        interpretation += `<span>Tendință: ${trend}</span>; Semn de ${trend === 'în creștere' ? 'îmbunătățire și dezvoltare pozitivă' : 'probleme potențiale'}.<br>`;

        if (statistics.mean > 100) {
            interpretation += `<span>Medie: ${statistics.mean.toFixed(2)}</span> - Medie foarte bună; sugerează performanță constantă și deasupra standardelor.<br>`;
        } else if (statistics.mean > 50) {
            interpretation += `<span>Medie: ${statistics.mean.toFixed(2)}</span> - Medie acceptabilă; reflectă o performanță decentă.<br>`;
        } else {
            interpretation += `<span>Medie: ${statistics.mean.toFixed(2)}</span> - Medie slabă; poate indica o performanță sub standardele așteptate.<br>`;
        }

        if (statistics.weightedMean > 100) {
            interpretation += `<span>Medie Ponderată: ${statistics.weightedMean.toFixed(2)}</span> - Performanță deasupra mediei ponderate; reflectă o importanță mare a valorilor mai mari în calculul mediei.<br>`;
        } else if (statistics.weightedMean > 50) {
            interpretation += `<span>Medie Ponderată: ${statistics.weightedMean.toFixed(2)}</span> - Medie ponderată moderată; indică o influență echilibrată a valorilor.<br>`;
        } else {
            interpretation += `<span>Medie Ponderată: ${statistics.weightedMean.toFixed(2)}</span> - Medie ponderată mică; valorile mai mici au o influență mare în medie, ceea ce poate indica o performanță inferioară.<br>`;
        }

        if (statistics.variance > 100) {
            interpretation += `<span>Varianță: ${statistics.variance.toFixed(2)}</span> - Variabilitate mare; există fluctuații mari în datele măsurate.<br>`;
        } else if (statistics.variance > 50) {
            interpretation += `<span>Varianță: ${statistics.variance.toFixed(2)}</span> - Variabilitate moderată; datele au o fluctuație rezonabilă.<br>`;
        } else {
            interpretation += `<span>Varianță: ${statistics.variance.toFixed(2)}</span> - Variabilitate mică; datele sunt destul de constante și stabilite.<br>`;
        }

        const stdDeviation = Math.sqrt(statistics.variance);
        if (stdDeviation > 10) {
            interpretation += `<span>Deviație Standard: ${stdDeviation.toFixed(2)}</span> - Deviere mare; datele sunt foarte variabile în jurul mediei.<br>`;
        } else if (stdDeviation > 5) {
            interpretation += `<span>Deviație Standard: ${stdDeviation.toFixed(2)}</span> - Deviere moderată; există o variabilitate vizibilă, dar controlabilă.<br>`;
        } else {
            interpretation += `<span>Deviație Standard: ${stdDeviation.toFixed(2)}</span> - Deviere mică; datele sunt destul de omogene și apropiate de medie.<br>`;
        }

        interpretation += `<span>Acoperire: ${statistics.coverage.toFixed(2)}%</span> - Proporția datelor complete comparativ cu datele lipsă; ${statistics.coverage > 90 ? 'acoperire excelentă' : 'acoperire insuficientă'}.<br>`;

        d3.select("#chartContainerInterpretation").html(interpretation); 
    }

    #handleMouseOver(event, data) {
        const tooltip = document.getElementById('tooltip');
        tooltip.style.display = 'block';
        tooltip.style.left = `${event.pageX + 10}px`;
        tooltip.style.top = `${event.pageY + 10}px`;
        tooltip.innerHTML = `
            <strong>An:</strong> ${data.an}<br>
            <strong>Valoare:</strong> ${data.valoare.toFixed(2)}
        `;
    }

    #handleMouseOut() {
        const tooltip = document.getElementById('tooltip');
        tooltip.style.display = 'none';
    }

    drawChart() {
        const width = 1000;
        const height = 400;
        const margin = { top: 50, right: 50, bottom: 100, left: 80 };
        d3.select(".chart-container").style("display", "block");
        d3.select(".chart-container-interpretations").style("display", "block");

        const svg = d3.select(this.#container)
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        this.#drawBars(svg, width, height);
        this.#drawTrendLine(svg, width, height);
        this.#drawAxes(svg, width, height, margin);
        this.#drawTitle(svg, width, margin);
        this.#drawAdditionalInfo(svg, width, height, margin);
        this.#updateInterpretation();
    }

}


class PieChartSVG {
    #container;
    #pibData = null;
    #popDataAll = null;
    #svDataAll = null;
    #data = null;

    constructor(container) {
        this.#container = container;
    }

    setChartData(pibData, popData, svData) {
        this.#pibData = pibData;
        this.#popDataAll = popData;
        this.#svDataAll = svData;
        console.log('Chart Data Set:', { pibData, popData, svData });
    }

    setData(data) {
        this.#data = data;
        console.log('Data Set:', data);
    }

    exportAsImage() {
        const svg = this.#container.querySelector('svg');
        if (!svg) {
            console.error('No SVG found to export.');
            return;
        }

        const serializer = new XMLSerializer();
        const source = serializer.serializeToString(svg);
        const img = new Image();
        img.src = 'data:image/svg+xml;base64,' + btoa(source);

        const canvas = document.createElement('canvas');
        canvas.width = svg.getBoundingClientRect().width;
        canvas.height = svg.getBoundingClientRect().height;
        const context = canvas.getContext('2d');

        img.onload = function () {
            context.drawImage(img, 0, 0);
            const a = document.createElement('a');
            a.download = 'chart.png';
            a.href = canvas.toDataURL('image/png');
            a.click();
        };
    }

    #calculateStatistics() {
        const n = this.#data.length;
        const sum = this.#data.reduce((sum, d) => sum + d.valoare, 0);
        const mean = sum / n;
        const weightedMean = this.#data.reduce((sum, d, i) => sum + (d.valoare * (i + 1)), 0) / (n * (n + 1) / 2);
        const variance = this.#data.reduce((sum, d) => sum + (d.valoare - mean) ** 2, 0) / n;
        const values = this.#data.map(d => d.valoare);
        const total = values.reduce((acc, val) => acc + val, 0);
        const count = values.length;
        const coverage = this.#calculateCoverage();
        return {
            mean,
            weightedMean,
            variance,
            coverage,
            total,
            count
        };
    }

    #calculateCoverage() {
        const totalEntries = this.#data.length;
        const completeEntries = this.#data.filter(d => d.valoare != null && d.valoare !== undefined).length;
        return (completeEntries / totalEntries) * 100;
    }

    #updateInterpretation() {
        if (!this.#data || !Array.isArray(this.#data) || this.#data.length === 0) {
            console.error('Invalid data for interpretation.');
            return '';
        }

        const statistics = this.#calculateStatistics();
        const growthRate = ((this.#data[this.#data.length - 1].valoare - this.#data[0].valoare) / this.#data[0].valoare) * 100;
        const meanValue = statistics.mean;
        const lastValue = this.#data[this.#data.length - 1].valoare;
        const trend = lastValue > meanValue ? 'în creștere' : 'în scădere';

        let interpretation = '';

        interpretation+="<h3> Interpretări economice ale valorilor</h3>"
        if (growthRate > 100) {
            interpretation += `<span>Rata de Creștere: ${growthRate.toFixed(2)}%</span> - Creștere foarte rapidă; indicator al unei performanțe excelente sau al unei expansiuni accelerate.<br>`;
        } else if (growthRate > 50) {
            interpretation += `<span>Rata de Creștere: ${growthRate.toFixed(2)}%</span> - Creștere solidă; performanță bună, dar nu la fel de accelerată.<br>`;
        } else {
            interpretation += `<span>Rata de Creștere: ${growthRate.toFixed(2)}%</span> - Creștere lentă; poate indica o performanță modestă sau o stagnare.<br>`;
        }

        if (meanValue > 100) {
            interpretation += `<span>Valoarea Medie: ${meanValue.toFixed(2)}</span> - Valoare medie mare; indicator al unei performanțe deasupra mediei.<br>`;
        } else if (meanValue > 50) {
            interpretation += `<span>Valoarea Medie: ${meanValue.toFixed(2)}</span> - Valoare medie moderată; performanță decentă.<br>`;
        } else {
            interpretation += `<span>Valoarea Medie: ${meanValue.toFixed(2)}</span> - Valoare medie mică; poate indica o performanță sub medie.<br>`;
        }

        if (lastValue > 100) {
            interpretation += `<span>Ultima Valoare: ${lastValue.toFixed(2)}</span>  - Performanță excelentă; indicator al unei valori foarte bune recente.<br>`;
        } else if (lastValue > 50) {
            interpretation += `<span>Ultima Valoare: ${lastValue.toFixed(2)}</span>  - Performanță decentă; valoare recentă bună, dar nu extraordinară.<br>`;
        } else {
            interpretation += `<span>Ultima Valoare: ${lastValue.toFixed(2)}</span> - Performanță slabă; valoare recentă sub medie.<br>`;
        }

        interpretation += `<span>Tendință: ${trend}</span>; Semn de ${trend === 'în creștere' ? 'îmbunătățire și dezvoltare pozitivă' : 'probleme potențiale'}.<br>`;

        if (statistics.mean > 100) {
            interpretation += `<span>Medie: ${statistics.mean.toFixed(2)}</span> - Medie foarte bună; sugerează performanță constantă și deasupra standardelor.<br>`;
        } else if (statistics.mean > 50) {
            interpretation += `<span>Medie: ${statistics.mean.toFixed(2)}</span> - Medie acceptabilă; reflectă o performanță decentă.<br>`;
        } else {
            interpretation += `<span>Medie: ${statistics.mean.toFixed(2)}</span> - Medie slabă; poate indica o performanță sub standardele așteptate.<br>`;
        }

        if (statistics.weightedMean > 100) {
            interpretation += `<span>Medie Ponderată: ${statistics.weightedMean.toFixed(2)}</span> - Performanță deasupra mediei ponderate; reflectă o importanță mare a valorilor mai mari în calculul mediei.<br>`;
        } else if (statistics.weightedMean > 50) {
            interpretation += `<span>Medie Ponderată: ${statistics.weightedMean.toFixed(2)}</span> - Medie ponderată moderată; indică o influență echilibrată a valorilor.<br>`;
        } else {
            interpretation += `<span>Medie Ponderată: ${statistics.weightedMean.toFixed(2)}</span> - Medie ponderată mică; valorile mai mici au o influență mare în medie, ceea ce poate indica o performanță inferioară.<br>`;
        }

        if (statistics.variance > 100) {
            interpretation += `<span>Varianță: ${statistics.variance.toFixed(2)}</span> - Variabilitate mare; există fluctuații mari în datele măsurate.<br>`;
        } else if (statistics.variance > 50) {
            interpretation += `<span>Varianță: ${statistics.variance.toFixed(2)}</span> - Variabilitate moderată; datele au o fluctuație rezonabilă.<br>`;
        } else {
            interpretation += `<span>Varianță: ${statistics.variance.toFixed(2)}</span> - Variabilitate mică; datele sunt destul de constante și stabilite.<br>`;
        }

        const stdDeviation = Math.sqrt(statistics.variance);
        if (stdDeviation > 10) {
            interpretation += `<span>Deviație Standard: ${stdDeviation.toFixed(2)}</span> - Deviere mare; datele sunt foarte variabile în jurul mediei.<br>`;
        } else if (stdDeviation > 5) {
            interpretation += `<span>Deviație Standard: ${stdDeviation.toFixed(2)}</span> - Deviere moderată; există o variabilitate vizibilă, dar controlabilă.<br>`;
        } else {
            interpretation += `<span>Deviație Standard: ${stdDeviation.toFixed(2)}</span> - Deviere mică; datele sunt destul de omogene și apropiate de medie.<br>`;
        }

        interpretation += `<span>Acoperire: ${statistics.coverage.toFixed(2)}%</span> - Proporția datelor complete comparativ cu datele lipsă; ${statistics.coverage > 90 ? 'acoperire excelentă' : 'acoperire insuficientă'}.<br>`;

        d3.select("#chartContainerInterpretation").html(interpretation); 
    }

    drawChart() {
        const width = 1100;
        const height = 400;
        const radius = Math.min(width, height) / 2.5;
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    
        d3.select(".chart-container").style("display", "block");
    d3.select(".chart-container-interpretations").style("display", "block");

        svg.setAttribute('width', width);
        svg.setAttribute('height', height);
        svg.setAttribute('style', 'background-color:#f3e4b3; margin-top:2%;');
        this.#container.innerHTML = '';
    
        const chartGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        chartGroup.setAttribute('transform', `translate(${width / 2},${height / 2})`);
    
        const total = this.#data.reduce((sum, d) => sum + d.valoare, 0);
        let currentAngle = 0;
    
        const colors = d3.schemeTableau10;
    
        this.#data.forEach((d, i) => {
            const sliceAngle = (d.valoare / total) * 2 * Math.PI;
            const x1 = radius * Math.cos(currentAngle);
            const y1 = radius * Math.sin(currentAngle);
            const x2 = radius * Math.cos(currentAngle + sliceAngle);
            const y2 = radius * Math.sin(currentAngle + sliceAngle);
            const largeArcFlag = sliceAngle > Math.PI ? 1 : 0;
    
            const pathData = [
                `M 0 0`,
                `L ${x1} ${y1}`,
                `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                `Z`
            ].join(' ');
    
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', pathData);
            path.setAttribute('fill', colors[i % colors.length]);
            path.setAttribute('data-an', d.an);
            path.setAttribute('data-all', d.valoare);
            path.setAttribute('data-tara', d.tara);
    
            path.addEventListener('mouseover', (event) => this.#handleMouseOver(event, total));
            path.addEventListener('mouseout', this.#handleMouseOut);
    
            chartGroup.appendChild(path);
            currentAngle += sliceAngle;
    
            path.style.transformOrigin = '0 0';
            path.style.transform = 'scale(0)';
            path.style.transition = 'transform 0.5s';
            setTimeout(() => {
                path.style.transform = 'scale(1)';
            }, i * 100); 
        });
    
        svg.appendChild(chartGroup);
        this.#container.appendChild(svg);
    
        const title = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        title.setAttribute('x', width / 2);
        title.setAttribute('y', 20);
        title.setAttribute('text-anchor', 'middle');
        title.setAttribute('fill', 'black');
        title.setAttribute('style', 'font-weight:bold;font-family:Poppins;font-size:18px;padding-bottom:2%');
        title.textContent = 'Graficul Indicatorilor Economici';
        svg.appendChild(title);
 this.#updateInterpretation();

    }

    #handleMouseOver(event, total) {
        const path = event.target;
        const tooltip = document.getElementById('tooltip');

        if (tooltip) {
            const an = path.getAttribute('data-an');
            const valoare = parseFloat(path.getAttribute('data-all'));
            const tara = path.getAttribute('data-tara');
            const percentage = ((valoare / total) * 100).toFixed(2);
            tooltip.style.display = 'block';
            tooltip.style.left = (event.pageX + 10) + 'px';
            tooltip.style.top = (event.pageY + 10) + 'px';

            tooltip.innerHTML = `An: ${an}<br>Tara: ${tara}<br>Valoare: ${valoare}<br>Procentaj: ${percentage}%`;
        }
    }

    #handleMouseOut() {
        const tooltip = document.getElementById('tooltip');
        if (tooltip) {
            tooltip.style.display = 'none';
        }
    }

    
}


class LineChartSVG {
    #container;
    #pibData = null;
    #popDataAll = null;
    #svDataAll = null;
    #data = null;

    constructor(container) {
        this.#container = container;
        this.data = null;
    }

    setChartData(pibData, popData, svData) {
        this.#pibData = pibData;
        this.#popDataAll = popData;
        this.#svDataAll = svData;
    }

    setData(data) {
        this.#data = data;
    }

    #drawAdditionalInfo(svg, width, height, margin) {
        const statistics = this.#calculateStatistics();
        const infoGroup = svg.append('g')
            .attr('transform', `translate(${width + margin.left + 20},${margin.top})`);

        infoGroup.append('rect')
            .attr('x', -10)
            .attr('y', -10)
            .attr('width', 220)
            .attr('height', 180)
            .attr('fill', 'white')
            .attr('stroke', 'black')
            .attr('stroke-width', 1);

        infoGroup.append('text')
            .attr('x', 10)
            .attr('y', 20)
            .attr('fill', 'black')
            .attr('style', 'font-weight:bold;font-family:Arial;font-size:14px;')
            .text('Statistici:');

        infoGroup.append('text')
            .attr('x', 10)
            .attr('y', 40)
            .attr('fill', 'black')
            .attr('style', 'font-weight:bold;font-family:Arial;font-size:12px;')
            .text(`Medie: ${statistics.mean.toFixed(2)}`);

        infoGroup.append('text')
            .attr('x', 10)
            .attr('y', 60)
            .attr('fill', 'black')
            .attr('style', 'font-weight:bold;font-family:Arial;font-size:12px;')
            .text(`Medie Ponderată: ${statistics.weightedMean.toFixed(2)}`);

        infoGroup.append('text')
            .attr('x', 10)
            .attr('y', 80)
            .attr('fill', 'black')
            .attr('style', 'font-weight:bold;font-family:Arial;font-size:12px;')
            .text(`Varianță: ${statistics.variance.toFixed(2)}`);

        infoGroup.append('text')
            .attr('x', 10)
            .attr('y', 100)
            .attr('fill', 'black')
            .attr('style', 'font-weight:bold;font-family:Arial;font-size:12px;')
            .text(`Deviație Standard: ${Math.sqrt(statistics.variance).toFixed(2)}`);
    }


    #calculateStatistics() {
        const n = this.#data.length;
        const sum = this.#data.reduce((sum, d) => sum + d.valoare, 0);
        const mean = sum / n;
        const weightedMean = this.#data.reduce((sum, d, i) => sum + (d.valoare * (i + 1)), 0) / (n * (n + 1) / 2);
        const variance = this.#data.reduce((sum, d) => sum + (d.valoare - mean) ** 2, 0) / n;
        const values = this.#data.map(d => d.valoare);
        const total = values.reduce((acc, val) => acc + val, 0);
        const count = values.length;
        const coverage = this.#calculateCoverage();
        return {
            mean,
            weightedMean,
            variance,
            coverage,
            total,
            count
        };
    }

    #calculateCoverage() {
        const totalEntries = this.#data.length;
        const completeEntries = this.#data.filter(d => d.valoare != null && d.valoare !== undefined).length;
        return (completeEntries / totalEntries) * 100;
    }

    #updateInterpretation() {
        if (!this.#data || !Array.isArray(this.#data) || this.#data.length === 0) {
            console.error('Invalid data for interpretation.');
            return '';
        }

        const statistics = this.#calculateStatistics();
        const growthRate = ((this.#data[this.#data.length - 1].valoare - this.#data[0].valoare) / this.#data[0].valoare) * 100;
        const meanValue = statistics.mean;
        const lastValue = this.#data[this.#data.length - 1].valoare;
        const trend = lastValue > meanValue ? 'în creștere' : 'în scădere';

        let interpretation = '';

        interpretation+="<h3> Interpretări economice ale valorilor</h3>"
        if (growthRate > 100) {
            interpretation += `<span>Rata de Creștere: ${growthRate.toFixed(2)}%</span> - Creștere foarte rapidă; indicator al unei performanțe excelente sau al unei expansiuni accelerate.<br>`;
        } else if (growthRate > 50) {
            interpretation += `<span>Rata de Creștere: ${growthRate.toFixed(2)}%</span> - Creștere solidă; performanță bună, dar nu la fel de accelerată.<br>`;
        } else {
            interpretation += `<span>Rata de Creștere: ${growthRate.toFixed(2)}%</span> - Creștere lentă; poate indica o performanță modestă sau o stagnare.<br>`;
        }

        if (meanValue > 100) {
            interpretation += `<span>Valoarea Medie: ${meanValue.toFixed(2)}</span> - Valoare medie mare; indicator al unei performanțe deasupra mediei.<br>`;
        } else if (meanValue > 50) {
            interpretation += `<span>Valoarea Medie: ${meanValue.toFixed(2)}</span> - Valoare medie moderată; performanță decentă.<br>`;
        } else {
            interpretation += `<span>Valoarea Medie: ${meanValue.toFixed(2)}</span> - Valoare medie mică; poate indica o performanță sub medie.<br>`;
        }

        if (lastValue > 100) {
            interpretation += `<span>Ultima Valoare: ${lastValue.toFixed(2)}</span>  - Performanță excelentă; indicator al unei valori foarte bune recente.<br>`;
        } else if (lastValue > 50) {
            interpretation += `<span>Ultima Valoare: ${lastValue.toFixed(2)}</span>  - Performanță decentă; valoare recentă bună, dar nu extraordinară.<br>`;
        } else {
            interpretation += `<span>Ultima Valoare: ${lastValue.toFixed(2)}</span> - Performanță slabă; valoare recentă sub medie.<br>`;
        }

        interpretation += `<span>Tendință: ${trend}</span>; Semn de ${trend === 'în creștere' ? 'îmbunătățire și dezvoltare pozitivă' : 'probleme potențiale'}.<br>`;

        if (statistics.mean > 100) {
            interpretation += `<span>Medie: ${statistics.mean.toFixed(2)}</span> - Medie foarte bună; sugerează performanță constantă și deasupra standardelor.<br>`;
        } else if (statistics.mean > 50) {
            interpretation += `<span>Medie: ${statistics.mean.toFixed(2)}</span> - Medie acceptabilă; reflectă o performanță decentă.<br>`;
        } else {
            interpretation += `<span>Medie: ${statistics.mean.toFixed(2)}</span> - Medie slabă; poate indica o performanță sub standardele așteptate.<br>`;
        }

        if (statistics.weightedMean > 100) {
            interpretation += `<span>Medie Ponderată: ${statistics.weightedMean.toFixed(2)}</span> - Performanță deasupra mediei ponderate; reflectă o importanță mare a valorilor mai mari în calculul mediei.<br>`;
        } else if (statistics.weightedMean > 50) {
            interpretation += `<span>Medie Ponderată: ${statistics.weightedMean.toFixed(2)}</span> - Medie ponderată moderată; indică o influență echilibrată a valorilor.<br>`;
        } else {
            interpretation += `<span>Medie Ponderată: ${statistics.weightedMean.toFixed(2)}</span> - Medie ponderată mică; valorile mai mici au o influență mare în medie, ceea ce poate indica o performanță inferioară.<br>`;
        }

        if (statistics.variance > 100) {
            interpretation += `<span>Varianță: ${statistics.variance.toFixed(2)}</span> - Variabilitate mare; există fluctuații mari în datele măsurate.<br>`;
        } else if (statistics.variance > 50) {
            interpretation += `<span>Varianță: ${statistics.variance.toFixed(2)}</span> - Variabilitate moderată; datele au o fluctuație rezonabilă.<br>`;
        } else {
            interpretation += `<span>Varianță: ${statistics.variance.toFixed(2)}</span> - Variabilitate mică; datele sunt destul de constante și stabilite.<br>`;
        }

        const stdDeviation = Math.sqrt(statistics.variance);
        if (stdDeviation > 10) {
            interpretation += `<span>Deviație Standard: ${stdDeviation.toFixed(2)}</span> - Deviere mare; datele sunt foarte variabile în jurul mediei.<br>`;
        } else if (stdDeviation > 5) {
            interpretation += `<span>Deviație Standard: ${stdDeviation.toFixed(2)}</span> - Deviere moderată; există o variabilitate vizibilă, dar controlabilă.<br>`;
        } else {
            interpretation += `<span>Deviație Standard: ${stdDeviation.toFixed(2)}</span> - Deviere mică; datele sunt destul de omogene și apropiate de medie.<br>`;
        }

        interpretation += `<span>Acoperire: ${statistics.coverage.toFixed(2)}%</span> - Proporția datelor complete comparativ cu datele lipsă; ${statistics.coverage > 90 ? 'acoperire excelentă' : 'acoperire insuficientă'}.<br>`;

        d3.select("#chartContainerInterpretation").html(interpretation); 
    }
    drawChart() {
    const width = 900;
    const height = 400;
    const margin = { top: 40, right: 90, bottom: 40, left: 120 };
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    
    svg.setAttribute('width', width + margin.left + margin.right);
    svg.setAttribute('height', height + margin.top + margin.bottom);
    svg.setAttribute('style', 'background-color:#f3e4b3; margin-top:2%;');
    d3.select(".chart-container").style("display", "block");
    d3.select(".chart-container-interpretations").style("display", "block");
    this.#container.innerHTML = '';
    
    const chartGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    chartGroup.setAttribute('transform', `translate(${margin.left},${margin.top})`);
    

    const xScale = d3.scaleLinear().domain([0, this.#data.length - 1]).range([0, width]);
    const yScale = d3.scaleLinear().domain([0, Math.max(...this.#data.map(d => d.valoare))]).range([height, 0]);
    
    const line = d3.line()
        .x((d, i) => xScale(i))
        .y(d => yScale(d.valoare))
        .curve(d3.curveMonotoneX);
    
    const pathData = line(this.#data);
    
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', pathData);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', 'pink');
    path.setAttribute('stroke-width', 2);
    
    chartGroup.appendChild(path);
    
    this.#data.forEach((d, i) => {
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', xScale(i));
        circle.setAttribute('cy', yScale(d.valoare));
        circle.setAttribute('r', 5);
        circle.setAttribute('fill', 'blue');
        
        circle.addEventListener('mouseover', (event) => {
            const tooltip = document.createElement('div');
            tooltip.id = 'tooltip';
            tooltip.style.position = 'absolute';
            tooltip.style.backgroundColor = 'white';
            tooltip.style.border = '1px solid black';
            tooltip.style.padding = '5px';
            tooltip.style.display = 'block';
            tooltip.style.left = (event.pageX + 10) + 'px';
            tooltip.style.top = (event.pageY + 10) + 'px';
            tooltip.innerHTML = `Valoare: ${d.valoare}`;
            document.body.appendChild(tooltip);
        });
        
        circle.addEventListener('mouseout', () => {
            const tooltip = document.getElementById('tooltip');
            if (tooltip) {
                tooltip.remove();
            }
        });
        
        chartGroup.appendChild(circle);
    });
    
    const xAxis = d3.axisBottom(xScale).ticks(this.#data.length);
    const yAxis = d3.axisLeft(yScale).ticks(5);
    
    const xAxisGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    xAxisGroup.setAttribute('transform', `translate(0,${height})`);
    d3.select(xAxisGroup).call(xAxis);
    
    const yAxisGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    d3.select(yAxisGroup).call(yAxis);
    
    chartGroup.appendChild(xAxisGroup);
    chartGroup.appendChild(yAxisGroup);
    
    svg.appendChild(chartGroup);
    this.#container.appendChild(svg);
    
    const title = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    title.setAttribute('x', (width + margin.left + margin.right) / 2);
    title.setAttribute('y', margin.top / 2);
    title.setAttribute('text-anchor', 'middle');
    title.setAttribute('fill', 'black');
    title.setAttribute('style', 'font-weight:bold;font-family:Poppins;font-size:18px;');
    title.textContent = 'Graficul Indicatorilor Economici';
    svg.appendChild(title);

    this.#updateInterpretation();
}

    
}

class BubbleChartCanvas {
    #canvas;
    #context;
    #data;
    #countryColorMap;
    #tooltip;
    #legend;

    constructor(canvasId) {
        this.#canvas = document.getElementById(canvasId);
        this.#context = this.#canvas.getContext('2d');
        this.#data = [];
        this.#countryColorMap = {
            'BE': { color: '#FFB6C1', name: 'Belgium' },
            'BG': { color: '#FFFF00', name: 'Bulgaria' },
            'CZ': { color: '#008080', name: 'Czech Republic' },
            'DK': { color: '#FFA07A', name: 'Denmark' },
            'DE': { color: '#DDA0DD', name: 'Germany' },
            'EE': { color: '#808080', name: 'Estonia' },
            'IE': { color: '#FFC0CB', name: 'Ireland' },
            'EL': { color: '#FF00FF', name: 'Greece' },
            'ES': { color: '#BC8F8F', name: 'Spain' },
            'FR': { color: '#FF69B4', name: 'France' },
            'HR': { color: '#32CD32', name: 'Croatia' },
            'IT': { color: '#008080', name: 'Italy' },
            'CY': { color: '#556B2F', name: 'Cyprus' },
            'LV': { color: '#F08080', name: 'Latvia' },
            'LT': { color: '#00FA9A', name: 'Lithuania' },
            'LU': { color: '#FA8072', name: 'Luxembourg' },
            'HU': { color: '#00FFFF', name: 'Hungary' },
            'MT': { color: '#808000', name: 'Malta' },
            'NL': { color: '#B8860B', name: 'Netherlands' },
            'AT': { color: '#800000', name: 'Austria' },
            'PL': { color: '#CD853F', name: 'Poland' },
            'PT': { color: '#A0522D', name: 'Portugal' },
            'RO': { color: '#FF4500', name: 'Romania' },
            'SI': { color: '#FF6347', name: 'Slovenia' },
            'SK': { color: '#DA70D6', name: 'Slovakia' },
            'FI': { color: '#006400', name: 'Finland' },
            'SE': { color: '#8B0000', name: 'Sweden' }
        };
        
        this.#tooltip = document.createElement('div');
        this.#tooltip.style.position = 'absolute';
        this.#tooltip.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        this.#tooltip.style.color = '#fff';
        this.#tooltip.style.padding = '5px';
        this.#tooltip.style.borderRadius = '3px';
        this.#tooltip.style.display = 'none';
        document.body.appendChild(this.#tooltip);
        
        this.#legend = document.getElementsByClassName('legendContainer')[0];
        this.#canvas.addEventListener('mousemove', this.showTooltip.bind(this));
        this.#canvas.addEventListener('mouseout', this.hideTooltip.bind(this));
    }

    setData(data) {
        this.#data = data;
        this.updateLegend();
    }

    processYearData(data, year) {
        const yearData = data.filter(item => item.an === year);
        const bubbleChartDataCombined = yearData.map(item => {
            const chartData = {
                tara: item.tara,
                an: item.an,
                x: undefined,
                y: undefined,
                radius: undefined,
            };

            if (item.indicator === 'POP') {
                chartData.x = item.valoare;
            } else if (item.indicator === 'SV') {
                chartData.radius = item.valoare;
            } else if (item.indicator === 'PIB') {
                chartData.y = item.valoare;
            }

            return chartData;
        });

        const uniqueData = [];
        bubbleChartDataCombined.forEach(item => {
            const existingItem = uniqueData.find(uniqueItem => uniqueItem.tara === item.tara && uniqueItem.an === item.an);
            if (!existingItem) {
                uniqueData.push(item);
            } else {
                existingItem.x = existingItem.x || item.x;
                existingItem.y = existingItem.y || item.y;
                existingItem.radius = existingItem.radius || item.radius;
            }
        });

        return uniqueData.filter(item => item.x !== undefined && item.y !== undefined && item.radius !== undefined);
    }


    createScale(domain, rangeLength, offset = 0) {
        const minDomain = Math.min(...domain);
        const maxDomain = Math.max(...domain);
        return (value) => ((value - minDomain) / (maxDomain - minDomain)) * rangeLength + offset;
    }
    

    drawChart() {
        this.#context.clearRect(0, 0, this.#canvas.width, this.#canvas.height);
        this.drawGrid();
    
        if (this.#data.length === 0) {
            console.error('No data available for drawing the bubble chart.');
            return;
        }
    
        const xDomain = this.#data.map(item => item.x);
        const yDomain = this.#data.map(item => item.y);
        const radiusDomain = this.#data.map(item => item.radius);
    
        const maxRadius = Math.max(...radiusDomain);
        const xScale = this.createScale(xDomain, this.#canvas.width - maxRadius * 2);
        const yScale = this.createScale(yDomain, this.#canvas.height - maxRadius * 2);
        const radiusScale = this.createScale(radiusDomain, Math.min(this.#canvas.width, this.#canvas.height) / 10);
    
        this.#data.forEach(item => {
            const x = xScale(item.x) + maxRadius;
            const y = yScale(item.y) + maxRadius;
            const radius = radiusScale(item.radius);
    
            this.#context.beginPath();
            this.#context.arc(x, y, radius, 0, 2 * Math.PI);
    
            const fillColor = this.#countryColorMap[item.tara]?.color || '#000';
            const gradient = this.#context.createRadialGradient(x, y, radius * 0.3, x, y, radius);
            gradient.addColorStop(0, fillColor);
            gradient.addColorStop(1, '#ffffff');
    
            this.#context.fillStyle = gradient;
            this.#context.strokeStyle = fillColor;
            this.#context.lineWidth = 2;
            this.#context.stroke();
            this.#context.fill();
    
            this.#context.fillStyle = '#000'; 
            this.#context.font = '12px Poppins';
            this.#context.textAlign = 'center';
            this.#context.fillText(item.tara, x, y);
        });
    
        this.drawAxes(xDomain, yDomain);
        d3.select(".legendContainer").style("display", "block");

    }
    

    drawGrid() {
        const stepX = this.#canvas.width / 10;
        const stepY = this.#canvas.height / 10;

        this.#context.strokeStyle = '#e0e0e0';
        this.#context.lineWidth = 0.5;

        for (let x = stepX; x < this.#canvas.width; x += stepX) {
            this.#context.beginPath();
            this.#context.moveTo(x, 0);
            this.#context.lineTo(x, this.#canvas.height);
            this.#context.stroke();
        }

        for (let y = stepY; y < this.#canvas.height; y += stepY) {
            this.#context.beginPath();
            this.#context.moveTo(0, y);
            this.#context.lineTo(this.#canvas.width, y);
            this.#context.stroke();
        }
    }

    drawAxes(xDomain, yDomain) {
        this.#context.beginPath();
        this.#context.moveTo(0, this.#canvas.height);
        this.#context.lineTo(this.#canvas.width, this.#canvas.height);
        this.#context.strokeStyle = '#000'; 
        this.#context.lineWidth = 2;
        this.#context.stroke();
        this.#context.fillStyle = '#000';
        this.#context.font = '14px Poppins';
        this.#context.textAlign = 'center';
        this.#context.fillText('X Axis', this.#canvas.width / 2, this.#canvas.height - 10);

        this.#context.beginPath();
        this.#context.moveTo(0, 0);
        this.#context.lineTo(0, this.#canvas.height);
        this.#context.strokeStyle = '#000';
        this.#context.lineWidth = 2;
        this.#context.stroke();
        this.#context.save();
        this.#context.rotate(-Math.PI / 2);
        this.#context.fillText('Y Axis', -this.#canvas.height / 2, 20);
        this.#context.restore();
    }

    updateLegend() {
        this.#legend.innerHTML = '<strong>Legend</strong><br>';
        Object.entries(this.#countryColorMap).forEach(([countryCode, countryInfo]) => {
            const legendItem = document.createElement('div');
            legendItem.style.display = 'flex';
            legendItem.style.alignItems = 'center';
            legendItem.innerHTML = `<span style="width: 15px; height: 15px; background-color: ${countryInfo.color}; margin-right: 5px; display: inline-block;"></span> ${countryInfo.name}`;
            this.#legend.appendChild(legendItem);
        });
    }
    
    

    showTooltip(event) {
        const rect = this.#canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        this.#data.forEach(item => {
            const xDomain = this.#data.map(d => d.x);
            const yDomain = this.#data.map(d => d.y);
            const radiusDomain = this.#data.map(d => d.radius);

            const maxRadius = Math.max(...radiusDomain);
            const xScale = this.createScale(xDomain, this.#canvas.width - maxRadius * 2);
            const yScale = this.createScale(yDomain, this.#canvas.height - maxRadius * 2);
            const radiusScale = this.createScale(radiusDomain, Math.min(this.#canvas.width, this.#canvas.height) / 10);

            const itemX = xScale(item.x) + maxRadius;
            const itemY = yScale(item.y) + maxRadius;
            const itemRadius = radiusScale(item.radius);

            const distance = Math.sqrt((x - itemX) ** 2 + (y - itemY) ** 2);
            if (distance < itemRadius) {
                this.#tooltip.innerHTML = `Țara: ${this.#countryColorMap[item.tara].name}<br>Produsul intern brut: ${item.x}<br>Populația pe cap de locuitor: ${item.y}<br>Speranța de viață: ${item.radius}`;
                this.#tooltip.style.left = `${event.pageX + 10}px`;
                this.#tooltip.style.top = `${event.pageY + 10}px`;
                this.#tooltip.style.display = 'block';
            }
        });
    }

    hideTooltip() {
        this.#tooltip.style.display = 'none';
    }
}

class DataTable {
    #tableBody;
    #data;

    constructor(tableBody) {
        this.#tableBody = tableBody;
        this.#data = [];
    }

    setData(data) {
        this.#data = data;
    }

    processDataDefinedIndicators(year) {
        const filteredByYear = this.#data.filter(item => item.an === year);
        
        const mediaUniuniiPIB = this.calculateMedia(filteredByYear, 'PIB');
        const mediaUniuniiPOP = this.calculateMedia(filteredByYear, 'POP');
        const mediaUniuniiSV = this.calculateMedia(filteredByYear, 'SV');

        return filteredByYear.filter(item => item.indicator === 'PIB' && item.valoare !== undefined)
            .map(item => {
                const pop = filteredByYear.find(entry => entry.tara === item.tara && entry.indicator === 'POP')?.valoare || '';
                const sv = filteredByYear.find(entry => entry.tara === item.tara && entry.indicator === 'SV')?.valoare || '';

                return {
                    tara: item.tara,
                    pib: item.valoare,
                    pop: pop,
                    sv: sv,
                    colorPIB: this.calculateColor(item.valoare, mediaUniuniiPIB),
                    colorPOP: this.calculateColor(pop, mediaUniuniiPOP),
                    colorSV: this.calculateColor(sv, mediaUniuniiSV)
                };
            });
    }

    calculateColor(value, media) {
        const difference = Math.abs(value - media);
        const maxDifference = 2 * media;
        const scale = this.calculateColorScale(maxDifference);

        let color;
        if (value > media) {
            const redShade = Math.floor((difference / maxDifference) * scale);
            color = `rgba(255, 0, 0, 0.${redShade + 5})`;
        } else {
            const greenShade = Math.floor((difference / maxDifference) * scale);
            color = `rgba(0, 255, 0, 0.${greenShade + 5})`;
        }
        return color;
    }

    calculateColorScale(maxDifference) {
        return maxDifference > 0 ? 255 : 0;
    }

    drawTable() {
        this.#tableBody.innerHTML = '';

        const year = document.getElementById('yearInput1').value;
        const filteredData = this.processDataDefinedIndicators(year);

        const row1 = document.createElement('tr');
        const headers = ['Țara', 'Produs intern brut', 'Populație pe cap de locuitor', 'Speranța de viață'];

        headers.forEach(header => {
            const th = document.createElement('th');
            th.textContent = header;
            th.style.backgroundColor = `#8dbaeb`;
            row1.appendChild(th);
        });
        this.#tableBody.appendChild(row1);

        if (filteredData.length === 0) {
            const row = document.createElement('tr');
            const cell = document.createElement('td');
            cell.colSpan = 4;
            cell.textContent = 'No data available for the selected year.';
            cell.style.textAlign = 'center';
            row.appendChild(cell);
            this.#tableBody.appendChild(row);
            return;
        }

        filteredData.forEach(item => {
            const row = document.createElement('tr');

            const cells = [
                { content: item.tara, color: '#8dbaeb' }, 
                { content: item.pib, color: item.colorPIB },
                { content: item.pop, color: item.colorPOP },
                { content: item.sv, color: item.colorSV }
            ];

            cells.forEach((cellData, index) => {
                const cell = document.createElement('td');
                cell.textContent = cellData.content;
                if (index === 0) {
                    cell.style.backgroundColor = cellData.color; 
                } else if (index === 1) {
                    cell.style.backgroundColor = cellData.color;
                } else if (index === 2) {
                    cell.style.backgroundColor = cellData.color;
                } else if (index === 3) {
                    cell.style.backgroundColor = cellData.color;
                }
                row.appendChild(cell);
            });

            this.#tableBody.appendChild(row);
        });
    }

    exportToCSV() {
        const rows = Array.from(this.#tableBody.querySelectorAll('tr'));
        let csvContent = '';

        rows.forEach(row => {
            const cells = Array.from(row.querySelectorAll('td, th')).map(cell => `"${cell.textContent.replace(/"/g, '""')}"`).join(',');
            csvContent += cells + '\n';
        });

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'data.csv';
        a.click();
        URL.revokeObjectURL(url);
    }

    calculateMedia(data, indicator) {
        const filteredData = data.filter(item => item.indicator === indicator && item.valoare !== undefined);

        if (filteredData.length === 0) {
            return 0;
        }

        const sum = filteredData.reduce((acc, item) => acc + item.valoare, 0);
        return sum / filteredData.length;
    }
}

document.addEventListener('DOMContentLoaded', function () {
    const chartContainer = document.getElementById('chartContainer');
    const chartTypeSelect = document.getElementById('chartType');
    const updateButton = document.getElementById('updateButton');

    function drawChart(type, data) {
        if (!chartContainer) {
            console.error('Elementul chartContainer nu a fost găsit.');
            return;
        }

        chartContainer.innerHTML = '';

        let chart;

        if (type === 'bar') {
            chart = new BarChartSVG(chartContainer);
        } else if (type === 'pie') {
            chart = new PieChartSVG(chartContainer);
        } else if (type === 'line') {
            chart = new LineChartSVG(chartContainer);
        } else {
            console.error('Tip de grafic necunoscut.');
            return;
        }
        chart.setData(data);
        chart.drawChart();
    }

    function updateCharts() {
        fetch('media/date.json')
            .then(response => response.json())
            .then(data => {
                if (data && data.length > 0) {
                    const selectedCountry = document.getElementById('countryInput').value;
                    const selectedIndicator = document.getElementById('indicatorInput').value;
                    
                    const filteredData = data.filter(item => item.tara === selectedCountry && item.indicator === selectedIndicator).slice(4);
    
                    const selectedType = chartTypeSelect.value;
    
                    drawChart(selectedType, filteredData);
                    console.log(filteredData);
                } else {
                    console.error('No data available.');
                }
            })
            .catch(error => console.error('Error:', error));
    }
    
    updateButton.addEventListener('click', updateCharts);

    const bubbleChart = new BubbleChartCanvas('bubbleChartCanvas');

    document.getElementById('showBubbleChartButton').addEventListener('click', function () {
        const canvasContainer = document.querySelector('.bubbleChartCanvasClass');
        const canvas = document.getElementById("bubbleChartCanvas");
        canvasContainer.style.display = "block";
    
        const selectedYear = document.getElementById('yearInput').value;
        const indicatorSelect = document.getElementById('indicatorInput');
        const selectedIndicatorValue = indicatorSelect.value;
        const selectedIndicatorText = indicatorSelect.options[indicatorSelect.selectedIndex].text;

        fetch('media/date.json')
            .then(response => response.json())
            .then(data => {
                const selectedData = data.filter(item => item.an === selectedYear);
                console.log(selectedData);
    
                const bubbleChartDataCombined = selectedData.map(item => {
                    const chartData = {
                        tara: item.tara,
                        an: item.an,
                        x: undefined,
                        y: undefined,
                        radius: undefined
                    };
    
                    if (item.indicator === 'POP') {
                        chartData.y = item.valoare;
                    } else if (item.indicator === 'SV') {
                        chartData.radius = item.valoare;
                    } else if (item.indicator === 'PIB') {
                        chartData.x = item.valoare;
                    }
    
                    return chartData;
                });
    
                const uniqueData = [];
                bubbleChartDataCombined.forEach(item => {
                    const existingItem = uniqueData.find(uniqueItem => uniqueItem.tara === item.tara && uniqueItem.an === item.an);
                    if (!existingItem) {
                        uniqueData.push(item);
                    } else {
                        existingItem.x = existingItem.x || item.x;
                        existingItem.y = existingItem.y || item.y;
                        existingItem.radius = existingItem.radius || item.radius;
                    }
                });
    
                const cleanedData = uniqueData.filter(item => item.x !== undefined && item.y !== undefined && item.radius !== undefined);
                console.log(cleanedData);
    
                bubbleChart.setData(cleanedData);
                bubbleChart.drawChart();            })
            .catch(error => console.error('Error:', error));
    });
    
    const tableBody = document.getElementById('dataTable');
    const yearInput = document.getElementById('yearInput1');
    const showTableButton = document.getElementById('showTable');

    const dataTable = new DataTable(tableBody);

    showTableButton.addEventListener('click', function () {
        const selectedYear = yearInput.value;
        fetch('media/date.json')
            .then(response => response.json())
            .then(data => {
                const selectedData = data.filter(item => item.an === selectedYear);
                if (selectedData && selectedData.length > 0) {
                    dataTable.setData(selectedData);
                    dataTable.drawTable(); 
                } else {
                    console.error('No data available for the selected year.');
                    dataTable.setData([]); 
                    dataTable.drawTable(); 
                }
            })
            .catch(error => console.error('Error fetching data:', error));
    });

    const icons = document.getElementsByClassName('img-icon');
    const tooltipInfo = document.createElement('div'); 
    
    tooltipInfo.style.position = 'absolute';
    tooltipInfo.style.display = 'none';
    tooltipInfo.style.backgroundColor = '#70fadaa3';
    tooltipInfo.style.border = '1px solid black';
    tooltipInfo.style.padding = '10px';
    tooltipInfo.style.borderRadius = '20px';
    tooltipInfo.style.fontFamily='Poppins';
    document.body.appendChild(tooltipInfo);
    
    Array.from(icons).forEach(icon => {
        icon.addEventListener('mouseover', function() {
            const text = icon.getAttribute('data-tooltip');
            tooltipInfo.textContent = text;
            tooltipInfo.style.display = 'block';
    
            const rect = icon.getBoundingClientRect();
            tooltipInfo.style.left = `${rect.left}px`;
            tooltipInfo.style.top = `${rect.bottom + window.scrollY}px`; 
        });
    
        icon.addEventListener('mouseout', function() {
            tooltipInfo.style.display = 'none';
        });
    });
    

});
