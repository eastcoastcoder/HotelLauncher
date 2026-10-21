#import "NativeYouTubePlayerManager.h"

#import <AVFoundation/AVFoundation.h>
#import <React/RCTConvert.h>

// tvOS has no WebKit, so youtube-ios-player-helper cannot load. AVPlayer plays
// the HLS manifest or a muxed MP4 from YouTube's player clients. A failure is
// reported to JS and the stage falls back to the static card.

// POST bodies differ per video, but the URL does not. The shared session would
// replay the first response for every later video.
static NSURLSession *HotelYouTubeSession(void) {
  static NSURLSession *session;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    NSURLSessionConfiguration *config = [NSURLSessionConfiguration ephemeralSessionConfiguration];
    config.requestCachePolicy = NSURLRequestReloadIgnoringLocalCacheData;
    session = [NSURLSession sessionWithConfiguration:config];
  });
  return session;
}

@interface HotelYouTubePlayerView : UIView
@property (nonatomic, copy) NSString *videoId;
@property (nonatomic, assign) BOOL play;
@property (nonatomic, assign) BOOL muted;
@property (nonatomic, copy) RCTBubblingEventBlock onStatus;
@end

@implementation HotelYouTubePlayerView {
  AVPlayer *_player;
  AVPlayerLayer *_playerLayer;
  AVPlayerItem *_item;
  id _endObserver;
  NSURLSessionDataTask *_task;
  NSInteger _request;
  BOOL _started;
}

- (instancetype)initWithFrame:(CGRect)frame {
  if (self = [super initWithFrame:frame]) {
    self.backgroundColor = UIColor.blackColor;
    _play = YES;
    _player = [AVPlayer playerWithPlayerItem:nil];
    _player.actionAtItemEnd = AVPlayerActionAtItemEndPause;
    _playerLayer = [AVPlayerLayer playerLayerWithPlayer:_player];
    _playerLayer.videoGravity = AVLayerVideoGravityResizeAspectFill;
    _playerLayer.frame = self.bounds;
    [self.layer addSublayer:_playerLayer];
    [[AVAudioSession sharedInstance] setCategory:AVAudioSessionCategoryPlayback error:nil];
  }
  return self;
}

- (void)dealloc {
  [self stopObservingItem];
  [_task cancel];
}

- (BOOL)canBecomeFocused {
  return NO;
}

- (void)layoutSubviews {
  [super layoutSubviews];
  _playerLayer.frame = self.bounds;
}

- (void)setVideoId:(NSString *)videoId {
  if ([_videoId isEqualToString:videoId]) {
    return;
  }
  _videoId = [videoId copy];
  _started = NO;
  [self loadCurrentVideo];
}

- (void)setPlay:(BOOL)play {
  _play = play;
  [self applyPlayback];
}

- (void)setMuted:(BOOL)muted {
  _muted = muted;
  _player.muted = muted;
  if (!muted) {
    _player.volume = 1;
  }
}

- (void)applyPlayback {
  _player.muted = _muted;
  if (_play && _item.status == AVPlayerItemStatusReadyToPlay) {
    [_player play];
  } else if (!_play) {
    [_player pause];
  }
}

- (void)emit:(NSString *)state {
  if (self.onStatus) {
    self.onStatus(@{@"state" : state});
  }
}

- (void)loadCurrentVideo {
  [_task cancel];
  [self stopObservingItem];
  [_player replaceCurrentItemWithPlayerItem:nil];
  _item = nil;

  NSString *videoId = _videoId;
  if (videoId.length == 0) {
    return;
  }
  if (videoId.length != 11) {
    [self emit:@"error"];
    return;
  }

  NSInteger request = ++_request;
  __weak HotelYouTubePlayerView *weakSelf = self;
  [self resolveVideoId:videoId clients:[self playerClients] index:0 request:request completion:^(NSURL *mediaURL) {
    HotelYouTubePlayerView *strongSelf = weakSelf;
    if (strongSelf == nil || request != strongSelf->_request) {
      return;
    }
    if (mediaURL == nil) {
      [strongSelf emit:@"error"];
      return;
    }
    [strongSelf playURL:mediaURL];
  }];
}

- (NSArray<NSDictionary *> *)playerClients {
  return @[
    @{
      @"key" : @"AIzaSyA8eiZmM1FaDVjRy-df2KTyQ_vz_yYM39w",
      @"userAgent" : @"com.google.android.youtube/20.10.38 (Linux; U; Android 11) gzip",
      @"client" : @{
        @"clientName" : @"ANDROID",
        @"clientVersion" : @"20.10.38",
        @"androidSdkVersion" : @30,
        @"hl" : @"en",
        @"gl" : @"US",
      },
    },
    @{
      @"key" : @"AIzaSyB-63vPrdThhKuerbLg2U_7I5V-0g2e8cU",
      @"userAgent" : @"com.google.ios.youtube/20.10.4 (iPhone16,2; U; CPU iOS 17_5_1 like Mac OS X)",
      @"client" : @{
        @"clientName" : @"IOS",
        @"clientVersion" : @"20.10.4",
        @"deviceModel" : @"iPhone16,2",
        @"hl" : @"en",
        @"gl" : @"US",
      },
    },
  ];
}

- (void)resolveVideoId:(NSString *)videoId
               clients:(NSArray<NSDictionary *> *)clients
                 index:(NSUInteger)index
               request:(NSInteger)request
            completion:(void (^)(NSURL *mediaURL))completion {
  if (index >= clients.count || request != _request) {
    dispatch_async(dispatch_get_main_queue(), ^{
      completion(nil);
    });
    return;
  }

  NSDictionary *client = clients[index];
  NSString *endpoint = [NSString stringWithFormat:@"https://www.youtube.com/youtubei/v1/player?key=%@&prettyPrint=false", client[@"key"]];
  NSMutableURLRequest *urlRequest = [NSMutableURLRequest requestWithURL:[NSURL URLWithString:endpoint]];
  urlRequest.HTTPMethod = @"POST";
  urlRequest.cachePolicy = NSURLRequestReloadIgnoringLocalCacheData;
  [urlRequest setValue:@"application/json" forHTTPHeaderField:@"Content-Type"];
  [urlRequest setValue:client[@"userAgent"] forHTTPHeaderField:@"User-Agent"];
  NSDictionary *body = @{
    @"videoId" : videoId,
    @"context" : @{@"client" : client[@"client"]},
    @"contentCheckOk" : @YES,
    @"racyCheckOk" : @YES,
  };
  urlRequest.HTTPBody = [NSJSONSerialization dataWithJSONObject:body options:0 error:nil];

  __weak HotelYouTubePlayerView *weakSelf = self;
  _task = [HotelYouTubeSession() dataTaskWithRequest:urlRequest completionHandler:^(NSData *data, NSURLResponse *response, NSError *error) {
    HotelYouTubePlayerView *strongSelf = weakSelf;
    if (strongSelf == nil || request != strongSelf->_request) {
      return;
    }
    NSURL *mediaURL = nil;
    if (error == nil && data != nil) {
      mediaURL = [strongSelf mediaURLFromPlayerResponse:data];
    }
    dispatch_async(dispatch_get_main_queue(), ^{
      HotelYouTubePlayerView *alive = weakSelf;
      if (alive == nil || request != alive->_request) {
        return;
      }
      if (mediaURL != nil) {
        completion(mediaURL);
        return;
      }
      [alive resolveVideoId:videoId clients:clients index:index + 1 request:request completion:completion];
    });
  }];
  [_task resume];
}

- (NSURL *)mediaURLFromPlayerResponse:(NSData *)data {
  id json = [NSJSONSerialization JSONObjectWithData:data options:0 error:nil];
  if (![json isKindOfClass:NSDictionary.class]) {
    return nil;
  }
  NSDictionary *status = json[@"playabilityStatus"];
  if ([status isKindOfClass:NSDictionary.class] && status[@"status"] != nil && ![status[@"status"] isEqualToString:@"OK"]) {
    return nil;
  }
  NSDictionary *streaming = json[@"streamingData"];
  if (![streaming isKindOfClass:NSDictionary.class]) {
    return nil;
  }
  NSString *hls = streaming[@"hlsManifestUrl"];
  if ([hls isKindOfClass:NSString.class] && hls.length > 0) {
    return [NSURL URLWithString:hls];
  }
  return [self muxedURLInFormats:streaming[@"formats"]] ?: [self muxedURLInFormats:streaming[@"adaptiveFormats"]];
}

- (NSURL *)muxedURLInFormats:(id)formats {
  if (![formats isKindOfClass:NSArray.class]) {
    return nil;
  }
  NSURL *best = nil;
  NSInteger bestWidth = -1;
  for (NSDictionary *format in formats) {
    if (![format isKindOfClass:NSDictionary.class]) {
      continue;
    }
    NSString *url = format[@"url"];
    NSString *mime = format[@"mimeType"];
    if (![url isKindOfClass:NSString.class] || ![mime isKindOfClass:NSString.class]) {
      continue;
    }
    if (![mime containsString:@"video/mp4"] || format[@"audioQuality"] == nil) {
      continue;
    }
    NSInteger width = [format[@"width"] integerValue];
    if (width < bestWidth) {
      continue;
    }
    NSURL *parsed = [NSURL URLWithString:url];
    if (parsed == nil) {
      continue;
    }
    bestWidth = width;
    best = parsed;
  }
  return best;
}

- (void)playURL:(NSURL *)url {
  [self stopObservingItem];
  AVPlayerItem *item = [AVPlayerItem playerItemWithURL:url];
  _item = item;
  [item addObserver:self forKeyPath:@"status" options:NSKeyValueObservingOptionNew context:nil];
  __weak HotelYouTubePlayerView *weakSelf = self;
  _endObserver = [NSNotificationCenter.defaultCenter addObserverForName:AVPlayerItemDidPlayToEndTimeNotification object:item queue:NSOperationQueue.mainQueue usingBlock:^(NSNotification *note) {
    [weakSelf emit:@"ended"];
  }];
  [_player replaceCurrentItemWithPlayerItem:item];
  [self applyPlayback];
}

- (void)stopObservingItem {
  if (_item != nil) {
    @try {
      [_item removeObserver:self forKeyPath:@"status"];
    } @catch (NSException *exception) {
    }
    _item = nil;
  }
  if (_endObserver != nil) {
    [NSNotificationCenter.defaultCenter removeObserver:_endObserver];
    _endObserver = nil;
  }
}

- (void)observeValueForKeyPath:(NSString *)keyPath ofObject:(id)object change:(NSDictionary *)change context:(void *)context {
  if (object != _item || ![keyPath isEqualToString:@"status"]) {
    return;
  }
  if (_item.status == AVPlayerItemStatusFailed) {
    [self emit:@"error"];
    return;
  }
  if (_item.status == AVPlayerItemStatusReadyToPlay) {
    [self applyPlayback];
    if (_play && !_started) {
      _started = YES;
      [self emit:@"playing"];
    }
  }
}

@end

@implementation NativeYouTubePlayerManager

RCT_EXPORT_MODULE(NativeYouTubePlayer)

+ (BOOL)requiresMainQueueSetup {
  return YES;
}

- (UIView *)view {
  return [[HotelYouTubePlayerView alloc] init];
}

RCT_CUSTOM_VIEW_PROPERTY(videoId, NSString, HotelYouTubePlayerView) {
  view.videoId = json ? [RCTConvert NSString:json] : @"";
}

RCT_CUSTOM_VIEW_PROPERTY(play, BOOL, HotelYouTubePlayerView) {
  view.play = json ? [RCTConvert BOOL:json] : NO;
}

RCT_CUSTOM_VIEW_PROPERTY(muted, BOOL, HotelYouTubePlayerView) {
  view.muted = json ? [RCTConvert BOOL:json] : YES;
}

RCT_EXPORT_VIEW_PROPERTY(onStatus, RCTBubblingEventBlock)

@end
