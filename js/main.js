/* eslint-disable camelcase */
/* eslint-disable no-unused-expressions */
/* eslint-disable no-param-reassign */
import * as d3 from 'd3';
import * as topojson from 'topojson';

(async function renderChart() {
  const [educations, countryMap] = await Promise.all([
    d3.json(
      'https://raw.githubusercontent.com/no-stack-dub-sack/testable-projects-fcc/master/src/data/choropleth_map/for_user_education.json'
    ),
    d3.json(
      'https://raw.githubusercontent.com/no-stack-dub-sack/testable-projects-fcc/master/src/data/choropleth_map/counties.json'
    ),
  ]);

  const width = 1200;
  const height = width * 0.45;
  const margin = {
    top: 30,
    right: 30,
    bottom: 70,
    left: 160,
  };

  const ratesMin = d3.min(educations, (d) => d.bachelorsOrHigher);
  const ratesMax = d3.max(educations, (d) => d.bachelorsOrHigher);
  const ratesDelta = Math.abs(ratesMax - ratesMin);

  const path = d3.geoPath();

  const colorScale = d3
    .scaleThreshold()
    .domain(d3.range(ratesMin, ratesMax, ratesDelta / 8))
    .range(d3.schemeBlues[9]);

  const svg = d3
    .select('body')
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom);

  const countryTopoJson = topojson.feature(
    countryMap,
    countryMap.objects.counties
  );

  countryTopoJson.features.forEach((topoItem) => {
    educations.forEach((education) => {
      if (topoItem.id === education.fips) {
        topoItem.education = education;
      }
    });
  });

  const tooltip = d3
    .select('body')
    .append('div')
    .attr('id', 'tooltip')
    .attr('class', 'tooltip');

  const createTooltipText = ({ area_name, state, bachelorsOrHigher }) =>
    `${area_name}, ${state} <b>${bachelorsOrHigher}</b>`;

  svg
    .append('g')
    .attr('class', 'countries')
    .selectAll('path')
    .data(countryTopoJson.features)
    .enter()
    .append('path')
    .attr('class', 'county')
    .attr('data-education', (d) => d.education.bachelorsOrHigher)
    .attr('data-fips', (d) => d.id)
    .attr('fill', (d) =>
      colorScale(
        educations[educations.findIndex((p) => p.fips === d.id)]
          .bachelorsOrHigher
      )
    )
    .attr('d', path)
    .on('mouseover', (event, i) => {
      tooltip.transition().duration(250).style('opacity', 1);
      tooltip
        .attr('data-education', i.education.bachelorsOrHigher)
        .html(createTooltipText(i.education))
        .style('left', `${event.pageX + 16}px`)
        .style('top', `${event.pageY}px`);
    })
    .on('mouseout', (_) =>
      tooltip.transition().duration(100).style('opacity', 0)
    );

  const xScaleLegend = d3
    .scaleLinear()
    .domain([2.6, 75.1])
    .rangeRound([600, 860]);

  const legendScaleThreshold = d3
    .scaleThreshold()
    .domain(d3.range(2.6, 75.1, (75.1 - 2.6) / 8))
    .range(colorScale.range());

  const legendSvg = svg
    .append('g')
    .attr('id', 'legend')
    .attr('transform', `translate(-16, 32)`);

  legendSvg
    .selectAll('rect')
    .data(
      colorScale
        .range()
        .map((item) =>
          colorScale
            .invertExtent(item)
            .map((d, i) => d || xScaleLegend.domain()[i])
        )
    )
    .enter()
    .append('rect')
    .attr('height', 8)
    .attr('x', (d) => xScaleLegend(d[0]))
    .attr('width', (d) => xScaleLegend(d[1]) - xScaleLegend(d[0]))
    .attr('fill', (d) => legendScaleThreshold(d[0]));

  legendSvg
    .append('text')
    .text('Education Rate')
    .attr('x', xScaleLegend.range()[0] - 4)
    .attr('y', -8)
    .attr('fill', '#000')
    .attr('text-anchor', 'start')
    .attr('font-weight', '700');

  legendSvg
    .call(
      d3
        .axisBottom(xScaleLegend)
        .tickSize(16)
        .tickValues(legendScaleThreshold.domain())
    )
    .select('.domain')
    .remove();
})();
