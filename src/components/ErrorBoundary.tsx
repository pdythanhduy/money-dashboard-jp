/**
 * Top-level error boundary. Without this, a render error anywhere below
 * shows up as a blank white screen in production builds (and a hard-to-spot
 * red flash in Expo Go). Renders a fallback with the error message so we
 * can SEE what crashed instead of guessing.
 */

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { ScrollView, Text, View } from 'react-native';

interface State {
  error: Error | null;
  info: ErrorInfo | null;
}

interface Props {
  children: ReactNode;
}

export class ErrorBoundary extends Component<Props, State> {
  override state: State = { error: null, info: null };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    this.setState({ info });
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  override render(): ReactNode {
    if (this.state.error) {
      return (
        <ScrollView
          style={{ flex: 1, backgroundColor: '#fff' }}
          contentContainerStyle={{ padding: 24, paddingTop: 80 }}
        >
          <Text style={{ fontSize: 24, fontWeight: '700', color: '#c00', marginBottom: 12 }}>
            App crashed
          </Text>
          <Text selectable style={{ fontSize: 14, color: '#000', marginBottom: 16 }}>
            {this.state.error.message}
          </Text>
          {this.state.error.stack ? (
            <View style={{ backgroundColor: '#f5f5f5', padding: 12, borderRadius: 8 }}>
              <Text selectable style={{ fontSize: 11, fontFamily: 'Courier', color: '#333' }}>
                {this.state.error.stack}
              </Text>
            </View>
          ) : null}
          {this.state.info?.componentStack ? (
            <>
              <Text style={{ fontSize: 16, fontWeight: '600', marginTop: 24, marginBottom: 8 }}>
                Component stack
              </Text>
              <View style={{ backgroundColor: '#f5f5f5', padding: 12, borderRadius: 8 }}>
                <Text selectable style={{ fontSize: 11, fontFamily: 'Courier', color: '#333' }}>
                  {this.state.info.componentStack}
                </Text>
              </View>
            </>
          ) : null}
        </ScrollView>
      );
    }
    return this.props.children;
  }
}
