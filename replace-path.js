/* eslint-disable import/no-extraneous-dependencies */
const nodePath = require('path');
const paths = require('tsconfig-paths');
const tsconfig = require('tsconfig-extends');
const Project = require('ts-simple-ast').default;
const _ = require('lodash');

const opts = {
  roots: ['lib'],
  alias: { '@asuna-admin': './' },
};

const handleSourceFile = absoluteBaseUrl => async sourceFile => {
  const importExportDeclarations = [
    ...sourceFile.getImportDeclarations(),
    ...sourceFile.getExportDeclarations(),
  ];
  const sourceFileAbsolutePath = sourceFile.getFilePath();
  let sourceFileWasChanged = false;
  importExportDeclarations.forEach(declaration => {
    // if module seems like absolute
    if (!declaration.isModuleSpecifierRelative()) {
      const value = declaration.getModuleSpecifierValue();
      // console.log('--------------------------------------------', value);
      // try to find relative module for it
      // const absolutePathToDepsModule = matchPathFunc(value, compilerOptions.paths, name => {
      //   console.log({ name });
      //   return false;
      // });

      if (value) {
        const prefix = _.findKey(opts.alias, (v, k) => value.startsWith(k));
        if (prefix) {
          const relativePathToDepsModule = nodePath.join(
            absoluteBaseUrl,
            opts.alias[prefix],
            value.slice(prefix.length + 1),
          );
          // console.log({ prefix, sourceFileAbsolutePath, absolutePathToDepsModule:
          // relativePathToDepsModule, value });

          // and if relative module really exists
          if (relativePathToDepsModule) {
            let resultPath = nodePath.relative(sourceFileAbsolutePath, relativePathToDepsModule);

            if (resultPath) {
              if (resultPath.startsWith('../../')) {
                resultPath = resultPath.slice(3);
              }

              // console.log({ resultPath });
              // replace absolute to relative
              declaration.setModuleSpecifier(resultPath);
              sourceFileWasChanged = true;
            } else {
              console.warn('--->', resultPath);
            }
          }
        }
      }
    }
  });

  if (sourceFileWasChanged) {
    await sourceFile.save();
  }
};

opts.roots.forEach(root => {
  // use `tsconfig-extends` module cause it can recursively apply "extends" field
  const compilerOptions = tsconfig.load_file_sync('./tsconfig.json');
  const absoluteBaseUrl = nodePath.join(process.cwd(), compilerOptions.baseUrl, root);
  // const matchPathFunc = paths.createMatchPath(absoluteBaseUrl, compilerOptions.paths || {});
  const project = new Project({ compilerOptions });

  // console.log({ opts, paths: compilerOptions.paths, absoluteBaseUrl });

  project.addExistingSourceFiles(`./${root}/**/*.{js,ts,tsx}`);
  const sourceFiles = project.getSourceFiles();

  sourceFiles.forEach(handleSourceFile(absoluteBaseUrl));
});
