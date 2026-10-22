import { useState } from 'react';
import {
  Image,
  KeyboardTypeOptions,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TVFocusGuideView,
  View,
} from 'react-native';
import { Focusable } from '../components/Focusable';
import { Panel } from '../components/Panel';
import { launcherConfig } from '../config/launcherConfig';
import { useLauncherSettings } from '../context/LauncherSettingsContext';
import { clearHotelLogo, imageUriForPath, pickHotelLogo } from '../services/hotelLogo';
import { colors } from '../theme/colors';
import { type } from '../theme/typography';
import { ScreenId, SettingId } from '../types';

export function Settings({}: { screen?: ScreenId }) {
  const { values, setValue, setLogoPath, setShuffleVideos } =
    useLauncherSettings();
  const appleTv = Platform.OS === 'ios' && Platform.isTV;
  const [picking, setPicking] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);

  const onPickLogo = async () => {
    if (picking) {
      return;
    }
    setLogoError(null);
    setPicking(true);
    try {
      const path = await pickHotelLogo(values.logoPath);
      if (path != null) {
        setLogoPath(path);
      }
    } catch (error) {
      setLogoError(
        error instanceof Error ? error.message : 'Could not save the logo',
      );
    } finally {
      setPicking(false);
    }
  };

  const onClearLogo = async () => {
    setLogoError(null);
    try {
      await clearHotelLogo(values.logoPath);
      setLogoPath(null);
    } catch (error) {
      setLogoError(
        error instanceof Error ? error.message : 'Could not remove the logo',
      );
    }
  };

  return (
    <Panel title="Settings">
      {/* The caret is the focus rect, so an untrapped search prefers the sidebar. */}
      <TVFocusGuideView trapFocusUp trapFocusDown>
        <View style={styles.field}>
          <Text style={styles.label}>Hotel Logo</Text>
          <View style={styles.logoRow}>
            {values.logoPath != null ? (
              <Image
                source={{ uri: imageUriForPath(values.logoPath) }}
                accessibilityLabel="Custom hotel logo"
                resizeMode="contain"
                style={styles.preview}
              />
            ) : (
              <View style={styles.preview}>
                <Text style={styles.previewLabel}>Built-in</Text>
              </View>
            )}
            {appleTv ? null : (
              <View style={styles.logoActions}>
                <Focusable
                  onPress={() => {
                    onPickLogo().catch(() => undefined);
                  }}
                  testID="setting-hotel-logo"
                  style={styles.action}
                >
                  <Text style={styles.actionText}>
                    {picking ? 'Opening gallery…' : 'Choose image'}
                  </Text>
                </Focusable>
                {values.logoPath != null ? (
                  <Focusable
                    onPress={() => {
                      onClearLogo().catch(() => undefined);
                    }}
                    testID="setting-hotel-logo-clear"
                    style={styles.action}
                  >
                    <Text style={styles.actionText}>Use built-in logo</Text>
                  </Focusable>
                ) : null}
              </View>
            )}
          </View>
          {logoError != null ? (
            <Text style={styles.error}>{logoError}</Text>
          ) : null}
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Shuffle videos</Text>
          <Focusable
            onPress={() => setShuffleVideos(!values.shuffleVideos)}
            testID="setting-shuffle-videos"
            style={styles.action}
          >
            <Text style={styles.actionText}>
              {values.shuffleVideos ? 'On' : 'Off'}
            </Text>
          </Focusable>
        </View>
        {launcherConfig.settings.map(item => {
          const mode = inputMode(item.id);
          return (
            <SettingInput
              key={item.id}
              label={item.label}
              value={values[item.id]}
              onChangeText={next => setValue(item.id, next)}
              testID={`setting-${item.id}`}
              autoCapitalize={mode.autoCapitalize}
              keyboardType={mode.keyboardType}
            />
          );
        })}
      </TVFocusGuideView>
    </Panel>
  );
}

function SettingInput({
  label,
  value,
  onChangeText,
  testID,
  autoCapitalize,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  testID: string;
  autoCapitalize: 'none' | 'words' | 'sentences';
  keyboardType?: KeyboardTypeOptions;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        testID={testID}
        accessibilityLabel={label}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        keyboardType={keyboardType}
        returnKeyType="done"
        blurOnSubmit
        cursorColor={colors.accent}
        selectionColor={colors.accent}
        placeholderTextColor={colors.textMuted}
        underlineColorAndroid="transparent"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[styles.input, focused && styles.inputFocused]}
      />
    </View>
  );
}

function inputMode(id: SettingId): {
  autoCapitalize: 'none' | 'words' | 'sentences';
  keyboardType?: KeyboardTypeOptions;
} {
  if (id === 'discoverChannel') {
    return { autoCapitalize: 'none', keyboardType: 'url' };
  }
  if (id === 'guestName') {
    return { autoCapitalize: 'words' };
  }
  return { autoCapitalize: 'sentences' };
}

const styles = StyleSheet.create({
  field: {
    maxWidth: 720,
    marginBottom: 16,
  },
  label: {
    ...type.body,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  preview: {
    width: 160,
    height: 72,
    borderRadius: 8,
    backgroundColor: colors.stage,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewLabel: {
    ...type.body,
    color: colors.textMuted,
  },
  logoActions: {
    flex: 1,
    gap: 8,
  },
  action: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: colors.stage,
  },
  actionText: {
    ...type.body,
    color: colors.textPrimary,
  },
  error: {
    ...type.body,
    color: colors.textSecondary,
    marginTop: 8,
  },
  input: {
    ...type.body,
    color: colors.textPrimary,
    backgroundColor: colors.stage,
    borderWidth: 2,
    borderColor: colors.divider,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  inputFocused: {
    borderColor: colors.accent,
    backgroundColor: colors.panelFocused,
  },
});
