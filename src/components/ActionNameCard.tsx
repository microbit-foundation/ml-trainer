/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import {
  Card,
  CardBody,
  CloseButton,
  HStack,
  Input,
  useToast,
} from "@chakra-ui/react";
import { useCallback, useMemo, useState } from "react";
import { useIntl } from "react-intl";
import { Action, ActionData } from "../model";
import { useStore } from "../store";
import { tourElClassname } from "../tours";
import { MakeCodeIcon } from "../utils/icons";
import LedIconSvg from "./icons/LedIconSvg";
import LedIcon from "./LedIcon";
import LedIconPicker from "./LedIconPicker";
import debounce from "lodash.debounce";

interface ActionNameCardProps {
  value: Action;
  onDeleteAction?: () => void;
  onSelectRow?: () => void;
  selected?: boolean;
  readOnly: boolean;
  disabled?: boolean;
}

const actionNameMaxLength = 18;

export const actionNameInputId = (action: Action) =>
  `action-name-input-${action.ID}`;

const ActionNameCard = ({
  value,
  onDeleteAction,
  onSelectRow,
  selected = false,
  readOnly = false,
  disabled,
}: ActionNameCardProps) => {
  const intl = useIntl();
  const toast = useToast();
  const toastId = "name-too-long-toast";
  const setActionName = useStore((s) => s.setActionName);
  const setActionIcon = useStore((s) => s.setActionIcon);
  const { icon, ID: id } = value;
  const [localName, setLocalName] = useState<string>(value.name);
  const predictionResult = useStore((s) => s.predictionResult);
  const isTriggered = readOnly
    ? predictionResult?.detected?.ID === value.ID
    : undefined;

  const debouncedSetActionName = useMemo(
    () =>
      debounce(
        (id: ActionData["ID"], name: string) => {
          setActionName(id, name);
        },
        400,
        { leading: true }
      ),
    [setActionName]
  );

  const onChange: React.ChangeEventHandler<HTMLInputElement> = useCallback(
    (e) => {
      const name = e.target.value;
      // Validate action name length
      if (name.length >= actionNameMaxLength && !toast.isActive(toastId)) {
        toast({
          id: toastId,
          position: "top",
          duration: 5_000,
          title: intl.formatMessage(
            { id: "action-length-error" },
            { maxLen: actionNameMaxLength }
          ),
          variant: "subtle",
          status: "error",
        });
        return;
      }
      setLocalName(name);
      debouncedSetActionName(id, name);
    },
    [debouncedSetActionName, id, intl, toast]
  );

  const handleIconSelected = useCallback(
    (icon: MakeCodeIcon) => {
      setActionIcon(id, icon);
    },
    [id, setActionIcon]
  );

  return (
    <Card
      p={2}
      h="120px"
      display="flex"
      borderColor={selected ? "brand.500" : "transparent"}
      borderWidth={1}
      onClick={onSelectRow}
      position="relative"
      className={tourElClassname.dataSamplesActionCard}
      opacity={disabled ? 0.5 : undefined}
    >
      {!readOnly && onDeleteAction && (
        <CloseButton
          position="absolute"
          right={1}
          top={1}
          onClick={onDeleteAction}
          size="sm"
          borderRadius="sm"
          aria-label={intl.formatMessage(
            { id: "delete-action-aria" },
            { action: localName }
          )}
        />
      )}
      <CardBody p={0} alignContent="center">
        <HStack>
          <HStack>
            {readOnly ? (
              <LedIcon icon={icon} isTriggered={isTriggered} />
            ) : (
              <LedIconSvg icon={icon} />
            )}
            {!readOnly && (
              <LedIconPicker
                actionName={value.name}
                onIconSelected={handleIconSelected}
              />
            )}
          </HStack>
          <Input
            id={actionNameInputId(value)}
            autoFocus={localName.length === 0}
            isTruncated
            readOnly={readOnly}
            value={localName}
            borderWidth={0}
            maxLength={18}
            {...(readOnly
              ? { bgColor: "transparent", size: "lg" }
              : { bgColor: "gray.25", size: "sm" })}
            _placeholder={{ opacity: 0.8, color: "gray.900" }}
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
