export default () => {
  const { PORT, ORIGINS, NODE_ENV = 'production' } = process.env;

  const ORIGINS_STR = ORIGINS ?? '';

  return {
    PORT: PORT ?? 3000,
    ORIGINS: ORIGINS_STR.split(',')
      .map((origin) => origin.trim())
      .filter((origin) => origin),
    NODE_ENV,
    IS_PRODUCTION: NODE_ENV === 'production',
  };
};
