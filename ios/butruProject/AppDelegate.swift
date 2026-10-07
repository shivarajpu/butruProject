import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    let delegate = ReactNativeDelegate()
    let factory = RCTReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    delegate.bakeStoreIdentity()

    window = UIWindow(frame: UIScreen.main.bounds)

    factory.startReactNative(
      withModuleName: "butruProject",
      in: window,
      launchOptions: launchOptions
    )

    return true
  }
}

class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

  /// Points the debug app at its own client's Metro.
  ///
  /// React's packager port is the compile-time `RCT_METRO_PORT` define, which is
  /// always 8081, so a client whose bundler runs on any other port fails with
  /// "No script URL provided" even though the server is up and reachable. Each
  /// client's xcconfig sets `RCT_METRO_PORT`, Info.plist substitutes it into
  /// `MetroPort`, and we hand that to `RCTBundleURLProvider` — which prefers
  /// `jsLocation` over the compiled-in default.
  private func applyClientPackagerPort() {
    guard
      let raw = Bundle.main.object(forInfoDictionaryKey: "MetroPort") as? String,
      let port = Int(raw.trimmingCharacters(in: .whitespacesAndNewlines)),
      port > 0
    else {
      // No usable port for this client, so leave React's default in place.
      return
    }

    RCTBundleURLProvider.sharedSettings().jsLocation = "localhost:\(port)"
  }

  /// Passes the binary's baked-in store identity to JS through NSUserDefaults,
  /// where React Native's Settings module picks it up.
  ///
  /// The store id in the JS bundle comes from whichever Metro served 8081 — the
  /// `.env.<client>` file is inlined at bundle time. With both flavours sharing
  /// port 8081, another client's Metro can serve a stale bundle (wrong tenant),
  /// so the auth payload's storeId must come from the binary, not the bundle.
  fileprivate func bakeStoreIdentity() {
    let defaults = UserDefaults.standard
    guard let id = Bundle.main.object(forInfoDictionaryKey: "ClientStoreId") as? String,
          let slug = Bundle.main.object(forInfoDictionaryKey: "ClientStoreSlug") as? String
    else {
      return
    }
    defaults.set(id, forKey: "ButruClientStoreId")
    defaults.set(slug, forKey: "ButruClientStoreSlug")
  }

  override func bundleURL() -> URL? {
#if DEBUG
    applyClientPackagerPort()
    return RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
    return Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}
