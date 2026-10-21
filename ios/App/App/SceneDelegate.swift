import UIKit
import Capacitor
import WebKit

class SceneDelegate: UIResponder, UIWindowSceneDelegate {

    var window: UIWindow?
    private var windowControlsObserver: WindowControlsObserver?
    private var didInstallViewportZoomScript = false

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = scene as? UIWindowScene else { return }

        // The scene delegate owns the window and root view controller under the
        // UIScene lifecycle; Main.storyboard no longer provides them.
        window = UIWindow(windowScene: windowScene)
        window?.rootViewController = CAPBridgeViewController()
        window?.makeKeyAndVisible()

        SceneDelegateProxy.shared.scene(scene, willConnectTo: session, options: connectionOptions)
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        // Called when the app is asked to open a url, including .hex files.
        SceneDelegateProxy.shared.scene(scene, openURLContexts: URLContexts)
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        // Called when the app was launched with an activity, including Universal Links.
        SceneDelegateProxy.shared.scene(scene, continue: userActivity)
    }

    func sceneDidBecomeActive(_ scene: UIScene) {
        // Work around an iOS WKWebView bug where viewport units (vw, vh)
        // become stale after the app resumes from background. Forcing a
        // layout pass may cause WebKit to recalculate them.
        // See https://bugs.webkit.org/show_bug.cgi?id=170595
        guard let vc = window?.rootViewController as? CAPBridgeViewController,
              let webView = vc.webView else { return }
        webView.setNeedsLayout()
        webView.layoutIfNeeded()

        setupWindowControlsObserver(webView: webView)
        setupViewportZoomWorkaround(webView: webView)
    }

    /// Disables web-content zoom (double-tap and pinch) in the native app by
    /// injecting `user-scalable=no` into the viewport meta tag.
    ///
    /// Works around an iPadOS WKWebView bug where double-tapping a data
    /// sample's close button can leave the app zoomed in with no easy way to
    /// zoom back out (#942). The shared `index.html` viewport is deliberately
    /// left untouched so the website keeps pinch-to-zoom for accessibility;
    /// native users retain the iOS system Zoom (Accessibility) feature.
    private func setupViewportZoomWorkaround(webView: WKWebView) {
        guard !didInstallViewportZoomScript else { return }
        didInstallViewportZoomScript = true

        let js = """
        var v = document.querySelector('meta[name=viewport]');
        if (v) {
          var c = v.getAttribute('content') || '';
          if (!/user-scalable/.test(c)) {
            v.setAttribute('content', c + ', user-scalable=no');
          }
        }
        """
        // Re-applies on every future navigation/reload.
        let script = WKUserScript(
            source: js,
            injectionTime: .atDocumentEnd,
            forMainFrameOnly: true
        )
        webView.configuration.userContentController.addUserScript(script)
        // The current page has already started loading by the time we run, so
        // apply once directly too.
        webView.evaluateJavaScript(js, completionHandler: nil)
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
