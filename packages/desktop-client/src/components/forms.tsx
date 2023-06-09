import React, {
  forwardRef,
  type ForwardedRef,
  type ReactNode,
  type HTMLProps,
  useRef,
} from 'react';
import { useSwitch, useFocusRing, VisuallyHidden } from 'react-aria';
import { useToggleState } from 'react-stately';

import { css, type CSSProperties } from 'glamor';

import { colors } from '../style';

import { View, Text, Button, Input } from './common';

export const EDITING_PADDING = 12;
export const FIELD_HEIGHT = 40;

export function FieldLabel({ title, flush, style }) {
  return (
    <Text
      style={[
        {
          marginBottom: 5,
          marginTop: flush ? 0 : 25,
          fontSize: 13,
          color: colors.n2,
          paddingLeft: EDITING_PADDING,
          textTransform: 'uppercase',
        },
        style,
      ]}
    >
      {title}
    </Text>
  );
}

type SectionLabelProps = {
  title?: string;
  style?: CSSProperties;
};

export const SectionLabel = ({ title, style }: SectionLabelProps) => {
  return (
    <View
      style={[
        {
          fontWeight: 500,
          textTransform: 'uppercase',
          color: colors.b3,
          marginBottom: 5,
          lineHeight: '1em',
        },
        style,
      ]}
    >
      {title}
    </View>
  );
};

type FormLabelProps = {
  title: string;
  id?: string;
  htmlFor?: string;
  style?: CSSProperties;
};

export const FormLabel = ({ style, title, id, htmlFor }: FormLabelProps) => {
  return (
    <Text style={[{ fontSize: 13, marginBottom: 3, color: colors.n3 }, style]}>
      <label htmlFor={htmlFor} id={id}>
        {title}
      </label>
    </Text>
  );
};

type FormFieldProps = {
  style?: CSSProperties;
  children: ReactNode;
};

export const FormField = ({ style, children }: FormFieldProps) => {
  return <View style={style}>{children}</View>;
};

const valueStyle = {
  borderWidth: 1,
  borderColor: colors.n9,
  marginLeft: -1,
  marginRight: -1,
  height: FIELD_HEIGHT,
  paddingHorizontal: EDITING_PADDING,
};

type InputFieldProps = {
  style?: CSSProperties;
  disabled?: boolean;
  onUpdate?: (value: string) => void;
};
export const InputField = forwardRef(function InputField(
  { disabled, style, onUpdate, ...props }: InputFieldProps,
  ref: ForwardedRef<HTMLInputElement>,
) {
  return (
    <Input
      type="text"
      ref={ref}
      disabled={disabled}
      onUpdate={val => {
        onUpdate && onUpdate(val);
      }}
      style={[
        valueStyle,
        style,
        { backgroundColor: disabled ? colors.n11 : 'white' },
      ]}
      {...props}
    />
  );
});

export function TapField({
  value,
  children,
  disabled,
  rightContent,
  style,
  textStyle,
  onTap,
}) {
  return (
    <Button
      onClick={!disabled && onTap}
      style={{ backgroundColor: 'white', opacity: disabled ? 0.5 : 1 }}
    >
      <View
        style={[
          valueStyle,
          { flexDirection: 'row', alignItems: 'center' },
          disabled && { backgroundColor: colors.n11 },
          style,
        ]}
      >
        {children ? (
          children
        ) : (
          <Text style={[{ flex: 1 }, textStyle]}>{value}</Text>
        )}
        {!disabled && rightContent}
      </View>
    </Button>
  );
}

export function BooleanField({ value, onUpdate, style }) {
  return (
    <Switch
      value={value}
      onValueChange={onUpdate}
      style={[
        {
          marginHorizontal: EDITING_PADDING,
        },
        style,
      ]}
    />
  );
}

// Custom inputs

type CheckboxProps = Omit<HTMLProps<HTMLInputElement>, 'type' | 'styles'> & {
  styles?: CSSProperties;
};

export const Checkbox = (props: CheckboxProps) => {
  return (
    <input
      type="checkbox"
      {...props}
      {...css(
        [
          {
            position: 'relative',
            margin: 0,
            marginRight: 6,
            width: 15,
            height: 15,
            appearance: 'none',
            outline: 0,
            border: '1px solid #d0d0d0',
            borderRadius: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            backgroundColor: 'white',
            ':checked': {
              border: '1px solid ' + colors.b6,
              backgroundColor: colors.b6,
              '::after': {
                display: 'block',
                background:
                  colors.b6 +
                  // eslint-disable-next-line rulesdir/typography
                  ' url(\'data:image/svg+xml; utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path fill="white" d="M0 11l2-2 5 5L18 3l2 2L7 18z"/></svg>\') 9px 9px',
                width: 9,
                height: 9,
                content: ' ',
              },
            },
            '&.focus-visible:focus': {
              '::before': {
                position: 'absolute',
                top: -5,
                bottom: -5,
                left: -5,
                right: -5,
                border: '2px solid ' + colors.b5,
                borderRadius: 6,
                content: ' ',
              },
            },
          },
        ],
        props.style,
      )}
    />
  );
};

function Switch(props) {
  let state = useToggleState(props);
  let ref = useRef(null);
  let { inputProps } = useSwitch(props, state, ref);
  let { isFocusVisible, focusProps } = useFocusRing();

  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        opacity: props.isDisabled ? 0.4 : 1,
      }}
    >
      <VisuallyHidden>
        <input {...inputProps} {...focusProps} ref={ref} />
      </VisuallyHidden>
      <svg width={40} height={24} aria-hidden="true" style={{ marginRight: 4 }}>
        <rect
          x={4}
          y={4}
          width={32}
          height={16}
          rx={8}
          fill={state.isSelected ? 'orange' : 'gray'}
        />
        <circle cx={state.isSelected ? 28 : 12} cy={12} r={5} fill="white" />
        {isFocusVisible && (
          <rect
            x={1}
            y={1}
            width={38}
            height={22}
            rx={11}
            fill="none"
            stroke="orange"
            strokeWidth={2}
          />
        )}
      </svg>
      {props.children}
    </label>
  );
}
