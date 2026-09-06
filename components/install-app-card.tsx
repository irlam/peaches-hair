"use client";

import Image from "next/image";
import { CheckCircle2, Download, Smartphone } from "lucide-react";
import { useEffect, useState } from "react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type DeviceType = "ios" | "android" | "desktop";

function detectDevice(): DeviceType {
  const userAgent = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(userAgent)) return "ios";
  if (/android/.test(userAgent)) return "android";
  return "desktop";
}

function isInstalled() {
  const standaloneNavigator = navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    standaloneNavigator.standalone === true
  );
}

export function InstallAppCard() {
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [device, setDevice] = useState<DeviceType>("desktop");
  const [showInstructions, setShowInstructions] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const installedCheck = window.setTimeout(() => setInstalled(isInstalled()), 0);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" }).catch((error) => {
        console.warn("Peaches Hair offline setup failed", error);
      });
    }

    const capturePrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    const markInstalled = () => {
      setInstalled(true);
      setShowInstructions(false);
      setInstallPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", capturePrompt);
    window.addEventListener("appinstalled", markInstalled);
    return () => {
      window.clearTimeout(installedCheck);
      window.removeEventListener("beforeinstallprompt", capturePrompt);
      window.removeEventListener("appinstalled", markInstalled);
    };
  }, []);

  async function addToDevice() {
    if (installPrompt) {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      setInstallPrompt(null);
      if (choice.outcome === "accepted") setInstalled(true);
      return;
    }
    setDevice(detectDevice());
    setShowInstructions(true);
  }

  const instructions =
    device === "ios"
      ? "On iPhone or iPad: open this page in Safari, tap the Share button, then choose Add to Home Screen."
      : device === "android"
        ? "Open your browser menu, then choose Install app or Add to Home screen."
        : "Open your browser menu and choose Install Peaches Hair to add it to this device.";

  return (
    <section className="app-install-section" aria-labelledby="app-install-title">
      <div className="app-install-card">
        <div className="app-install-icon" aria-hidden="true">
          <Image src="/app-icon-192.png" alt="" width={92} height={92} />
          <span><Download /></span>
        </div>
        <div className="app-install-copy">
          <p className="eyebrow"><Smartphone /> Peaches Hair on your phone</p>
          <h2 id="app-install-title">Your appointments, one tap away.</h2>
          <p>Add Peaches Hair to your phone for quicker booking and easy access whenever you need us.</p>
        </div>
        <div className="app-install-action">
          {installed ? (
            <span className="app-installed"><CheckCircle2 /> Added to this device</span>
          ) : (
            <button type="button" onClick={addToDevice}>
              <Download /> Add to my phone
            </button>
          )}
        </div>
        {showInstructions && !installed && (
          <p className="app-install-instructions" role="status">{instructions}</p>
        )}
      </div>
    </section>
  );
}
