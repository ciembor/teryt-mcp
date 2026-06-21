import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { createAspNetPostbackForm } from "../../src/features/sync-database/infrastructure/aspnet-form.js";

describe("createAspNetPostbackForm", () => {
  it("parses hidden inputs and configures the postback target", async () => {
    const html = await readFile(join(process.cwd(), "test/fixtures/eteryt/download-form.html"), "utf8");
    const form = createAspNetPostbackForm(html, "download-target");

    expect(Object.fromEntries(form)).toEqual({
      __EVENTARGUMENT: "",
      __EVENTTARGET: "download-target",
      __VIEWSTATE: "view&state value",
      __VIEWSTATEGENERATOR: "generator",
    });
  });
});
