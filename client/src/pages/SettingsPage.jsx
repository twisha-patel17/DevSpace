/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from "react";
import {
  Monitor,
  Code2,
  FolderKanban,
  Save,
  RotateCcw,
  Check,
  LoaderCircle,
  AlertCircle,
} from "lucide-react";

const STORAGE_KEY = "devspace-settings";

const defaultSettings = {
  theme: "dark",
  fontSize: 14,
  tabSize: "2",
  wordWrap: true,
  minimap: false,
  autosave: true,
  defaultLanguage: "javascript",
};

const sections = [
  { id: "appearance", label: "Appearance", icon: Monitor },
  { id: "editor", label: "Editor", icon: Code2 },
  { id: "workspace", label: "Workspace", icon: FolderKanban },
];

const SettingsPage = () => {
  const [settings, setSettings] = useState(defaultSettings);
  const [activeSection, setActiveSection] = useState("appearance");
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);

      if (stored) {
        const parsed = JSON.parse(stored);

        setSettings({
          ...defaultSettings,
          ...parsed,
        });
      }
    } catch {
      setError("Could not load your saved preferences.");
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSetting = (key, value) => {
    setSettings((current) => ({
      ...current,
      [key]: value,
    }));

    setSaved(false);
    setError("");
  };

  const handleSave = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      setSaved(true);
      setError("");
    } catch {
      setError("Could not save your settings in this browser.");
    }
  };

  const handleReset = () => {
    setSettings(defaultSettings);
    setSaved(false);
    setError("");

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(defaultSettings)
      );
      setSaved(true);
    } catch {
      setError("Settings were reset in the form but could not be saved.");
    }
  };

  const Toggle = ({ checked, onChange, label }) => (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition ${
        checked ? "bg-[#dc9458]" : "bg-zinc-700"
      }`}
    >
      <span
        className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-all ${
          checked ? "left-6" : "left-1"
        }`}
      />
    </button>
  );

  const SettingRow = ({ title, description, children }) => (
    <div className="flex flex-col gap-4 border-b border-white/[0.06] py-5 last:border-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h3 className="text-sm font-medium text-[#e9e2da]">
          {title}
        </h3>
        <p className="mt-1 max-w-lg text-xs leading-5 text-[#858078]">
          {description}
        </p>
      </div>

      <div className="shrink-0 sm:ml-6">{children}</div>
    </div>
  );

  const SelectControl = ({ value, onChange, options, label }) => (
    <select
      aria-label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="min-w-36 rounded-lg border border-white/[0.1] bg-[#0b0d0f] px-3 py-2.5 text-sm text-[#e9e2da] outline-none transition focus:border-[#dc9458]/60"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center gap-3 text-sm text-[#96918b]">
        <LoaderCircle className="h-5 w-5 animate-spin text-[#dc9458]" />
        Loading settings...
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 lg:py-10">
      {/* Heading */}
      <div className="mb-8">
        <p className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-[#dc9458]">
          Preferences
        </p>

        <h1 className="text-3xl font-semibold tracking-tight text-[#f2eee9] sm:text-4xl">
          Settings
        </h1>

        <p className="mt-2 text-sm text-[#96918b]">
          Customize your DevSpace experience and coding environment.
        </p>
      </div>

      {error && (
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-red-400/20 bg-red-400/[0.06] p-4 text-sm text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {saved && (
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] p-4 text-sm text-emerald-300">
          <Check className="h-4 w-4 shrink-0" />
          Your preferences have been saved in this browser.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        {/* Settings navigation */}
        <aside className="h-fit rounded-2xl border border-white/[0.08] bg-[#101214] p-3">
          <p className="px-3 pb-3 pt-2 text-[10px] font-semibold tracking-[0.16em] text-zinc-600">
            PREFERENCES
          </p>

          <nav className="space-y-1">
            {sections.map((section) => {
              const Icon = section.icon;
              const active = activeSection === section.id;

              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setActiveSection(section.id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition ${
                    active
                      ? "bg-[#dc9458]/[0.1] text-[#e9b17e]"
                      : "text-[#96918b] hover:bg-white/[0.04] hover:text-[#e9e2da]"
                  }`}
                >
                  <Icon size={17} />
                  <span>{section.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Settings content */}
        <section className="min-w-0 rounded-2xl border border-white/[0.08] bg-[#101214] p-5 sm:p-7">
          {activeSection === "appearance" && (
            <>
              <div className="mb-2 flex items-center gap-3">
                <Monitor className="h-5 w-5 text-[#dc9458]" />
                <h2 className="text-lg font-semibold text-[#f2eee9]">
                  Appearance
                </h2>
              </div>

              <p className="mb-5 text-sm text-[#858078]">
                Configure how DevSpace looks on your screen.
              </p>

              <SettingRow
                title="Color theme"
                description="DevSpace currently uses a dark interface optimized for coding."
              >
                <SelectControl
                  label="Color theme"
                  value={settings.theme}
                  onChange={(value) => updateSetting("theme", value)}
                  options={[
                    { value: "dark", label: "Dark" },
                  ]}
                />
              </SettingRow>

              <SettingRow
                title="Interface preview"
                description="Your current DevSpace interface uses dark surfaces and amber accents."
              >
                <div className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-[#0b0d0f] p-3">
                  <span className="h-3 w-3 rounded-full bg-[#dc9458]" />
                  <span className="text-xs text-[#c9c2ba]">
                    Dark · Amber
                  </span>
                </div>
              </SettingRow>
            </>
          )}

          {activeSection === "editor" && (
            <>
              <div className="mb-2 flex items-center gap-3">
                <Code2 className="h-5 w-5 text-[#dc9458]" />
                <h2 className="text-lg font-semibold text-[#f2eee9]">
                  Editor preferences
                </h2>
              </div>

              <p className="mb-5 text-sm text-[#858078]">
                Choose the defaults you prefer when writing code.
              </p>

              <SettingRow
                title="Font size"
                description="Set the preferred code editor font size."
              >
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    aria-label="Decrease font size"
                    disabled={settings.fontSize <= 10}
                    onClick={() =>
                      updateSetting("fontSize", settings.fontSize - 1)
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.1] text-[#c9c2ba] hover:bg-white/[0.05] disabled:opacity-30"
                  >
                    −
                  </button>

                  <span className="w-12 text-center font-mono text-sm text-[#e9b17e]">
                    {settings.fontSize}px
                  </span>

                  <button
                    type="button"
                    aria-label="Increase font size"
                    disabled={settings.fontSize >= 24}
                    onClick={() =>
                      updateSetting("fontSize", settings.fontSize + 1)
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.1] text-[#c9c2ba] hover:bg-white/[0.05] disabled:opacity-30"
                  >
                    +
                  </button>
                </div>
              </SettingRow>

              <SettingRow
                title="Tab size"
                description="Number of spaces inserted when indentation uses tabs."
              >
                <SelectControl
                  label="Tab size"
                  value={settings.tabSize}
                  onChange={(value) => updateSetting("tabSize", value)}
                  options={[
                    { value: "2", label: "2 spaces" },
                    { value: "4", label: "4 spaces" },
                    { value: "8", label: "8 spaces" },
                  ]}
                />
              </SettingRow>

              <SettingRow
                title="Word wrap"
                description="Wrap long lines instead of requiring horizontal scrolling."
              >
                <Toggle
                  label="Word wrap"
                  checked={settings.wordWrap}
                  onChange={(value) => updateSetting("wordWrap", value)}
                />
              </SettingRow>

              <SettingRow
                title="Minimap"
                description="Show a miniature overview of your source code."
              >
                <Toggle
                  label="Editor minimap"
                  checked={settings.minimap}
                  onChange={(value) => updateSetting("minimap", value)}
                />
              </SettingRow>
            </>
          )}

          {activeSection === "workspace" && (
            <>
              <div className="mb-2 flex items-center gap-3">
                <FolderKanban className="h-5 w-5 text-[#dc9458]" />
                <h2 className="text-lg font-semibold text-[#f2eee9]">
                  Workspace preferences
                </h2>
              </div>

              <p className="mb-5 text-sm text-[#858078]">
                Configure your preferred starting language and saving behavior.
              </p>

              <SettingRow
                title="Default language"
                description="Preferred language for a new coding workspace."
              >
                <SelectControl
                  label="Default language"
                  value={settings.defaultLanguage}
                  onChange={(value) =>
                    updateSetting("defaultLanguage", value)
                  }
                  options={[
                    { value: "javascript", label: "JavaScript" },
                    { value: "python", label: "Python" },
                    { value: "cpp", label: "C++" },
                    { value: "java", label: "Java" },
                    { value: "html", label: "HTML" },
                  ]}
                />
              </SettingRow>

              <SettingRow
                title="Autosave preference"
                description="Save your preferred autosave setting for the editor."
              >
                <Toggle
                  label="Autosave preference"
                  checked={settings.autosave}
                  onChange={(value) => updateSetting("autosave", value)}
                />
              </SettingRow>

              <div className="mt-5 rounded-xl border border-[#dc9458]/15 bg-[#dc9458]/[0.04] p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#dc9458]" />
                  <p className="text-xs leading-5 text-[#b0a69b]">
                    These preferences are stored locally for now. We'll connect
                    them to the Monaco editor and workspace creation flow so
                    they affect actual behavior.
                  </p>
                </div>
              </div>
            </>
          )}

          {/* Save and reset */}
          <div className="mt-7 flex flex-col-reverse gap-3 border-t border-white/[0.07] pt-5 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm text-[#96918b] transition hover:bg-white/[0.04] hover:text-[#e9e2da]"
            >
              <RotateCcw size={15} />
              Reset defaults
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#dc9458] px-5 py-2.5 text-sm font-semibold text-[#17120e] transition hover:bg-[#e7a66e] active:scale-[0.98]"
            >
              <Save size={15} />
              Save preferences
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default SettingsPage;