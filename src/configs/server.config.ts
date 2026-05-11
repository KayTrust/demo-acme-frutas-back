import { parseBoolean } from 'src/common/utils/functions';

export default () => {
  const { PORT, ORIGINS, FORCE_HTTPS, NODE_ENV = 'production', SERVER_BASE_URL = '', NO_TRUST_PROXY = true } = process.env;

  const ORIGINS_STR = ORIGINS ?? '';

  const IS_PRODUCTION = NODE_ENV === 'production';

  return {
    PORT: PORT ?? 3000,
    ORIGINS: ORIGINS_STR.split(',')
      .map((origin) => origin.trim())
      .filter((origin) => origin),
    NODE_ENV,
    IS_PRODUCTION,
    NO_TRUST_PROXY: parseBoolean(NO_TRUST_PROXY),
    SERVER_BASE_URL: SERVER_BASE_URL.replace(/\/+$/, ''),
    FORCE_HTTPS: parseBoolean(FORCE_HTTPS)
  };
};
