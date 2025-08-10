declare module 'react-native-actionsheet' {
  import { Component } from 'react';
    import { ViewStyle } from 'react-native';

  export interface ActionSheetProps {
    title?: string;
    message?: string;
    options: string[];
    cancelButtonIndex?: number;
    destructiveButtonIndex?: number;
    tintColor?: string;
    styles?: ViewStyle;
    onPress: (index: number) => void;
  }

  export default class ActionSheet extends Component<ActionSheetProps> {
    show(): void;
    hide(): void;
  }
}
