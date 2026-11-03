import { fromNextHandler } from '../../../lib/next-handler';
// @ts-expect-error untyped JS module ported from the SkyJo repo
import handler from '../../../games/skyjo/api-games.js';

export const prerender = false;
export const ALL = fromNextHandler(handler);
