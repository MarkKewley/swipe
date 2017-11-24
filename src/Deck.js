import React, { Component } from 'react';
import {
  View,
  Animated,
  PanResponder, // used for when a user touches the screen and drags their finger
  Dimensions  // used to retrieve dimensions of the screen the app is running on
} from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
// 1/4 of the width of the screen
const SWIPE_THRESHOLD = 0.25 * SCREEN_WIDTH;
const SWIPE_OUT_DURATION_MILLIS = 250;

class Deck extends Component {

  constructor (props) {
    super(props);

    const position = new Animated.ValueXY();
    const panResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (event, gesture) => {
        const {dx, dy} = gesture;
        console.log(dx);
        position.setValue({x: dx, y: dy});
      },
      onPanResponderRelease: (event, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          // swipe right
          this.forceSwipe(SCREEN_WIDTH)
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          // swipe left
          this.forceSwipe(-SCREEN_WIDTH)
        } else {
          this.resetPosition();
        }
      }
    });

    this.position = position;
    this.state = {panResponder};
  }

  forceSwipe (x) {
    Animated.timing(this.position, {
      toValue: {x, y: 0},
      duration: SWIPE_OUT_DURATION_MILLIS
    }).start();
  }

  resetPosition () {
    Animated.spring(this.position, {
      toValue: {x: 0, y: 0}
    }).start();
  }

  // e.g. if x was at -300 => -90deg, so it maps -500 -> 500 to -120deg -> 120deg by stating
  // it is approx 20% through the inputRange so it should be 20% to the outPutRange
  getCardStyle () {
    // postion.x is how much the position has changed in the x-axis
    const rotate = this.position.x.interpolate({
      // [min, mid, max]
      // the 1.5 makes it rotate a bit less since it takes more DISTANCE to get from low to mid to high for ROTATION
      inputRange: [-SCREEN_WIDTH * 1.5, 0, SCREEN_WIDTH * 1.5], // the distance the card has been dragged on the screen
      outputRange: ['-120deg', '0deg', '120deg'] // the degrees it maps to
    });

    return {
      ...this.position.getLayout(),
      transform: [{rotate}]
    };
  }

  renderCards () {
    return this.props.data.map((item, index) => {
      if (index === 0) {
        return (
          <Animated.View
            key={item.id}
            style={this.getCardStyle()}
            {...this.state.panResponder.panHandlers}>
            {this.props.renderCard(item)}
          </Animated.View>
        );
      }
      return this.props.renderCard(item);
    });
  }

  render () {
    return (
      <View>
        {this.renderCards()}
      </View>
    );
  }

}

export default Deck;