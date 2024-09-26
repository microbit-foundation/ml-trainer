import {
  Icon,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
} from "@chakra-ui/react";
import { MdMoreVert } from "react-icons/md";
import { FormattedMessage, useIntl } from "react-intl";
import LoadProjectMenuItem from "./LoadProjectMenuItem";
import {
  RiDeleteBin2Line,
  RiDownload2Line,
  RiUpload2Line,
} from "react-icons/ri";
import { useStore } from "../store";

const DataSamplesMenu = () => {
  const intl = useIntl();
  const downloadDataSet = useStore((s) => s.downloadDataset);
  const deleteAllGestures = useStore((s) => s.deleteAllGestures);
  return (
    <Menu>
      <MenuButton
        as={IconButton}
        aria-label={intl.formatMessage({
          id: "content.data.controlbar.button.menu",
        })}
        variant="ghost"
        icon={<Icon as={MdMoreVert} boxSize={10} color="brand.500" />}
        isRound
      />
      <MenuList>
        <LoadProjectMenuItem icon={<RiUpload2Line />} accept=".json">
          <FormattedMessage id="content.data.controlbar.button.uploadData" />
        </LoadProjectMenuItem>
        <MenuItem icon={<RiDownload2Line />} onClick={downloadDataSet}>
          <FormattedMessage id="content.data.controlbar.button.downloadData" />
        </MenuItem>
        <MenuItem icon={<RiDeleteBin2Line />} onClick={deleteAllGestures}>
          <FormattedMessage id="content.data.controlbar.button.clearData" />
        </MenuItem>
      </MenuList>
    </Menu>
  );
};

export default DataSamplesMenu;
