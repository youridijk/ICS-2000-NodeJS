import {Hub, RESTServer} from './index';
import {parseArgs} from 'node:util';
import loadEnv from './loadEnv';

async function main() {
  let {
    // eslint-disable-next-line prefer-const
    values: {email, password, port, useEnv, sendLocal, backUpIP},
  } = parseArgs({
    options: {
      email: {
        type: 'string',
        short: 'e',
      },
      password: {
        type: 'string',
        short: 'p',
      },
      port: {
        type: 'string',
      },
      useEnv: {
        type: 'boolean',
      },
      sendLocal: {
        type: 'boolean',
      },
      backUpIP: {
        type: 'string',
        short: 'i',
      },
    },
  });

  if (useEnv) {
    loadEnv();
    email = process.env.EMAIL;
    password = process.env.PASSWORD;
    port = process.env.PORT;
    sendLocal = process.env.SENDLOCAL === 'true';
    backUpIP = process.env.BACKUPIP;
  }

  let portNumber = port ? Number(port) : null;

  if (email && !password) {
    return console.log('Password is required when email is provided');
  }

  if (!email && password) {
    return console.log('Email is required when password is provided');
  }

  if (portNumber && isNaN(portNumber)) {
    return console.log('Port needs to a number, not ' + port);
  }
  const singleUserMode = email != null && password != null;
  sendLocal ??= singleUserMode;

  let hub: Hub | undefined;
  if (singleUserMode) {
    hub = new Hub(email!, password!, [], backUpIP);
  }

  const server = new RESTServer(sendLocal, hub);

  try {
    portNumber ??= 8080;
    await server.setup();
    await server.listen(portNumber);
    console.log('Server started on port ' + portNumber);
    console.log(`Current mode: ${singleUserMode ? 'single user' : 'multi user'} `);
  } catch (error) {
    console.log(`${error}`);
  }
}

main().then();
