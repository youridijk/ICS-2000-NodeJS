const yargs = require('yargs');
const Hub = require('../../dist/kaku/Hub.js')

const argv = yargs
  .option('username', {
    alias: 'u',
    description: 'Parses username',
    type: 'string',
  })
  .option('password', {
    alias: 'p',
    description: 'Parses password',
    type: 'string',
  })
  .option('pull-devices', {
    alias: 'pd',
    description: 'Pulls all connected devices',
    type: 'boolean',
  })
  .option('get-status', {
    alias: 'gs',
    description: 'Gets status from a device based on given entity ID',
    type: 'number',
  })
  .option('change-status', {
    alias: 'cs',
    description: 'Change status from a device based on given entity ID',
    type: 'number',
  })
  .option('function', {
    alias: 'f',
    description: 'Set function [integer] for the device thats changes status',
    type: 'number',
  })
  .option('value', {
    alias: 'v',
    description: 'Set value [integer] for the device thats changes status',
    type: 'number',
  })
  .option('get-on-status', {
    alias: 'gos',
    description: 'Get the ON/OFF status based on given entity ID',
    type: 'number',
  })
  .option('get-brightness', {
    alias: 'gb',
    description: 'Gets brightness based on given entity ID',
    type: 'number',
  })
  .help()
  .alias('help', 'h').argv;

async function main() {

  if (argv.pd) {
    if (!(argv.u && argv.p)) {
      console.log('Please enter your credentials using the username [-u] and password [-p] parameters when using this option.')
      return
    } else {
      console.log(`Pulling Devices...`);
      const hub = new Hub(argv.u, argv.p);
      await hub.login();
      console.log(JSON.stringify(await hub.pullDevices()));
    }
  }
  if (argv.gs) {
    const entity_id = argv.gs;
    console.log(`Getting status for Entity ID ${entity_id}...`);
  }
  if (argv.cs) {
    const entity_id = argv.cs;
    console.log(`Changing status for Entity ID ${entity_id}...`);
  }
  if (argv.f) {
    const changefunction = argv.f;
    console.log(`Function ${changefunction} set!`);
  }
  if (argv.v) {
    const value = argv.v;
    console.log(`Set function value to ${value}.`);
  }
  if (argv.gos) {
    const entity_id = argv.gos;
    console.log(`Getting status of ${entity_id}...`);
  }
  if (argv.gb) {
    const entity_id = argv.gb;
    console.log(`Getting brightness of ${entity_id}...`);
  }
}
main().then();
//console.log(argv);