const configuredBasePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const PUBLIC_BASE_PATH = configuredBasePath.replace(/\/$/, "");

export function publicAssetPath(pathname: string): string {
  const normalizedPathname = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${PUBLIC_BASE_PATH}${normalizedPathname}`;
}
