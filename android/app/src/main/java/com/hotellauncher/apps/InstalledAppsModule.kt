package com.hotellauncher.apps

import android.content.Intent
import android.content.pm.PackageManager
import android.content.pm.ResolveInfo
import android.os.Build
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.module.annotations.ReactModule

@ReactModule(name = InstalledAppsModule.NAME)
class InstalledAppsModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = NAME

  @ReactMethod
  fun listInstalledApps(promise: Promise) {
    try {
      val packageManager = reactApplicationContext.packageManager
      val apps = linkedMapOf<String, String>()
      collect(packageManager, Intent.CATEGORY_LEANBACK_LAUNCHER, apps)
      collect(packageManager, Intent.CATEGORY_LAUNCHER, apps)
      val rows = Arguments.createArray()
      apps.entries
          .sortedWith(compareBy({ it.value.lowercase() }, { it.key }))
          .forEach { (appId, label) ->
            val row = Arguments.createMap()
            row.putString("appId", appId)
            row.putString("label", label)
            rows.pushMap(row)
          }
      promise.resolve(rows)
    } catch (error: Exception) {
      promise.reject("LIST_FAILED", error.message, error)
    }
  }

  @ReactMethod
  fun launchApp(appId: String, promise: Promise) {
    val packageManager = reactApplicationContext.packageManager
    val intent =
        packageManager.getLeanbackLaunchIntentForPackage(appId)
            ?: packageManager.getLaunchIntentForPackage(appId)
    if (intent == null) {
      promise.reject("NOT_FOUND", "No launchable activity for $appId")
      return
    }
    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    UiThreadUtil.runOnUiThread {
      try {
        val activity = reactApplicationContext.currentActivity
        if (activity != null) {
          activity.startActivity(intent)
        } else {
          reactApplicationContext.startActivity(intent)
        }
        promise.resolve(true)
      } catch (error: Exception) {
        promise.reject("LAUNCH_FAILED", error.message, error)
      }
    }
  }

  @ReactMethod
  fun getCustomAppIds(promise: Promise) {
    val stored = Arguments.createMap()
    preferences().all.forEach { (menuItemId, value) ->
      if (value is String && value.isNotBlank()) {
        stored.putString(menuItemId, value)
      }
    }
    promise.resolve(stored)
  }

  @ReactMethod
  fun setCustomAppId(menuItemId: String, appId: String, promise: Promise) {
    val saved = preferences().edit().putString(menuItemId, appId).commit()
    if (saved) {
      promise.resolve(null)
    } else {
      promise.reject("SAVE_FAILED", "Could not save the custom app")
    }
  }

  @ReactMethod
  fun clearCustomAppId(menuItemId: String, promise: Promise) {
    val saved = preferences().edit().remove(menuItemId).commit()
    if (saved) {
      promise.resolve(null)
    } else {
      promise.reject("SAVE_FAILED", "Could not clear the custom app")
    }
  }

  private fun preferences() =
      reactApplicationContext.getSharedPreferences(PREFS, android.content.Context.MODE_PRIVATE)

  private fun collect(
      packageManager: PackageManager,
      category: String,
      apps: MutableMap<String, String>,
  ) {
    val intent = Intent(Intent.ACTION_MAIN).addCategory(category)
    for (info in query(packageManager, intent)) {
      val appId = info.activityInfo?.packageName ?: continue
      if (appId == reactApplicationContext.packageName || apps.containsKey(appId)) {
        continue
      }
      val label = info.loadLabel(packageManager)?.toString()?.trim().orEmpty()
      apps[appId] = if (label.isEmpty()) appId else label
    }
  }

  private fun query(packageManager: PackageManager, intent: Intent): List<ResolveInfo> {
    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      packageManager.queryIntentActivities(intent, PackageManager.ResolveInfoFlags.of(0))
    } else {
      @Suppress("DEPRECATION")
      packageManager.queryIntentActivities(intent, 0)
    }
  }

  companion object {
    const val NAME = "InstalledApps"
    private const val PREFS = "stream_custom_apps"
  }
}
