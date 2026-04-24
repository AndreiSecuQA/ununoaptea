import { beforeEach, describe, expect, it } from "vitest";
import { useWizardState } from "./useWizardState";

describe("useWizardState", () => {
  beforeEach(() => {
    localStorage.clear();
    useWizardState.getState().reset();
  });

  it("starts at step 1 with empty consents", () => {
    const s = useWizardState.getState();
    expect(s.currentStep).toBe(1);
    expect(s.consents.gdpr).toBe(false);
    expect(s.consents.marketing).toBe(false);
    expect(s.email).toBe("");
  });

  it("advances and retreats within 1-7 bounds", () => {
    useWizardState.getState().next();
    expect(useWizardState.getState().currentStep).toBe(2);

    for (let i = 0; i < 10; i++) useWizardState.getState().next();
    expect(useWizardState.getState().currentStep).toBe(7);

    useWizardState.getState().back();
    expect(useWizardState.getState().currentStep).toBe(6);

    for (let i = 0; i < 10; i++) useWizardState.getState().back();
    expect(useWizardState.getState().currentStep).toBe(1);
  });

  it("setField updates data immutably", () => {
    useWizardState.getState().setField("first_name", "Andrei");
    expect(useWizardState.getState().data.first_name).toBe("Andrei");
  });

  it("setConsent flips the selected consent only", () => {
    useWizardState.getState().setConsent("gdpr", true);
    const c = useWizardState.getState().consents;
    expect(c.gdpr).toBe(true);
    expect(c.marketing).toBe(false);
    expect(c.withdrawal).toBe(false);
  });

  it("setEmail persists the value", () => {
    useWizardState.getState().setEmail("a@b.ro");
    expect(useWizardState.getState().email).toBe("a@b.ro");
  });

  it("reset returns to initial state", () => {
    useWizardState.getState().setEmail("x@y.ro");
    useWizardState.getState().next();
    useWizardState.getState().reset();
    const s = useWizardState.getState();
    expect(s.email).toBe("");
    expect(s.currentStep).toBe(1);
  });
});
