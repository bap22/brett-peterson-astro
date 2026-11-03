// SkyJo's original store API, backed by the site's shared store under the "skyjo" prefix.
import { createStore } from '../../lib/kv';

const store = createStore('skyjo');

export const storeGet = (key) => store.get(key);
export const storeSet = (key, value, exSeconds = 3600 * 6) => store.set(key, value, exSeconds);
export const storeDel = (key) => store.del(key);
export const storeKeys = (pattern) => store.keys(pattern);
