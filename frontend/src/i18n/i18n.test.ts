import { describe, it, expect, beforeEach } from "vitest";
import i18n, { UI_LANGUAGE_STORAGE_KEY, SUPPORTED_LANGUAGES } from "./index";
import { saveStatusLabel } from "../utils/autosaveConfig";

describe("i18n", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("en");
  });

  it("initializes and defaults to English", () => {
    expect(i18n.isInitialized).toBe(true);
    expect(i18n.t("settings.title")).toBe("Settings");
    expect(i18n.t("auth.login.submit")).toBe("Sign In");
  });

  it("exposes exactly English and Brazilian Portuguese", () => {
    expect(SUPPORTED_LANGUAGES.map((l) => l.code)).toEqual(["en", "pt-BR"]);
  });

  it("switches to pt-BR and back to en", async () => {
    await i18n.changeLanguage("pt-BR");
    expect(i18n.t("settings.title")).toBe("Configurações");
    expect(i18n.t("dashboard.empty.noDrawings")).toBe("Nenhum desenho encontrado");
    expect(i18n.t("sidebar.nav.settings")).toBe("Configurações");
    await i18n.changeLanguage("en");
    expect(i18n.t("settings.title")).toBe("Settings");
  });

  it("persists the chosen language to localStorage", async () => {
    await i18n.changeLanguage("pt-BR");
    expect(localStorage.getItem(UI_LANGUAGE_STORAGE_KEY)).toBe("pt-BR");
  });

  it("interpolates variables", () => {
    expect(
      i18n.t("auth.login.continueWithOidc", { oidcProvider: "Keycloak" }),
    ).toBe("Continue with Keycloak");
  });

  it("localizes the save-status label through t (priority surface)", async () => {
    const liveT = (key: string, def?: string): string =>
      i18n.t(key, { defaultValue: def });
    await i18n.changeLanguage("en");
    expect(saveStatusLabel("saving", liveT)).toBe("Saving…");
    await i18n.changeLanguage("pt-BR");
    expect(saveStatusLabel("saving", liveT)).toBe("Salvando…");
    expect(saveStatusLabel("saved", liveT)).toBe("Salvo");
    expect(saveStatusLabel("error", liveT)).toBe("Falha ao salvar");
    await i18n.changeLanguage("en");
    // Without a translator it stays English (pure default for unit tests).
    expect(saveStatusLabel("error")).toBe("Save failed");
  });

  it("translates the Settings / API Keys surface", async () => {
    await i18n.changeLanguage("pt-BR");
    expect(i18n.t("settings.tabs.apiKeys")).toBe("Chaves de API / MCP");
    expect(i18n.t("settings.apiKeys.heading")).toBe("Chaves de API / MCP");
    expect(i18n.t("settings.language.title")).toBe("Idioma");
    await i18n.changeLanguage("en");
  });
});
