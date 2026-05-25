// Sequential blob download — mirrors share-cards.ts; browsers cancel later
// downloads if you fire them all synchronously, so we stagger.

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export async function downloadAll(
  blobs: Blob[],
  filenamePrefix: string,
): Promise<void> {
  for (let i = 0; i < blobs.length; i++) {
    downloadBlob(blobs[i], `${filenamePrefix}-${String(i + 1).padStart(2, "0")}.png`);
    await new Promise((r) => setTimeout(r, 400));
  }
}
