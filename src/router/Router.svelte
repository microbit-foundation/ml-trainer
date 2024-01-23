<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors

  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import { onMount } from 'svelte';
  import DataPage from '../pages/DataPage.svelte';
  import Homepage from '../pages/Homepage.svelte';
  import ModelPage from '../pages/model/ModelPage.svelte';
  import FilterPage from '../pages/filter/FilterPage.svelte';
  import TrainingPage from '../pages/training/TrainingPage.svelte';
  import PlaygroundPage from '../pages/PlaygroundPage.svelte';
  import { currentPageComponent } from '../views/currentComponentStore';
  import { currentPath, isValidPath, navigate, Paths, PathType } from './paths';

  const stripLeadingSlash = (s: string): string => (s.startsWith('/') ? s.slice(1) : s);

  function getRoutedComponent(path: PathType) {
    switch (path) {
      case Paths.HOME:
        return Homepage;
      case Paths.PLAYGROUND:
        return PlaygroundPage;
      case Paths.DATA:
        return DataPage;
      case Paths.TRAINING:
        return TrainingPage;
      case Paths.MODEL:
        return ModelPage;
      case Paths.FILTERS:
        return FilterPage;
    }
  }

  const onPathChange = (path: PathType) => {
    currentPageComponent.set(getRoutedComponent(path));
    let shouldPushState = true;

    const historyState = pathFromBrowserHistoryState(history.state);

    if (historyState !== undefined && historyState === path) {
      shouldPushState = false;
    }

    if (shouldPushState) {
      const url =
        window.location.origin + import.meta.env.BASE_URL + stripLeadingSlash(path);
      history.pushState({ path: path }, '', url);
    }
  };

  const pathFromBrowserHistoryState = (state: unknown): PathType | undefined => {
    if (typeof state !== 'object' || state == null) {
      return undefined;
    }
    if (!('path' in state)) {
      return undefined;
    }
    if (typeof state.path !== 'string') {
      return undefined;
    }
    if (!Object.values(Paths).includes(state.path as PathType)) {
      return undefined;
    }
    return state.path as PathType;
  };

  const navigateFromUrl = () => {
    const path = stripLeadingSlash(window.location.pathname).slice(
      stripLeadingSlash(import.meta.env.BASE_URL).length,
    );
    if (isValidPath(path)) {
      navigate(path);
    } else {
      history.replaceState({}, '', Paths.HOME);
    }
  };
  navigateFromUrl();

  $: onPathChange($currentPath);

  const onPopstateEvent = (event: PopStateEvent) => {
    const state: unknown = event.state;
    const path = pathFromBrowserHistoryState(state);
    if (path !== undefined) {
      navigate(path);
    }
  };

  onMount(() => {
    addEventListener('popstate', onPopstateEvent);
    return () => {
      removeEventListener('popstate', onPopstateEvent);
    };
  });
</script>

<slot />
