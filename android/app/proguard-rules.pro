# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# If your project uses WebView with JS, uncomment the following
# and specify the fully qualified class name to the JavaScript interface
# class:
#-keepclassmembers class fqcn.of.javascript.interface.for.webview {
#   public *;
#}

# Uncomment this to preserve the line number information for
# debugging stack traces.
#-keepattributes SourceFile,LineNumberTable

# If you keep the line number information, uncomment this to
# hide the original source file name.
#-renamesourcefileattribute SourceFile

# Capacitor annotations: required below Capacitor 8.6.0 in R8 full mode (ionic-team/capacitor#8589)
-keep @interface com.getcapacitor.** { *; }

# Plugin-specific rules from each plugin's README
-keep class io.capawesome.capacitorjs.plugins.** { *; }

# Optional backends that plugins probe for at runtime (see missing_rules.txt)
-dontwarn io.requery.android.database.**
-dontwarn net.zetetic.database.**
