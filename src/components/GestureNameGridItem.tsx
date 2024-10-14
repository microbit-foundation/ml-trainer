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
import { useStore } from "../store";
import { tourElClassname } from "../tours";
import { MakeCodeIcon } from "../utils/icons";
import LedIcon from "./LedIcon";
import LedIconPicker from "./LedIconPicker";

interface GestureNameGridItemProps {
  name: string;
  icon: MakeCodeIcon;
  onDeleteAction?: () => void;
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
  onDeleteAction,
  onSelectRow,
  id,
  selected = false,
  readOnly = false,
  isTriggered = undefined,
}: GestureNameGridItemProps) => {
  const intl = useIntl();
  const toast = useToast();
  const toastId = "name-too-long-toast";
  const setGestureName = useStore((s) => s.setGestureName);
  const setGestureIcon = useStore((s) => s.setGestureIcon);

  const onChange: React.ChangeEventHandler<HTMLInputElement> = useCallback(
    (e) => {
      const name = e.target.value;
      // Validate gesture name length
      if (name.length >= gestureNameMaxLength && !toast.isActive(toastId)) {
        toast({
          id: toastId,
          position: "top",
          duration: 5_000,
          title: intl.formatMessage(
            { id: "action-length-error" },
            { maxLen: gestureNameMaxLength }
          ),
          variant: "subtle",
          status: "error",
        });
        return;
      }
      setGestureName(id, name);
    },
    [id, intl, setGestureName, toast]
  );

  const handleIconSelected = useCallback(
    (icon: MakeCodeIcon) => {
      setGestureIcon(id, icon);
    },
    [id, setGestureIcon]
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
        className={tourElClassname.dataSamplesActionCard}
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
                id: "action-name-placeholder",
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
