# Changelog

## v2.3.0
**2023-02-02**

* Better handling of hybrid ES6/CommonJS modes.
    * Distributables moved to /dist folder with extra types.
    * Default NPM package points to source.
    * Fallback NPM package points to CommonJS distributable.
* Bump minor version as importation of scripts may break for direct file sourcing. 

## v2.2.1
**2023-01-25**

* Split modes for ES6, CommonJS, and global importing.
    * Adjust webpack config and output based on env.
    * NPM package definition for `main` and `module`.

## v2.2.0
**2023-01-24**

* New features:
    * Support for partials.
    * Support for sections passed as context.
    * Support for chaining functions.
* Readme edits.
* Clean-up options handling.
* Clean-up node class constructors and handling.
* Reworked context handling and hierarchy tracking.
    * Split context object into own class.
    * Unresolved checks for passed-to function(s).
    * Recursing outside-in rendering for sections preserves node hierarchy.
* Make package an ES6 module.
    * Last holdout was updating webpack config.
* While backwards compatible, significant changes to internal workings, bump as minor update.

## v2.1.1
**2023-01-11**

* Update libraries: 
    * `@babel/core` (7.20.12)
    * `@babel/preset-env` (7.20.2)
    * `babel-loader` (9.1.2)
    * `webpack` (5.75)
    * `webpack-cli` (5.0.1)
* Readme edits.
* Update overflow limit to 99.

## v2.1.0
**2022-01-15**

* Reformat webpack `output.library` parameters to new standard.
* Add changelog.
* Pretty stable as this point, bump as minor update.

## v2.0.5
**2022-01-13**

* Update libraries: 
    * `@babel/core` (7.16.7)
    * `@babel/preset-env` (7.16.8)
    * `babel-loader` (8.2.3)
    * `webpack` (5.66.0)
    * `webpack-cli` (4.9.1)
    * `d3-format` (3.1.0)
* Specify `globalObject` as `"this"` in webpack output parameters. Ensures library will load correctly in node environment as well as web.
* Readme revisions

## v2.0.4
**2021-12-30**

* Update library: `caniuse`.
* Ensure option renamed/refactored `handleMissingTags` => `errorOnMissingTags`.
* Properly pass function error handler to search and eval functions.

## v2.0.3
**2021-08-03**

* Update libraries: 
    * `@babel/core` (7.14.8)
    * `@babel/preset-env` (7.14.9)
    * `webpack` (5.48.0)
    * `webpack-cli` (4.7.2)
    * `d3-format` (3.0.1)
* Major readme revision.

## v2.0.2
**2021-03-25**

* Fix domain search bug (prefix iteration was bad). 
* Add permanent `prefixlen` var in `Domain`.
* Search dynamics in reverse order when searching context.

## v2.0.1
**2021-03-25**

* Fix bug with repeating section (was not piecing array properly).

## v2.0.0
**2021-03-25**

* Major overhaul completed, fairly stable, splitting as v2.0.0.
