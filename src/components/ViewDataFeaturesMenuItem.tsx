/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { useCallback } from "react";
import { RiEyeFill, RiEyeOffFill } from "react-icons/ri";
import { FormattedMessage, useIntl } from "react-intl";
import { DataSamplesView } from "../model";
import { Icon, MenuItem } from "@microbit/ui";
import { useStore } from "../store";

const ViewDataFeaturesMenuItem = () => {
  const intl = useIntl();
  const dataSamplesView = useStore((s) => s.settings.dataSamplesView);
  const showGraphs = useStore((s) => s.settings.showGraphs);
  const setDataSamplesView = useStore((s) => s.setDataSamplesView);

  const handleShowDataFeatures = useCallback(async () => {
    await setDataSamplesView(
      showGraphs
        ? DataSamplesView.GraphAndDataFeatures
        : DataSamplesView.DataFeatures
    );
  }, [setDataSamplesView, showGraphs]);

  const handleHideDataFeatures = useCallback(async () => {
    await setDataSamplesView(DataSamplesView.Graph);
  }, [setDataSamplesView]);

  return (
    <>
      {dataSamplesView === DataSamplesView.Graph ? (
        <MenuItem
          onAction={handleShowDataFeatures}
          icon={<Icon as={RiEyeFill} />}
          textValue={intl.formatMessage({ id: "data-features-show-action" })}
        >
          <FormattedMessage id="data-features-show-action" />
        </MenuItem>
      ) : (
        <MenuItem
          onAction={handleHideDataFeatures}
          icon={<Icon as={RiEyeOffFill} />}
          textValue={intl.formatMessage({ id: "data-features-hide-action" })}
        >
          <FormattedMessage id="data-features-hide-action" />
        </MenuItem>
      )}
    </>
  );
};

export default ViewDataFeaturesMenuItem;
