/** True when `pathname` is the nav item's route or one of its children. */
export function isRouteActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
