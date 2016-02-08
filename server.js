'use strict';

exports.run = run;

function run(cluster) {
    require('./app/server').run(cluster);
}

run();
