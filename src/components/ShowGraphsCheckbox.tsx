/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { Checkbox } from "@microbit/ui";
import { useCallback } from "react";
import { FormattedMessage } from "react-intl";
import { DataSamplesView } from "../model";
import { useStore } from "../store";

const ShowGraphsCheckbox = () => {
  const { dataSamplesView, showGraphs } = useStore((s) => s.settings);
  const setDataSamplesView = useStore((s) => s.setDataSamplesView);
  const setShowGraphs = useStore((s) => s.setShowGraphs);

  const handleShowGraphOnChange = useCallback(
    async (isChecked: boolean) => {
      await setShowGraphs(isChecked);
      await setDataSamplesView(
        isChecked
          ? DataSamplesView.GraphAndDataFeatures
          : DataSamplesView.DataFeatures
      );
    },
    [setDataSamplesView, setShowGraphs]
  );

  return (
    <>
      {dataSamplesView !== DataSamplesView.Graph && (
        <Checkbox isSelected={showGraphs} onChange={handleShowGraphOnChange}>
          <FormattedMessage id="show-graphs-checkbox-label-text" />
        </Checkbox>
      )}
    </>
  );
};

export default ShowGraphsCheckbox;
