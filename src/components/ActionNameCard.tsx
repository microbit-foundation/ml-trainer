import {
  Card,
  CardBody,
  CloseButton,
  HStack,
  Input,
  useToast,
} from "@chakra-ui/react";
import { useCallback } from "react";
import { useIntl } from "react-intl";
import { useStore } from "../store";
import { tourElClassname } from "../tours";
import { MakeCodeIcon } from "../utils/icons";
import LedIcon from "./LedIcon";
import LedIconPicker from "./LedIconPicker";
import { Action } from "../model";

interface ActionNameCardProps {
  value: Action;
  onDeleteAction?: () => void;
  onSelectRow?: () => void;
  selected?: boolean;
  readOnly: boolean;
  isTriggered?: boolean;
  disabled?: boolean;
}

const actionNameMaxLength = 18;

const ActionNameCard = ({
  value,
  onDeleteAction,
  onSelectRow,
  selected = false,
  readOnly = false,
  isTriggered = undefined,
  disabled,
}: ActionNameCardProps) => {
  const intl = useIntl();
  const toast = useToast();
  const toastId = "name-too-long-toast";
  const setActionName = useStore((s) => s.setActionName);
  const setActionIcon = useStore((s) => s.setActionIcon);
  const { name, icon, ID: id } = value;

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
      setActionName(id, name);
    },
    [id, intl, setActionName, toast]
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
      borderColor="brand.500"
      borderWidth={selected ? 1 : 0}
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
            { action: name }
          )}
        />
      )}
      <CardBody p={0} alignContent="center">
        <HStack>
          <HStack>
            <LedIcon icon={icon} isTriggered={isTriggered} />;
            {!readOnly && <LedIconPicker onIconSelected={handleIconSelected} />}
          </HStack>
          <Input
            autoFocus={name.length === 0}
            isTruncated
            readOnly={readOnly}
            value={name}
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
