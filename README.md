# OpenAPI Client

Generate ES6 or Typescript service integration code from an OpenAPI spec.

Also supports optional Redux action creator generation.

Tested against JSON services.

## Install

In your project

    npm install openapi-client --save-dev

Or globally to run CLI from anywhere

    npm install openapi-client -g

## Usage

### CLI

    Usage: openapi [options]
 
    Options:
 
      -h, --help              output usage information
      -V, --version           output the version number
      -s, --src <url|path>    The url or path to the Open API spec file
      -o, --outDir <dir>      The path to the directory where files should be generated
      -l, --language <js|ts>  The language of code to generate
      --redux                 True if wanting to generate redux action creators

### Code

    const openapi = require('openapi-client')
    openapi.genCode({
      src: 'http://petstore.swagger.io/v2/swagger.json',
      outDir: './src/service',
      language: 'ts',
      redux: true
    })
    .then(complete, error)

    function complete(spec) {
      console.info('Service generation complete')
      process.exit(0)
    }

    function error(e) {
      const msg = (e instanceof Error) ? e.message : e
      console.error(msg)
      process.exit(1)
    }
