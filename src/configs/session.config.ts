export default () => {
  const { SESSION_SECRET } = process.env;

  if (!SESSION_SECRET) throw Error('Required env variable: SESSION_SECRET');

  return {
    SESSION_SECRET,
  };
};
