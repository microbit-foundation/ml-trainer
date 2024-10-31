import { Button, Checkbox, HStack } from "@chakra-ui/react";
import { useCallback, useState } from "react";
import { RiEyeFill, RiEyeOffFill } from "react-icons/ri";
import { FormattedMessage } from "react-intl";
import { DataSamplesView } from "../model";
import { useStore } from "../store";

const DataSampleViewControls = () => {
  const dataSamplesView = useStore((s) => s.settings.dataSamplesView);
  const setDataSamplesView = useStore((s) => s.setDataSamplesView);
  const [isShowGraphChecked, setIsShowGraphChecked] = useState<boolean>(true);

  const handleShowGraphOnChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const isChecked = e.target.checked;
      setIsShowGraphChecked(isChecked);
      setDataSamplesView(
        isChecked
          ? DataSamplesView.GraphAndDataFeatures
          : DataSamplesView.DataFeatures
      );
    },
    [setDataSamplesView]
  );

  const handleShowDataFeatures = useCallback(() => {
    setDataSamplesView(
      isShowGraphChecked
        ? DataSamplesView.GraphAndDataFeatures
        : DataSamplesView.DataFeatures
    );
  }, [isShowGraphChecked, setDataSamplesView]);

  const handleHideDataFeatures = useCallback(() => {
    setDataSamplesView(DataSamplesView.Graph);
  }, [setDataSamplesView]);

  return (
    <HStack gap={3}>
      {dataSamplesView !== DataSamplesView.Graph && (
        <Checkbox
          isChecked={isShowGraphChecked}
          onChange={handleShowGraphOnChange}
        >
          {/* TODO: Add to translation */}
          <FormattedMessage id="Show graphs" />
        </Checkbox>
      )}
      {dataSamplesView === DataSamplesView.Graph ? (
        <Button
          w="200px"
          onClick={handleShowDataFeatures}
          variant="secondary"
          leftIcon={<RiEyeFill />}
        >
          <FormattedMessage id="show-data-features-action" />
        </Button>
      ) : (
        <Button
          w="200px"
          onClick={handleHideDataFeatures}
          variant="secondary"
          leftIcon={<RiEyeOffFill />}
        >
          <FormattedMessage id="hide-data-features-action" />
        </Button>
      )}
    </HStack>
  );
};

export default DataSampleViewControls;
