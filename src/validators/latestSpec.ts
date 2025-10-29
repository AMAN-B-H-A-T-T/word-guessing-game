import ProfileValidationSpec from "./profile.validationSpec";

class LatestSpec {
  latest: Record<string, any>;
  constructor() {
    this.latest = {
      profile: new ProfileValidationSpec(),
    };
  }

  public getModule(module: string) {
    return this.latest[module];
  }
}

export default LatestSpec;
