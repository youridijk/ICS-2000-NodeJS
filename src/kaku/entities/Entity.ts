import Hub from '../Hub';
import DeviceData from '../model/DeviceData';
import {EntityType} from '../model/EntityType';

/**
 * This class represents a device you can turn on or off
 */
export default class Entity {
  public readonly entityId: number;
  public readonly name: string;
  public readonly isGroup: boolean;
  public readonly deviceType: number;
  // The # marks it private in plain js
  readonly #hub: Hub;

  /**
   * Creates a default entity: module (device), group or scene
   * @param hub The Hub you use to control this device
   * @param deviceData The data pulled from the KAKU cloud about this device
   * @param entityType The entityType of this entity
   */
  public constructor(
    hub: Hub,
    public readonly deviceData: DeviceData,
    public readonly entityType: EntityType,
  ) {
    this.#hub = hub;
    this.entityId = Number(deviceData.id);
    this.name = deviceData.data[entityType].name;
    this.deviceType = deviceData.data[entityType].device ?? entityType;
    this.isGroup = entityType === 'group';
  }

  /**
   * Get the current status of a device in the form of an integer array
   */
  public getStatus(): Promise<number[]> {
    return this.#hub.getDeviceStatus(this.entityId);
  }

  /**
   * Returns the hub used by this device. Methods aren't seen by JSON.stringify,
   * so using a getter here instead of public property to prevent circular JSON
   */
  public getHub(): Hub {
    return this.#hub;
  }

  public changeStatus(deviceFunction: number, value: number, sendLocal: boolean): Promise<void> {
    return this.#hub.changeStatus(this.entityId, deviceFunction, value, this.isGroup, sendLocal);
  }
}

module.exports = Entity;
