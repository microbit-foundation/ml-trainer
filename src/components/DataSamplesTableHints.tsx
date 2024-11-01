import { GridItem, HStack, Text, VStack } from "@chakra-ui/react";
import { FormattedMessage } from "react-intl";
import { ActionData } from "../model";
import ActionDataSamplesCard from "./ActionDataSamplesCard";
import GreetingEmojiWithArrow from "./GreetingEmojiWithArrow";
import UpCurveArrow from "./UpCurveArrow";
import { RecordingOptions } from "./RecordingDialog";

interface DataSamplesTableHintsProps {
  gesture: ActionData;
  onRecord: (recordingOptions: RecordingOptions) => void;
}

const DataSamplesTableHints = ({
  gesture,
  onRecord,
}: DataSamplesTableHintsProps) => {
  return (
    <>
      {gesture.name.length === 0 ? (
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
              value={gesture}
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
              <Text w={200} textAlign="center">
                <FormattedMessage id="record-hint" />
              </Text>
            </HStack>
          </GridItem>
        </>
      )}
    </>
  );
};

export default DataSamplesTableHints;
