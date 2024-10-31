import { MenuItem } from "@chakra-ui/react";
import { useCallback } from "react";
import { RiEyeFill, RiEyeOffFill } from "react-icons/ri";
import { FormattedMessage } from "react-intl";
import { DataSamplesView } from "../model";
import { useStore } from "../store";

const ViewDataFeaturesMenuItem = () => {
  const dataSamplesView = useStore((s) => s.settings.dataSamplesView);
  const showGraphs = useStore((s) => s.settings.showGraphs);
  const setDataSamplesView = useStore((s) => s.setDataSamplesView);

  const handleShowDataFeatures = useCallback(() => {
    setDataSamplesView(
      showGraphs
        ? DataSamplesView.GraphAndDataFeatures
        : DataSamplesView.DataFeatures
    );
  }, [setDataSamplesView, showGraphs]);

  const handleHideDataFeatures = useCallback(() => {
    setDataSamplesView(DataSamplesView.Graph);
  }, [setDataSamplesView]);

  return (
    <>
      {dataSamplesView === DataSamplesView.Graph ? (
        <MenuItem onClick={handleShowDataFeatures} icon={<RiEyeFill />}>
          <FormattedMessage id="show-data-features-action" />
        </MenuItem>
      ) : (
        <MenuItem onClick={handleHideDataFeatures} icon={<RiEyeOffFill />}>
          <FormattedMessage id="hide-data-features-action" />
        </MenuItem>
      )}
    </>
  );
};

export default ViewDataFeaturesMenuItem;
