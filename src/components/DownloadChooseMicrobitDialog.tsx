/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { useCallback, useState } from "react";
import {
  Radio as RACRadio,
  RadioGroup as RACRadioGroup,
} from "react-aria-components";
import { RiCheckboxBlankLine, RiCheckboxFill } from "react-icons/ri";
import { FormattedMessage, useIntl } from "react-intl";
import {
  DownloadState,
  SameOrDifferentChoice,
} from "../download-flow/download-types";
import microbitImage from "../images/stylised-microbit-black.svg";
import twoMicrobitsImage from "../images/stylised-two-microbits-black.svg";
import { Box, css, cx, HStack, Icon, Image, Text, VStack } from "../shared-ui";
import ConnectContainerDialog, {
  ConnectContainerDialogProps,
} from "./ConnectContainerDialog";

export interface DownloadChooseMicrobitDialogProps
  extends Omit<ConnectContainerDialogProps, "children" | "headingId"> {
  onSameMicrobitClick: () => void;
  onDifferentMicrobitClick: () => void;
  stage: DownloadState;
}

type MicrobitOption =
  | SameOrDifferentChoice.Same
  | SameOrDifferentChoice.Different;

const DownloadChooseMicrobitDialog = ({
  onSameMicrobitClick,
  onDifferentMicrobitClick,
  stage,
  ...props
}: DownloadChooseMicrobitDialogProps) => {
  const intl = useIntl();
  const defaultValue =
    stage.microbitChoice === SameOrDifferentChoice.Default
      ? SameOrDifferentChoice.Same
      : stage.microbitChoice;
  const [selected, setSelected] = useState<MicrobitOption>(defaultValue);
  const handleOptionChange = useCallback(
    (opt: string) => setSelected(opt as MicrobitOption),
    []
  );
  const radioCardOptions: RadioCardProps[] = [
    {
      id: SameOrDifferentChoice.Same,
      imgSrc: microbitImage,
    },
    {
      id: SameOrDifferentChoice.Different,
      imgSrc: twoMicrobitsImage,
    },
  ];
  return (
    <ConnectContainerDialog
      {...props}
      onNextClick={
        selected === SameOrDifferentChoice.Same
          ? onSameMicrobitClick
          : onDifferentMicrobitClick
      }
      headingId="download-project-choose-microbit-title"
    >
      <VStack gap={5} w="full">
        <Text textAlign="left" w="full">
          <FormattedMessage id="download-project-choose-microbit-subtitle" />
        </Text>
        <RACRadioGroup
          aria-label={intl.formatMessage({
            id: "download-project-choose-microbit-title",
          })}
          orientation="horizontal"
          value={selected}
          onChange={handleOptionChange}
          className={css({
            display: "flex",
            gap: 5,
            w: "full",
            justifyContent: "space-evenly",
            mb: 3,
          })}
        >
          {radioCardOptions.map((config) => (
            <RadioCard key={config.id} {...config} />
          ))}
        </RACRadioGroup>
      </VStack>
    </ConnectContainerDialog>
  );
};

interface RadioCardProps {
  id: MicrobitOption;
  imgSrc: string;
}

const RadioCard = ({ id, imgSrc }: RadioCardProps) => {
  return (
    <RACRadio value={id} className={css({ cursor: "pointer" })}>
      {({ isSelected, isFocusVisible }) => (
        <Box
          className={cx(
            css({
              cursor: "pointer",
              borderWidth: "5px",
              borderStyle: "solid",
              borderRadius: "md",
              p: 4,
            }),
            isSelected
              ? css({ borderColor: "brand.600" })
              : css({ borderColor: "gray.500" }),
            isFocusVisible ? css({ focusShadow: "outline" }) : undefined
          )}
        >
          <HStack justifyContent="right" mb={-7} mt={-1} mr={-1}>
            {isSelected ? (
              <Icon
                as={RiCheckboxFill}
                css={{ width: 6, height: 6, color: "brand.600" }}
              />
            ) : (
              <Icon
                as={RiCheckboxBlankLine}
                css={{ width: 6, height: 6, color: "gray.500" }}
              />
            )}
          </HStack>
          <VStack>
            <Image
              src={imgSrc}
              alt=""
              width="220px"
              height="123px"
              px={12}
              py={3}
              position="relative"
              justifySelf="center"
            />
            <Text fontWeight="bold" fontSize="md" w="full">
              <FormattedMessage id={`download-project-${id}-microbit-option`} />
            </Text>
          </VStack>
        </Box>
      )}
    </RACRadio>
  );
};

export default DownloadChooseMicrobitDialog;
