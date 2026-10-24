import { test, expect } from "@playwright/test";
for (const level of ["A1", "A2", "B1"])
  test(`${level} complete mystery with lyrics, incorrect choices, persistence, audio and replay`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/");
    await page.getByRole("button", { name: new RegExp(level) }).click();
    await page.getByRole("button", { name: "Enter the underground" }).click();
    await expect(
      page.getByRole("heading", { name: "Warschauer Straße", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Pause music" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Lyrics", exact: false }).click();
    await page
      .getByRole("button", { name: "That yellow bag… make a note" })
      .click();
    await expect(page.getByText("Lyric note", { exact: true })).toBeVisible();
    await page.getByLabel("Choose train line").selectOption("U8");
    await page.getByRole("button", { name: "Board train" }).click();
    await expect(
      page.getByText(/Diese Bahn fährt hier nicht|Falscher Bahnsteig/),
    ).toBeVisible();
    await page.getByLabel("Choose train line").selectOption("U3");
    await page.getByRole("button", { name: "Board train" }).click();
    await expect(
      page.getByRole("heading", { name: "Kottbusser Tor", exact: true }),
    ).toBeVisible();
    await page
      .getByLabel("YOUR WORDS. YOUR GERMAN.")
      .fill("hallo, gelbe tasch gesehen?");
    await page.getByRole("button", { name: "Send message" }).click();
    await expect(
      page.getByText("Deniz’s receipt", { exact: true }),
    ).toBeVisible();
    await page.reload();
    await expect(
      page.getByText("Deniz’s receipt", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Play music", exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Select Alexanderplatz", exact: true })
      .press("Enter");
    await page.getByLabel("Choose train line").selectOption("U8");
    await page.getByRole("button", { name: "Board train" }).click();
    await expect(
      page.getByRole("heading", { name: "Alexanderplatz", exact: true }),
    ).toBeVisible();
    await page.getByLabel("SCHLIESSFACH / LOCKER NUMBER").fill("06");
    await page.getByRole("button", { name: "Open locker" }).click();
    await expect(
      page.getByText("Dieses Fach enthält", { exact: false }),
    ).toBeVisible();
    await page.getByLabel("SCHLIESSFACH / LOCKER NUMBER").fill("07");
    await page.getByRole("button", { name: "Open locker" }).click();
    await expect(
      page.getByRole("region", { name: "Mystery complete" }),
    ).toBeVisible();
    await expect(
      page.getByText("officially in the band", { exact: false }),
    ).toBeVisible();
    await page.getByRole("button", { name: "One more night" }).click();
    await expect(
      page.getByRole("heading", { name: "Warschauer Straße", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("Every good story starts", { exact: false }),
    ).toBeVisible();
    expect(errors).toEqual([]);
  });
for (const level of ["A2", "B1"])
  test(`${level} has adapted dialogue and soundtrack`, async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: new RegExp(level) }).click();
    await page.getByRole("button", { name: "Enter the underground" }).click();
    await expect(
      page.getByText(
        level === "A2" ? "Wo bist du?" : "Letzte Bahn nach Mitternacht",
        { exact: true },
      ),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Show English" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Lyrics", exact: false }).click();
    await expect(
      page.getByRole("button", {
        name:
          level === "A2"
            ? "Die gelbe Tasche reist zum Kottbusser Tor."
            : "Eine gelbe Tasche zog zum Kottbusser Tor,",
        exact: true,
      }),
    ).toBeVisible();
  });
test("AI endpoint validates input and has working no-key fallback", async ({
  request,
}) => {
  const invalid = await request.post("/api/chat", {
    data: { text: "tasche", level: "A1", station: "alex" },
  });
  expect(invalid.status()).toBe(400);
  const valid = await request.post("/api/chat", {
    data: { text: "gelbe tasch gesehen?", level: "A1", station: "kotti" },
  });
  expect(valid.ok()).toBe(true);
  expect(await valid.json()).toMatchObject({ intent: "bag" });
});
test("real German assets decode and play; dialogue and microphone lower music", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const w = window as unknown as {
      __audio: {
        oscillators: number;
        voices: number;
        nonSilent: boolean;
        ramps: number[];
      };
      SpeechRecognition: unknown;
    };
    w.__audio = { oscillators: 0, voices: 0, nonSilent: false, ramps: [] };
    const start = OscillatorNode.prototype.start;
    OscillatorNode.prototype.start = function (when?: number) {
      w.__audio.oscillators++;
      return start.call(this, when);
    };
    const voiceStart = AudioBufferSourceNode.prototype.start;
    AudioBufferSourceNode.prototype.start = function (
      when?: number,
      offset?: number,
      duration?: number,
    ) {
      w.__audio.voices++;
      if (this.buffer)
        w.__audio.nonSilent = this.buffer
          .getChannelData(0)
          .some((v) => Math.abs(v) > 0.01);
      return voiceStart.call(this, when, offset, duration);
    };
    const ramp = AudioParam.prototype.setTargetAtTime;
    AudioParam.prototype.setTargetAtTime = function (
      value: number,
      time: number,
      constant: number,
    ) {
      w.__audio.ramps.push(value);
      return ramp.call(this, value, time, constant);
    };
    w.SpeechRecognition = class {
      lang = "";
      interimResults = false;
      continuous = false;
      onresult?: (e: unknown) => void;
      onend?: () => void;
      onerror?: () => void;
      start() {
        setTimeout(() => {
          this.onresult?.({
            results: [[{ transcript: "Hallo, gelbe Tasche gesehen?" }]],
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
  await page.getByRole("button", { name: "Enter the underground" }).click();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as unknown as { __audio: { voices: number } }).__audio.voices,
      ),
    )
    .toBeGreaterThan(0);
  expect(
    await page.evaluate(
      () =>
        (window as unknown as { __audio: { nonSilent: boolean } }).__audio
          .nonSilent,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Read dialogue aloud" }).click();
  await expect
    .poll(() =>
      page.evaluate(() =>
        (
          window as unknown as { __audio: { ramps: number[] } }
        ).__audio.ramps.some((v) => Math.abs(v - 0.35 * 0.15) < 0.00001),
      ),
    )
    .toBe(true);
  await page.getByRole("button", { name: "Board train" }).click();
  await expect(
    page.getByRole("heading", { name: "Kottbusser Tor", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Speak German" }).click();
  await expect
    .poll(() =>
      page.evaluate(() =>
        (
          window as unknown as { __audio: { ramps: number[] } }
        ).__audio.ramps.some((v) => Math.abs(v - 0.35 * 0.015) < 0.00001),
      ),
    )
    .toBe(true);
  await expect(page.getByLabel("YOUR WORDS. YOUR GERMAN.")).toHaveValue(
    "Hallo, gelbe Tasche gesehen?",
  );
  await page.getByRole("button", { name: "Mute music", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Unmute music", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Pause music", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Play music", exact: true }),
  ).toBeVisible();
});
