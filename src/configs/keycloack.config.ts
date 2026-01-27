export default () => {
  const { JWKS_URI, USERINFO_URI } = process.env;

  if (!JWKS_URI) throw Error("Required env variable: JWKS_URI");
  if (!USERINFO_URI) throw Error("Required env variable: USERINFO_URI");

  return {
    JWKS_URI:
      JWKS_URI!,
    USERINFO_URI: USERINFO_URI!,
  };
};
