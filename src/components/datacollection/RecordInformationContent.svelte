<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 
  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import { t } from '../../i18n';
  import ImageSkeleton from '../skeletonloading/ImageSkeleton.svelte';
  import { getInfoBoxColors } from '../information/InformationComponentUtility';
  import recordingGuideImage from '../../imgs/microbit_record_guide.svg';
  export let isLightTheme = true;

  const colors = getInfoBoxColors(isLightTheme);
  const textColor = colors.textColor;
</script>

<div style="color: {textColor}">
  <p class="font-bold text-sm mb-2">
    {$t('content.data.choice.header')}
  </p>
  <p class="text-sm">
    {$t('content.data.choice.body')}
  </p>
  <div class="relative w-full justify-start flex justify-around gap-1 mt-6 mb-2">
    <div class="w-full float-left">
      <ImageSkeleton
        alt="microbit recording guide"
        height={134}
        src={recordingGuideImage}
        width={200} />
    </div>
    <p class=" text-center absolute w-60px right-10px top-35px">
      {$t('content.index.recordButtonDescription')}
    </p>
  </div>
</div>
