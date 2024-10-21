import {
  Icon,
  IconButton,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
  Portal,
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
import { useLogging } from "../logging/logging-hooks";
import { useCallback } from "react";
import { getTotalNumSamples } from "../utils/gestures";

const DataSamplesMenu = () => {
  const intl = useIntl();
  const logging = useLogging();
  const gestures = useStore((s) => s.gestures);
  const downloadDataset = useStore((s) => s.downloadDataset);
  const handleDownloadDataset = useCallback(() => {
    logging.event({
      type: "dataset-save",
      detail: {
        actions: gestures.length,
        samples: getTotalNumSamples(gestures),
      },
    });
    downloadDataset();
  }, [downloadDataset, gestures, logging]);
  const deleteAllGestures = useStore((s) => s.deleteAllGestures);
  const handleDeleteAllGestures = useCallback(() => {
    logging.event({
      type: "dataset-delete",
    });
    deleteAllGestures();
  }, [deleteAllGestures, logging]);
  return (
    <Menu>
      <MenuButton
        as={IconButton}
        aria-label={intl.formatMessage({
          id: "data-actions-menu",
        })}
        variant="ghost"
        icon={<Icon as={MdMoreVert} color="gray.800" boxSize={7} />}
        isRound
      />
      <Portal>
        <MenuList>
          {/* TODO: Add data features view toggling */}
          <MenuDivider />
          <LoadProjectMenuItem icon={<RiUpload2Line />} accept=".json">
            <FormattedMessage id="import-data-samples-action" />
          </LoadProjectMenuItem>
          <MenuItem icon={<RiDownload2Line />} onClick={handleDownloadDataset}>
            <FormattedMessage id="download-data-samples-action" />
          </MenuItem>
          <MenuItem
            icon={<RiDeleteBin2Line />}
            onClick={handleDeleteAllGestures}
          >
            <FormattedMessage id="delete-data-samples-action" />
          </MenuItem>
        </MenuList>
      </Portal>
    </Menu>
  );
};

export default DataSamplesMenu;
