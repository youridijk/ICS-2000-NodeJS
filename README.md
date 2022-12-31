# ICS-2000 client for NodeJS

Control your KAKU devices connected to the ICS-2000 with this library. If you already have the ICS-2000 and don't have
or want Zigbee / 443MHz sender receiver hardware and still want to control your devices using JS, it's possible with
this library.

This library supports communication locally (talking direct to the ICS-2000) and remote (through the servers of Trust)

## Example usage

```ts
const hub = new Hub('your KAKU account e-mail', 'your password');

// Login to get AES key anc MAC-address of your ICS-2000
// Required for almost everything
await hub.login();

await hub.getAllDeviceStatuses();

// Get all devices stored on your account and find the local IP-address of your ICS-2000 
await hub.discoverDevices();

// Turn device on with entity id 12345
await hub.turnDeviceOnOff(12345, true, 1, false, true);

// Easier way:
const device = hub.devices.find(device => device.name === "My device name");
await device.turnOn();
await device.turnOff();

// Dim to maximal level
await device.dim(255)

// Change color temperature to half of maximal level
await device.changeColorTemperature(300);
```

By default, all commands are sent directly to the ICS-2000. If you want to send it through the servers of Trust, pass a
boolean as extra argument that says whether command should be sent directly to the ICS-2000 or through the servers of
Trust.

```ts
const hub = new Hub('your KAKU account e-mail', 'your password');
await hub.login();
await hub.getAllDeviceStatuses();
await hub.discoverDevices();

// Easier way:
const device = hub.devices.find(device => device.name === "My device name");

// Turn of and off through the servers of Trust
await device.turnOn(false);
await device.turnOff(false);

// Dim to maximal level using the servers of Trust
await device.dim(255, false)

// Change color temperature to half of maximal level using the servers of Trust
await device.changeColorTemperature(300, false);
```

## Locally VS cloud

Locally is faster as your command doesn't leave the network. But locally only works when connected to your LAN. If you
want to send the commands from any other network, you need to send the commands through the servers of Trust (the
company behind the brand Klik Aan Klik Uit).

## REST server

A REST server written with Express.js is included in this library. It provides an easy way to communicate with your
ICS-2000. To build it, clone this repo and run the following commands once in the folder of this repo:

```shell
npm install
npm run build
```

To start the server, run the following:

```shell
npm run start:server -- 'e-mail' 'password'
```

Optionally, provide a port (default port is 8080):

```shell
npm run start:server -- 'e-mail' 'password' '8888'
```

Note that the server only supports controlling devices connected to the account you provided the credentials for when
you started the server.


### Docker
A Docker-image is provided to run the REST server in a Docker container  
