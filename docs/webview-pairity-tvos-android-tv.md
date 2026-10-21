To maintain strict parity between your Android TV and Apple tvOS targets within the same bare React Native project while leaning into a native player wrapper like YTPlayerView, you will need to build a unified React Native Custom Native Component.
Because Android TV can easily use a native Android library (like android-youtube-player), and Apple tvOS can use Google's native youtube-ios-player-helper Cocoapod, you can abstract them under a single React Native API wrapper.
Here is the exact blueprint to create an explicit cross-platform native abstraction (NativeYouTubePlayer) without writing complex, fragmented platform code inside your Javascript views.

Step 1: Create the Shared JavaScript Component Layer

Create a unified interface file called NativeYouTubePlayer.tsx (or .js). React Native will automatically bundle the platform-specific native file based on the extension (.android.js and .ios.js).
tsx
// NativeYouTubePlayer.tsx
import { requireNativeComponent, ViewStyle } from 'react-native';

interface YouTubePlayerProps {
  videoId: string;
  play?: boolean;
  style?: ViewStyle;
}

// Maps to the native module registered on both Android and tvOS
export const NativeYouTubePlayer = requireNativeComponent<YouTubePlayerProps>('NativeYouTubePlayer');

Step 2: Implement the Apple tvOS Native Layer (Objective-C/Swift)

1. Open your terminal, navigate to your /ios folder, and make sure your Podfile targets tvOS.
2. Add the native dependency to your Podfile:ruby
pod 'youtube-ios-player-helper'
3. Run pod install.
4. Create the native Manager (NativeYouTubePlayerManager.m) to register the component layout:
objectivec
// NativeYouTubePlayerManager.m
#import <React/RCTViewManager.h>
#import <youtube-ios-player-helper/YTPlayerView.h>

@interface NativeYouTubePlayerManager : RCTViewManager
@end

@implementation NativeYouTubePlayerManager

RCT_EXPORT_MODULE(NativeYouTubePlayer)

- (UIView *)view {
  // Returns the Google YTPlayerView native component 
  return [[YTPlayerView alloc] init];
}

// Expose the videoId prop to JS
RCT_CUSTOM_VIEW_PROPERTY(videoId, NSString, YTPlayerView) {
  if (json) {
    [view loadWithVideoId:[RCTConvert NSString:json]];
  }
}

// Expose the play/pause state control to JS
RCT_CUSTOM_VIEW_PROPERTY(play, BOOL, YTPlayerView) {
  if (json) {
    BOOL shouldPlay = [RCTConvert BOOL:json];
    if (shouldPlay) {
      [view playVideo];
    } else {
      [view pauseVideo];
    }
  }
}

@end

Step 3: Implement the Android TV Native Layer (Kotlin/Java)

On Android, rather than a WebView framework, you want a lightweight native player component optimized for leanback TV architecture.
1. Add the dependency in your /android/app/build.gradle:groovy
dependencies {
    implementation 'com.pierfrancescosoffritti.androidyoutubeplayer:core:12.1.0'
}
2. Create your view manager (NativeYouTubePlayerManager.kt) to bind properties exactly like the iOS module side:
kotlin
// NativeYouTubePlayerManager.kt
package com.yourapp

import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp
import com.pierfrancescosoffritti.androidyoutubeplayer.core.player.views.YouTubePlayerView
import com.pierfrancescosoffritti.androidyoutubeplayer.core.player.YouTubePlayer
import com.pierfrancescosoffritti.androidyoutubeplayer.core.player.listeners.AbstractYouTubePlayerListener

class NativeYouTubePlayerManager : SimpleViewManager<YouTubePlayerView>() {

    override fun getName() = "NativeYouTubePlayer"

    private var activePlayer: YouTubePlayer? = null
    private var currentVideoId: String? = null

    override fun createViewInstance(reactContext: ThemedReactContext): YouTubePlayerView {
        val playerView = YouTubePlayerView(reactContext)
        reactContext.currentActivity?.lifecycle?.addObserver(playerView)
        
        playerView.initialize(object : AbstractYouTubePlayerListener() {
            override fun onReady(youTubePlayer: YouTubePlayer) {
                activePlayer = youTubePlayer
                currentVideoId?.let { youTubePlayer.cueVideo(it, 0f) }
            }
        })
        return playerView
    }

    @ReactProp(name = "videoId")
    fun setVideoId(view: YouTubePlayerView, videoId: String?) {
        currentVideoId = videoId
        activePlayer?.cueVideo(videoId ?: "", 0f)
    }

    @ReactProp(name = "play")
    fun setPlay(view: YouTubePlayerView, play: Boolean) {
        if (play) {
            activePlayer?.play()
        } else {
            activePlayer?.pause()
        }
    }
}
3. Register your manager component layout within your application's ReactPackage wrapper array list.

Step 4: Consume Seamlessly in Your TV Views

Now, your application logic stays perfectly standard and unified. You do not need conditional Platform.OS === 'ios' branches scattered in your media pages.
tsx
import React, { useState } from 'react';
import { View, StyleSheet, Button } from 'react-native';
import { NativeYouTubePlayer } from './NativeYouTubePlayer';

export default function TVPlayerScreen() {
  const [isPlaying, setIsPlaying] = useState(true);

  return (
    <View style={styles.container}>
      <NativeYouTubePlayer 
        videoId="dQw4w9WgXcQ" 
        play={isPlaying}
        style={styles.tvPlayerLayout} 
      />
      
      <Button 
        title={isPlaying ? "Pause Video" : "Play Video"} 
        onPress={() => setIsPlaying(!isPlaying)} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  tvPlayerLayout: { width: 1280, height: 720 }, // TV HD standard bounding box
});