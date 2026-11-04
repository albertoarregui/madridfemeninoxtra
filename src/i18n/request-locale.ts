import { AsyncLocalStorage } from "node:async_hooks";
import type { SiteLocale } from "./index";

const storage = new AsyncLocalStorage<SiteLocale>();

export function runWithRequestLocale<T>(locale: SiteLocale, callback: () => T): T {
  return storage.run(locale, callback);
}

export function getRequestLocale(): SiteLocale {
  return storage.getStore() ?? "es";
}
