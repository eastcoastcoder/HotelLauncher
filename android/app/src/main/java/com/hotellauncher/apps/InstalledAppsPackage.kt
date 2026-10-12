package com.hotellauncher.apps

import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider

class InstalledAppsPackage : BaseReactPackage() {
  override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? {
    if (name == InstalledAppsModule.NAME) {
      return InstalledAppsModule(reactContext)
    }
    return null
  }

  override fun getReactModuleInfoProvider(): ReactModuleInfoProvider {
    return ReactModuleInfoProvider {
      mapOf(
          InstalledAppsModule.NAME to
              ReactModuleInfo(
                  InstalledAppsModule.NAME,
                  InstalledAppsModule::class.java.name,
                  false,
                  false,
                  false,
                  // Legacy module. There is no codegen spec, and NativeModules
                  // reaches it through the new-architecture interop layer.
                  false,
              ),
      )
    }
  }
}
