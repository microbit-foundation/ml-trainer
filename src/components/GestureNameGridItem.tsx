import {
  Card,
  CardBody,
  CloseButton,
  GridItem,
  HStack,
  Input,
  useToast,
} from "@chakra-ui/react";
import { useCallback } from "react";
import { useIntl } from "react-intl";
import { useGestureActions } from "../gestures-hooks";
import { MakeCodeIcon } from "../utils/icons";
import LedIcon from "./LedIcon";
import LedIconPicker from "./LedIconPicker";

interface GestureNameGridItemProps {
  name: string;
  icon: MakeCodeIcon;
  onCloseClick?: () => void;
  onSelectRow?: () => void;
  id: number;
  selected?: boolean;
  readOnly: boolean;
  isTriggered?: boolean;
}

const gestureNameMaxLength = 18;

const GestureNameGridItem = ({
  name,
  icon,
  onCloseClick,
  onSelectRow,
  id,
  selected = false,
  readOnly = false,
  isTriggered = false,
}: GestureNameGridItemProps) => {
  const intl = useIntl();
  const toast = useToast();
  const toastId = "name-too-long-toast";
  const actions = useGestureActions();

  const onChange: React.ChangeEventHandler<HTMLInputElement> = useCallback(
    (e) => {
      const name = e.target.value.trim();
      // Validate gesture name length
      if (name.length >= gestureNameMaxLength && !toast.isActive(toastId)) {
        toast({
          id: toastId,
          position: "top",
          duration: 5_000,
          title: intl.formatMessage(
            { id: "alert.data.classNameLengthAlert" },
            { maxLen: gestureNameMaxLength }
          ),
          variant: "subtle",
          status: "error",
        });
        return;
      }
      actions.setGestureName(id, name);
    },
    [actions, id, intl, toast]
  );

  const handleIconSelected = useCallback(
    (icon: MakeCodeIcon) => {
      actions.setGestureIcon(id, icon);
    },
    [actions, id]
  );

  return (
    <GridItem>
      <Card
        p={2}
        h="120px"
        display="flex"
        borderColor="brand.500"
        borderWidth={selected ? 1 : 0}
        onClick={onSelectRow}
        position="relative"
      >
        {!readOnly && onCloseClick && (
          <CloseButton
            position="absolute"
            right={1}
            top={1}
            onClick={onCloseClick}
            size="sm"
            borderRadius="sm"
            aria-label={intl.formatMessage(
              { id: "content.data.deleteAction" },
              { action: name }
            )}
          />
        )}
        <CardBody p={0} alignContent="center">
          <HStack>
            <HStack>
              <LedIcon
                icon={icon}
                isTestModelPage={readOnly}
                isTriggered={isTriggered}
              />
              ;
              {!readOnly && (
                <LedIconPicker onIconSelected={handleIconSelected} />
              )}
            </HStack>
            <Input
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
                id: "content.data.classPlaceholderNewClass",
              })}
              onChange={onChange}
            />
          </HStack>
        </CardBody>
      </Card>
    </GridItem>
  );
};

export default GestureNameGridItem;
