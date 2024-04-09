import puppeteer from "puppeteer";
import config from "../config.json";

const regex = {
  device: (text: string) => {
    const match = text.match(/\(([^)]+)\)/);

    return match ? match[1].trim() : null;
  },

  name: (text: string) => {
    const match = text.match(/^([^(\n]+)/);

    return match ? match[1].trim() : null;
  },

  version: (text: string) => {
    const match = text.match(/Miku UI (.+)/);

    return match ? match[1].trim() : null;
  },

  android: (text: string) => {
    const match = text.match(/Android: (\d+)/);

    return match ? match[1].trim() : null;
  },

  status: (text: string) => {
    const match = text.match(/Status: (.+)/);

    return match ? match[1].trim() : null;
  },

  selinux: (text: string) => {
    const match = text.match(/SELinux:(.+)/);

    return match ? match[1].trim() : null;
  },

  kernelsu: (text: string) => {
    const match = text.match(/KernelSU: (\d+)/);

    return match ? match[1].trim() : null;
  },

  updated: (text: string) => {
    const match = text.match(/Updated: (\d{4}\.\d{2}\.\d{2})/);

    return match ? match[1].trim() : null;
  },

  changelog: (text: string) => {
    const match =
      text.match(/Changelog:\n([\s\S]*?)\n\n/) ||
      text.match(/Changelog:\n([\s\S]*?)(?=\nNotes:)/);

    return match
      ? match[1]
          .trim()
          .split("\n")
          .map((entry) => entry.replace(/-\s+/, ""))
      : [];
  },

  notes: (text: string) => {
    const match = text.match(/Notes:([\s\S]+)/);

    return match ? match[1].trim().split("\n").slice(0, -2) : [];
  },

  sourcforge_url: (text: string) => {
    const match = text.match(/<a href="(https:\/\/sourceforge\.net\/[^"]+)"/);

    return match ? match[1].trim() : null;
  },
};

export const getDataFromTelegram = async () => {
  const browser = await puppeteer.launch(config.puppeteer);

  const page = await browser.newPage();

  await page.goto("https://t.me/s/mikuuirelease");

  const result = await page.evaluate(async () => {
    const nodes = document.querySelectorAll(
      ".tgme_widget_message_text"
    ) as NodeListOf<HTMLElement>;

    const data: {
      innerText: string;
      outerHTML: string;
    }[] = [];

    nodes.forEach(({ innerText, outerHTML }) => {
      data.push({
        innerText,
        outerHTML,
      });
    });

    return data;
  });

  await browser.close();

  const list = [];

  result.forEach(({ innerText, outerHTML }) => {
    const lines = innerText.split("\n");

    let base = {
      device: regex.device(lines[0]),
      name: regex.name(lines[0]),
    };

    if (!base.device) {
      return;
    }

    list.push({
      ...base,
      version: regex.version(innerText),
      android: Number(regex.android(innerText)),
      status: regex.status(innerText),
      selinux: regex.selinux(innerText),
      kernelsu: Number(regex.kernelsu(innerText)),
      date: regex.updated(innerText),
      sourcforge_url: regex.sourcforge_url(outerHTML),
      changelog: regex.changelog(innerText),
      notes: regex.notes(innerText),
    });
  });

  return list;
};

export const updateDevices = async () => {
  const { prisma } = await import("utils/prisma");

  const data = await getDataFromTelegram();

  data.forEach(async (item) => {
    const result = await prisma.devices.findFirst({
      where: {
        device: item.device,
        version: item.version,
      },
    });

    if (result) {
      return;
    }

    await prisma.devices.create({
      data: {
        ...item,
        changelog: JSON.stringify(item.changelog),
        notes: JSON.stringify(item.note),
      },
    });

    console.log(`new device inserted: ${item.name} ${item.version}`);
  });
};

if (require.main === module) {
  console.log("exec getDataFromTelegram(), please wait...");

  updateDevices();
}
