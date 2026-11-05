import UIKit
import Capacitor

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Override point for customization after application launch.
        return true
    }

    func application(_ application: UIApplication, configurationForConnecting connectingSceneSession: UISceneSession, options: UIScene.ConnectionOptions) -> UISceneConfiguration {
        // Under the UIScene lifecycle the window, the url/universal link handlers and the
        // foreground/background callbacks all live in SceneDelegate instead of here.
        let config = UISceneConfiguration(name: "Default Configuration", sessionRole: connectingSceneSession.role)
        // Only the app window gets a SceneDelegate (and so a web view). Other roles,
        // such as external displays and AirPlay, keep the default so iOS mirrors the
        // device instead of starting a second copy of the app.
        // See https://github.com/ionic-team/capacitor/issues/8648
        if connectingSceneSession.role == .windowApplication {
            config.delegateClass = SceneDelegate.self
        }
        return config
    }
}
