import UIKit
import Capacitor
import WebKit

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?
    private var windowControlsObserver: WindowControlsObserver?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Override point for customization after application launch.
        return true
    }

    func applicationWillResignActive(_ application: UIApplication) {
        // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
        // Use this method to pause ongoing tasks, disable timers, and invalidate graphics rendering callbacks. Games should use this method to pause the game.
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
        // If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        // Called as part of the transition from the background to the active state; here you can undo many of the changes made on entering the background.
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        // Work around an iOS WKWebView bug where viewport units (vw, vh)
        // become stale after the app resumes from background. Forcing a
        // layout pass may cause WebKit to recalculate them.
        // See https://bugs.webkit.org/show_bug.cgi?id=170595
        guard let vc = window?.rootViewController as? CAPBridgeViewController,
              let webView = vc.webView else { return }
        webView.setNeedsLayout()
        webView.layoutIfNeeded()

        setupWindowControlsObserver(webView: webView)
    }

    /// Adds an invisible view that tracks the iPadOS 26 window-controls
    /// corner adaptation margin and injects it as a CSS variable.
    private func setupWindowControlsObserver(webView: WKWebView) {
        guard windowControlsObserver == nil,
              let parent = webView.superview else { return }
        let observer = WindowControlsObserver()
        observer.attach(to: webView)
        observer.translatesAutoresizingMaskIntoConstraints = false
        observer.isUserInteractionEnabled = false
        observer.alpha = 0
        observer.isAccessibilityElement = false
        observer.accessibilityElementsHidden = true
        parent.insertSubview(observer, belowSubview: webView)
        NSLayoutConstraint.activate([
            observer.topAnchor.constraint(equalTo: webView.topAnchor),
            observer.leadingAnchor.constraint(equalTo: webView.leadingAnchor),
            observer.trailingAnchor.constraint(equalTo: webView.trailingAnchor),
            observer.bottomAnchor.constraint(equalTo: webView.bottomAnchor),
        ])
        windowControlsObserver = observer
        parent.layoutIfNeeded()
        observer.injectWindowControlsInset()
    }

    func applicationWillTerminate(_ application: UIApplication) {
        // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        // Called when the app was launched with a url. Feel free to add additional processing here,
        // but if you want the App API to support tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        // Called when the app was launched with an activity, including Universal Links.
        // Feel free to add additional processing here, but if you want the App API to support
        // tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }

}

/// Invisible view that observes layout changes to detect the iPadOS 26
/// window-controls region and inject its width as a CSS custom property
/// (`--window-controls-left`) into the Capacitor web view.
///
/// On older iOS versions or when window controls are absent the value is 0.
private class WindowControlsObserver: UIView {
    weak var webView: WKWebView?
    private var lastLeft: CGFloat = -1
    private var loadingObservation: NSKeyValueObservation?

    func attach(to webView: WKWebView) {
        self.webView = webView
        // Re-inject after page reload (document.documentElement is replaced).
        loadingObservation = webView.observe(\.isLoading) { [weak self] wv, _ in
            if !wv.isLoading {
                self?.lastLeft = -1
                self?.injectWindowControlsInset()
            }
        }
    }

    override func layoutSubviews() {
        super.layoutSubviews()
        injectWindowControlsInset()
    }

    func injectWindowControlsInset() {
        var left: CGFloat = 0
        if #available(iOS 26.0, *) {
            let corner = edgeInsets(
                for: .margins(cornerAdaptation: .horizontal)
            )
            let base = edgeInsets(for: .margins())
            // Only non-zero when window controls are actually present.
            // Use the full corner value so the variable represents the
            // complete inset from the window edge.
            if corner.left > base.left {
                left = corner.left
            }
        }
        guard left != lastLeft else { return }
        lastLeft = left
        let px = Int(left)
        let js = "document.documentElement.style.setProperty('--window-controls-left','\(px)px')"
        DispatchQueue.main.async { [weak self] in
            self?.webView?.evaluateJavaScript(js, completionHandler: nil)
        }
    }
}
