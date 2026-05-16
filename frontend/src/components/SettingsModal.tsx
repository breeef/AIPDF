"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Loader2, Save, Cpu, MessageSquare, Type, Languages, BookOpen, Eye, EyeOff } from "lucide-react";
import * as api from "@/lib/api";
import type { AppSettings } from "@/lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
}

interface TaskConfig {
  key: "graph" | "chat" | "title" | "translate" | "explain";
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  desc: string;
}

const TASKS: TaskConfig[] = [
  { key: "graph", label: "图谱生成", icon: Cpu, desc: "上传论文后生成知识图谱" },
  { key: "chat", label: "对话编辑", icon: MessageSquare, desc: "通过对话修改图谱" },
  { key: "title", label: "标题精简", icon: Type, desc: "精简论文标题" },
  { key: "translate", label: "选词翻译", icon: Languages, desc: "PDF选中文本翻译为中文" },
  { key: "explain", label: "深入解释", icon: BookOpen, desc: "结合论文上下文解释选中内容" },
];

export function SettingsModal({ open, onClose }: Props) {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState("");

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setSaved(false);
    api.getSettings().then((s) => {
      setSettings(s);
      setApiKeyInput("");
      setShowKey(false);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const handleSave = useCallback(async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        llm_model: settings.llm_model,
        graph_model: settings.graph_model,
        graph_thinking: settings.graph_thinking,
        chat_model: settings.chat_model,
        chat_thinking: settings.chat_thinking,
        title_model: settings.title_model,
        title_thinking: settings.title_thinking,
        translate_model: settings.translate_model,
        translate_thinking: settings.translate_thinking,
        explain_model: settings.explain_model,
        explain_thinking: settings.explain_thinking,
        openai_base_url: settings.openai_base_url,
      };
      if (apiKeyInput) {
        payload.openai_api_key = apiKeyInput;
      }
      const updated = await api.updateSettings(payload as Partial<AppSettings & { openai_api_key: string }>);
      setSettings(updated);
      setApiKeyInput("");
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }, [settings, apiKeyInput]);

  if (!open) return null;

  const update = (field: keyof AppSettings, value: string | boolean) => {
    setSettings((s) => s ? { ...s, [field]: value } : s);
    setSaved(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh]">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-[520px] max-h-[75vh] bg-white rounded-2xl shadow-2xl shadow-black/15 border border-[var(--border)] overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-5 h-12 border-b border-[var(--border)]">
          <span className="text-[14px] font-semibold text-[var(--foreground)]">设置</span>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-black/5 transition-colors">
            <X className="w-4 h-4 text-[var(--muted)]" />
          </button>
        </div>

        <div className="p-5 space-y-5 overflow-y-auto max-h-[calc(75vh-108px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 animate-spin text-[var(--accent)]" />
            </div>
          ) : settings ? (
            <>
              {/* Global */}
              <div>
                <h3 className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider mb-2">
                  通用配置
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <Field
                    label="默认模型"
                    value={settings.llm_model}
                    onChange={(v) => update("llm_model", v)}
                    placeholder="deepseek-v4-pro"
                  />
                  <Field
                    label="Base URL"
                    value={settings.openai_base_url}
                    onChange={(v) => update("openai_base_url", v)}
                    placeholder="https://api.deepseek.com"
                  />
                </div>
                <div className="mt-3">
                  <label className="text-[10px] font-medium text-[var(--muted)] uppercase tracking-wider">
                    API Key
                  </label>
                  <div className="relative mt-1">
                    <input
                      type={showKey ? "text" : "password"}
                      value={apiKeyInput}
                      onChange={(e) => { setApiKeyInput(e.target.value); setSaved(false); }}
                      placeholder={settings.openai_api_key || "sk-..."}
                      className="w-full px-2.5 py-1.5 pr-8 text-[12px] rounded-lg border border-[var(--border)] bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                    >
                      {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  {settings.openai_api_key && !apiKeyInput && (
                    <span className="text-[10px] text-[var(--muted)] mt-0.5 block">
                      当前: {settings.openai_api_key}
                    </span>
                  )}
                </div>
              </div>

              {/* Per-task */}
              {TASKS.map(({ key, label, icon: Icon, desc }) => {
                const modelKey = `${key}_model` as keyof AppSettings;
                const thinkingKey = `${key}_thinking` as keyof AppSettings;
                return (
                  <div key={key} className="rounded-xl border border-[var(--border)] p-3.5">
                    <div className="flex items-center gap-2 mb-2.5">
                      <Icon className="w-3.5 h-3.5 text-[var(--accent)]" />
                      <span className="text-[13px] font-semibold text-[var(--foreground)]">{label}</span>
                      <span className="text-[11px] text-[var(--muted)]">{desc}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={(settings[modelKey] as string) || ""}
                          onChange={(e) => update(modelKey, e.target.value)}
                          placeholder={settings.llm_model || "使用默认模型"}
                          className="w-full px-2.5 py-1.5 text-[12px] rounded-lg border border-[var(--border)] bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)]"
                        />
                      </div>
                      <label className="flex items-center gap-1.5 cursor-pointer select-none shrink-0">
                        <div
                          className={`relative w-8 h-[18px] rounded-full transition-colors ${
                            settings[thinkingKey] ? "bg-[var(--accent)]" : "bg-black/10"
                          }`}
                          onClick={() => update(thinkingKey, !settings[thinkingKey])}
                        >
                          <div
                            className={`absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white shadow-sm transition-transform ${
                              settings[thinkingKey] ? "translate-x-[16px]" : "translate-x-[2px]"
                            }`}
                          />
                        </div>
                        <span className="text-[11px] text-[var(--muted)]">Thinking</span>
                      </label>
                    </div>
                  </div>
                );
              })}
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 h-12 border-t border-[var(--border)] bg-[var(--background)]">
          {saved && (
            <span className="text-[11px] text-emerald-600 font-medium mr-auto">已保存</span>
          )}
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-[12px] font-medium text-[var(--muted)] hover:bg-black/5 rounded-lg transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-[12px] font-semibold text-white bg-[var(--accent)] hover:bg-[#005bb5] rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
            保存
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-[10px] font-medium text-[var(--muted)] uppercase tracking-wider">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full px-2.5 py-1.5 text-[12px] rounded-lg border border-[var(--border)] bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)]"
      />
    </div>
  );
}
