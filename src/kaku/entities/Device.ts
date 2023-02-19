import Entity from './Entity';
import Hub from '../Hub';
import DeviceData from '../model/DeviceData';
import DeviceConfig from '../model/DeviceConfig';

export default class Device extends Entity {
  public readonly disabled: boolean;

  /**
   * Creates a device
   * @param hub The Hub you use to control this device
   * @param deviceData The data pulled from the KAKU cloud about this device
   * @param deviceConfig Data that contains the functions for on/off, dimming and color temp
   */
  constructor(
    hub: Hub,
    deviceData: DeviceData,
    public readonly deviceConfig: DeviceConfig,
  ) {
    super(hub, deviceData, 'group' in deviceData.data ? 'group' : 'module');
    this.disabled = deviceConfig.disabled ?? false;
  }
}
