const fs = require('fs');
const packageJson = require('../package.json');

const version = packageJson.version;
const versionFileContent = `
export default () => ({
  APP_VERSION: "${version}"
})
`;

fs.writeFile('./src/configs/version.config.ts', versionFileContent, (err) => {
  if (err) {
    return console.log('Error escribiendo el archivo de versión:', err);
  }
  console.log('Archivo de versión generado correctamente');
});

const dockerDemosFileContent = `
FROM ghcr.io/kaytrust/demo-acme-frutas-back:${version}
`;

fs.writeFile('./Dockerfile-demos', dockerDemosFileContent, (err) => {
  if (err) {
    return console.log('Error escribiendo el archivo Dockerfile-demos:', err);
  }
  console.log('Archivo Dockerfile-demos generado correctamente');
});