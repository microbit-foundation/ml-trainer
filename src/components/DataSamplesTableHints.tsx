/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { GridItem, HStack, Text, VStack } from "@chakra-ui/react";
import { FormattedMessage } from "react-intl";
import { useConnectionStage } from "../connection-stage-hooks";
import { ActionData } from "../model";
import ActionDataSamplesCard from "./ActionDataSamplesCard";
import GreetingEmojiWithArrow from "./GreetingEmojiWithArrow";
import { RecordingOptions } from "./RecordingDialog";
import UpCurveArrow from "./UpCurveArrow";

interface DataSamplesTableHintsProps {
  action: ActionData;
  onRecord: (recordingOptions: RecordingOptions) => void;
}

const DataSamplesTableHints = ({
  action,
  onRecord,
}: DataSamplesTableHintsProps) => {
  const { isConnected } = useConnectionStage();
  return (
    <>
      {action.name.length === 0 ? (
        <GridItem h="120px">
          <VStack m={0} p={2} w={200} transform="translate(-30px, 40px)">
            <GreetingEmojiWithArrow w="120px" h="103px" color="brand.500" />
            <Text textAlign="center">
              <FormattedMessage id="name-action-hint" />
            </Text>
          </VStack>
        </GridItem>
      ) : (
        <>
          <GridItem>
            <ActionDataSamplesCard
              value={action}
              selected={true}
              onRecord={onRecord}
            />
          </GridItem>
          {/* Empty grid item to fill first column of grid */}
          <GridItem />
          <GridItem h="120px">
            <HStack
              m={0}
              p={2}
              transform="translateX(65px)"
              w="calc(100% - 65px)"
            >
              <UpCurveArrow w="60px" h="93px" color="brand.500" />
              {isConnected ? (
                <Text textAlign="center" maxW={200}>
                  <FormattedMessage id="record-hint-button-b" />
                </Text>
              ) : (
                <Text textAlign="center" maxW={125}>
                  <FormattedMessage id="record-hint" />
                </Text>
              )}
            </HStack>
          </GridItem>
        </>
      )}
    </>
  );
};

export default DataSamplesTableHints;
