<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 
  SPDX-License-Identifier: MIT
 -->
<script lang="ts">
  export let progress: number;
</script>

<div class="w-full h-2 bg-gray-200 rounded">
  <div class="h-2 bg-secondary rounded" style="width: {progress * 100}%;" />
</div>
