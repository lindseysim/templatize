# Changelog

## v2.0.6
**2022-01-15**

* Reformat webpack `output.library` parameters to new standard.
* Add changelog.

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

* Major overhaul completed, splitting as version 2.