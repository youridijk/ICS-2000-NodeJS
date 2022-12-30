import {Hub, RESTServer} from './index';
import {parseArgs} from 'node:util';
import loadEnv from './loadEnv';

async function main() {
  let {
    // eslint-disable-next-line prefer-const
    values: {email, password, port, useEnv},
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
        short: 'p',
      },
      useEnv: {
        type: 'boolean',
      },
    },
  });

  if (useEnv) {
    loadEnv();
    email = process.env.EMAIL;
    password = process.env.PASSWORD;
    port = process.env.PORT;
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

  let hub: Hub | undefined;

  const singleUserMode = email && password;

  if (singleUserMode) {
    hub = new Hub(email!, password!);
  }

  const server = new RESTServer(hub);

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
