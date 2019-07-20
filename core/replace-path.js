/* eslint-disable import/no-extraneous-dependencies,no-console */
const nodePath = require('path');
// const paths = require('tsconfig-paths');
const tsconfig = require('tsconfig-extends');
const Project = require('ts-morph').default;
const _ = require('lodash');

const opts = {
  roots: ['dist'],
  alias: { '@asuna-admin': './' },
};

let importExportCounts = 0;

const handleSourceFile = absoluteBaseUrl => async sourceFile => {
  // console.log({ sourceFile, importDeclarations: sourceFile.getImportDeclarations(), exportDeclarations: sourceFile.getExportDeclarations() });
  const importExportDeclarations = [
    ...sourceFile.getImportDeclarations(),
    ...sourceFile.getExportDeclarations(),
  ];
  importExportCounts += importExportDeclarations.length;
  const sourceFileAbsolutePath = sourceFile.getFilePath();
  // console.log({ importExportDeclarations });
  // console.log('source:', sourceFileAbsolutePath);
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
          // console.log({
          //   prefix,
          //   sourceFileAbsolutePath,
          //   absolutePathToDepsModule: relativePathToDepsModule,
          //   value,
          // });

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

  // console.log({ opts, paths: compilerOptions.paths, absoluteBaseUrl, search: `./${root}/**/*.{js,jsx,ts,tsx}` });

  project.addExistingSourceFiles(`./${root}/**/*.{js,jsx,ts,tsx}`);
  const sourceFiles = project.getSourceFiles();

  sourceFiles.forEach(handleSourceFile(absoluteBaseUrl));

  if (importExportCounts === 0) {
    console.warn('compile:replace-path may not works with commonjs.');
  }
});
