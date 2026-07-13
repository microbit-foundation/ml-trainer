/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { useCallback, useRef } from "react";
import { Dialog, Popover as RACPopover } from "react-aria-components";
import { FormattedMessage, useIntl } from "react-intl";
import {
  Button,
  css,
  HStack,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  PopoverArrow,
  useBreakpointValue,
} from "../shared-ui";
import { useStore } from "../store";
import TourOverlay from "./TourOverlay";

// Default distance or margin between the reference and popover.
const gutterDefault = 8;

// Chakra's popper-positioned ModalContent had no shadow (it overrode
// boxShadow to none) and the standard modal white box.
const popoverDialogClass = css({
  bg: "white",
  borderRadius: "md",
  maxW: "md",
  outline: "none",
});
const popoverHeaderClass = css({
  px: 6,
  py: 4,
  fontSize: "xl",
  fontWeight: "semibold",
});
const popoverBodyClass = css({ px: 6, py: 2, maxW: "md" });
const popoverFooterClass = css({ px: 6, py: 4 });

const Tour = () => {
  const intl = useIntl();
  const tourState = useStore((s) => s.tourState);
  const steps = tourState?.steps;
  const step = steps?.[tourState?.index ?? -1];

  const tourNext = useStore((s) => s.tourNext);
  const tourBack = useStore((s) => s.tourBack);
  const tourComplete = useStore((s) => s.tourComplete);
  const isOpen = !!tourState;
  // On small screens there isn't room to anchor the popover next to the
  // highlighted element without it being clipped out of view, so fall back to
  // a centered dialog. The spotlight overlay still highlights the relevant
  // element, so the step remains clear.
  const isSmallScreen = useBreakpointValue({ base: true, md: false });
  const anchored = !!step?.selector && !isSmallScreen;
  const spotlightPadding = step?.spotlightStyle?.padding ?? 5;

  // The spotlighted element the popover anchors to. Assigned during render so
  // it's set before the (remounted, keyed) popover measures it on mount.
  const anchorRef = useRef<HTMLElement | null>(null);
  anchorRef.current = step?.selector
    ? document.querySelector<HTMLElement>(step.selector)
    : null;

  // Let focus move to the body so the next Tab enters the page from the top.
  // react-aria restores focus on unmount only when focus is still inside the
  // dialog, so blurring first defeats it. On the MakeCode page restoring
  // focus would target the editor's container/iframe, pulling focus into the
  // MakeCode workspace.
  const blurThen = useCallback(
    <A extends unknown[]>(fn: (...args: A) => void) =>
      (...args: A) => {
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
        fn(...args);
      },
    []
  );

  const handleTourComplete = useCallback(() => {
    if (!tourState) {
      throw new Error("Must be a tour");
    }
    void tourComplete(tourState.markCompleted);
  }, [tourComplete, tourState]);

  if (!tourState || !steps || !step) {
    return null;
  }
  const { index } = tourState;
  const hasBack = index > 0;
  const isLastStep = index === steps.length - 1;

  const footer = (
    <HStack justifyContent="space-between" p={0} w="full">
      {!isLastStep ? (
        <Button onPress={blurThen(handleTourComplete)} variant="link">
          <FormattedMessage id="skip-tour-action" />
        </Button>
      ) : (
        <div />
      )}
      <HStack gap={2}>
        {hasBack && (
          <Button variant="secondary" size="sm" onPress={blurThen(tourBack)}>
            <FormattedMessage id="back-action" />
          </Button>
        )}
        {isLastStep ? (
          <Button
            variant="primary"
            size="sm"
            onPress={blurThen(handleTourComplete)}
          >
            <FormattedMessage id="close-action" />
          </Button>
        ) : (
          <Button variant="primary" size="sm" onPress={blurThen(tourNext)}>
            {intl.formatMessage({ id: "next-action" })} ({index + 1}/
            {steps.length})
          </Button>
        )}
      </HStack>
    </HStack>
  );

  // Use the modal's own backdrop for the single-step tour over MakeCode,
  // which is itself in a full screen modal (TourOverlay doesn't appear over
  // it). Avoid it with multiple steps as the transition between the per-step
  // backdrops flashes; TourOverlay dims (and spotlights) instead.
  const useTourOverlay = Boolean(step.selector) || steps.length > 1;

  if (!anchored) {
    return (
      <>
        {useTourOverlay && (
          <TourOverlay
            referenceRef={anchorRef as React.MutableRefObject<HTMLElement>}
            padding={spotlightPadding}
            paddingTop={step.spotlightStyle?.paddingTop}
            paddingBottom={step.spotlightStyle?.paddingBottom}
            paddingRight={step.spotlightStyle?.paddingRight}
            paddingLeft={step.spotlightStyle?.paddingLeft}
          />
        )}
        <Modal
          isOpen={isOpen}
          onClose={() => {}}
          isDismissable={false}
          isCentered
          size={step.modalSize}
          contentCss={
            isSmallScreen ? { maxW: "calc(100vw - 2rem)" } : undefined
          }
          overlayCss={
            useTourOverlay ? { background: "transparent" } : undefined
          }
        >
          <ModalHeader>{step.title}</ModalHeader>
          <ModalBody css={{ maxW: { base: "full", md: "md" } }}>
            {step.content}
          </ModalBody>
          <ModalFooter>{footer}</ModalFooter>
        </Modal>
      </>
    );
  }

  return (
    <>
      <TourOverlay
        referenceRef={anchorRef as React.MutableRefObject<HTMLElement>}
        padding={spotlightPadding}
        paddingTop={step.spotlightStyle?.paddingTop}
        paddingBottom={step.spotlightStyle?.paddingBottom}
        paddingRight={step.spotlightStyle?.paddingRight}
        paddingLeft={step.spotlightStyle?.paddingLeft}
      />
      <RACPopover
        // Remount per step so the popover re-measures its new anchor.
        key={step.selector}
        triggerRef={anchorRef}
        isOpen={isOpen}
        onOpenChange={() => {}}
        shouldCloseOnInteractOutside={() => false}
        placement={step.placement ?? "bottom"}
        offset={
          gutterDefault + (step.spotlightStyle?.paddingTop ?? spotlightPadding)
        }
        className={css({ zIndex: "modal" })}
      >
        {/* Chakra's popper arrow: white, shadowless, 16px base. */}
        <PopoverArrow size={16} css={{ "& svg": { fill: "white" } }} />
        <Dialog className={popoverDialogClass}>
          <div className={popoverHeaderClass}>{step.title}</div>
          <div className={popoverBodyClass}>{step.content}</div>
          <div className={popoverFooterClass}>{footer}</div>
        </Dialog>
      </RACPopover>
    </>
  );
};

export default Tour;
