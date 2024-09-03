import { GridItem, HStack, Image, Text, VStack } from "@chakra-ui/react";
import { FormattedMessage } from "react-intl";
import { GestureData } from "../gestures-hooks";
import upCurveArrowImage from "../images/curve-arrow-up.svg";
import greetingEmojiWithArrowImage from "../images/greeting-emoji-with-arrow.svg";
import DataRecordingGridItem from "./DataRecordingGridItem";

interface AddDataGridWalkThrough {
  gesture: GestureData;
  startRecording: () => void;
}

const AddDataGridWalkThrough = ({
  gesture,
  startRecording,
}: AddDataGridWalkThrough) => {
  return (
    <>
      {gesture.name.length === 0 ? (
        <GridItem h="120px">
          <VStack m={0} p={2} w={200} transform="translate(-30px, 40px)">
            <Image width="120px" src={greetingEmojiWithArrowImage} alt="" />
            <Text textAlign="center">
              <FormattedMessage id="content.data.addActionWalkThrough" />
            </Text>
          </VStack>
        </GridItem>
      ) : (
        <>
          <DataRecordingGridItem
            data={gesture}
            selected={true}
            startRecording={startRecording}
          />
          {/* Empty grid item to fill first column of grid */}
          <GridItem />
          <GridItem h="120px">
            <HStack m={0} p={2} w={300} transform="translateX(65px)">
              <Image width="100px" src={upCurveArrowImage} alt="" />
              <Text textAlign="center">
                <FormattedMessage id="content.data.addRecordingWalkThrough" />
              </Text>
            </HStack>
          </GridItem>
        </>
      )}
    </>
  );
};

export default AddDataGridWalkThrough;
