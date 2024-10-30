import {
  Button,
  ButtonGroup,
  Menu,
  MenuItemOption,
  MenuList,
  MenuOptionGroup,
  Portal,
} from "@chakra-ui/react";
import { useCallback } from "react";
import { RiEyeFill, RiEyeOffFill } from "react-icons/ri";
import { FormattedMessage, useIntl } from "react-intl";
import { DataSamplesView } from "../model";
import { useStore } from "../store";
import MoreMenuButton from "./MoreMenuButton";

const DataFeaturesButton = () => {
  const dataSamplesView = useStore((s) => s.settings.dataSamplesView);
  const setDataSamplesView = useStore((s) => s.setDataSamplesView);
  const intl = useIntl();
  const handleViewChange = useCallback(
    (view: string | string[]) => {
      if (typeof view === "string") {
        setDataSamplesView(view as DataSamplesView);
      }
    },
    [setDataSamplesView]
  );
  return (
    <Menu>
      <ButtonGroup isAttached>
        {dataSamplesView !== DataSamplesView.GraphAndDataFeatures ? (
          <Button
            w="200px"
            onClick={() =>
              setDataSamplesView(DataSamplesView.GraphAndDataFeatures)
            }
            variant="secondary"
            leftIcon={<RiEyeFill />}
          >
            <FormattedMessage id="show-data-features-action" />
          </Button>
        ) : (
          <Button
            w="200px"
            onClick={() => setDataSamplesView(DataSamplesView.Graph)}
            variant="secondary"
            leftIcon={<RiEyeOffFill />}
          >
            <FormattedMessage id="hide-data-features-action" />
          </Button>
        )}
        <MoreMenuButton aria-label="data-features-view-more-label" />
        <Portal>
          <MenuList>
            <MenuOptionGroup
              defaultValue={dataSamplesView}
              type="radio"
              onChange={handleViewChange}
            >
              <MenuItemOption value={DataSamplesView.Graph}>
                <FormattedMessage id="data-samples-view-graph-option" />
              </MenuItemOption>
              <MenuItemOption value={DataSamplesView.DataFeatures}>
                <FormattedMessage id="data-samples-view-data-features-option" />
              </MenuItemOption>
              <MenuItemOption value={DataSamplesView.GraphAndDataFeatures}>
                <FormattedMessage id="data-samples-view-graph-and-data-features-option" />
              </MenuItemOption>
            </MenuOptionGroup>
          </MenuList>
        </Portal>
      </ButtonGroup>
    </Menu>
  );
};

export default DataFeaturesButton;
