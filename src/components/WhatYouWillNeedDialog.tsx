import { Grid, GridItem, Image, Text, VStack } from "@chakra-ui/react";
import { FormattedMessage } from "react-intl";
import ConnectContainerDialog, {
  ConnectContainerDialogProps,
} from "./ConnectContainerDialog";

interface Item {
  imgSrc: string;
  titleId: string;
  subtitleId?: string;
}

export interface WhatYouWillNeedDialogProps
  extends Omit<ConnectContainerDialogProps, "children" | "onBack"> {
  reconnect: boolean;
  items: Item[];
  reconnectHeadingId: string;
}

const WhatYouWillNeedDialog = ({
  reconnect,
  items,
  headingId,
  reconnectHeadingId,
  ...props
}: WhatYouWillNeedDialogProps) => {
  return (
    <ConnectContainerDialog
      {...props}
      headingId={reconnect ? reconnectHeadingId : headingId}
    >
      {reconnect && (
        <Text>
          <FormattedMessage id="reconnectFailed.subtitle" />
        </Text>
      )}
      <Grid
        width="100%"
        templateColumns={`repeat(${items.length}, 1fr)`}
        gap={16}
        py="50px"
      >
        {items.map(({ imgSrc, titleId, subtitleId }) => {
          return (
            <GridItem key={titleId}>
              <VStack gap={5}>
                <Image
                  src={imgSrc}
                  alt=""
                  objectFit="contain"
                  boxSize="107px"
                />
                <VStack textAlign="center">
                  <Text fontWeight="bold">
                    <FormattedMessage id={titleId} />
                  </Text>
                  {subtitleId && (
                    <Text>
                      <FormattedMessage id={subtitleId} />
                    </Text>
                  )}
                </VStack>
              </VStack>
            </GridItem>
          );
        })}
      </Grid>
    </ConnectContainerDialog>
  );
};

export default WhatYouWillNeedDialog;
