import {URLSearchParams} from 'url';
import Cryptographer from './Cryptographer';
import * as dgram from 'dgram';
import Command from './Command';
import * as fs from 'fs';
import DimDevice from './entities/DimDevice';
import DeviceData from './model/DeviceData';
import axios from 'axios';
import SmartMeterDataCurrent from './model/SmartMeterDataCurrent';
import ColorTemperatureDevice from './entities/ColorTemperatureDevice';
import DeviceConfig from './model/DeviceConfig';
import deviceConfigs from './DeviceConfigs';
import SwitchDevice from './entities/SwitchDevice';
import SmartMeterData, {Precision} from './model/SmartMeterData';
import {EntityType, Entity_Type} from './model/EntityType';
import Scene from './entities/Scene';
import Device from './entities/Device';
import Entity from './entities/Entity';

// Set base url for all axios requests
axios.defaults.baseURL = 'https://trustsmartcloud2.com/ics2000_api';

/**
 * A class that represents the ICS-2000 hub
 */
export default class Hub {
  private aesKey?: string;
  private hubMac?: string;
  public devices: Device[] = [];
  private localAddress?: string;
  public readonly deviceStatuses: Map<number, number[]> = new Map<number, number[]>();
  private p1EntityId?: number;
  public readonly deviceConfigs: Record<number, DeviceConfig>;

  /**
   * Creates a Hub for easy communication with the ics-2000
   * @param email Your e-mail of your KAKU account
   * @param password Your password of your KAKU account
   * @param entityBlacklist A list of entityID's you don't want to appear in HomeKit
   * @param localBackupAddress Optionally, you can pass the ip address of your ics-2000
   * in case it can't be automatically found in the network
   * @param deviceConfigsOverrides An object used to pass custom device configs.
   * This object will be merged with the existing configs, but these configs will override existing configs.
   */
  constructor(
    private readonly email: string,
    private readonly password: string,
    private readonly entityBlacklist: number[] = [],
    private readonly localBackupAddress?: string,
    deviceConfigsOverrides: Record<number, DeviceConfig> = {},
  ) {
    this.localAddress = localBackupAddress;
    this.deviceConfigs = {...deviceConfigs, ...deviceConfigsOverrides};

    if (!email || !password) {
      throw new Error('Email and/ or password missing');
    }
  }

  /**
   * Login on the KAKU server and fetch the AES key and ics-2000 mac address stored on you account
   */
  public async login() {
    const params = new URLSearchParams({
      action: 'login',
      email: this.email,
      password_hash: this.password,
      device_unique_id: 'android',
      platform: '',
      mac: '',
    });

    const request = await axios.post('/account.php', params.toString())
      .catch(error => {
        if (error.response.status === 401) {
          throw new Error('Username/ password combination incorrect');
        }
        throw new Error(error.response.data[0]);
      });

    const responseJson = request.data;

    if (responseJson['homes'].length > 0) {
      const home = responseJson['homes'][0];
      this.aesKey = home['aes_key'];
      this.hubMac = home['mac'];
    } else {
      throw new Error(responseJson);
    }
  }

  /**
   * Method used in map functions to decrypt a list of data from the cloud
   * @param data The data where data and status needs to be decrypted
   * @param decryptData  A boolean which indicates whether you want to decrypt the data or not
   * @param decryptStatus A boolean which indicates whether you want to decrypt the status or not
   * @private
   */
  private formatDeviceData(data: object, decryptData: boolean, decryptStatus: boolean) {
    if (decryptData) {
      const decryptedData = Cryptographer.decryptBase64(data['data'], this.aesKey!);
      data['data'] = JSON.parse(decryptedData);
    }

    if (decryptStatus && data['status'] != null) {
      const decryptedStatus = Cryptographer.decryptBase64(data['status'], this.aesKey!);
      data['status'] = JSON.parse(decryptedStatus);
    }

    return data;
  }

  /**
   * Fetches the list of devices, rooms, etc., from the KAKU cloud and decrypts the status and data
   * @param decryptData A boolean which indicates whether you want to decrypt the data or not
   * @param decryptStatus A boolean which indicates whether you want to decrypt the status or not
   */
  public async getRawDevicesData(decryptData: boolean, decryptStatus: boolean) {
    if (!this.aesKey || !this.hubMac) {
      throw new Error('Hub mac address or aes key undefined');
    }

    const params = new URLSearchParams({
      action: 'sync',
      email: this.email,
      mac: this.hubMac!,
      password_hash: this.password,
      home_id: '',
    });

    const response = await axios.post('/gateway.php', params.toString());

    const devicesData = await response.data;
    // console.log(devicesData);

    if (decryptData || decryptStatus) {
      // Decrypt the data for every object in the data (scenes, rooms, groups and devices are all in this list)
      devicesData.map(d => this.formatDeviceData(d, decryptData, decryptStatus));
    }

    return devicesData;
  }

  public async getRawDeviceStatuses(decryptData: boolean, decryptStatus: boolean) {
    const deviceIds: number[] = this.devices.map(device => Number(device.entityId));
    const idsString = `[${deviceIds}]`;

    const params = new URLSearchParams({
      'action': 'get-multiple',
      'email': this.email,
      'mac': this.hubMac!,
      'password_hash': this.password,
      'home_id': '',
      'entity_id': idsString,
    });

    const response = await axios.post('/entity.php', params.toString());
    const statusList: object[] = response.data;

    if (statusList.length === 0) {
      throw new Error(`Unknown error while fetching device statuses, response json: ${statusList}`);
    }

    return statusList.map(d => this.formatDeviceData(d, decryptData, decryptStatus));
  }

  public async getScenes(entitiesData?: object[]): Promise<Scene[]> {
    // Status of scene is not imported so not decrypting it
    if (!entitiesData) {
      entitiesData = await this.getRawDevicesData(true, false);
    }

    const scenes = entitiesData!.filter(entity => 'scene' in entity['data'] && !this.entityBlacklist.includes(entity['id']));

    return scenes.map(s => new Scene(this, s as DeviceData, 'scene'));
  }


  /**
   * Pulls the list of devices connected to your ics-2000 from the serer
   * Stores the list of devices in this class and returns it
   */
  public async getDevices(entitiesData?: object[]) {
    // Status will later be decrypted, because fewer data needs to be decrypted
    if (!entitiesData) {
      entitiesData = await this.getRawDevicesData(true, false);
    }

    const hubCopy = Object.assign({}, this);
    hubCopy.devices = [];

    const devices = entitiesData!.filter(device => {
      const deviceId = Number(device['id']);
      const data = device['data'];

      if (this.entityBlacklist.includes(deviceId)) {
        return false;
      }

      // console.log( device['data']['module']['device']);
      device['isGroup'] = 'group' in data;
      // Check if entry is a device or a group
      if ('module' in data && 'info' in data['module']) {
        // In my case, there are some devices in this list that are deleted and not shown in the app
        // So we need to filter this out
        // The sum of all values in the info array is always greater than 0 if device exist
        const functionSum = data['module']['info'].reduce((a, b) => a + b, 0);
        return functionSum > 0;
      } else if ('group' in data) {
        // change group key name to module so a group is treated as a device
        device['data']['module'] = device['data']['group'];
        delete device['data']['group'];
        return true;
      }

      return false;
    });

    this.devices = devices.map(device => {
      device['name'] = device['data']['module']['name'];
      device['device'] = device['data']['module']['device'];
      const deviceType = device['device'];

      const deviceConfig = this.deviceConfigs[deviceType];

      if (!deviceConfig) {
        // Should be Device but changing it would cause issues with homebridge plugin
        return new SwitchDevice(this, device as DeviceData, {modelName: 'Unknown device type', onOffFunction: 0});
      }

      if (deviceConfig.colorTemperatureFunction != null) {
        return new ColorTemperatureDevice(this, device as DeviceData, deviceConfig);
      }

      if (deviceConfig.dimFunction != null) {
        return new DimDevice(this, device as DeviceData, deviceConfig);
      }

      if (deviceConfig.onOffFunction != null) {
        return new SwitchDevice(this, device as DeviceData, deviceConfig);
      }

      return new Device(this, device as DeviceData, deviceConfig);
    });

    return this.devices;
  }

  /**
   * Get a list of all devices and scenes
   */
  public async getDevicesAndScenes(): Promise<Entity[]> {
    const entitiesData = await this.getRawDevicesData(true, false);
    const scenes = await this.getScenes(entitiesData);
    const devices = await this.getDevices(entitiesData);
    return [...scenes, ...devices];
  }

  /**
   * Search in you local network for the ics-2000. The ics-2000 listens to a broadcast message, so that's the way we find it out
   * @param searchTimeout The amount of milliseconds you want to wait for an answer on the sent message, before the promise is rejected
   * @param message The message sent to the ics-2000 to discover it in HEX string format. Defaults to self discovered message
   */
  public async discoverHubLocal(searchTimeout = 10_000, message?: string) {
    return new Promise<{ address: string; isBackupAddress: boolean }>((resolve, reject) => {
      const messageBuffer = Buffer.from(
        message ?? '010003ffffffffffffca000000010400044795000401040004000400040000000000000000020000003000',
        'hex',
      );
      const client = dgram.createSocket('udp4');

      const timeout = setTimeout(() => {
        client.close();
        if (this.localBackupAddress) {
          resolve({address: this.localBackupAddress!, isBackupAddress: true});
        } else {
          reject('Searching hub timed out and no backup IP-address specified!');
        }
      }, searchTimeout);

      client.on('message', (msg, peer) => {
        client.close();
        clearTimeout(timeout);
        this.localAddress = peer.address;
        resolve({address: peer.address, isBackupAddress: false});
      });

      client.bind(() => client.setBroadcast(true));

      client.send(messageBuffer, 2012, '255.255.255.255');
    });
  }


  /**
   * Creates a command using the hub mac address and AES-key stored in this hub. Example for turning on a switch: function: 0, value: 1
   * @param deviceId The id of the device you want to run a function on
   * @param deviceFunction The function you want to run on the device
   * @param value The value for the function
   * @param entityType The entityType used for the command
   */
  public createCommand(deviceId: number, deviceFunction: number, value: number, entityType: EntityType): Command {
    let deviceFunctions: number[] = [];

    if (entityType === 'group') {
      deviceFunctions = this.deviceStatuses.get(deviceId)!;
    }

    return new Command(this.hubMac!, deviceId, deviceFunction, value, this.aesKey!, entityType, deviceFunctions);
  }

  /**
   * Sends a command to the ICS-2000 directly or through the cloud
   * @param command The command you want to send
   * @param sendLocal Whether you want to send the command directly or through the cloud
   */
  public async sendCommand(command: Command, sendLocal: boolean): Promise<void> {
    if (sendLocal) {
      return this.sendCommandToHub(command, 2012);
    } else {
      return this.sendCommandToCloud(command);
    }
  }

  /**
   * Send a command to the ICS-2000 through the cloud
   * @param command The command you want to send
   * @param port The port you want to send the command to. Default for ICS-2000 is 2012
   */
  public async sendCommandToHub(command: Command, port: number): Promise<void> {
    if (!this.localAddress) {
      throw new Error('Local address is undefined');
    }

    if (!Number.isInteger(port)) {
      throw new Error('Port needs to be an integer');
    }

    return command.sendTo(this.localAddress!, port);
  }

  /**
   * Send a command to the ICS-2000 through the cloud
   * @param command The command you want to send
   */
  public async sendCommandToCloud(command: Command): Promise<void> {
    return command.sendToCloud(this.email, this.password);
  }

  public changeStatus(deviceId: number, deviceFunction: number, value: number, isGroup: boolean, sendLocal: boolean) {
    const command = this.createCommand(deviceId, deviceFunction, value, isGroup ? Entity_Type.Group : Entity_Type.Module);
    return this.sendCommand(command, sendLocal);
  }

  /**
   * Creates a command to turn a device on or off and sends it to the ics-2000 ip address stored in this class
   * @param deviceId The id of the device you want to turn on or off
   * @param on Whether you want to turn the device on or off
   * @param onFunction The function used to turn the device on or off
   * @param isGroup A boolean which indicates whether the device is a group of other devices or not
   * @param sendLocal A boolean which indicates whether you want to send the command through KAKU cloud or local using UDP
   */
  public turnDeviceOnOff(deviceId: number, on: boolean, onFunction: number, isGroup: boolean, sendLocal: boolean) {
    const command = this.createCommand(deviceId, onFunction, on ? 1 : 0, isGroup ? Entity_Type.Group : Entity_Type.Module);
    return this.sendCommand(command, sendLocal);
  }

  /**
   * Creates a command to dim a device and sends it to the ics-2000 ip address stored in this class
   * @param deviceId The id of the device tou want tot dim
   * @param dimFunction The function you want to use to dim the device
   * @param dimLevel The new dim value (0 = off, 255 = 100% brightness)
   * @param isGroup A boolean which indicates whether the device is a group of other devices or not
   * @param sendLocal A boolean which indicates whether you want to send the command through KAKU cloud or local using UDP
   */
  public dimDevice(deviceId: number, dimFunction: number, dimLevel: number, isGroup: boolean, sendLocal: boolean) {
    if (dimLevel < 0 || dimLevel > 255) {
      throw new Error(`Dim level ${dimLevel} is negative or greater than 255`);
    }

    const command = this.createCommand(deviceId, dimFunction, dimLevel, isGroup ? Entity_Type.Group : Entity_Type.Module);
    return this.sendCommand(command, sendLocal);
  }

  /**
   * Change color temperature of a light
   * @param deviceId The id of the device tou want tot dim
   * @param colorTempFunction The function you want to use to change the color temperature of the device
   * @param colorTemperature The new color temperature. Value from 0 to 600
   * @param isGroup A boolean which indicates whether the device is a group of other devices or not
   * @param sendLocal A boolean which indicates whether you want to send the command through KAKU cloud or local using UDP
   */
  public changeColorTemperature(
    deviceId: number, colorTempFunction: number, colorTemperature: number, isGroup: boolean, sendLocal: boolean,
  ) {
    if (colorTemperature < 0 || colorTemperature > 600) {
      throw new Error(`Color temperature ${colorTemperature} is negative or greater than 600`);
    }

    const command = this.createCommand(deviceId, colorTempFunction, colorTemperature, isGroup ? Entity_Type.Group : Entity_Type.Module);
    return this.sendCommand(command, sendLocal);
  }

  public async runScene(entityId: number): Promise<void> {
    const command = this.createCommand(entityId, 0, 1, Entity_Type.Scene);
    return this.sendCommand(command, true);
  }

  public async getAllDeviceStatuses() {
    const statusList = await this.getRawDeviceStatuses(false, true);

    for (const device of statusList) {
      // console.log(device)
      // const status = Cryptographer.decryptBase64(device['status'], this.aesKey!);
      // const jsonStatus = JSON.parse(status);
      const jsonStatus = device['status'];

      // Functions array is stored with different keys for groups and devices (modules)
      if ('module' in jsonStatus) {
        this.deviceStatuses.set(device['id'], jsonStatus['module']['functions']);
      } else if ('group' in jsonStatus) {
        this.deviceStatuses.set(device['id'], jsonStatus['group']['functions']);
      } else {
        throw new Error('Module or group data not found');
      }
    }
  }

  private updateDate: Date = new Date();
  private updating = false;

  public async sleep(milliseconds: number) {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
  }

  /**
   * Get the current status of a device
   * @param deviceId The id of the device you want to get the status of
   * @returns A list of numbers that represents the current status of the device.
   * index 0 is on/off status for switch, index 1 is dim level device type 2,
   * index 3 on/off for zigbee lightbulb, index 4 is current dim level
   */
  public async getDeviceStatus(deviceId: number): Promise<number[]> {
    const currentDate = new Date();
    const updateDate = this.updateDate;
    this.updateDate = new Date();

    const dateDifference = currentDate.getTime() - updateDate.getTime();

    if (dateDifference >= 2000 || this.deviceStatuses.size === 0) {
      this.updating = true;
      await this.getAllDeviceStatuses();
      this.updating = false;
    }

    // Wait till the new data is fetched
    while (this.updating) {
      await this.sleep(100);
    }

    return this.deviceStatuses.get(deviceId)!;
    // return this.getDeviceStatusFromServer(deviceId);
  }

  /**
   * Get the current status of a device, directly from the server
   * @param deviceId The id of the device you want to get the status of
   * @returns A list of numbers that represents the current status of the device.
   * index 0 is on/off status, index 4 is current dim level
   */
  public async getDeviceStatusFromServer(deviceId: number): Promise<number[]> {
    if (!this.aesKey || !this.hubMac) {
      throw new Error('Hub mac address or aes key undefined');
    }

    const params = new URLSearchParams({
      'action': 'get-multiple',
      'email': this.email,
      'mac': this.hubMac!,
      'password_hash': this.password,
      'home_id': '',
      'entity_id': `[${deviceId}]`,
    });

    const response = await axios.post('/entity.php', params.toString())
      .catch(error => {
        if (error.response.status === 404) {
          throw new Error(`Device with id ${deviceId} not found`);
        } else {
          throw new Error(error.response.data);
        }
      });

    const responseJson: object[] = response.data;

    if (responseJson.length === 0) {
      throw new Error(`Device with id ${deviceId} not found`);
    }

    if (!responseJson[0]['status']) {
      return [0];
    }

    // Get first item of the list and grep the status of it
    const status = Cryptographer.decryptBase64(responseJson[0]['status'], this.aesKey);
    const jsonStatus = JSON.parse(status);


    // Functions array is stored with different keys for groups and devices (modules)
    if ('module' in jsonStatus) {
      return jsonStatus['module']['functions'];
    } else if ('group' in jsonStatus) {
      return jsonStatus['group']['functions'];
    } else {
      throw new Error('Module or group data not found');
    }
  }

  /**
   * A method to write the list of devices, rooms, etc. to a JSON file called 'devices.json'
   * @param decryptData A boolean which indicates whether you want to decrypt the data or not
   * @param decryptStatus A boolean which indicates whether you want to decrypt the status or not
   */
  public async generateDevicesJSON(decryptData: boolean, decryptStatus: boolean) {
    if (!this.aesKey || !this.hubMac) {
      // console.log('MAC or AES key is null, so logging in!');
      await this.login();
    }

    const devices = await this.getRawDevicesData(decryptData, decryptStatus);
    fs.writeFileSync('devices.json', JSON.stringify(devices, null, 2));
  }

  /**
   * A method to write the list of statuses of all devices to a JSON file called 'statuses.json'
   * @param decryptData A boolean which indicates whether you want to decrypt the data or not
   * @param decryptStatus A boolean which indicates whether you want to decrypt the status or not
   */
  public async generateDeviceStatusesJSON(decryptData: boolean, decryptStatus: boolean) {
    if (!this.aesKey || !this.hubMac) {
      // console.log('MAC or AES key is null, so logging in!');
      await this.login();
      await this.getDevices();
    }

    const devices = await this.getRawDeviceStatuses(decryptData, decryptStatus);
    fs.writeFileSync('statuses.json', JSON.stringify(devices, null, 2));
  }

  public async getP1EntityID(): Promise<number> {
    const rawDevicesData = await this.getRawDevicesData(true, false);
    const p1Entity = rawDevicesData.find(d => d.data?.module?.name === 'P1 Module');
    return p1Entity?.id;
  }

  /**
   * Get the current data from the P1 module (aka smart meter)
   */
  public async getSmartMeterData(): Promise<SmartMeterDataCurrent> {
    if (this.p1EntityId == null) {
      this.p1EntityId = await this.getP1EntityID();
    }

    // If still null, no P1 smartmeter found
    if (this.p1EntityId == null) {
      throw Error('No entityId found for the P1 smartmeter!');
    }

    const params = new URLSearchParams({
      'action': 'check',
      'email': this.email,
      'password_hash': this.password,
      'mac': this.hubMac!,
      'entity_id': this.p1EntityId.toString(),
    });

    const response = await axios.post('/entity.php', params.toString());
    const p1EncryptedData = response.data[3];
    const p1Data = Cryptographer.decryptBase64(p1EncryptedData, this.aesKey!);
    const p1JsonData = JSON.parse(p1Data);
    const functions: number[] = p1JsonData.module.functions;

    return {
      powerConsumedLowTariff: functions[0],
      powerConsumed: functions[1],
      powerProducedLowTariff: functions[2],
      powerProduced: functions[3],
      currentConsumption: functions[4],
      currentProduction: functions[5],
      gas: functions[6],
      rawDataArray: functions,
    };
  }

  protected formatDate(date: Date): string {
    date.setMilliseconds(0);
    date.setSeconds(0);
    date.setMinutes(0);
    const dateString = date.toLocaleDateString('en-CA');
    const timeString = date.toLocaleTimeString('nl-NL');
    return dateString + ' ' + timeString;
  }

  /**
   * Get raw energy data recorded by the ICS-2000 using the P1-port
   * @param startDate The start of the period you want the data from
   * @param endDate The end of the period you want the data from
   * @param precision The precision of the data. Some values are 15minutes, day, week, month
   * @param differential
   * @param interpolate
   */
  public async getP1Data(
    startDate: Date,
    endDate: Date,
    precision: Precision,
    differential = true,
    interpolate = true,
  ): Promise<number[][]> {
    const params = new URLSearchParams({
      'action': 'aggregated_reports',
      'email': this.email,
      'password_hash': this.password,
      'mac': this.hubMac!,
      'differential': String(differential),
      'interpolate': String(interpolate),
      'start_date': this.formatDate(startDate),
      'end_date': this.formatDate(endDate),
      precision,
    });

    const response = await axios.post('/p1.php', params.toString()).catch(error => {
      if (error.response.status === 400 && error.response.data.error) {
        throw new Error(error.response.data.error);
      } else {
        throw new Error(error.response.data);
      }
    });

    if (response.status !== 200) {
      throw new Error('Non 200 status returned: ' + response.status);
    }

    const responseData = response.data;

    if (!Array.isArray(responseData)) {
      console.log(responseData);
      if (responseData.error) {
        throw new Error(responseData.error);
      }

      throw new Error('Response date is not an array');
    }

    return response.data;
  }

  public static convertToSmartMeterData(array: number[], date: Date, useEpoch = false): SmartMeterData {
    return {
      date: (useEpoch ? date.getTime() : date),
      powerConsumedLowTariff: array[0],
      powerConsumed: array[1],
      powerProducedLowTariff: array[2],
      powerProduced: array[3],
      gas: array[4],
      water: array[5],
    };
  }

  public async getSmartMeterDataByDay(startDate: Date, endDate: Date) {
    startDate.setHours(23);
    startDate.setSeconds(0);
    startDate.setMilliseconds(0);

    endDate.setHours(23);
    endDate.setSeconds(0);
    endDate.setMilliseconds(0);

    const rawData = await this.getP1Data(startDate, endDate, 'day');

    const returnData: SmartMeterData[] = [];

    for (const dayDataArray of rawData) {
      startDate.setDate(startDate.getDate() + 1);
      returnData.push(Hub.convertToSmartMeterData(dayDataArray, new Date(startDate.getTime())));
    }

    return returnData;
  }

  public async getSmartMeterDataByDayWithNumberOfDays(endDate: Date, numberOfDays: number) {
    const startDate = new Date(endDate.getTime());
    startDate.setDate(startDate.getDate() - numberOfDays);
    return this.getSmartMeterDataByDay(startDate, endDate);
  }

  public async getSmartMeterDataByDayPastWeek(weekEndDate: Date) {
    return this.getSmartMeterDataByDayWithNumberOfDays(weekEndDate, 7);
  }

  public async getSmartMeterDataByDayPastMonth(monthEndDate: Date) {
    const startDate = new Date(monthEndDate.getTime());
    startDate.setMonth(startDate.getMonth() - 1);
    return this.getSmartMeterDataByDay(startDate, monthEndDate);
  }

  public getAESKey() {
    return this.aesKey;
  }

  public getHubMac() {
    return this.hubMac;
  }

  /**
   * Set the AES-key used for encryption and descryption
   * @param aesKey The AES-key used to encrypt and decrypt data send and received. Will be fetched when running login(),
   * but if you don't need MAC-address and provide AES-key, login isn't necessary
   */
  public setAesKey(aesKey: string) {
    this.aesKey = aesKey;
  }

  /**
   * Set hub mac address
   * @param hubMac The MAC-Address of your ICS-2000. Will be fetched when running login(),
   * but if you don't need AES-key and provide MAC-address, login isn't necessary
   */
  public setHubMac(hubMac: string) {
    this.hubMac = hubMac;
  }
}

module.exports = Hub;
