import { Asset } from 'expo-asset';

/** Bundled brand mark — Orthodoxy church silhouette used on welcome. */
export const PAROHIA_ICON = require('../assets/images/parohia_icon.png');

/** Native splash mark — keep LoadingScreen in lockstep with expo-splash-screen. */
export const PAROHIA_SPLASH_ICON = require('../assets/images/Splash.png');

let brandAssetsReady = false;
let brandAssetsPromise: Promise<void> | null = null;

/** Prefetch the church mark into memory before splash / welcome reveal. */
export async function preloadBrandAssets(): Promise<void> {
  if (brandAssetsReady) return;
  if (!brandAssetsPromise) {
    brandAssetsPromise = Asset.loadAsync([PAROHIA_ICON, PAROHIA_SPLASH_ICON])
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
