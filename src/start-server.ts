import {Hub, RESTServer} from './index';
import {parseArgs} from 'node:util';
import e from 'express';

async function main() {
  const {
    values: {email, password, port},
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
    },
  });

  let portNumber = port ? Number(port) : null;

  if (email && !password) {
    return console.log('Password is required when email is provided');
  }

  if (!email && password) {
    return console.log('Email is required when password is provided');
  }

  if (portNumber && isNaN(portNumber)) {
    return console.log('Port needs to a number, not ' + port)
  }

  let hub: Hub | undefined;

  if (email && password) {
    hub = new Hub(email, password);
  }

  const server = new RESTServer(hub);

  try {
    portNumber ??= 8080;
    await server.setup();
    await server.listen(portNumber);
    console.log('Server started on port ' + portNumber);
  } catch (error) {
    console.log(`${error}`);
  }
}

main().then()
