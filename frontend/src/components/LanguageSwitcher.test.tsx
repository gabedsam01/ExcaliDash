import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import i18n, { UI_LANGUAGE_STORAGE_KEY } from "../i18n";
import { LanguageSwitcher } from "./LanguageSwitcher";

describe("LanguageSwitcher", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("en");
  });

  it("renders both supported languages", () => {
    render(<LanguageSwitcher />);
    expect(screen.getByRole("option", { name: "English" })).toBeTruthy();
    expect(
      screen.getByRole("option", { name: "Português (Brasil)" }),
    ).toBeTruthy();
  });

  it("switches language and persists it to localStorage", async () => {
    render(<LanguageSwitcher />);
    const select = screen.getByRole("combobox") as HTMLSelectElement;
    expect(select.value).toBe("en");

    fireEvent.change(select, { target: { value: "pt-BR" } });

    await waitFor(() => expect(i18n.language).toBe("pt-BR"));
    expect(localStorage.getItem(UI_LANGUAGE_STORAGE_KEY)).toBe("pt-BR");
  });
});
