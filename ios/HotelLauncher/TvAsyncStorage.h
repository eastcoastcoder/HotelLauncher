#import <React/RCTBridgeModule.h>

// Stand-in for @react-native-async-storage/async-storage. That pod vendors an
// xcframework with no tvOS slice. The JS package calls these legacy methods.
@interface TvAsyncStorage : NSObject <RCTBridgeModule>
@end
