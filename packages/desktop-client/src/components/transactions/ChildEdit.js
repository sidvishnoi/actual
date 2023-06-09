import React, { PureComponent } from 'react';

import { styles } from '../../style';
import { Text, View } from '../common';
import { FieldLabel, InputField, TapField } from '../forms';
import { AmountInput } from '../util/AmountInput';

class ChildEdit extends PureComponent {
  //   gestureY = new Animated.Value(400);
  //   gestureEvent = Animated.event(
  //     [{ nativeEvent: { translationY: this.gestureY } }],
  //     { useNativeDriver: true },
  //   );

  //   componentDidMount() {
  //     Animated.spring(this.gestureY, {
  //       tension: 50,
  //       toValue: 0,
  //       useNativeDriver: true,
  //     }).start();
  //   }

  //   componentDidUpdate(prevProps) {
  //     if (!prevProps.exiting && this.props.exiting) {
  //       Animated.spring(this.gestureY, {
  //         tension: 50,
  //         toValue: 400,
  //         useNativeDriver: true,
  //       }).start(() => {
  //         this.props.onClose();
  //       });
  //     } else if (prevProps.exiting && !this.props.exiting) {
  //       Animated.spring(this.gestureY, {
  //         tension: 50,
  //         toValue: 0,
  //         useNativeDriver: true,
  //       }).start();
  //     }
  //   }

  //   onHandlerStateChange = e => {
  //     if (e.nativeEvent.oldState === State.ACTIVE) {
  //       const closing = e.nativeEvent.translationY > 80;

  //       if (closing) {
  //         this.props.onStartClose();
  //       } else {
  //         Animated.spring(this.gestureY, {
  //           tension: 50,
  //           toValue: 0,
  //           useNativeDriver: true,
  //         }).start();
  //       }
  //     }
  //   };

  onEditCategory = () => {
    this.props.navigation.navigate('CategorySelect', {
      title: 'Select a category',
      onSelect: id => {
        this.props.onEdit(this.props.transaction, 'category', id);
      },
    });
  };

  render() {
    const { transaction, exiting, getCategoryName, amountSign } = this.props;

    return (
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
          justifyContent: 'flex-end',
        }}
        pointerEvents={exiting ? 'none' : 'auto'}
      >
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            backgroundColor: 'black',
            opacity: this.gestureY.interpolate({
              inputRange: [0, 400],
              outputRange: [0.4, 0],
              extrapolate: 'clamp',
            }),
          }}
        />
        {/* <PanGestureHandler
          onGestureEvent={this.gestureEvent}
          onHandlerStateChange={this.onHandlerStateChange}
        > */}
        <View
          style={{
            justifyContent: 'flex-end',
            backgroundColor: 'white',
            margin: 10,
            borderRadius: 4,
            overflow: 'hidden',
            transform: [{ translateY: this.gestureY }],
          }}
        >
          <View
            style={{
              borderBottomWidth: 1,
              borderColor: '#f0f0f0',
              flexDirection: 'row',
              justifyContent: 'center',
              padding: 15,
            }}
          >
            <Text style={styles.header.headerTitleStyle}>
              Edit Split Transaction
            </Text>
          </View>
          <View
            style={{
              backgroundColor: '#FBFCFC',
            }}
          >
            <View style={{ alignItems: 'center', marginVertical: 15 }}>
              <FieldLabel
                title="Amount"
                flush
                style={{ marginBottom: 0, paddingLeft: 0 }}
              />
              <AmountInput
                value={transaction.amount}
                sign={amountSign}
                style={{ height: 26, transform: [] }}
                focusedStyle={{
                  width: 'auto',
                  paddingVertical: 0,
                  paddingHorizontal: 10,
                  minWidth: 100,
                  transform: [{ translateY: -0.5 }],
                }}
                onBlur={value =>
                  this.props.onEdit(transaction, 'amount', value.toString())
                }
                textStyle={{ fontSize: 20, textAlign: 'center' }}
              />
            </View>

            <FieldLabel title="Category" flush />
            <TapField
              value={getCategoryName(transaction.category)}
              onTap={this.onEditCategory}
            />

            <FieldLabel title="Notes" />
            <InputField
              defaultValue={transaction.notes}
              multiline={true}
              numberOfLines={10}
              style={{ height: 60, marginBottom: 25 }}
              paddingTop={10}
              paddingBottom={10}
              onUpdate={value => this.props.onEdit(transaction, 'notes', value)}
            />
          </View>
        </View>
        {/* </PanGestureHandler> */}
      </View>
    );
  }
}

export default ChildEdit;
