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
            <Image
              w="120px"
              h="103px"
              src={greetingEmojiWithArrowImage}
              alt=""
            />
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
            <HStack
              m={0}
              p={2}
              transform="translateX(65px)"
              w="calc(100% - 65px)"
            >
              <Image w="60px" h="93px" src={upCurveArrowImage} alt="" />
              <Text w={200} textAlign="center">
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
