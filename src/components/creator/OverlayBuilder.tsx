"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Layers,
  Plus,
  Copy,
  Trash2,
  Settings2,
  Eye,
  EyeOff,
  ChevronDown,
  Check,
  ExternalLink,
  Loader2,
  Palette,
  Layout,
  Type,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOverlays, getOverlayUrl } from "@/lib/hooks/useCreatorProfile";
import {
  OVERLAY_TYPES,
  type OverlayType,
  type OverlayConfig,
  type StreamerOverlay,
} from "@/types/creator";

interface OverlayBuilderProps {
  maxOverlays?: number;
}

export function OverlayBuilder({ maxOverlays = Infinity }: OverlayBuilderProps) {
  const {
    overlays,
    isLoading,
    createOverlay,
    isCreating,
    updateOverlay,
    isUpdating,
    deleteOverlay,
    isDeleting,
  } = useOverlays();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingOverlay, setEditingOverlay] = useState<StreamerOverlay | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyUrl = async (overlay: StreamerOverlay) => {
    const url = getOverlayUrl(overlay.token);
    await navigator.clipboard.writeText(url);
    setCopiedId(overlay.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggleActive = async (overlay: StreamerOverlay) => {
    await updateOverlay(overlay.id, { is_active: !overlay.is_active });
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this overlay?")) {
      await deleteOverlay(id);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 bg-card animate-pulse rounded-xl" />
        ))}
      </div>
    );
  }

  const canCreateMore = overlays.length < maxOverlays;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Stream Overlays</h2>
          <p className="text-muted-foreground mt-1">
            Create overlays for OBS, Streamlabs, and other streaming software
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          disabled={!canCreateMore}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Overlay
        </Button>
      </div>

      {/* Overlay limit warning */}
      {!canCreateMore && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 text-sm">
          <p className="text-yellow-500">
            You've reached your overlay limit ({maxOverlays}). Upgrade your
            creator tier to create more overlays.
          </p>
        </div>
      )}

      {/* Overlays List */}
      {overlays.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-xl border border-border">
          <Layers className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No Overlays Yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first overlay to display on your streams
          </p>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Overlay
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {overlays.map((overlay) => (
            <OverlayCard
              key={overlay.id}
              overlay={overlay}
              onCopy={() => handleCopyUrl(overlay)}
              onToggleActive={() => handleToggleActive(overlay)}
              onEdit={() => setEditingOverlay(overlay)}
              onDelete={() => handleDelete(overlay.id)}
              isCopied={copiedId === overlay.id}
              isUpdating={isUpdating}
              isDeleting={isDeleting}
            />
          ))}
        </div>
      )}

      {/* Create Modal */}
      <CreateOverlayModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={async (data) => {
          await createOverlay(data);
          setShowCreateModal(false);
        }}
        isCreating={isCreating}
      />

      {/* Edit Modal */}
      {editingOverlay && (
        <EditOverlayModal
          overlay={editingOverlay}
          onClose={() => setEditingOverlay(null)}
          onSave={async (config) => {
            await updateOverlay(editingOverlay.id, { config });
            setEditingOverlay(null);
          }}
          isUpdating={isUpdating}
        />
      )}
    </div>
  );
}

// Overlay Card Component
interface OverlayCardProps {
  overlay: StreamerOverlay;
  onCopy: () => void;
  onToggleActive: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isCopied: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
}

function OverlayCard({
  overlay,
  onCopy,
  onToggleActive,
  onEdit,
  onDelete,
  isCopied,
  isUpdating,
  isDeleting,
}: OverlayCardProps) {
  const typeInfo = OVERLAY_TYPES[overlay.type as OverlayType];
  const overlayUrl = getOverlayUrl(overlay.token);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-card rounded-xl border p-4 ${
        overlay.is_active ? "border-primary/50" : "border-border"
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Layers className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">{overlay.name}</h3>
              <p className="text-sm text-muted-foreground">{typeInfo?.name}</p>
            </div>
            {overlay.is_active ? (
              <span className="px-2 py-0.5 text-xs bg-green-500/10 text-green-500 rounded-full">
                Active
              </span>
            ) : (
              <span className="px-2 py-0.5 text-xs bg-muted text-muted-foreground rounded-full">
                Inactive
              </span>
            )}
          </div>

          <div className="mt-3 flex items-center gap-2">
            <code className="text-xs bg-muted px-2 py-1 rounded truncate max-w-xs">
              {overlayUrl}
            </code>
            <Button size="sm" variant="ghost" onClick={onCopy}>
              {isCopied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
            <Button size="sm" variant="ghost" asChild>
              <a href={overlayUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={onToggleActive}
            disabled={isUpdating}
          >
            {overlay.is_active ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
          <Button size="sm" variant="ghost" onClick={onEdit}>
            <Settings2 className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onDelete}
            disabled={isDeleting}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

// Create Overlay Modal
interface CreateOverlayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: { name: string; type: OverlayType; config: OverlayConfig }) => Promise<void>;
  isCreating: boolean;
}

function CreateOverlayModal({
  isOpen,
  onClose,
  onCreate,
  isCreating,
}: CreateOverlayModalProps) {
  const [step, setStep] = useState<"type" | "name">("type");
  const [selectedType, setSelectedType] = useState<OverlayType | null>(null);
  const [name, setName] = useState("");

  const handleCreate = async () => {
    if (!selectedType || !name.trim()) return;

    const typeInfo = OVERLAY_TYPES[selectedType];
    const config: OverlayConfig = {
      type: selectedType,
      theme: "dark",
      position: { x: 0, y: 0 },
      size: typeInfo.defaultSize,
      opacity: 100,
      borderRadius: 8,
      showBackground: true,
    };

    await onCreate({ name: name.trim(), type: selectedType, config });
    setStep("type");
    setSelectedType(null);
    setName("");
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative bg-card rounded-xl border border-border shadow-xl w-full max-w-lg mx-4 p-6"
        >
          <h2 className="text-xl font-semibold mb-4">
            {step === "type" ? "Choose Overlay Type" : "Name Your Overlay"}
          </h2>

          {step === "type" ? (
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(OVERLAY_TYPES).map(([key, type]) => (
                <button
                  key={key}
                  onClick={() => {
                    setSelectedType(key as OverlayType);
                    setStep("name");
                  }}
                  className={`p-4 rounded-lg border text-left transition-colors ${
                    selectedType === key
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <h3 className="font-medium">{type.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {type.description}
                  </p>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Overlay Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="My Stream Overlay"
                  className="w-full px-4 py-2 rounded-lg border border-input bg-background"
                  autoFocus
                />
              </div>

              {selectedType && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium">
                    {OVERLAY_TYPES[selectedType].name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {OVERLAY_TYPES[selectedType].description}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 mt-6">
            {step === "name" && (
              <Button
                variant="outline"
                onClick={() => {
                  setStep("type");
                  setName("");
                }}
              >
                Back
              </Button>
            )}
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            {step === "name" && (
              <Button
                onClick={handleCreate}
                disabled={!name.trim() || isCreating}
              >
                {isCreating ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Create Overlay
              </Button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// Edit Overlay Modal
interface EditOverlayModalProps {
  overlay: StreamerOverlay;
  onClose: () => void;
  onSave: (config: Partial<OverlayConfig>) => Promise<void>;
  isUpdating: boolean;
}

function EditOverlayModal({
  overlay,
  onClose,
  onSave,
  isUpdating,
}: EditOverlayModalProps) {
  const [config, setConfig] = useState<OverlayConfig>(overlay.config as OverlayConfig);
  const [activeTab, setActiveTab] = useState<"layout" | "style" | "content">("layout");

  const handleSave = async () => {
    await onSave(config);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-card rounded-xl border border-border shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden flex flex-col"
      >
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-semibold">Edit {overlay.name}</h2>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          {[
            { id: "layout", label: "Layout", icon: Layout },
            { id: "style", label: "Style", icon: Palette },
            { id: "content", label: "Content", icon: Type },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === id
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === "layout" && (
            <>
              <div>
                <label className="text-sm font-medium mb-2 block">Size</label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground">Width</label>
                    <input
                      type="number"
                      value={config.size?.width || 400}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          size: { ...config.size, width: parseInt(e.target.value) || 400 },
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-input bg-background"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Height</label>
                    <input
                      type="number"
                      value={config.size?.height || 200}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          size: { ...config.size, height: parseInt(e.target.value) || 200 },
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-input bg-background"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Border Radius: {config.borderRadius}px
                </label>
                <input
                  type="range"
                  min={0}
                  max={32}
                  value={config.borderRadius}
                  onChange={(e) =>
                    setConfig({ ...config, borderRadius: parseInt(e.target.value) })
                  }
                  className="w-full"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Opacity: {config.opacity}%
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={config.opacity}
                  onChange={(e) =>
                    setConfig({ ...config, opacity: parseInt(e.target.value) })
                  }
                  className="w-full"
                />
              </div>
            </>
          )}

          {activeTab === "style" && (
            <>
              <div>
                <label className="text-sm font-medium mb-2 block">Theme</label>
                <div className="grid grid-cols-4 gap-2">
                  {(["dark", "light", "transparent", "custom"] as const).map(
                    (theme) => (
                      <button
                        key={theme}
                        onClick={() => setConfig({ ...config, theme })}
                        className={`px-3 py-2 rounded-lg border text-sm capitalize ${
                          config.theme === theme
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        {theme}
                      </button>
                    )
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Show Background</label>
                <button
                  onClick={() =>
                    setConfig({ ...config, showBackground: !config.showBackground })
                  }
                  className={`w-12 h-6 rounded-full transition-colors ${
                    config.showBackground ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transform transition-transform ${
                      config.showBackground ? "translate-x-6" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>

              {config.theme === "custom" && (
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground">Background</label>
                    <input
                      type="color"
                      value={config.backgroundColor || "#1a1a1a"}
                      onChange={(e) =>
                        setConfig({ ...config, backgroundColor: e.target.value })
                      }
                      className="w-full h-10 rounded cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Text</label>
                    <input
                      type="color"
                      value={config.textColor || "#ffffff"}
                      onChange={(e) =>
                        setConfig({ ...config, textColor: e.target.value })
                      }
                      className="w-full h-10 rounded cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Accent</label>
                    <input
                      type="color"
                      value={config.accentColor || "#8b5cf6"}
                      onChange={(e) =>
                        setConfig({ ...config, accentColor: e.target.value })
                      }
                      className="w-full h-10 rounded cursor-pointer"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm font-medium mb-2 block">Animation</label>
                <div className="grid grid-cols-4 gap-2">
                  {(["none", "fade", "slide", "bounce"] as const).map((anim) => (
                    <button
                      key={anim}
                      onClick={() => setConfig({ ...config, animation: anim })}
                      className={`px-3 py-2 rounded-lg border text-sm capitalize ${
                        config.animation === anim
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      {anim}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === "content" && (
            <div className="text-center py-8 text-muted-foreground">
              <Sparkles className="h-12 w-12 mx-auto mb-4" />
              <p>Content settings vary by overlay type.</p>
              <p className="text-sm mt-2">
                Configure what data to display in the preview.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isUpdating}>
            {isUpdating ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Save Changes
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
