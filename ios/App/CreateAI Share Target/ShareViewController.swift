//
//  ShareViewController.swift
//  CreateAI Share Target
//
//  Created by Alex Shaw (mb) on 15/12/2025.
//

import UIKit
import Social
import UniformTypeIdentifiers

let containerGroupName = "group.org.microbit.createai"

class ShareViewController: SLComposeServiceViewController {

    override func isContentValid() -> Bool {
        // Do validation of contentText and/or NSExtensionContext attachments here
        return true
    }

    override func didSelectPost() {
        guard let extensionItems = extensionContext?.inputItems as? [NSExtensionItem] else { return }

        for item in extensionItems {
            guard let attachments = item.attachments else { continue }
            
            for provider in attachments {
                if provider.hasItemConformingToTypeIdentifier(UTType.data.identifier) {
                    provider.loadItem(forTypeIdentifier: UTType.data.identifier, options: nil) { (dataItem, error) in
                        if let url = dataItem as? URL {
                            if let destinationURL = try? self.makeLocalCopyOfHex(url) {
                                self.openMainApp(destinationURL)
                            } else {
                                print("Failed to copy shared data to CreateAI")
                            }
                        } else {
                            print("Unexpected data type:", type(of: dataItem))
                        }
                    }
                }
            }
        }
        self.extensionContext?.completeRequest(returningItems: nil)
    }

    // This has to happen in the share target, as it has permission to see the incoming
    // file and also to write to our own storage.
    func makeLocalCopyOfHex(_ fileURL: URL) throws -> URL {
        let containerURL = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: containerGroupName)!
        
        let destinationURL = containerURL.appendingPathComponent(fileURL.lastPathComponent)

        if FileManager.default.fileExists(atPath: destinationURL.path) {
            try FileManager.default.removeItem(at: destinationURL)
        }
        try FileManager.default.copyItem(at: fileURL, to: destinationURL)
        return destinationURL
    }
    
    func openMainApp(_ urlToOpen: URL) {
        // pop the "file" and replace it with our custom scheme
        var components = URLComponents(url: urlToOpen, resolvingAgainstBaseURL: false)!
        components.scheme = "mbcreateai"
        let url = components.url
        
        DispatchQueue.main.async {
        
            var responder: UIResponder? = self
            while responder != nil {
                    if let application = responder as? UIApplication {
                        application.perform(#selector(UIApplication.open(_:options:completionHandler:)),
                                            with: url,
                                            with: nil)
                        break
                    }
                responder = responder?.next
            }
        }
    }
    
    override func configurationItems() -> [Any]! {
        // To add configuration options via table cells at the bottom of the sheet, return an array of SLComposeSheetConfigurationItem here.
        return []
    }

}
