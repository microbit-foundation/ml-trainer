/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { RiListSettingsLine } from "react-icons/ri";
import { FormattedMessage, useIntl } from "react-intl";
import { Icon, MenuItem } from "@microbit/ui";

interface SettingsMenuItemProps {
  onOpen: () => void;
}

const SettingsMenuItem = ({ onOpen }: SettingsMenuItemProps) => {
  const intl = useIntl();
  return (
    <MenuItem
      icon={<Icon as={RiListSettingsLine} css={{ h: 5, w: 5 }} />}
      onAction={onOpen}
      textValue={intl.formatMessage({ id: "settings" })}
    >
      <FormattedMessage id="settings" />
    </MenuItem>
  );
};

export default SettingsMenuItem;
