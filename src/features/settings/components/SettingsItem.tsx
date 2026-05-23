import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Pressable, Switch, Text, View } from 'react-native';

import { useTheme } from '@/theme';

type SettingsItemKind = 'navigate' | 'value' | 'toggle' | 'action';

interface BaseProps {
  label: string;
  sublabel?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  destructive?: boolean;
  disabled?: boolean;
  showBorder?: boolean;
}

interface NavigateItem extends BaseProps {
  kind: 'navigate';
  onPress: () => void;
  value?: string;
}

interface ValueItem extends BaseProps {
  kind: 'value';
  onPress: () => void;
  value: string;
}

interface ToggleItem extends BaseProps {
  kind: 'toggle';
  value: boolean;
  onChange: (v: boolean) => void;
}

interface ActionItem extends BaseProps {
  kind: 'action';
  onPress: () => void;
  rightAdornment?: ReactNode;
}

type SettingsItemProps = NavigateItem | ValueItem | ToggleItem | ActionItem;

export function SettingsItem(props: SettingsItemProps) {
  const { colors, typography, spacing } = useTheme();

  const labelColor = props.destructive ? colors.danger : colors.text;
  const iconColor = props.destructive ? colors.danger : colors.brand;

  const right = (() => {
    if (props.kind === 'toggle') {
      return (
        <Switch
          accessibilityLabel={props.label}
          value={props.value}
          onValueChange={props.onChange}
          disabled={props.disabled}
          trackColor={{ false: colors.borderStrong, true: colors.brand }}
        />
      );
    }
    if (props.kind === 'navigate' || props.kind === 'value') {
      return (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.xs,
            flexShrink: 1,
            maxWidth: '55%',
          }}
        >
          {props.value ? (
            <Text
              style={[typography.callout, { color: colors.textSecondary, flexShrink: 1 }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {props.value}
            </Text>
          ) : null}
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </View>
      );
    }
    if (props.kind === 'action') {
      return props.rightAdornment ?? null;
    }
    return null;
  })();

  const isPressable = props.kind !== 'toggle';
  const onPress = isPressable ? (props as NavigateItem | ValueItem | ActionItem).onPress : undefined;

  const body = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
        gap: spacing.md,
        minHeight: 52,
        borderTopWidth: props.showBorder ? 1 : 0,
        borderTopColor: colors.border,
        opacity: props.disabled ? 0.5 : 1,
      }}
    >
      {props.icon ? (
        <View
          style={{
            width: 28,
            height: 28,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name={props.icon} size={20} color={iconColor} />
        </View>
      ) : null}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          style={[typography.body, { color: labelColor }]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {props.label}
        </Text>
        {props.sublabel ? (
          <Text
            style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {props.sublabel}
          </Text>
        ) : null}
      </View>
      {right}
    </View>
  );

  if (isPressable && onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: props.disabled }}
        disabled={props.disabled}
        onPress={onPress}
        android_ripple={{ color: colors.brandSubtle }}
      >
        {body}
      </Pressable>
    );
  }

  return body;
}
