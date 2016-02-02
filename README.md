# pool-stack

[![Build Status][travis-image]][travis-url]
[![Dependency Status][dep-image]][dep-url]
[![Dev Dependency Status][dev-dep-image]][dev-dep-url]

[travis-image]: https://travis-ci.org/iromu/pool-stack.svg?branch=badges
[travis-url]: https://travis-ci.org/iromu/pool-stack

[dep-image]: https://david-dm.org/iromu/pool-stack.svg
[dep-url]: https://david-dm.org/iromu/pool-stack#info=dependencies&view=table

[dev-dep-image]: https://david-dm.org/iromu/pool-stack/dev-status.svg
[dev-dep-url]: https://david-dm.org/iromu/pool-stack#info=devDependencies&view=table


This project runs a RESTful server, providing endpoints for acquiring and releasing "locks" over a pool of "resources".
See `test/routes/pool.js` for the full set of implemented endpoints.


## API

For seeding pools, call (update with PUT)

    POST /pool with payload {"A":["1","2","3","4"]}
        should return {"A":["1","2","3","4"]}
        
For acquiring a lock, call

    POST /pool/A/lock
        should return "4"

Next lock call, will result in     
    
    POST /pool/A/lock
        should return "3"
         
Release the lock over the resource "4" from pool "A"

    DELETE /pool/A/lock/4
        should return 200 (Ok)
         
The lock ownership is optimistic within this api, and a purge mechanism can be implemented, 
with only knowing the resource and pool name.
        
## What's for

### Microcontrollers. Internet of Things, mesh networks

Leverages the use of the Pessimistic Locking pattern for low powered devices, without external libraries.
Arduino, Trinket, ESP8266,..
Pools can represent sensor buckets, and the locking can be orchestated from any peer.

### Resource Locking. Continous Integration, Delivery, Provisioning

With the only dependency of having an HTTP client (curl or wget), this project brings traditional database-like locking,
 to plain scripts.
A resource pool can be share between any number of clients, ensuring concurrent safe access.

## What's included

This project uses:

- [config](https://github.com/lorenwest/node-config) and [json5](
  http://json5.org) for configuration
- [bunyan](https://github.com/trentm/node-bunyan) for logging
- [mocha](http://visionmedia.github.io/mocha/) and [supertest](
  https://github.com/visionmedia/supertest) for testing
- [cluster](http://nodejs.org/docs/latest/api/cluster.html) for managing workers
- [redis](http://redis.io) for caching and storing data
- [bluebirdjs](http://bluebirdjs.com) as Promise API for Async code.

## Installing

Run `npm --production install` for installing all requisites.
As external dependencies, a running redis instance and nodejs installation with build support on target machine (hiredis).

## Configuring

See `config/default.json5` for a sample to get you started. If you need to
change any defaults, make a copy named `local.json5` and change it to your
liking.

If you want to have different configuration properties for different
environments, create configuration files named after the environments they are
for. For example, to create a configuration file that will be used when
`NODE_ENV` is `development`, create `development.json5`.

If you want to configure your running instances with enviroment variables only. Use:

    #!/usr/bin/env bash
    export NODE_CONFIG=$(cat <<EOF
    {  
      "server": {  
        "port": 31678, 
        "cluster": false 
      }, 
      "redis": {  
        "url" : "redis://redis-master.local:6379/1",  
        "prefix": "pool-ci:",  
        "purgeOnLoad": true  
      },  
      "logging": {  
        "dir": "logs",  
        "level": "warn"  
      } 
    }
    EOF
    )


## Starting and stopping

Running `npm start` will start the server using [forever](
https://github.com/nodejitsu/forever), and running `npm stop` will stop it.
`npm run-script status` will list the forever processes that are running.

## Testing

Running `npm test` will execute the tests in the `test` directory using mocha.

See more build tasks inside `package.json` file.

Run coverage reports.

    npm run coverage
    ./node_modules/.bin/istanbul report cobertura --root coverage --dir cobertura

Hold build artifacts on CI

    #!/usr/bin/env bash
    set -o pipefail
    rm *.tgz
    set +o pipefail
    npm pack
    
    