/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import { Ref, forwardRef } from "react";
import { Link as RouterLink, LinkProps as RouterLinkProps } from "react-router";
import { styled } from "@microbit/ui";
import { link } from "styled-system/recipes";

// Adapter to deal with to vs href.
type RouterLinkAdaptedProps = Omit<RouterLinkProps, "to"> & { href: string };

const RouterLinkAdapted = forwardRef(function RouterLinkAdaptedInner(
  { href, ...props }: RouterLinkAdaptedProps,
  ref: Ref<HTMLAnchorElement> | undefined
) {
  return <RouterLink ref={ref} to={href} {...props} />;
});

/** A react-router link styled like the shared-ui Link (same recipe). */
const Link = styled(RouterLinkAdapted, link);

export default Link;
