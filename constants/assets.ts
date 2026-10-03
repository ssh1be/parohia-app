import { Asset } from 'expo-asset';

/** Bundled brand mark — Orthodoxy church silhouette used on welcome. */
export const PAROHIA_ICON = require('../assets/images/parohia_icon.png');

let brandAssetsReady = false;
let brandAssetsPromise: Promise<void> | null = null;

/** Prefetch the church mark into memory before splash / welcome reveal. */
export async function preloadBrandAssets(): Promise<void> {
  if (brandAssetsReady) return;
  if (!brandAssetsPromise) {
    brandAssetsPromise = Asset.loadAsync([PAROHIA_ICON])
      .then(() => {
        brandAssetsReady = true;
      })
      .catch((error) => {
        brandAssetsPromise = null;
        throw error;
      });
  }
  await brandAssetsPromise;
}

export function areBrandAssetsReady(): boolean {
  return brandAssetsReady;
}
