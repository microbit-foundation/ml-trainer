<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 
  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { get } from 'svelte/store';
  import * as d3 from 'd3';
  import {
    FilterType,
    determineFilter,
    getFilterLimits,
  } from '../../script/datafunctions';
  import { GestureData, prevData } from '../../script/stores/mlStore';
  import { state } from '../../script/stores/uiStore';
  import { gestures } from '../../script/stores/Stores';

  export let filter: FilterType;
  export let fullScreen: boolean = false;

  $: showLive = $state.isInputConnected;

  type RecordingRepresentation = {
    ID: number;
    gestureClassName: string;
    gestureClassID: number;
    x: number;
    y: number;
    z: number;
  };
  type Axis = 'x' | 'y' | 'z';
  type PathDrawer = (gesture: RecordingRepresentation) => string | null;

  // Data
  const uniqueLiveDataID = 983095438740;
  const filterStrategy = determineFilter(filter);
  const filterFunction = (data: number[]) => filterStrategy.computeOutput(data);
  let color: d3.ScaleOrdinal<string, string> | undefined = undefined;
  let classList: { name: string; id: number }[] = [];
  const recordings = createDataRepresentation(); // side effect: updates classList and color

  // Plot
  const plotSize = fullScreen ? 800 : 400;
  const margin = { top: 30, right: 10, bottom: 10, left: 0 };
  const width = plotSize - margin.left - margin.right;
  const height = plotSize * 0.75 - margin.top - margin.bottom;
  let plot: any = undefined;
  let plotDrawn = false;

  // Scalars to built graph and insert data in graph
  const dimensions: Axis[] = ['x', 'y', 'z'];
  const { min, max } = getFilterLimits(filter);
  const xScalar: d3.ScalePoint<string> = d3
    .scalePoint()
    .range([15, width])
    .padding(0.1)
    .domain(dimensions);
  const yScalar: any = createYScalar(dimensions, min, max);
  const path = getPathFunc(xScalar, yScalar, dimensions);

  onMount(() => {
    // append the svg object for plot
    plot = d3
      .select('#parallel-plot-' + filter)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    drawParallelPlot(recordings, plot);
  });

  onInterval(() => {
    UpdateLiveDataPath(plot);
  }, 100);

  // --------- DRAW PLOT ---------------
  function drawParallelPlot(data: RecordingRepresentation[], p: any) {
    drawAxes(p, xScalar, yScalar);

    drawLines(data, p, path);

    plotDrawn = true;
  }

  function UpdateLiveDataPath(p: any) {
    if (plotDrawn === false) return;

    const livePath = p.select('.s' + uniqueLiveDataID);

    if (!showLive) {
      if (!livePath.empty()) {
        classList = classList.filter(c => c.id !== uniqueLiveDataID);
        livePath.remove();
      }
      return;
    }

    const liveDataRep: RecordingRepresentation | undefined = createLiveData();

    if (liveDataRep === undefined) return;

    if (livePath.empty()) {
      // Add 'live' to legend
      classList = [...classList, { name: 'live', id: uniqueLiveDataID }];

      // Insert live data path
      drawLines([liveDataRep], p, path);
    } else {
      // Update live path
      const newLivePathLine = () => path(liveDataRep as RecordingRepresentation);
      // Animate
      livePath.transition().duration(50).attr('d', newLivePathLine);
    }
  }

  // --------- HELPER FUNCTIONS ---------------

  function onInterval(callback: () => void, milliseconds: number) {
    const interval = setInterval(callback, milliseconds);
    onDestroy(() => {
      clearInterval(interval);
    });
  }

  function getColorForClass(gestureID: string) {
    if (color === undefined) {
      throw new Error('Cannot get color for gesture, color function not defined');
    }
    return color(gestureID);
  }

  function getStrokeColor(gesture: unknown) {
    const gestureID = (gesture as RecordingRepresentation).gestureClassID;
    if (!gestureID) {
      throw new Error('The given gesture did not contain a gestureClass');
    }
    return getColorForClass(gestureID.toString());
  }

  function createLiveData() {
    const liveData = prevData.toSnapshot();
    if (liveData === undefined) return undefined;
    const filteredData: RecordingRepresentation = {
      ID: uniqueLiveDataID,
      gestureClassName: 'live',
      gestureClassID: uniqueLiveDataID,
      x: filterFunction(liveData.x),
      y: filterFunction(liveData.y),
      z: filterFunction(liveData.z),
    };
    return filteredData;
  }

  // Side effect: updates classList and color
  function createDataRepresentation() {
    const classes: { name: string; id: number }[] = [];
    const data: GestureData[] = get(gestures);
    const recordings: RecordingRepresentation[] = [];
    data.map(gestureClassObject => {
      const gestureClassName: string = gestureClassObject.name;
      const gestureClassID: number = gestureClassObject.ID;
      const gestureClass = { name: gestureClassName, id: gestureClassID };
      if (!classes.includes(gestureClass)) {
        classes.push(gestureClass);
      }
      gestureClassObject.recordings.map(recording => {
        const ID = recording.ID;
        const x = filterFunction(recording.data.x);
        const y = filterFunction(recording.data.y);
        const z = filterFunction(recording.data.z);
        recordings.push({ ID, gestureClassName, gestureClassID, x, y, z });
      });
    });
    const classesIDs = [
      ...classes.map(c => c.id.toString()),
      uniqueLiveDataID.toString(),
    ];
    color = d3.scaleOrdinal<string>().domain(classesIDs).range(d3.schemeSet3);
    classList = classes;
    return recordings;
  }

  function highlight(
    _: any,
    gesture: RecordingRepresentation | { gestureClassID: number },
  ) {
    const gestureID = 's' + gesture.gestureClassID;

    // first every group turns grey
    d3.selectAll('.line')
      .transition()
      .duration(200)
      .style('stroke', 'lightgrey')
      .style('opacity', '0.2');
    // Second the hovered specie takes its color
    d3.selectAll('.' + gestureID)
      .transition()
      .duration(200)
      .style('stroke', (gesture: unknown) => {
        const id = (gesture as RecordingRepresentation).gestureClassID;
        if (!id) {
          throw new Error('The given gesture did not contain a gestureClass');
        }
        return getColorForClass(id.toString());
      })
      .style('opacity', '1');
  }

  function doNotHighlight() {
    d3.selectAll('.line')
      .transition()
      .duration(200)
      .delay(1000)
      .style('stroke', getStrokeColor)
      .style('opacity', '1');
  }

  function drawLines(data: RecordingRepresentation[], plot: any, path: PathDrawer) {
    plot
      .selectAll()
      .data(data)
      .enter()
      .append('path')
      .attr('class', function (gesture: RecordingRepresentation) {
        return 'line ' + 's' + gesture.gestureClassID;
      }) // 2 class for each line: 'line' and the group name
      .attr('d', path)
      .style('fill', 'none')
      .style('stroke', function (gesture: RecordingRepresentation) {
        return getColorForClass(gesture.gestureClassID.toString());
      })
      .style('opacity', function (gesture: RecordingRepresentation) {
        return 0.8;
      })
      .style('stroke-width', function (gesture: RecordingRepresentation) {
        return 4;
      })
      .on('mouseover', highlight)
      .on('mouseleave', doNotHighlight);
  }

  function drawAxes(plot: any, x: d3.ScalePoint<string>, y: any) {
    plot
      .selectAll()
      // For each dimension of the dataset I add a 'g' element:
      .data(dimensions)
      .enter()
      .append('g')
      .attr('class', 'axis')
      // I translate this element to its right position on the x axis
      .attr('transform', function (axis: Axis) {
        return 'translate(' + x(axis) + ')';
      })
      // And I build the axis with the call function
      .each(function (this: SVGGraphicsElement, axis: Axis) {
        d3.select(this).call(d3.axisLeft(d3.scaleLinear()).ticks(4).scale(y[axis]));
      })
      // Add axis title
      .append('text')
      .style('text-anchor', 'middle')
      .style('font-size', '20px')
      .style('fill', function (axis: Axis) {
        if (axis === 'x') return '#f9808e';
        if (axis === 'y') return '#80f98e';
        return '#808ef9';
      })
      .attr('y', -9)
      .text(function (axis: Axis) {
        return axis;
      });
  }

  function createYScalar(d: Axis[], minimum: number, maximum: number) {
    let y: any = {};
    for (let i in d) {
      let axis: Axis = d[i];
      y[axis] = d3.scaleLinear().domain([minimum, maximum]).range([height, 0]);
    }
    return y;
  }

  // The path function take a row of the csv as input, and return x and y coordinates of the line to draw for this raw.
  function getPathFunc(x: d3.ScalePoint<string>, y: any, d: Axis[]) {
    return (gesture: RecordingRepresentation) =>
      d3.line()(
        d.map(function (axis: Axis) {
          return [x(axis) as number, y[axis](gesture[axis])];
        }),
      );
  }
</script>

<div class="flex">
  <div class="flex flex-col justify-evenly mr-4">
    {#each classList as c}
      <!-- svelte-ignore a11y-no-static-element-interactions -->
      <div
        class="py-1 px-4 rounded-md btn transition ease border select-none focusElement"
        style="background-color: {getColorForClass(c.id.toString())};"
        on:mouseenter={() => highlight(null, { gestureClassID: c.id })}
        on:mouseleave={doNotHighlight}>
        {c.name}
      </div>
    {/each}
  </div>
  <div id={'parallel-plot-' + filter} class="relative" />
</div>
