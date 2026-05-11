import { parseBoolean } from "src/common/utils/functions";
import { CLEANUP_INTERVAL_MS_DEFAULT, SESSION_TTL_MS_DEFAULT } from "./constants";

export default () => {
  const { SESSION_SECRET, CLEANUP_INTERVAL_MS, SESSION_TTL_MS, NO_SECURE_SESSION } = process.env;

  if (!SESSION_SECRET) throw Error('Required env variable: SESSION_SECRET');

  return {
    SESSION_SECRET,
    NO_SECURE_SESSION: parseBoolean(NO_SECURE_SESSION),
    CLEANUP_INTERVAL_MS: CLEANUP_INTERVAL_MS ? Math.max(parseInt(CLEANUP_INTERVAL_MS), CLEANUP_INTERVAL_MS_DEFAULT) : CLEANUP_INTERVAL_MS_DEFAULT,
    SESSION_TTL_MS: SESSION_TTL_MS ? Math.max(parseInt(SESSION_TTL_MS), SESSION_TTL_MS_DEFAULT) : SESSION_TTL_MS_DEFAULT,
  };
};
