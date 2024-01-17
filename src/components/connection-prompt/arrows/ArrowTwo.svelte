<!--
  (c) 2024, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  export let widthReduction: number = 0;
  const width = 244 - widthReduction;
</script>

<svg
  {width}
  height="180"
  viewBox="0 0 {width} 180"
  fill="none"
  xmlns="http://www.w3.org/2000/svg">
  <rect x="13" y="25" width={202 - widthReduction} height="10" fill="#00a000" />
  <rect x="13" y="25" width="10" height="140" fill="#00a000" />
  <circle cx={202 - widthReduction} cy="30" r="20" fill="#00a000" />
  <path d="M17.5 180L2.34455 143.75H32.6554L17.5 180Z" fill="#00a000" />
  <foreignObject x={182 - widthReduction} y="10" width="40" height="40">
    <div class="h-10 w-10 flex items-center justify-center" aria-hidden>
      <p class="text-2xl text-white">2</p>
    </div>
  </foreignObject>
</svg>
