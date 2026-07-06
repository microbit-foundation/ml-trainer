/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { IoMdGlobe } from "react-icons/io";
import { FormattedMessage, useIntl } from "react-intl";
import { Icon, MenuItem } from "../shared-ui";

interface LanguageMenuItemProps {
  onOpen: () => void;
}

const LanguageMenuItem = ({ onOpen }: LanguageMenuItemProps) => {
  const intl = useIntl();
  return (
    <MenuItem
      icon={<Icon as={IoMdGlobe} css={{ h: 5, w: 5 }} />}
      onAction={onOpen}
      textValue={intl.formatMessage({ id: "language" })}
    >
      <FormattedMessage id="language" />
    </MenuItem>
  );
};

export default LanguageMenuItem;
