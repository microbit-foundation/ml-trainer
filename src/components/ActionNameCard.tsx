/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useIntl } from "react-intl";
import { Action } from "../model";
import {
  Card,
  CardBody,
  CloseButton,
  css,
  cx,
  HStack,
  Input,
  useBreakpointValue,
  useToast,
} from "../shared-ui";
import { useStore } from "../store";
import { tourElClassname } from "../tours";
import { MakeCodeIcon } from "../utils/icons";
import LedIconSvg from "./icons/LedIconSvg";
import LedIcon, { LedIconHandle } from "./LedIcon";
import LedIconPicker from "./LedIconPicker";
import debounce from "lodash.debounce";
import { isNativePlatform } from "../platform";

export enum ActionCardNameViewMode {
  Editable = "Editable", // Interaction, color, depth
  ReadOnly = "Readonly", // Grayed out
  Preview = "Preview", // Flattened
}

interface ActionNameCardProps {
  value: Action;
  onDeleteAction?: () => void;
  onSelectRow?: () => void;
  selected?: boolean;
  viewMode: ActionCardNameViewMode;
  disabled?: boolean;
}

const actionNameMaxLength = 18;

export const actionNameInputId = (action: Action) =>
  `action-name-input-${action.id}`;

const ActionNameCard = ({
  value,
  onDeleteAction,
  onSelectRow,
  selected = false,
  viewMode,
  disabled,
}: ActionNameCardProps) => {
  const intl = useIntl();
  const toast = useToast();
  const toastId = "name-too-long-toast";
  const setActionName = useStore((s) => s.setActionName);
  const setActionIcon = useStore((s) => s.setActionIcon);
  const setHint = useStore((s) => s.setHint);
  const { icon, id } = value;
  const [localName, setLocalName] = useState<string>(value.name);

  useEffect(() => {
    // Occurs when the name is updated in another tab.
    setLocalName(value.name);
  }, [value.name]);
  const ledIconRef = useRef<LedIconHandle>(null);
  useEffect(() => {
    if (viewMode !== ActionCardNameViewMode.ReadOnly) return;
    return useStore.subscribe(
      (s) => s.predictionResult?.detected?.id === value.id,
      (v) => ledIconRef.current?.setLedsOn(v)
    );
  }, [value.id, viewMode]);

  // Avoid autofocus on mobile/native as it triggers the keyboard
  const isDesktop =
    useBreakpointValue({ base: false, md: true }) && !isNativePlatform();
  const debouncedSetActionName = useMemo(
    () =>
      debounce(
        async (id: string, name: string) => {
          await setActionName(id, name);
        },
        400,
        // Allowing the first 'Record' button to appear immediately so that
        // users can keyboard navigate to the button immediately after naming
        // their first action.
        { leading: true }
      ),
    [setActionName]
  );

  const debouncedSetHint = useMemo(
    () =>
      // Set hint on the trailing end of inputting action name to avoid
      // aria-live for hint from being interrupted by inputting of action name.
      debounce(() => setHint(false), 400, { leading: false, trailing: true }),
    [setHint]
  );

  const setHasMoved = useStore((s) => s.setHasMoved);
  const onChange: React.ChangeEventHandler<HTMLInputElement> = useCallback(
    async (e) => {
      const name = e.target.value;
      // Validate action name length
      if (name.length >= actionNameMaxLength) {
        toast({
          id: toastId,
          duration: 5_000,
          title: intl.formatMessage(
            { id: "action-length-error" },
            { maxLen: actionNameMaxLength }
          ),
          status: "error",
        });
        return;
      }
      setLocalName(name);
      setHasMoved(true);
      await debouncedSetActionName(id, name);
      debouncedSetHint();
    },
    [debouncedSetActionName, debouncedSetHint, id, intl, setHasMoved, toast]
  );

  const handleIconSelected = useCallback(
    async (icon: MakeCodeIcon) => {
      await setActionIcon(id, icon);
    },
    [id, setActionIcon]
  );

  return (
    <Card
      variant={
        viewMode === ActionCardNameViewMode.Preview ? "outline" : undefined
      }
      onClick={onSelectRow}
      className={cx(
        tourElClassname.dataSamplesActionCard,
        css({
          px: 2,
          py: 2,
          h: "120px",
          display: "flex",
          borderWidth: "1px",
          borderStyle: "solid",
        }),
        selected
          ? css({ borderColor: "brand.500" })
          : css({ borderColor: "transparent" }),
        disabled ? css({ opacity: 0.5 }) : undefined
      )}
    >
      {viewMode === ActionCardNameViewMode.Editable && onDeleteAction && (
        <CloseButton
          onClick={onDeleteAction}
          size="sm"
          aria-label={intl.formatMessage(
            { id: "delete-action-aria" },
            { action: localName }
          )}
          css={{
            position: "absolute",
            right: 1,
            top: 1,
            borderRadius: "sm",
            _after: {
              position: "absolute",
              top: -2,
              right: -2,
              bottom: -2,
              left: -2,
              content: '""',
            },
          }}
        />
      )}
      <CardBody css={{ px: 0, py: 0, alignContent: "center" }}>
        <HStack>
          <HStack>
            {viewMode === ActionCardNameViewMode.ReadOnly ? (
              <LedIcon
                ref={ledIconRef}
                icon={icon}
                colorScheme="brand2"
                initiallyOn={false}
              />
            ) : viewMode === ActionCardNameViewMode.Editable ? (
              <LedIconPicker
                actionName={value.name}
                onIconSelected={handleIconSelected}
                autoFocus={!isDesktop && localName.length === 0}
              >
                <LedIconSvg icon={icon} />
              </LedIconPicker>
            ) : (
              <LedIconSvg icon={icon} />
            )}
          </HStack>
          <Input
            id={actionNameInputId(value)}
            autoFocus={isDesktop && localName.length === 0}
            readOnly={viewMode !== ActionCardNameViewMode.Editable}
            value={localName}
            maxLength={18}
            css={
              viewMode !== ActionCardNameViewMode.Editable
                ? {
                    truncate: true,
                    border: "none",
                    bg: "transparent",
                    h: 12,
                    fontSize: "lg",
                    _placeholder: { opacity: 0.8, color: "gray.900" },
                  }
                : {
                    truncate: true,
                    border: "none",
                    bg: "gray.25",
                    h: 8,
                    px: 3,
                    fontSize: "sm",
                    borderRadius: "sm",
                    _placeholder: { opacity: 0.8, color: "gray.900" },
                  }
            }
            aria-label={intl.formatMessage({
              id: "action-name-placeholder",
            })}
            placeholder={intl.formatMessage({
              id: "action-name-placeholder",
            })}
            onChange={onChange}
          />
        </HStack>
      </CardBody>
    </Card>
  );
};

export default ActionNameCard;
