import { Box, Icon, IconProps, Stack, VStack, Text } from "@chakra-ui/react";
import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import Tick from "./Tick";
import DataSamplesCollection, {
  DataSamplesCollectionRef,
} from "./DataSamplesCollection";
import { animation } from "./utils";
import { FormattedMessage } from "react-intl";

interface LaptopProps extends IconProps {}

export interface LaptopRef {
  displayTick(): void;
  displayNone(): void;
  playDataCollectionTopSamples(): Promise<void>;
  playDataCollectionBottomSamples(): Promise<void>;
}

const Laptop = forwardRef<LaptopRef, LaptopProps>(function Laptop(
  { ...props }: LaptopProps,
  ref
) {
  const dataSamplesCollectionRef = useRef<DataSamplesCollectionRef>(null);
  const [display, setDisplay] = useState<
    null | "tick" | "data-collection" | "training"
  >(null);
  useImperativeHandle(
    ref,
    () => {
      return {
        displayTick() {
          setDisplay("tick");
        },
        displayNone() {
          setDisplay(null);
        },
        async playDataCollectionTopSamples() {
          setDisplay("data-collection");
          await dataSamplesCollectionRef.current?.playTopSamples();
        },
        async playDataCollectionBottomSamples() {
          setDisplay("data-collection");
          await dataSamplesCollectionRef.current?.playBottomSamples();
        },
      };
    },
    []
  );
  return (
    <Box position="relative">
      <Icon viewBox="0 0 195.46 133.33" {...props}>
        <path
          fill="none"
          stroke="#1e1e1c"
          strokeMiterlimit={10}
          strokeWidth="4px"
          d="M22.78,112.02V19.03c0-7.64,6.2-13.84,13.84-13.84h122.44c7.64,0,13.84,6.2,13.84,13.84v93.1"
        />
        <path
          fill="none"
          stroke="#1e1e1c"
          strokeMiterlimit={10}
          strokeWidth="4px"
          d="M187.33,111.97H8.14c-1.36,0-2.49,1.13-2.49,2.48,0,7.23,5.76,13.11,12.99,13.11h158.18c7.23,0,12.99-5.88,12.99-13.11,0-.68-.23-1.35-.68-1.81-.56-.34-1.13-.56-1.81-.68"
        />
      </Icon>
      <Stack
        position="absolute"
        width="175px"
        height="122px"
        left="28px"
        top="8px"
        alignItems="center"
        justifyContent="center"
      >
        {display === "tick" && (
          <Tick
            size="40px"
            animation={`${animation.fadeIn} 0.3s ease-in-out forwards`}
          />
        )}
        {display === "data-collection" && (
          <DataSamplesCollection
            color="gray.600"
            ref={dataSamplesCollectionRef}
          />
        )}
        {display === "training" && (
          <VStack>
            <Text>
              <FormattedMessage id="animation-training" />
            </Text>
          </VStack>
        )}
      </Stack>
    </Box>
  );
});

export default Laptop;
