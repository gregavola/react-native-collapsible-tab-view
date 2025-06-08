import React from 'react';
import { StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, interpolate } from 'react-native-reanimated';
import { isRTL } from '../helpers';

const Indicator = _ref => {
  let {
    indexDecimal,
    itemsLayout,
    style,
    fadeIn = false
  } = _ref;
  const opacity = useSharedValue(fadeIn ? 0 : 1);
  const stylez = useAnimatedStyle(() => {
    var _itemsLayout$0$x, _itemsLayout$, _itemsLayout$2;

    const firstItemX = (_itemsLayout$0$x = (_itemsLayout$ = itemsLayout[0]) === null || _itemsLayout$ === void 0 ? void 0 : _itemsLayout$.x) !== null && _itemsLayout$0$x !== void 0 ? _itemsLayout$0$x : 0;
    const transform = [{
      translateX: itemsLayout.length > 1 ? interpolate(indexDecimal.value, itemsLayout.map((_, i) => i), // when in RTL mode, the X value should be inverted
      itemsLayout.map(v => isRTL ? -1 * v.x : v.x)) : isRTL ? -1 * firstItemX : firstItemX
    }];
    const width = itemsLayout.length > 1 ? interpolate(indexDecimal.value, itemsLayout.map((_, i) => i), itemsLayout.map(v => v.width)) : (_itemsLayout$2 = itemsLayout[0]) === null || _itemsLayout$2 === void 0 ? void 0 : _itemsLayout$2.width;
    return {
      transform,
      width,
      opacity: withTiming(opacity.value)
    };
  }, [indexDecimal, itemsLayout]);
  React.useEffect(() => {
    if (fadeIn) {
      opacity.value = 1;
    } // eslint-disable-next-line react-hooks/exhaustive-deps

  }, [fadeIn]);
  return /*#__PURE__*/React.createElement(Animated.View, {
    style: [stylez, styles.indicator, style]
  });
};

const styles = StyleSheet.create({
  indicator: {
    height: 2,
    backgroundColor: '#2196f3',
    position: 'absolute',
    bottom: 0
  }
});
export { Indicator };
//# sourceMappingURL=Indicator.js.map