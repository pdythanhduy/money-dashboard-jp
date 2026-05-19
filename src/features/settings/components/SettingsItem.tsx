import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Pressable, Switch, Text, View } from 'react-native';

import { useTheme } from '@/theme';

interface BaseProps {
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  label: string;
  hint?: string;
  isLast?: boolean;
}

interface NavigationProps extends BaseProps {
  kind: 'navigation';
  value?: string;
  onPress: () => void;
}

interface ToggleProps extends BaseProps {
  kind: 'toggle';
  value: boolean;
  onValueChange: (v: boolean) => void;
  disabled?: boolean;
}

interface ActionProps extends BaseProps {
  kind: 'action';
  destructive?: boolean;
  onPress: () => void;
  rightChild?: ReactNode;
}

export type SettingsItemProps = NavigationProps | ToggleProps | ActionProps;

export function SettingsItem(props: SettingsItemProps) {
  const { colors, typography, spacing } = useTheme();
  const { icon, iconColor, label, hint, isLast } = props;

  const content = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        minHeight: 48,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: colors.border,
        gap: spacing.sm,
      }}
    >
      {icon ? (
        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            backgroundColor: (iconColor ?? colors.brand) + '22',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name={icon} size={16} color={iconColor ?? colors.brand} />
        </View>
      ) : null}
      <View style={{ flex: 1 }}>
        <Text
          style={[
            typography.body,
            { color: props.kind === 'action' && props.destructive ? colors.danger : colors.text },
          ]}
        >
          {label}
        </Text>
        {hint ? (
          <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>
            {hint}
          </Text>
        ) : null}
      </View>
      {props.kind === 'navigation' ? (
        <>
          {props.value ? (
            <Text style={[typography.callout, { color: colors.textSecondary }]}>{props.value}</Text>
          ) : null}
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </>
      ) : null}
      {props.kind === 'toggle' ? (
        <Switch
          value={props.value}
          onValueChange={props.onValueChange}
          disabled={props.disabled}
          trackColor={{ true: colors.brand, false: colors.border }}
        />
      ) : null}
      {props.kind === 'action' ? props.rightChild : null}
    </View>
  );

  if (props.kind === 'toggle') return content;
  return (
    <Pressable onPress={props.onPress} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
      {content}
    </Pressable>
  );
}
