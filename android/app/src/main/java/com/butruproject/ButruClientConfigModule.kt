package com.butruproject

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule

/**
 * Exposes the binary's baked-in store identity to JS.
 *
 * The store id inside the JS bundle is inlined from `.env.<client>` at bundle
 * time by whichever Metro owns port 8081, and every flavor shares that port —
 * so another client's Metro can serve a stale bundle that looks like a
 * different tenant. The values here come from flavor string resources
 * (`client_store_id`, `client_store_slug` written by `npm run clients:sync`),
 * so they always describe the binary that is actually installed.
 */
class ButruClientConfigModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  override fun getName() = NAME

  override fun getConstants(): Map<String, Any> {
    val res = reactApplicationContext.resources
    return mapOf(
      "storeId" to res.getString(R.string.client_store_id),
      "storeSlug" to res.getString(R.string.client_store_slug),
    )
  }

  companion object {
    const val NAME = "ButruClientConfig"
  }
}