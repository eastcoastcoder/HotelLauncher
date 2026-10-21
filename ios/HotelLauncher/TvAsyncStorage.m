#import "TvAsyncStorage.h"

static NSString *const kStoragePrefix = @"hotellauncher.storage.";

@implementation TvAsyncStorage

RCT_EXPORT_MODULE(RNAsyncStorage);

+ (BOOL)requiresMainQueueSetup {
  return NO;
}

- (NSString *)storageKey:(NSString *)key {
  return [kStoragePrefix stringByAppendingString:key];
}

- (NSUserDefaults *)defaults {
  return NSUserDefaults.standardUserDefaults;
}

RCT_EXPORT_METHOD(legacy_multiGet:(NSArray<NSString *> *)keys
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
  NSMutableArray *rows = [NSMutableArray arrayWithCapacity:keys.count];
  for (NSString *key in keys) {
    if (![key isKindOfClass:NSString.class]) {
      continue;
    }
    id value = [[self defaults] stringForKey:[self storageKey:key]];
    [rows addObject:@[key, value == nil ? [NSNull null] : value]];
  }
  resolve(rows);
}

RCT_EXPORT_METHOD(legacy_multiSet:(NSArray *)pairs
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
  for (NSArray *pair in pairs) {
    if (![pair isKindOfClass:NSArray.class] || pair.count < 2) {
      continue;
    }
    NSString *key = pair[0];
    NSString *value = pair[1];
    if ([key isKindOfClass:NSString.class] && [value isKindOfClass:NSString.class]) {
      [[self defaults] setObject:value forKey:[self storageKey:key]];
    }
  }
  resolve([NSNull null]);
}

RCT_EXPORT_METHOD(legacy_multiRemove:(NSArray<NSString *> *)keys
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
  for (NSString *key in keys) {
    if ([key isKindOfClass:NSString.class]) {
      [[self defaults] removeObjectForKey:[self storageKey:key]];
    }
  }
  resolve([NSNull null]);
}

RCT_EXPORT_METHOD(legacy_getAllKeys:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
  NSMutableArray *keys = [NSMutableArray array];
  [[self defaults].dictionaryRepresentation enumerateKeysAndObjectsUsingBlock:^(NSString *key, id obj, BOOL *stop) {
    if ([key hasPrefix:kStoragePrefix]) {
      [keys addObject:[key substringFromIndex:kStoragePrefix.length]];
    }
  }];
  resolve(keys);
}

RCT_EXPORT_METHOD(legacy_clear:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
  NSDictionary *all = [self defaults].dictionaryRepresentation;
  for (NSString *key in all) {
    if ([key hasPrefix:kStoragePrefix]) {
      [[self defaults] removeObjectForKey:key];
    }
  }
  resolve([NSNull null]);
}

RCT_EXPORT_METHOD(legacy_multiMerge:(NSArray *)pairs
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
  for (NSArray *pair in pairs) {
    if (![pair isKindOfClass:NSArray.class] || pair.count < 2) {
      continue;
    }
    NSString *key = pair[0];
    NSString *incoming = pair[1];
    if (![key isKindOfClass:NSString.class] || ![incoming isKindOfClass:NSString.class]) {
      continue;
    }
    NSString *storedKey = [self storageKey:key];
    NSString *existing = [[self defaults] stringForKey:storedKey];
    NSString *merged = incoming;
    NSData *oldData = [existing dataUsingEncoding:NSUTF8StringEncoding];
    NSData *newData = [incoming dataUsingEncoding:NSUTF8StringEncoding];
    id oldJSON = oldData == nil ? nil : [NSJSONSerialization JSONObjectWithData:oldData options:0 error:nil];
    id newJSON = newData == nil ? nil : [NSJSONSerialization JSONObjectWithData:newData options:0 error:nil];
    if ([oldJSON isKindOfClass:NSDictionary.class] && [newJSON isKindOfClass:NSDictionary.class]) {
      NSMutableDictionary *mix = [oldJSON mutableCopy];
      [mix addEntriesFromDictionary:newJSON];
      NSData *data = [NSJSONSerialization dataWithJSONObject:mix options:0 error:nil];
      if (data != nil) {
        merged = [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
      }
    }
    [[self defaults] setObject:merged forKey:storedKey];
  }
  resolve([NSNull null]);
}

@end
