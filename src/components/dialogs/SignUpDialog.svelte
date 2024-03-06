<!--
  (c) 2023, Center for Computational Thinking and Design at Aarhus University and contributors
 
  SPDX-License-Identifier: MIT
 -->

<script lang="ts">
  import { t } from '../../i18n';
  import { hasSeenSignUpDialog } from '../../script/stores/uiStore';
  import StandardDialog from './StandardDialog.svelte';
  import StandardButton from '../StandardButton.svelte';
  import { signUp as signUpApi } from '../../script/utils/api';
  import HtmlFormattedMessage, { linkWithProps } from '../HtmlFormattedMessage.svelte';
  import LoadingAnimation from '../LoadingSpinner.svelte';
  import HammerIcon from 'virtual:icons/ri/hammer-line';

  export let isOpen: boolean;
  let email = '';
  let emailInput: HTMLInputElement;
  let emailIsValid: boolean | undefined;
  let signUpError = false;
  let submissionInProgress = false;

  const onClose = () => {
    $hasSeenSignUpDialog = true;
    isOpen = false;
  };

  const handleSignup = async (e: Event) => {
    e.preventDefault();
    submissionInProgress = true;
    signUpError = false;
    emailIsValid = emailInput.validity.valid;
    if (!emailIsValid) {
      submissionInProgress = false;
      return;
    }
    const result = await signUpApi(email);
    if (result) {
      onClose();
    } else {
      signUpError = true;
    }
    submissionInProgress = false;
  };
</script>

<StandardDialog {isOpen} {onClose} class="w-150 space-y-5">
  <svelte:fragment slot="heading">{$t('sign-up.title')}</svelte:fragment>
  <svelte:fragment slot="body">
    <div class="space-y-3">
      <div class="flex items-center space-x-5">
        <HammerIcon
          class="h-12 w-12 text-gray-800 flex-shrink-0 leading-0 transform rotate-45" />
        <p>{$t('sign-up.content')}</p>
      </div>
      <form class="space-y-2" on:submit={handleSignup} novalidate>
        <label class="font-bold" for="email">
          {$t('sign-up.email-label')} <span class="text-red-600" aria-hidden>*</span>
        </label>
        <input
          class="block w-4/5 h-10 border rounded-md border-gray-300 border-solid px-4 outline-none focus-visible:ring-4 focus-visible:ring-offset-1 focus-visible:ring-ring"
          class:!border-red-600={emailIsValid === false}
          id="email"
          name="email"
          bind:value={email}
          bind:this={emailInput}
          disabled={submissionInProgress}
          type="email"
          required />
        {#if emailIsValid === false}
          <p class="text-red-600" aria-live="polite">
            {$t('sign-up.invalid')}
          </p>
        {/if}
        {#if signUpError}
          <p class="text-red-500" aria-live="polite">
            <HtmlFormattedMessage
              id="sign-up.error"
              options={{
                values: {
                  link: linkWithProps(
                    {
                      href: 'mailto:thenextgen.help@microbit.org',
                    },
                    {
                      className: 'text-red-500 underline',
                    },
                  ),
                },
              }} />
          </p>
        {/if}
      </form>
    </div>
    <div class="flex items-center justify-between">
      <StandardButton type="link" onClick={onClose}
        >{$t('sign-up.skip-action')}</StandardButton>
      <StandardButton
        class="relative"
        type="primary"
        disabled={submissionInProgress}
        onClick={handleSignup}>
        <span class:invisible={submissionInProgress}>
          {$t('sign-up.sign-up-action')}
        </span>
        <span class="absolute left-0 right-0" class:hidden={!submissionInProgress}>
          <LoadingAnimation />
        </span>
      </StandardButton>
    </div>
  </svelte:fragment>
</StandardDialog>
