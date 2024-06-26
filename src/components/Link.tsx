import {
  Link as RouterLink,
  LinkProps as RouterLinkProps,
} from "react-router-dom";
import { chakra } from "@chakra-ui/react";
import { Ref, forwardRef } from "react";

// Adapter to deal with to vs href.
type RouterLinkAdaptedProps = Omit<RouterLinkProps, "to"> & { href: string };

const RouterLinkAdapted = forwardRef(function RouterLinkAdaptedInner(
  { href, ...props }: RouterLinkAdaptedProps,
  ref: Ref<HTMLAnchorElement> | undefined
) {
  return <RouterLink ref={ref} to={href} {...props} />;
});

// https://chakra-ui.com/docs/components/link
const Link = chakra<typeof RouterLinkAdapted, RouterLinkAdaptedProps>(
  RouterLinkAdapted,
  {
    shouldForwardProp: (prop) => ["href", "target", "children"].includes(prop),
  }
);

export default Link;
