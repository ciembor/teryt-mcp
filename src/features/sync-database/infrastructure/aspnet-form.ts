import { load } from "cheerio";

export function createAspNetPostbackForm(html: string, eventTarget: string): URLSearchParams {
  const $ = load(html);
  const form = new URLSearchParams();

  $("input[name]").each((_index, input) => {
    const name = $(input).attr("name");

    if ($(input).attr("type")?.toLowerCase() === "hidden" && name) {
      form.set(name, $(input).attr("value") ?? "");
    }
  });
  form.set("__EVENTTARGET", eventTarget);
  form.set("__EVENTARGUMENT", "");

  return form;
}
