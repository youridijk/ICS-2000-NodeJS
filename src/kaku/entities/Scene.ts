import Entity from './Entity';

export default class Scene extends Entity {
  public async run(): Promise<void> {
    return this.getHub().runScene(this.entityId);
  }
}
