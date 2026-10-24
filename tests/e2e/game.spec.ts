import { test, expect, type Page } from "@playwright/test";
async function inspect(page: Page, label: string) {
  await page
    .getByRole("button", { name: `Examine ${label}`, exact: true })
    .click();
}
async function move(page: Page, label: string) {
  await page
    .getByRole("navigation", { name: "Explore the building" })
    .getByRole("button", { name: new RegExp(label) })
    .click();
}
async function say(page: Page, text: string) {
  await page.getByLabel(/WHAT DO YOU SAY/).fill(text);
  await page.getByRole("button", { name: "Send German reply" }).click();
  await expect(
    page.getByText("Einen Moment…", { exact: true }),
  ).not.toBeVisible();
}
for (const level of ["A1", "A2"])
  test(`${level}: entire mystery, first midnight, evidence and complete ending`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/");
    await page.getByRole("button", { name: new RegExp(`^${level}`) }).click();
    await page
      .getByRole("button", { name: "Start the night", exact: false })
      .click();
    await inspect(page, "Suspicious note");
    await inspect(page, "Noticeboard");
    await inspect(page, "Empty painting hooks");
    await inspect(page, "Nora’s apartment");
    await inspect(page, "Flickering light");
    await inspect(page, "Hallway clock");
    await expect(
      page.getByRole("status").getByText("MITTERNACHT.", { exact: true }),
    ).toBeVisible();
    await expect(page.getByText("NIGHT 02", { exact: true })).toBeVisible();
    await expect(
      page.getByText("MITTERNACHT.", { exact: true }),
    ).not.toBeVisible();
    await expect(
      page.getByRole("button", { name: /A note in blue ink/ }),
    ).toBeVisible();
    await move(page, "Weber’s office");
    await inspect(page, "Maintenance log");
    await inspect(page, "Old photograph");
    await say(page, "Könnte ich bitte den Schlüssel bekommen?");
    await expect(
      page.getByText("Weber listens. He needs a reason.", { exact: true }),
    ).toBeVisible();
    await say(page, "Ich brauchen Schlüssel. Wasser im Keller!");
    await expect(
      page.getByText("The basement key", { exact: true }),
    ).toBeVisible();
    await move(page, "The hallway");
    await page.getByRole("button", { name: /^Lena/ }).click();
    await say(page, "Hast du das Bild gesehen?");
    await page.getByRole("button", { name: /^Milo/ }).click();
    await say(page, "Was hast du gehört?");
    await expect(
      page.getByRole("button", { name: /Milo’s midnight tape/ }),
    ).toBeVisible();
    await move(page, "The basement");
    await inspect(page, "Covered painting");
    await inspect(page, "Archive door / red lever");
    await expect(page.getByText("Nora is safe", { exact: true })).toBeVisible();
    await page
      .getByRole("button", { name: "Close the case", exact: false })
      .click();
    await expect(
      page.getByText("ENDING A · THE TRUTH REVEALED", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("TOMORROW. AT LAST.", { exact: true }),
    ).toBeVisible();
    expect(errors).toEqual([]);
    await page.reload();
    await page.getByRole("button", { name: /Continue night/ }).click();
    await expect(
      page.getByText("ENDING A · THE TRUTH REVEALED", { exact: true }),
    ).toBeVisible();
  });
test("real rewind demo restores a refusal and creates an alternate branch", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: /Try the two-minute rewind demo/ })
    .click();
  await say(page, "Gib mir den Schlüssel!");
  await expect(
    page.getByText("Weber bristles. No key.", { exact: true }),
  ).toBeVisible();
  const beforeTime = await page.locator("time").textContent();
  await page
    .getByRole("button", { name: /NOCHMAL!.*REWIND LAST REPLY/ })
    .click();
  await expect(
    page.getByText("ONE CONVERSATION. ONE MORE CHANCE.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("ONE CONVERSATION. ONE MORE CHANCE.", { exact: true }),
  ).not.toBeVisible();
  expect(await page.locator("time").textContent()).not.toBe(beforeTime);
  await expect(
    page.getByLabel("Alternative timeline comparison"),
  ).toBeVisible();
  await say(page, "Könnte ich bitte den Schlüssel bekommen?");
  await expect(
    page
      .getByText("Weber listens. He needs a reason.", { exact: true })
      .first(),
  ).toBeVisible();
  await say(page, "Ich brauche den Schlüssel. Wasser im Keller!");
  await expect(
    page.getByText("The basement key", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByLabel("Alternative timeline comparison"),
  ).toContainText("Gib mir den Schlüssel!");
  await expect(
    page.getByLabel("Alternative timeline comparison"),
  ).toContainText("Key acquired");
  // Rewind the key grant: the key vanishes, but language observations stay.
  await page
    .getByRole("button", { name: /NOCHMAL!.*REWIND LAST REPLY/ })
    .click();
  await expect(
    page.getByText("ONE CONVERSATION. ONE MORE CHANCE.", { exact: true }),
  ).not.toBeVisible();
  await expect(
    page.getByText("The basement key", { exact: true }),
  ).not.toBeVisible();
  await page.getByRole("button", { name: /Found words/ }).click();
  await expect(
    page.getByText("“Ich brauche den Schlüssel. Wasser im Keller!”", {
      exact: true,
    }),
  ).toBeVisible();
});
test("incomplete ending, restart, pause and typed non-audio alternatives", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: /Try the two-minute rewind demo/ })
    .click();
  await page.getByRole("button", { name: "Pause atmosphere" }).click();
  await say(page, "Schlüssel bitte. Wasser im Keller!");
  await move(page, "The basement");
  await inspect(page, "Covered painting");
  await page.getByRole("button", { name: /Close the case/ }).click();
  await expect(
    page.getByText("ENDING B · THE INCOMPLETE TRUTH", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: /Another night, another ending/ })
    .click();
  await page
    .getByRole("button", { name: "Start a new story", exact: false })
    .click();
  await expect(page.getByText("NIGHT 01", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Pause game", exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: "Between two seconds." }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
});
test("API validates evidence and runs without credentials", async ({
  request,
}) => {
  const invalid = await request.post("/api/chat", {
    data: {
      text: "Schlüssel",
      level: "A1",
      character: "weber",
      knowledge: ["fake"],
    },
  });
  expect(invalid.status()).toBe(400);
  const result = await request.post("/api/chat", {
    data: {
      text: "Ich brauchen Schlüssel. Wasser!",
      level: "A1",
      character: "weber",
      knowledge: ["note", "log"],
    },
  });
  expect(result.ok()).toBe(true);
  expect(await result.json()).toMatchObject({
    source: "scripted",
    interpretation: { intent: "request_key", referencedEvidence: ["log"] },
  });
});
test("local speech is non-silent and microphone suppression restores on typed fallback", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const w = window as unknown as {
      __sound: { voices: number; nonSilent: boolean; ramps: number[] };
      SpeechRecognition: unknown;
    };
    w.__sound = { voices: 0, nonSilent: false, ramps: [] };
    const start = AudioBufferSourceNode.prototype.start;
    AudioBufferSourceNode.prototype.start = function (
      when?: number,
      offset?: number,
      duration?: number,
    ) {
      if (!this.loop) {
        w.__sound.voices++;
        w.__sound.nonSilent = !!this.buffer
          ?.getChannelData(0)
          .some((v) => Math.abs(v) > 0.01);
      }
      return start.call(this, when, offset, duration);
    };
    const ramp = AudioParam.prototype.setTargetAtTime;
    AudioParam.prototype.setTargetAtTime = function (
      v: number,
      t: number,
      c: number,
    ) {
      w.__sound.ramps.push(v);
      return ramp.call(this, v, t, c);
    };
    w.SpeechRecognition = class {
      lang = "";
      continuous = false;
      interimResults = false;
      onresult?: (e: unknown) => void;
      onerror?: () => void;
      onend?: () => void;
      start() {
        setTimeout(() => {
          this.onresult?.({
            results: [[{ transcript: "Kann ich den Schlüssel bekommen?" }]],
          });
          this.onend?.();
        }, 100);
      }
      stop() {
        this.onend?.();
      }
    };
  });
  await page.goto("/");
  await page
    .getByRole("button", { name: /Try the two-minute rewind demo/ })
    .click();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as unknown as { __sound: { voices: number } }).__sound.voices,
      ),
    )
    .toBeGreaterThan(0);
  expect(
    await page.evaluate(
      () =>
        (window as unknown as { __sound: { nonSilent: boolean } }).__sound
          .nonSilent,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Speak German", exact: true }).click();
  await expect(page.getByLabel(/WHAT DO YOU SAY/)).toHaveValue(
    "Kann ich den Schlüssel bekommen?",
  );
  expect(
    await page.evaluate(() =>
      (
        window as unknown as { __sound: { ramps: number[] } }
      ).__sound.ramps.some((v) => Math.abs(v - 0.45 * 0.015) < 0.00001),
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Send German reply" }).click();
  await expect(
    page.getByText("Weber listens. He needs a reason.", { exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(() =>
      (
        window as unknown as { __sound: { ramps: number[] } }
      ).__sound.ramps.some((v) => Math.abs(v - 0.45 * 0.13) < 0.00001),
    ),
  ).toBe(true);
});
test("pause cancels an in-flight reply; journal and mobile dialogue collapse", async ({
  page,
  isMobile,
}) => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/chat", async (route) => {
    await gate;
    await route.fulfill({
      json: {
        source: "scripted",
        interpretation: {
          intent: "request_key",
          confidence: 0.99,
          tone: "urgent",
          referencedEvidence: ["log"],
          needsClarification: false,
        },
      },
    });
  });
  await page.goto("/");
  await page
    .getByRole("button", { name: /Try the two-minute rewind demo/ })
    .click();
  const time = await page.locator("time").textContent();
  await page.getByLabel(/WHAT DO YOU SAY/).fill("Schlüssel! Wasser im Keller!");
  await page.getByRole("button", { name: "Send German reply" }).click();
  await expect(page.getByText("Einen Moment…", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Pause game", exact: true }).click();
  const finished = page.waitForResponse("**/api/chat");
  release();
  await finished;
  await page.getByRole("button", { name: /Keep playing/ }).click();
  await expect(
    page.getByText("No key. Not yet.", { exact: true }),
  ).toBeVisible();
  expect(await page.locator("time").textContent()).toBe(time);
  if (isMobile) {
    await page
      .getByRole("button", { name: "Hide conversation", exact: false })
      .click();
    await expect(page.getByLabel(/WHAT DO YOU SAY/)).not.toBeVisible();
    await page
      .getByRole("button", { name: "Open conversation", exact: false })
      .click();
    await expect(page.getByLabel(/WHAT DO YOU SAY/)).toBeVisible();
  }
  await page.getByRole("button", { name: /YOUR DETECTIVE JOURNAL/ }).click();
  await expect(
    page.getByRole("button", { name: /A note in blue ink/ }),
  ).not.toBeVisible();
  await page.getByRole("button", { name: /YOUR DETECTIVE JOURNAL/ }).click();
  await expect(
    page.getByRole("button", { name: /A note in blue ink/ }),
  ).toBeVisible();
});
