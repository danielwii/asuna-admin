export class Constants {
  private static _constants;

  public static set constants(constants: any) {
    this._constants = constants;
  }

  public static get constants() {
    return this._constants;
  }
}
