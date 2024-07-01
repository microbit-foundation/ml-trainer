import { Grid, VStack } from "@chakra-ui/react";
import ConnectFirstView from "../components/ConnectFirstView";
import DefaultPageLayout from "../components/DefaultPageLayout";
import LiveGraphPanel from "../components/LiveGraphPanel";
import TabView from "../components/TabView";
import { addDataConfig } from "../steps-config";

const AddDataPage = () => {
  const noStoredData = true;
  const isInputConnected = false;
  return (
    <DefaultPageLayout titleId={`${addDataConfig.id}-title`}>
      <TabView activeStep={addDataConfig.id} />
      <VStack flexGrow={1} bgColor="gray.25">
        {noStoredData && !isInputConnected ? (
          <ConnectFirstView />
        ) : (
          <Grid>TODO: Grid layout!</Grid>
        )}
      </VStack>
      <LiveGraphPanel />
    </DefaultPageLayout>
  );
};

export default AddDataPage;
